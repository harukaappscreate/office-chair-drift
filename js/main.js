/**
 * js/main.js
 * ゲームのエントリーポイント・入力ハンドリング・メインループ制御（100点満点完成版）
 * - UnrealBloom 発光・PBRシーンの駆動
 * - ユーロビート風BGMシーケンサー＆連続ドリフトタイヤスキール音の駆動
 * - メンタル0時のスローモーション「社畜ラグドール吹っ飛び」演出
 * - 複合機ジャンプ台＆巨大決裁ロボ社長ボス戦の統合
 */
window.OfficeDriftGame = window.OfficeDriftGame || {};

class GameApp {
  constructor() {
    this.config = window.OfficeDriftGame.Config;
    this.sceneManager = new window.OfficeDriftGame.SceneManager('canvas-container');
    this.soundSystem = new window.OfficeDriftGame.SoundSystem();
    this.effectSystem = new window.OfficeDriftGame.EffectSystem(
      this.sceneManager.scene,
      this.sceneManager.camera
    );
    this.gameState = new window.OfficeDriftGame.GameState();
    this.environment = new window.OfficeDriftGame.Environment(this.sceneManager.scene);
    this.player = new window.OfficeDriftGame.Player(this.sceneManager.scene);
    this.obstacleManager = new window.OfficeDriftGame.ObstacleManager(this.sceneManager.scene);

    this.input = {
      left: false,
      right: false,
      pointerActive: false,
      pointerWorldX: 0
    };

    this.lastTime = performance.now();
    this.bindEvents();
    this.animate();
  }

