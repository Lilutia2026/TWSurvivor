// ============================================================================
// core/sprite_anim.js — 《TW倖存者》8方向序列幀精靈圖集渲染引擎（支援自動鏡像）
// ============================================================================
window.CHAR_ANIM_REGISTRY = window.CHAR_ANIM_REGISTRY || {};

const SpriteAnimManager = {
  cache: {}, // charId -> { meta, img, loaded, loading }

  // 取得或預載指定角色精靈圖集
    // 自動去除《天翼之鍊》純黑底色（從圖集外圍邊界泛洪清除純黑像素，不傷及角色內部深色線條）
      // 直接全圖清除《天翼之鍊》純黑透明色鍵（R,G,B 皆 <= 18 設為透明，28 以下柔化邊緣鋸齒）
  stripColorKey(img) {
    const w = img.width, h = img.height;
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    const g = c.getContext('2d');
    g.drawImage(img, 0, 0);
    const imgData = g.getImageData(0, 0, w, h);
    const d = imgData.data;

    for (let i = 0; i < d.length; i += 4) {
      if (d[i + 3] === 0) continue;
      const maxC = Math.max(d[i], d[i + 1], d[i + 2]);
      if (maxC <= 18) {
        d[i + 3] = 0;
      } else if (maxC <= 32) {
        d[i + 3] = Math.round(d[i + 3] * ((maxC - 18) / 14));
      }
    }
    g.putImageData(imgData, 0, 0);
    return c;
  },
  
    // 取得或預載指定角色精靈圖集
    ensureLoaded(charId) {
      if (!charId) return null;
      if (this.cache[charId]) return this.cache[charId];
  
      const meta = window.CHAR_ANIM_REGISTRY[charId];
      if (!meta) return null;
  
      const rawImg = new Image();
      const entry = { meta, img: rawImg, loaded: false, loading: true };
      rawImg.onload = () => {
        try {
          if (!meta.timedAnimations) entry.img = this.stripColorKey(rawImg);
        } catch (error) {
          // 本機檔案環境可能禁止讀回像素，透明 PNG 仍可直接繪製。
          if (error.name !== 'SecurityError') throw error;
        }
        entry.loaded = true;
        entry.loading = false;
      };
      rawImg.onerror = () => { entry.loaded = false; entry.loading = false; };
      rawImg.src = `assets/characters/${meta.atlasImage || (charId + '.png')}`;
      this.cache[charId] = entry;
      return entry;
    }, 

  // 依據移動向量 (vx, vy) 換算《天翼之鍊》8方向鍵值與是否水平鏡像
  resolveDir8(vx, vy, fallbackDir = 'down') {
    if (Math.hypot(vx, vy) < 0.05) {
      return this.mapDirToBase(fallbackDir);
    }
    const deg = Math.atan2(vy, vx) * 180 / Math.PI; // -180 ~ 180（右=0, 下=90, 左=±180, 上=-90）
    let dir8 = 'down';
    if (deg >= -22.5 && deg < 22.5) dir8 = 'right';
    else if (deg >= 22.5 && deg < 67.5) dir8 = 'downRight';
    else if (deg >= 67.5 && deg < 112.5) dir8 = 'down';
    else if (deg >= 112.5 && deg < 157.5) dir8 = 'downLeft';
    else if (deg >= 157.5 || deg < -157.5) dir8 = 'left';
    else if (deg >= -157.5 && deg < -112.5) dir8 = 'upLeft';
    else if (deg >= -112.5 && deg < -67.5) dir8 = 'up';
    else if (deg >= -67.5 && deg < -22.5) dir8 = 'upRight';
    return this.mapDirToBase(dir8);
  },

  // 左半邊 5 方向直出，右半邊 3 方向自動水平鏡像
  mapDirToBase(dir8) {
    const table = {
      up:        { dir8: 'up',        base: 'up',       mirror: false },
      upLeft:    { dir8: 'upLeft',    base: 'upLeft',   mirror: false },
      left:      { dir8: 'left',      base: 'left',     mirror: false },
      downLeft:  { dir8: 'downLeft',  base: 'downLeft', mirror: false },
      down:      { dir8: 'down',      base: 'down',     mirror: false },
      upRight:   { dir8: 'upRight',   base: 'upLeft',   mirror: true },
      right:     { dir8: 'right',     base: 'left',     mirror: true },
      downRight: { dir8: 'downRight', base: 'downLeft', mirror: true }
    };
    return table[dir8] || table.down;
  },

  getTimedFrame(clip, nowMs, state) {
    if (state && state.clip !== clip) {
      state.clip = clip;
      state.startedAtMs = nowMs;
    }
    if (clip.durationMs === 0) return clip.frames[0];
    const elapsedMs = (nowMs - (state?.startedAtMs ?? 0)) % clip.durationMs;
    return clip.frames.find(frame => elapsedMs < frame.endMs);
  },

  getShowcasePose(charId) {
    const meta = window.CHAR_ANIM_REGISTRY[charId];
    if (!meta) return null;
    const timed = meta.timedAnimations?.preview || meta.timedAnimations?.idle;
    const clips = timed || meta.animations?.idle;
    const base = ['down', 'downLeft', 'left', 'upLeft', 'up'].find(direction =>
      (timed ? clips[direction]?.frames : clips?.[direction])?.length
    );
    if (!base) return null;
    const labels = timed ? clips[base].frames.map(frame => frame.id) : clips[base];
    const frames = labels.map(id => meta.frames?.[id]).filter(Boolean);
    return frames.length ? { dirInfo: this.mapDirToBase(base), previewPose: true, frames } : null;
  },

  // 繪製角色當前動畫幀（回傳 true 代表成功繪製精靈，false 代表未就緒需走方塊備案）
  drawCharacter(ctx, charId, x, y, opts = {}) {
    const entry = this.ensureLoaded(charId);
    if (!entry || !entry.loaded || !entry.meta) return false;

    const { meta, img } = entry;
    const dirInfo = opts.dirInfo || this.mapDirToBase('down');
    const timeMs = opts.timeSec != null ? opts.timeSec * 1000 : performance.now();
    let frameLabel, mirror;
    if (meta.timedAnimations) {
      const action = opts.isMoving && meta.timedAnimations.run ? 'run' : 'idle';
      const direction = dirInfo.dir8 || dirInfo.base;
      const preview = opts.previewPose ? meta.timedAnimations.preview?.[direction] : undefined;
      const clip = preview || meta.timedAnimations[action]?.[direction] || meta.timedAnimations.idle?.down;
      if (!clip) return false;
      const frame = this.getTimedFrame(clip, timeMs, opts.animationState);
      frameLabel = frame?.id;
      mirror = frame?.mirror;
    } else {
      const action = opts.isMoving && meta.animations?.run ? 'run' : 'idle';
      const seq = meta.animations?.[action]?.[dirInfo.base] || meta.animations?.idle?.down;
      if (!seq?.length) return false;
      const defaultFps = meta.defaultFps || 9;
      const fps = opts.isMoving ? (meta.runFps || defaultFps * 1.15) : (meta.idleFps || defaultFps * 0.70);
      frameLabel = seq[Math.floor(timeMs * fps / 1000) % seq.length];
      mirror = dirInfo.mirror;
    }
    const f = meta.frames?.[frameLabel];
    if (!f) return false;

    const scale = opts.scale || 1.0;

    // 腳底柔和陰影
    ctx.save();
    ctx.fillStyle = 'rgba(15, 23, 42, 0.36)';
    ctx.beginPath();
    ctx.ellipse(x, y + 2, 16 * scale, 7 * scale, 0, 0, Math.PI * 2);
    ctx.fill();

    const footSink = (opts.footSink ?? (meta.timedAnimations ? 0 : 9)) * scale;
    ctx.translate(x, y);
    if (mirror) {
      // 新資料以圖片本身的中心翻轉，和 HTML 預覽的定位相同。
      if (meta.timedAnimations) ctx.translate((2 * f.ax + f.w) * scale, 0);
      ctx.scale(-1, 1);
    }
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(
      img,
      f.x, f.y, f.w, f.h,
      f.ax * scale, f.ay * scale + footSink, f.w * scale, f.h * scale
    );
    ctx.restore();
    return true;
  }
};
