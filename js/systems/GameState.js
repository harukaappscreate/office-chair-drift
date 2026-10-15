/**
 * js/systems/GameState.js
 * スコア（粉砕した残業時間）、自己ベスト保存（localStorage）、コンボ、メンタル残量(HP)、
 * 有給ジェットゲージ、巨大決裁ロボ社長ボスHP、スローモーション・ラグドール敗北演出、
 * およびHUD表示を一元管理します（100点満点完成版）。
 */
window.OfficeDriftGame = window.OfficeDriftGame || {};

class GameState {
  constructor() {
    this.config = window.OfficeDriftGame.Config;
    this.bestScoreHours = this.loadBestScore();
    this.reset();
  }

  loadBestScore() {
    try {
      const saved = localStorage.getItem('ocd_best_score_hours');
      return saved ? parseFloat(saved) || 0 : 0;
    } catch (e) {
      return 0;
    }
  }

  saveBestScore() {
    if (this.scoreHours > this.bestScoreHours) {
      this.bestScoreHours = this.scoreHours;
      try {
        localStorage.setItem('ocd_best_score_hours', this.bestScoreHours.toFixed(1));
      } catch (e) {
        // ignore storage errors
      }
    }
  }

  reset() {
    this.isPlaying = false;
    this.isCrashing = false;
    this.crashTimer = 0;
    this.isGameOver = false;

    this.scoreHours = 0;
    this.distance = 0;
    this.nextGateDistance = this.config.GATE_INTERVAL_METERS;
    this.gatesCleared = 0;
    this.smashedCount = 0;

    this.combo = 0;
    this.maxCombo = 0;
    this.comboTimer = 0;

    this.hp = this.config.PLAYER.MAX_HP;
    this.boost = 100;
    this.isBoosting = false;
    this.boostTimer = 0;

    this.floorIndex = 0;

    // 巨大決裁ロボ社長 ボス状態
    this.isBossActive = false;
    this.bossHp = 100;
    this.bossMaxHp = 100;
    this.bossSpawnedForCurrentGate = false;

    this.updateBossHUD();
    this.updateHUD();
  }

  getCurrentFloor() {
    const floors = this.config.FLOORS;
    return floors[Math.min(this.floorIndex, floors.length - 1)];
  }

  addSmashScore(baseHours) {
    this.combo++;
    if (this.combo > this.maxCombo) {
      this.maxCombo = this.combo;
    }
    this.comboTimer = 3.2;
    this.smashedCount++;

    const multiplier = 1 + Math.min(this.combo * 0.15, 3.0);
    const earned = baseHours * multiplier;
    this.scoreHours += earned;
    this.saveBestScore();

    if (!this.isBoosting) {
      this.boost = Math.min(
        this.config.PLAYER.MAX_BOOST,
        this.boost + this.config.PLAYER.BOOST_CHARGE_ON_SMASH
      );
    }

    const comboBox = document.getElementById('combo-box');
    if (comboBox) {
      comboBox.classList.remove('pulse');
      void comboBox.offsetWidth;
      comboBox.classList.add('pulse');
    }

    this.updateHUD();
    return earned;
  }

  takeDamage(amount) {
    if (this.isBoosting || this.isCrashing) return false;
    this.hp = Math.max(0, this.hp - amount);
    this.combo = 0;
    this.comboTimer = 0;
    this.updateHUD();

    if (this.hp <= 0 && !this.isCrashing) {
      // メンタルが0になったら即座にリザルトを出さず、2.2秒間の社畜ラグドール大クラッシュ演出へ突入！
      this.isCrashing = true;
      this.crashTimer = 2.25;
      this.saveBestScore();
      this.showCutin('💥 メンタル崩壊！！ 社畜ラグドール吹っ飛び中！！');
    }
    return true;
  }

