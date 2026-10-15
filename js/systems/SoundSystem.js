/**
 * js/systems/SoundSystem.js
 * Web Audio API プロシージャル音源＆ユーロビート風BGMシーケンサー（100点満点完成版）
 * - ユーロビート風オクターブベース＆ブラスリード自動演奏（有給ブースト・ボス戦時にテンポアップ）
 * - ドリフト横Gに応じたリアルタイム連続タイヤスキール音（「キュルルル！」）
 * - 複合機ジャンプ音、ボス警報サイレン、ボス撃破爆発音、ラグドール吹っ飛びクラッシュ音
 */
window.OfficeDriftGame = window.OfficeDriftGame || {};

class SoundSystem {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.bgmPlaying = false;
    this.stepIndex = 0;
    this.stepTimer = 0;

    // 連続ドリフトタイヤスキール音用ノード
    this.screechOsc1 = null;
    this.screechOsc2 = null;
    this.screechGain = null;
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        this.setupDriftScreechNodes();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggleMute() {
    this.muted = !this.muted;
    if (this.muted && this.screechGain && this.ctx) {
      this.screechGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.03);
    }
    return this.muted;
  }

  // 連続タイヤスキール音（「キュルルル！」）の常駐オシレーター構築
  setupDriftScreechNodes() {
    if (!this.ctx || this.screechGain) return;

    this.screechOsc1 = this.ctx.createOscillator();
    this.screechOsc2 = this.ctx.createOscillator();
    this.screechOsc1.type = 'sawtooth';
    this.screechOsc2.type = 'triangle';

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 1350;
    filter.Q.value = 4.5;

    this.screechGain = this.ctx.createGain();
    this.screechGain.gain.value = 0.0;

    this.screechOsc1.connect(filter);
    this.screechOsc2.connect(filter);
    filter.connect(this.screechGain);
    this.screechGain.connect(this.ctx.destination);

    this.screechOsc1.start();
    this.screechOsc2.start();
  }

  // 毎フレーム呼び出し：ドリフト横速度に応じたタイヤスキール音＋ユーロビートBGMの更新
  update(dt, lateralSpeed = 0, isAirborne = false, isPlaying = false, isBoosting = false, isBossActive = false) {
    if (!this.ctx || this.muted) return;
    const now = this.ctx.currentTime;

    // 1. 連続タイヤスキール音の制御
    if (this.screechGain) {
      const absVx = Math.abs(lateralSpeed);
      if (isPlaying && !isAirborne && absVx > 8.5) {
        const intensity = Math.min((absVx - 8.5) / 18, 1.0);
        const wobble = Math.sin(performance.now() * 0.045) * 45;
        this.screechOsc1.frequency.setTargetAtTime(980 + intensity * 320 + wobble, now, 0.02);
        this.screechOsc2.frequency.setTargetAtTime(1420 + intensity * 410 - wobble, now, 0.02);
        this.screechGain.gain.setTargetAtTime(intensity * 0.065, now, 0.03);
      } else {
        this.screechGain.gain.setTargetAtTime(0.0, now, 0.04);
      }
    }

    // 2. ユーロビート風BGMシーケンサー（16分音符ステップ）
    if (!isPlaying) return;

    const bpm = isBoosting ? 172 : isBossActive ? 162 : 148;
    const stepDuration = 60 / bpm / 4; // 16分音符1ステップの長さ

    this.stepTimer += dt;
    if (this.stepTimer >= stepDuration) {
      this.stepTimer -= stepDuration;
      this.playEurobeatStep(this.stepIndex, stepDuration, isBoosting);
      this.stepIndex = (this.stepIndex + 1) % 32;
    }
  }

  playEurobeatStep(step, dur, isBoosting) {
    if (!this.ctx || this.muted) return;
    const now = this.ctx.currentTime;

    // 疾走感のあるオクターブ・シンセベース (Am -> G -> F -> E)
    const rootNotes = [
      110.0, 110.0, 110.0, 110.0, 110.0, 110.0, 110.0, 110.0, // A2
      98.0,  98.0,  98.0,  98.0,  98.0,  98.0,  98.0,  98.0,  // G2
      87.31, 87.31, 87.31, 87.31, 87.31, 87.31, 87.31, 87.31, // F2
      82.41, 82.41, 82.41, 82.41, 82.41, 82.41, 98.0,  103.83 // E2 -> G2 -> G#2
    ];
    const baseFreq = rootNotes[step] * (step % 2 === 1 ? 2.0 : 1.0) * (isBoosting ? 1.122 : 1.0);

    const bassOsc = this.ctx.createOscillator();
    const bassFilter = this.ctx.createBiquadFilter();
    const bassGain = this.ctx.createGain();

    bassOsc.type = 'sawtooth';
    bassOsc.frequency.setValueAtTime(baseFreq, now);

    bassFilter.type = 'lowpass';
    bassFilter.frequency.setValueAtTime(950, now);
    bassFilter.frequency.exponentialRampToValueAtTime(240, now + dur * 0.9);

    bassGain.gain.setValueAtTime(0.075, now);
    bassGain.gain.exponentialRampToValueAtTime(0.005, now + dur * 0.92);

    bassOsc.connect(bassFilter);
    bassFilter.connect(bassGain);
    bassGain.connect(this.ctx.destination);
    bassOsc.start(now);
    bassOsc.stop(now + dur);

    // ユーロビート・シンセブラスリード（メロディフレーズ）
    const leadPattern = [
      440.0, 0, 523.25, 587.33, 659.25, 0, 587.33, 523.25,
      587.33, 0, 493.88, 0, 392.0, 0, 493.88, 523.25,
      587.33, 0, 659.25, 698.46, 659.25, 587.33, 523.25, 493.88,
      659.25, 0, 523.25, 0, 493.88, 523.25, 587.33, 659.25
    ];
    const leadFreq = leadPattern[step];
    if (leadFreq > 0) {
      const leadOsc = this.ctx.createOscillator();
      const leadGain = this.ctx.createGain();
      leadOsc.type = 'square';
      leadOsc.frequency.setValueAtTime(leadFreq * (isBoosting ? 1.122 : 1.0), now);

      leadGain.gain.setValueAtTime(0.045, now);
      leadGain.gain.exponentialRampToValueAtTime(0.004, now + dur * 1.4);

      leadOsc.connect(leadGain);
      leadGain.connect(this.ctx.destination);
      leadOsc.start(now);
      leadOsc.stop(now + dur * 1.45);
    }

    // 4つ打ちバスドラム（step % 4 === 0）
    if (step % 4 === 0) {
      const kickOsc = this.ctx.createOscillator();
      const kickGain = this.ctx.createGain();
      kickOsc.type = 'sine';
      kickOsc.frequency.setValueAtTime(135, now);
      kickOsc.frequency.exponentialRampToValueAtTime(38, now + 0.11);

      kickGain.gain.setValueAtTime(0.18, now);
      kickGain.gain.exponentialRampToValueAtTime(0.008, now + 0.12);

      kickOsc.connect(kickGain);
      kickGain.connect(this.ctx.destination);
      kickOsc.start(now);
      kickOsc.stop(now + 0.12);
    }
  }

  // 回転スピン発動音
  playSpin() {
    if (!this.ctx || this.muted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.exponentialRampToValueAtTime(720, now + 0.18);
    osc.frequency.exponentialRampToValueAtTime(320, now + 0.45);

    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.45);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.45);
  }

  // 複合機ジャンプ台離陸音（キュイィィン！）
  playJump() {
    if (!this.ctx || this.muted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(240, now);
    osc.frequency.exponentialRampToValueAtTime(980, now + 0.32);

    gain.gain.setValueAtTime(0.24, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.35);
  }

  // ハンコ・上司を弾き飛ばした時の「承認ドゴォォン！！」音
  playSmash(combo = 1) {
    if (!this.ctx || this.muted) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    const pitchBoost = Math.min(combo * 18, 260);
    osc.frequency.setValueAtTime(160 + pitchBoost, now);
    osc.frequency.exponentialRampToValueAtTime(42, now + 0.28);

    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.3);

    const chime = this.ctx.createOscillator();
    const chimeGain = this.ctx.createGain();
    chime.type = 'sine';
    const baseNote = 520 + Math.min(combo * 35, 600);
    chime.frequency.setValueAtTime(baseNote, now);
    chime.frequency.setValueAtTime(baseNote * 1.25, now + 0.07);

    chimeGain.gain.setValueAtTime(0.16, now);
    chimeGain.gain.exponentialRampToValueAtTime(0.008, now + 0.25);

    chime.connect(chimeGain);
    chimeGain.connect(this.ctx.destination);
    chime.start(now);
    chime.stop(now + 0.25);
  }

  // 有給ジェット噴射音
  playBoost() {
    if (!this.ctx || this.muted) return;
    const now = this.ctx.currentTime;

    const bufferSize = this.ctx.sampleRate * 0.7;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(300, now);
    filter.frequency.exponentialRampToValueAtTime(1400, now + 0.35);
    filter.frequency.exponentialRampToValueAtTime(500, now + 0.7);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.32, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.7);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);
    noise.start(now);
    noise.stop(now + 0.7);
  }

  // 巨大決裁ロボ社長 登場警報サイレン
  playBossSiren() {
    if (!this.ctx || this.muted) return;
    for (let i = 0; i < 2; i++) {
      const now = this.ctx.currentTime + i * 0.35;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(420, now);
      osc.frequency.linearRampToValueAtTime(780, now + 0.18);
      osc.frequency.linearRampToValueAtTime(420, now + 0.33);

      gain.gain.setValueAtTime(0.22, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.34);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.34);
    }
  }

  // 巨大決裁ロボ社長 撃破ファンファーレ＆大爆発
  playBossDefeat() {
    if (!this.ctx || this.muted) return;
    this.playBoost();
    const notes = [523.25, 659.25, 783.99, 1046.5, 1318.5];
    notes.forEach((freq, idx) => {
      const now = this.ctx.currentTime + idx * 0.07;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.008, now + 0.45);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.45);
    });
  }

  // 被弾（残業ダメージ）音
  playDamage() {
    if (!this.ctx || this.muted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.linearRampToValueAtTime(65, now + 0.32);

    gain.gain.setValueAtTime(0.28, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.35);
  }

  // ゲームオーバー時の社畜ラグドール大クラッシュ音
  playRagdollCrash() {
    if (!this.ctx || this.muted) return;
    this.playDamage();
    const notes = [620, 480, 340, 210, 110];
    notes.forEach((freq, idx) => {
      const now = this.ctx.currentTime + idx * 0.12;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.6, now + 0.11);

      gain.gain.setValueAtTime(0.22, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.12);
    });
  }

  // 定時退社ゲート突破ファンファーレ
  playGateClear() {
    if (!this.ctx || this.muted) return;
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((freq, idx) => {
      const now = this.ctx.currentTime + idx * 0.08;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0.22, now);
      gain.gain.exponentialRampToValueAtTime(0.008, now + 0.35);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.35);
    });
  }
}

window.OfficeDriftGame.SoundSystem = SoundSystem;