  bindEvents() {
    // キーボード操作
    window.addEventListener('keydown', (e) => {
      if (e.code === 'KeyA' || e.code === 'ArrowLeft') {
        this.input.left = true;
        this.input.pointerActive = false;
      }
      if (e.code === 'KeyD' || e.code === 'ArrowRight') {
        this.input.right = true;
        this.input.pointerActive = false;
      }
      if (e.code === 'KeyW' || e.code === 'ArrowUp') {
        this.activateSpin();
      }
      if (e.code === 'Space') {
        e.preventDefault();
        this.activateBoost();
      }
    });

    window.addEventListener('keyup', (e) => {
      if (e.code === 'KeyA' || e.code === 'ArrowLeft') this.input.left = false;
      if (e.code === 'KeyD' || e.code === 'ArrowRight') this.input.right = false;
    });

    // マウス・タッチ移動によるレーンドリフト操作
    const updatePointerX = (clientX) => {
      const normX = (clientX / window.innerWidth) * 2 - 1;
      this.input.pointerWorldX = normX * this.config.LANE_LIMIT * 1.15;
      this.input.pointerActive = true;
    };

    window.addEventListener('mousemove', (e) => {
      if (!this.gameState.isPlaying || this.gameState.isCrashing) return;
      updatePointerX(e.clientX);
    });

    window.addEventListener('mousedown', (e) => {
      if (!this.gameState.isPlaying || this.gameState.isCrashing) return;
      if (e.target.closest('button')) return;
      if (e.button === 0) {
        this.activateSpin();
      } else if (e.button === 2) {
        this.activateBoost();
      }
    });

    window.addEventListener('contextmenu', (e) => {
      if (this.gameState.isPlaying) e.preventDefault();
    });

    window.addEventListener(
      'touchstart',
      (e) => {
        if (!this.gameState.isPlaying || this.gameState.isCrashing || !e.touches.length) return;
        if (e.target.closest('button')) return;
        updatePointerX(e.touches[0].clientX);
      },
      { passive: true }
    );

    window.addEventListener(
      'touchmove',
      (e) => {
        if (!this.gameState.isPlaying || this.gameState.isCrashing || !e.touches.length) return;
        updatePointerX(e.touches[0].clientX);
      },
      { passive: true }
    );

    // UIボタンイベント
    const startBtn = document.getElementById('start-btn');
    const retryBtn = document.getElementById('retry-btn');
    const shareBtn = document.getElementById('share-btn');
    const spinBtn = document.getElementById('btn-spin');
    const boostBtn = document.getElementById('btn-boost');
    const bgmBtn = document.getElementById('btn-bgm');

    if (startBtn) startBtn.addEventListener('click', () => this.startGame());
    if (retryBtn) retryBtn.addEventListener('click', () => this.startGame());

    const bindButtonTouchAndClick = (btn, action) => {
      if (!btn) return;
      let handledTouch = false;
      btn.addEventListener(
        'touchstart',
        (e) => {
          e.stopPropagation();
          e.preventDefault();
          handledTouch = true;
          action();
          setTimeout(() => { handledTouch = false; }, 350);
        },
        { passive: false }
      );
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (handledTouch) return;
        action();
      });
    };

    bindButtonTouchAndClick(spinBtn, () => this.activateSpin());
    bindButtonTouchAndClick(boostBtn, () => this.activateBoost());
    bindButtonTouchAndClick(bgmBtn, () => {
      const isMuted = this.soundSystem.toggleMute();
      if (bgmBtn) bgmBtn.textContent = isMuted ? '🔇 BGM OFF' : '🔊 BGM ON';
    });
    if (shareBtn) {
      shareBtn.addEventListener('click', () => this.copyShareResult(shareBtn));
    }
  }

  activateSpin() {
    if (!this.gameState.isPlaying || this.gameState.isCrashing) return;
    if (this.player.triggerSpin()) {
      this.soundSystem.playSpin();
    }
  }

  activateBoost() {
    if (!this.gameState.isPlaying || this.gameState.isCrashing) return;
    if (this.gameState.tryActivateBoost()) {
      this.soundSystem.playBoost();
      this.effectSystem.flashScreen('rgba(255, 215, 0, 0.45)');
      this.sceneManager.triggerShake(0.6, 0.4);
    }
  }

  startGame() {
    this.soundSystem.init();
    this.gameState.reset();
    this.gameState.isPlaying = true;

    this.player.reset();
    this.obstacleManager.clear();
    this.effectSystem.clear();
    this.sceneManager.applyFloorTheme(this.gameState.getCurrentFloor());

    document.getElementById('title-screen').classList.add('hidden');
    document.getElementById('result-screen').classList.add('hidden');
    document.getElementById('hud').classList.remove('hidden');

    this.soundSystem.playBoost();
    this.gameState.showCutin('🪑 定時退社ドリフト 開始！！');
  }

  onGameOver() {
    const speedLines = document.getElementById('speed-lines');
    if (speedLines) speedLines.className = 'speed-lines';

    document.getElementById('hud').classList.add('hidden');
    const resultScreen = document.getElementById('result-screen');
    resultScreen.classList.remove('hidden');

    const rankInfo = this.gameState.getRankInfo();
    document.getElementById('result-rank').textContent = rankInfo.title;
    document.getElementById('result-comment').textContent = rankInfo.comment;
    document.getElementById('res-score').textContent = `${this.gameState.scoreHours.toFixed(1)} 時間`;
    const bestEl = document.getElementById('res-best');
    if (bestEl) bestEl.textContent = this.gameState.bestScoreHours.toFixed(1);
    document.getElementById('res-gates').textContent = `${this.gameState.gatesCleared} フロア突破`;
    document.getElementById('res-smashed').textContent = `${this.gameState.smashedCount} 個`;
    document.getElementById('res-combo').textContent = `${this.gameState.maxCombo} COMBO`;
  }

  copyShareResult(btnEl) {
    const rankInfo = this.gameState.getRankInfo();
    const text =
      `【出社拒否！オフィスチェア・ドリフト無双】\n` +
      `🏆 本日の退社称号：「${rankInfo.title}」\n` +
      `💥 粉砕した残業時間：${this.gameState.scoreHours.toFixed(1)}時間 (自己ベスト: ${this.gameState.bestScoreHours.toFixed(1)}h)\n` +
      `🚪 突破した退社ゲート：${this.gameState.gatesCleared}フロア\n` +
      `💮 弾き飛ばしたハンコ＆上司：${this.gameState.smashedCount}個 (最大${this.gameState.maxCombo}コンボ)\n` +
      `#オフィスチェアドリフト無双 #Threejsバカゲー`;

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        btnEl.textContent = '✅ コピー完了！SNSに貼り付けて自慢しよう！';
        setTimeout(() => {
          btnEl.textContent = '📋 退社記録をコピーして自慢する';
        }, 2500);
      });
    }
  }

  animate() {
    requestAnimationFrame(() => this.animate());

    const now = performance.now();
    const dt = Math.min((now - this.lastTime) / 1000, 0.05);
    this.lastTime = now;

    if (this.gameState.isPlaying) {
      const floorCfg = this.gameState.getCurrentFloor();

      // スローモーション・社畜ラグドール吹っ飛び演出中かどうか
      if (this.gameState.isCrashing) {
        if (!this.player.isRagdoll) {
          this.player.triggerRagdollCrash();
          this.soundSystem.playRagdollCrash();
          this.sceneManager.triggerShake(1.1, 0.6);
        }
        const slowDt = dt * 0.45;
        this.player.updateRagdoll(slowDt, this.effectSystem, this.soundSystem);
        this.environment.update(slowDt, 14, 999);
        this.effectSystem.update(slowDt, 14);
        this.gameState.update(dt, 0);
        this.soundSystem.update(dt, 0, true, false, false, false);
        this.sceneManager.update(
          dt,
          this.player.x,
          false,
          false,
          0,
          this.player.upperBodyGroup.position.y,
          true
        );
      } else {
        // 通常プレイ更新
        this.player.update(
          dt,
          this.input,
          this.gameState.isBoosting,
          floorCfg.speedMult,
          this.effectSystem
        );

        const { gateReached } = this.gameState.update(dt, this.player.speed);
        if (gateReached) {
          this.soundSystem.playGateClear();
          this.effectSystem.flashScreen('rgba(0, 240, 255, 0.45)');
          this.sceneManager.applyFloorTheme(this.gameState.getCurrentFloor());
        }

        const remGateDist = Math.max(0, this.gameState.nextGateDistance - this.gameState.distance);
        this.environment.update(dt, this.player.speed, remGateDist);
        this.obstacleManager.update(
          dt,
          this.player,
          this.gameState,
          this.effectSystem,
          this.soundSystem,
          this.sceneManager
        );
        this.effectSystem.update(dt, this.player.speed);

        // ユーロビートBGM＆連続ドリフトタイヤスキール音の更新
        this.soundSystem.update(
          dt,
          this.player.vx,
          this.player.isAirborne(),
          true,
          this.gameState.isBoosting,
          this.gameState.isBossActive
        );

        // 集中線エフェクト切り替え
        const speedLines = document.getElementById('speed-lines');
        if (speedLines) {
          if (this.gameState.isBoosting) {
            speedLines.className = 'speed-lines fever';
          } else if (
            this.player.isSpinning ||
            this.player.isAirborne() ||
            Math.abs(this.player.vx) > 12
          ) {
            speedLines.className = 'speed-lines active';
          } else {
            speedLines.className = 'speed-lines';
          }
        }

        // カメラ更新（ジャンプ高度・横Gバンク角に対応）
        this.sceneManager.update(
          dt,
          this.player.x,
          this.player.isSpinning,
          this.gameState.isBoosting,
          this.player.vx,
          this.player.y,
          false
        );
      }

      if (this.gameState.isGameOver) {
        this.onGameOver();
      }
    } else {
      // タイトル・リザルト画面中は背景でデモ走行
      this.soundSystem.update(dt, 0, false, false, false, false);
      this.environment.update(dt, 24, 999);
      this.player.swivelGroup.rotation.y += dt * 2.2;
      this.effectSystem.update(dt, 24);
      this.sceneManager.update(dt, Math.sin(now * 0.001) * 1.5, false, false, 0, 0, false);
    }

    this.sceneManager.render();
  }
}

window.OfficeDriftGame.tryStart = function () {
  if (window.OfficeDriftGame._started) return;
  if (!window.THREE || !window.OfficeDriftGame.SceneManager) return;
  window.OfficeDriftGame._started = true;
  window.OfficeDriftGame.app = new GameApp();
};

if (document.readyState === 'loading') {
  window.addEventListener('DOMContentLoaded', () => window.OfficeDriftGame.tryStart());
} else {
  window.OfficeDriftGame.tryStart();
}