  healAndCharge(hpGain, boostGain) {
    this.hp = Math.min(this.config.PLAYER.MAX_HP, this.hp + hpGain);
    this.boost = Math.min(this.config.PLAYER.MAX_BOOST, this.boost + boostGain);
    this.updateHUD();
  }

  tryActivateBoost() {
    if (this.isBoosting || this.boost < 100 || this.isCrashing) return false;
    this.isBoosting = true;
    this.boostTimer = this.config.PLAYER.BOOST_DURATION;
    this.boost = 0;
    this.showCutin('🚀 有給ジェット無双 発動！！（無敵）');
    this.updateHUD();
    return true;
  }

  // 巨大決裁ロボ社長の出現開始
  startBossBattle() {
    this.isBossActive = true;
    this.bossSpawnedForCurrentGate = true;
    this.bossMaxHp = this.config.OBSTACLES.BOSS.baseHp + this.floorIndex * 35;
    this.bossHp = this.bossMaxHp;
    this.updateBossHUD();
    this.showCutin('🤖 警告：巨大決裁ロボ社長「ブラック・カイザー」出現！！');
  }

  // 社長ロボへのダメージ処理（撃破時は true を返す）
  damageBoss(dmg) {
    if (!this.isBossActive) return false;
    this.bossHp = Math.max(0, this.bossHp - dmg);
    this.updateBossHUD();
    if (this.bossHp <= 0) {
      this.isBossActive = false;
      this.scoreHours += this.config.OBSTACLES.BOSS.clearBonusHours;
      this.saveBestScore();
      this.updateBossHUD();
      this.updateHUD();
      this.showCutin('🎉 社長ロボ完全論破！！ 定時退社ゲート開放！！');
      return true;
    }
    return false;
  }

  updateBossHUD() {
    const bossHud = document.getElementById('boss-hud');
    const bossBar = document.getElementById('boss-hp-bar');
    if (!bossHud || !bossBar) return;

    if (this.isBossActive) {
      bossHud.classList.remove('hidden');
      const pct = Math.max(0, (this.bossHp / this.bossMaxHp) * 100);
      bossBar.style.width = `${pct}%`;
    } else {
      bossHud.classList.add('hidden');
    }
  }

  update(dt, speed) {
    if (!this.isPlaying) return { gateReached: false, shouldSpawnBoss: false };

    // ラグドールクラッシュ中のカウントダウン
    if (this.isCrashing) {
      this.crashTimer -= dt;
      if (this.crashTimer <= 0) {
        this.isCrashing = false;
        this.isGameOver = true;
        this.isPlaying = false;
      }
      return { gateReached: false, shouldSpawnBoss: false };
    }

    // ボス戦中はゲート手前で距離進行がホールドされ、撃破するとゲートへ突入！
    const remBeforeMove = this.nextGateDistance - this.distance;
    const metersDelta = (speed * dt) * 0.45;
    if (this.isBossActive && remBeforeMove <= 38) {
      // ボスがゲート前で立ちふさがっている間はゲート距離38mでホールド
      this.scoreHours += metersDelta * 0.03;
    } else {
      this.distance += metersDelta;
      this.scoreHours += metersDelta * 0.04;
    }
    this.saveBestScore();

    // コンボタイマー減衰
    if (this.combo > 0) {
      this.comboTimer -= dt;
      if (this.comboTimer <= 0) {
        this.combo = 0;
      }
    }

    // 有給ブースト管理
    if (this.isBoosting) {
      this.boostTimer -= dt;
      this.boost = (this.boostTimer / this.config.PLAYER.BOOST_DURATION) * 100;
      if (this.boostTimer <= 0) {
        this.isBoosting = false;
        this.boost = 0;
      }
    } else {
      this.boost = Math.min(
        this.config.PLAYER.MAX_BOOST,
        this.boost + this.config.PLAYER.BOOST_CHARGE_PER_SEC * dt
      );
    }

    // ゲート手前140mで巨大決裁ロボ社長が出撃判定
    const remDist = this.nextGateDistance - this.distance;
    let shouldSpawnBoss = false;
    if (
      !this.bossSpawnedForCurrentGate &&
      !this.isBossActive &&
      remDist <= this.config.BOSS_SPAWN_BEFORE_GATE
    ) {
      shouldSpawnBoss = true;
      this.startBossBattle();
    }

    // 定時退社ゲート到達判定
    let gateReached = false;
    if (this.distance >= this.nextGateDistance) {
      gateReached = true;
      this.gatesCleared++;
      this.floorIndex++;
      this.nextGateDistance += this.config.GATE_INTERVAL_METERS;
      this.bossSpawnedForCurrentGate = false;
      this.isBossActive = false;
      this.updateBossHUD();
      this.scoreHours += 25.0;
      this.saveBestScore();
      this.hp = Math.min(this.config.PLAYER.MAX_HP, this.hp + 25);
      const nextFloor = this.getCurrentFloor();
      this.showCutin(`🚪 定時退社ゲート突破！ 次：${nextFloor.name}`);
    }

    this.updateHUD();
    return { gateReached, shouldSpawnBoss };
  }

