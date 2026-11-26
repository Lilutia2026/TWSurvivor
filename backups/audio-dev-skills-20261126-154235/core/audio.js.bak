// ============================================================================
// 《TW倖存者》背景音樂（BGM）雙軌播放器 & 摸魚保護機制 (core/audio.js)
// ============================================================================

const AudioManager = {
    enabled: true,
    volume: 0.45,
    currentTrack: null,      // 'title_login' | 'char_select' | 'raidia_day' | 'raidia_night' | 'battle' | 關卡曲目
    playlist: null,          // 關卡多曲輪播清單（例如 ['battle_penine_1', 'battle_penine_2', 'battle_penine_3']）
    playlistIndex: 0,
    playlistShuffle: true,
    playToken: 0,            // 防串音流水號：確保切換場景後舊音檔載入不會延遲插播
    htmlAudio: null,
    synthCtx: null,
    synthTimer: null,
    synthStep: 0,
    isBlurred: false,

    // 曲目設定（優先嘗試讀取 assets/bgm/ 下的真實音檔，無檔案則自動無縫降級播放柔和合成和弦）
    tracks: {
        title_login:     { label: '標題與帳號登入封面（預留）', files: ['assets/bgm/title_login.m4a', 'assets/bgm/title_login.ogg', 'assets/bgm/title_login.mp3'], tempo: 560, notes: [220.00, 261.63, 329.63, 392.00, 440.00, 392.00, 329.63, 261.63] },
        char_select:     { label: '角色選擇大廳', files: ['assets/bgm/char_select.m4a', 'assets/bgm/char_select.ogg', 'assets/bgm/char_select.mp3'], tempo: 500, notes: [261.63, 329.63, 392.00, 493.88, 523.25, 493.88, 392.00, 329.63] },
        raidia_day:      { label: '雷蒂亞（白晝・Come with Happiness）', files: ['assets/bgm/raidia_day.m4a', 'assets/bgm/raidia_day.ogg', 'assets/bgm/raidia_day.mp3'], tempo: 380, notes: [392.00, 440.00, 493.88, 587.33, 659.25, 587.33, 493.88, 440.00] },
        raidia_night:    { label: '雷蒂亞（星夜・呼喚幸福之歌）', files: ['assets/bgm/raidia_night.m4a', 'assets/bgm/raidia_night.ogg', 'assets/bgm/raidia_night.mp3'], tempo: 620, notes: [329.63, 392.00, 493.88, 587.33, 493.88, 392.00, 293.66, 392.00] },
        battle:          { label: '野外征戰（通用）', files: ['assets/bgm/battle.m4a', 'assets/bgm/battle.ogg', 'assets/bgm/battle.mp3'], tempo: 240, notes: [220.00, 261.63, 329.63, 440.00, 392.00, 329.63, 293.66, 329.63] },
        // 第 1 階：貝那茵森林歌單
        battle_penine_1: { label: '貝那茵森林・曲目 1', files: ['assets/bgm/battle_penine_1.m4a', 'assets/bgm/battle_penine_1.ogg', 'assets/bgm/battle_penine_1.mp3'], tempo: 250, notes: [261.63, 329.63, 392.00, 523.25, 493.88, 392.00, 329.63, 392.00] },
        battle_penine_2: { label: '貝那茵森林・曲目 2', files: ['assets/bgm/battle_penine_2.m4a', 'assets/bgm/battle_penine_2.ogg', 'assets/bgm/battle_penine_2.mp3'], tempo: 240, notes: [293.66, 349.23, 440.00, 523.25, 440.00, 349.23, 329.63, 392.00] },
        battle_penine_3: { label: '貝那茵森林・曲目 3', files: ['assets/bgm/battle_penine_3.m4a', 'assets/bgm/battle_penine_3.ogg', 'assets/bgm/battle_penine_3.mp3'], tempo: 230, notes: [220.00, 261.63, 329.63, 440.00, 392.00, 329.63, 293.66, 329.63] },
        // 第 2 階：耳語海岸歌單
        battle_coast_1:  { label: '耳語海岸・曲目 1', files: ['assets/bgm/battle_coast_1.m4a', 'assets/bgm/battle_coast_1.ogg', 'assets/bgm/battle_coast_1.mp3'], tempo: 245, notes: [246.94, 293.66, 369.99, 493.88, 440.00, 369.99, 329.63, 293.66] },
        battle_coast_2:  { label: '耳語海岸・曲目 2', files: ['assets/bgm/battle_coast_2.m4a', 'assets/bgm/battle_coast_2.ogg', 'assets/bgm/battle_coast_2.mp3'], tempo: 235, notes: [220.00, 277.18, 329.63, 440.00, 493.88, 440.00, 329.63, 277.18] },
        battle_coast_3:  { label: '耳語海岸・曲目 3', files: ['assets/bgm/battle_coast_3.m4a', 'assets/bgm/battle_coast_3.ogg', 'assets/bgm/battle_coast_3.mp3'], tempo: 225, notes: [196.00, 246.94, 293.66, 392.00, 440.00, 392.00, 293.66, 246.94] }
    },

    init() {
        const savedMute = localStorage.getItem('tws_bgm_enabled');
        if (savedMute !== null) this.enabled = savedMute === 'true';

        // 瀏覽器首次點擊解鎖音效播放權限（包含處於 paused 狀態的 HTML5 Audio）
        const unlock = () => {
            if (this.enabled && this.currentTrack && !this.isBlurred) {
                if (this.htmlAudio && this.htmlAudio.paused) {
                    this.htmlAudio.play().catch(() => {});
                } else if (!this.htmlAudio && !this.synthTimer) {
                    this.play(this.currentTrack, true);
                }
            }
            if (this.synthCtx && this.synthCtx.state === 'suspended') {
                this.synthCtx.resume().catch(() => {});
            }
            window.removeEventListener('pointerdown', unlock);
            window.removeEventListener('keydown', unlock);
        };
        window.addEventListener('pointerdown', unlock);
        window.addEventListener('keydown', unlock);

               // 【摸魚保護機制】視窗失焦或切換分頁時瞬間靜音並自動凍結局內戰鬥
               const onHide = () => {
                this.isBlurred = true;
                this._pausePlayback();
                if (battleSceneActive && !isPaused && !gameOver) togglePause();
            };
            const onShow = () => {
                this.isBlurred = false;
                if (this.enabled && this.currentTrack) this._resumePlayback();
            };
        window.addEventListener('blur', onHide);   
        window.addEventListener('focus', onShow);
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) onHide();
            else onShow();
        });
    },

    toggle() {
        this.enabled = !this.enabled;
        localStorage.setItem('tws_bgm_enabled', String(this.enabled));
        if (!this.enabled) {
            this.stop();
        } else if (this.playlist && this.playlist.length > 0) {
            this._playPlaylistCurrent();
        } else if (this.currentTrack) {
            this.play(this.currentTrack, true);
        }
        return this.enabled;
    },

    // 播放關卡多曲輪播清單（支援自動接下一首、隨機不連播、缺檔自動跳下一首）
    playPlaylist(trackKeys, shuffle = true) {
        const validKeys = Array.isArray(trackKeys) ? trackKeys.filter(k => this.tracks[k]) : [];
        if (validKeys.length === 0) {
            this.play('battle', true);
            return;
        }
        this.stop();
        this.playlist = validKeys;
        this.playlistShuffle = shuffle;
        this.playlistIndex = shuffle ? Math.floor(Math.random() * validKeys.length) : 0;
        this._playPlaylistCurrent(0);
    },

    _playPlaylistCurrent(failCount = 0) {
        if (!this.playlist || this.playlist.length === 0) return;
        // 若歌單內所有曲目都尚未放入實體音檔，自動降級播放通用 battle（或合成音效）
        if (failCount >= this.playlist.length) {
            const fallbackKey = this.playlist[0] || 'battle';
            this.currentTrack = fallbackKey;
            const myToken = ++this.playToken;
            if (!this.enabled || this.isBlurred) return;
            const cfg = this.tracks[fallbackKey] || this.tracks.battle;
            this._tryPlayFiles(this.tracks.battle.files, 0, myToken, true, () => {
                if (this.playToken !== myToken || !this.enabled || this.isBlurred) return;
                this._startSynth(cfg);
            });
            return;
        }

        const trackKey = this.playlist[this.playlistIndex % this.playlist.length];
        this.currentTrack = trackKey;
        const myToken = ++this.playToken;
        if (!this.enabled || this.isBlurred) return;

        const cfg = this.tracks[trackKey];
        const isSingleTrack = this.playlist.length === 1;
        this._tryPlayFiles(cfg.files, 0, myToken, isSingleTrack, () => {
            // 該曲目在 assets/bgm/ 找不到實體檔案時，自動跳下一首嘗試
            if (this.playToken !== myToken || !this.playlist) return;
            this.playlistIndex = (this.playlistIndex + 1) % this.playlist.length;
            this._playPlaylistCurrent(failCount + 1);
        }, () => {
            // 單曲播完（onended）後自動無縫切換歌單下一首
            if (this.playToken !== myToken || !this.playlist) return;
            this._advancePlaylist();
        });
    },

    _advancePlaylist() {
        if (!this.playlist || this.playlist.length === 0) return;
        if (this.playlist.length === 1) {
            this.playlistIndex = 0;
        } else if (this.playlistShuffle) {
            let nextIdx = this.playlistIndex;
            while (nextIdx === this.playlistIndex) {
                nextIdx = Math.floor(Math.random() * this.playlist.length);
            }
            this.playlistIndex = nextIdx;
        } else {
            this.playlistIndex = (this.playlistIndex + 1) % this.playlist.length;
        }
        this._playPlaylistCurrent(0);
    },

    play(trackKey, forceRestart = false) {
        if (!this.tracks[trackKey]) return;
        if (!forceRestart && !this.playlist && this.currentTrack === trackKey && (this.htmlAudio || this.synthTimer)) return;
        this.playlist = null; // 切換回單曲模式時清除關卡歌單狀態
        this.stop();
        this.currentTrack = trackKey;
        const myToken = ++this.playToken;
        if (!this.enabled || this.isBlurred) return;

        const cfg = this.tracks[trackKey];
        this._tryPlayFiles(cfg.files, 0, myToken, true, () => {
            if (this.playToken !== myToken || !this.enabled || this.isBlurred) return;
            this._startSynth(cfg);
        });
    },

    _tryPlayFiles(files, idx, token, shouldLoop, onAllFailed, onEndedCallback = null) {
        if (this.playToken !== token) return;
        if (!files || idx >= files.length) {
            onAllFailed();
            return;
        }
        const audio = new Audio(files[idx]);
        audio.loop = !!shouldLoop;
        audio.volume = this.volume;
        if (!shouldLoop && typeof onEndedCallback === 'function') {
            audio.onended = () => {
                if (this.playToken !== token) return;
                onEndedCallback();
            };
        }
        audio.onerror = () => {
            if (this.playToken !== token) return;
            this._tryPlayFiles(files, idx + 1, token, shouldLoop, onAllFailed, onEndedCallback);
        };
        audio.oncanplaythrough = () => {
            if (this.playToken !== token || this.currentTrack === null || !this.enabled || this.isBlurred) {
                audio.pause();
                audio.src = '';
                return;
            }
            if (this.htmlAudio && this.htmlAudio !== audio) {
                this.htmlAudio.pause();
                this.htmlAudio.src = '';
            }
            this.htmlAudio = audio;
            audio.play().catch(() => { /* 等待首次點擊解鎖 */ });
        };
        audio.load();
    },

    _startSynth(cfg) {
        try {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (!AudioCtx) return;
            if (!this.synthCtx) this.synthCtx = new AudioCtx();
            if (this.synthCtx.state === 'suspended') this.synthCtx.resume();
            this.synthStep = 0;

            const playNote = () => {
                if (!this.enabled || this.isBlurred || !this.synthCtx) return;
                const freq = cfg.notes[this.synthStep % cfg.notes.length];
                this.synthStep++;
                const now = this.synthCtx.currentTime;
                const osc = this.synthCtx.createOscillator();
                const gain = this.synthCtx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(freq, now);
                gain.gain.setValueAtTime(0.001, now);
                gain.gain.exponentialRampToValueAtTime(0.045 * this.volume, now + 0.04);
                gain.gain.exponentialRampToValueAtTime(0.0008, now + (cfg.tempo / 1000) * 1.4);
                osc.connect(gain);
                gain.connect(this.synthCtx.destination);
                osc.start(now);
                osc.stop(now + (cfg.tempo / 1000) * 1.45);
            };
            playNote();
            this.synthTimer = setInterval(playNote, cfg.tempo);
        } catch (e) { /* 忽略瀏覽器未解鎖前之例外 */ }
    },

    _pausePlayback() {
        if (this.htmlAudio) this.htmlAudio.pause();
        if (this.synthTimer) { clearInterval(this.synthTimer); this.synthTimer = null; }
    },

    _resumePlayback() {
        if (this.htmlAudio) {
            this.htmlAudio.play().catch(() => {});
        } else if (this.currentTrack && this.tracks[this.currentTrack]) {
            this._startSynth(this.tracks[this.currentTrack]);
        }
    },

    stop() {
        this.playToken++;
        if (this.htmlAudio) {
            this.htmlAudio.pause();
            this.htmlAudio.src = '';
            this.htmlAudio = null;
        }
        if (this.synthTimer) {
            clearInterval(this.synthTimer);
            this.synthTimer = null;
        }
    }
};

window.addEventListener('DOMContentLoaded', () => AudioManager.init());