  showCutin(message) {
    const banner = document.getElementById('cutin-banner');
    const textEl = document.getElementById('cutin-text');
    if (!banner || !textEl) return;
    textEl.textContent = message;
    banner.classList.remove('hidden');
    clearTimeout(this._cutinTimeout);
    this._cutinTimeout = setTimeout(() => {
      banner.classList.add('hidden');
    }, 2400);
  }

  getRankInfo() {
    const ranks = this.config.RANKS;
    let chosen = ranks[0];
    for (const r of ranks) {
      if (this.scoreHours >= r.minHours) {
        chosen = r;
      }
    }
    return chosen;
  }

  updateHUD() {
    const scoreEl = document.getElementById('score-val');
    const bestEl = document.getElementById('hud-best-val');
    const distEl = document.getElementById('gate-dist-val');
    const stageEl = document.getElementById('stage-label');
    const comboValEl = document.getElementById('combo-val');
    const comboRankEl = document.getElementById('combo-rank');
    const hpBar = document.getElementById('hp-bar');
    const hpText = document.getElementById('hp-text');
    const boostBar = document.getElementById('boost-bar');
    const boostText = document.getElementById('boost-text');

    if (scoreEl) scoreEl.textContent = this.scoreHours.toFixed(1);
    if (bestEl) bestEl.textContent = this.bestScoreHours.toFixed(1);
    if (distEl) {
      const rem = Math.max(0, Math.ceil(this.nextGateDistance - this.distance));
      distEl.textContent = rem;
    }
    if (stageEl) stageEl.textContent = this.getCurrentFloor().name;
    if (comboValEl) comboValEl.textContent = this.combo;
    if (comboRankEl) {
      if (this.combo >= 15) comboRankEl.textContent = '🔥 労働基準法超越者';
      else if (this.combo >= 8) comboRankEl.textContent = '⚡ 音速の決裁モンスター';
      else if (this.combo >= 3) comboRankEl.textContent = '🌪️ 係長クラスの大回転';
      else comboRankEl.textContent = '🪑 平社員ドリフト';
    }

    if (hpBar) hpBar.style.width = `${this.hp}%`;
    if (hpText) hpText.textContent = `${Math.ceil(this.hp)}%`;

    if (boostBar) boostBar.style.width = `${Math.min(100, Math.max(0, this.boost))}%`;
    if (boostText) {
      if (this.isBoosting) {
        boostText.textContent = '🚀 無双噴射中!!';
      } else if (this.boost >= 100) {
        boostText.textContent = '🔥 発動可能 (SPACE)';
      } else {
        boostText.textContent = `チャージ中 ${Math.floor(this.boost)}%`;
      }
    }
  }
}

window.OfficeDriftGame.GameState = GameState;
