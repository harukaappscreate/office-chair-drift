/**
 * js/config.js
 * ゲーム全体のバランス調整、ジャンプ台ギミック、巨大決裁ロボ社長ボス戦、
 * フロア定義、バカゲー称号・セリフ設定（100点満点完成版）
 */
window.OfficeDriftGame = window.OfficeDriftGame || {};

window.OfficeDriftGame.Config = {
  // コース・レーン設定
  ROAD_WIDTH: 18,
  LANE_LIMIT: 7.4,
  GATE_INTERVAL_METERS: 450, // 定時退社ゲートが出現する間隔(m)
  BOSS_SPAWN_BEFORE_GATE: 140, // ゲート手前140mで巨大決裁ロボ社長が出撃！

  // プレイヤー挙動パラメータ
  PLAYER: {
    BASE_SPEED: 42,
    MAX_SPEED: 98,
    BOOST_SPEED_BONUS: 54,
    STRAFE_SPEED: 26,
    DRIFT_TILT_MAX: 0.48,
    SPIN_DURATION: 1.15,
    SPIN_COOLDOWN: 0.22,
    BOOST_DURATION: 4.0,
    JUMP_VELOCITY: 21.5,
    GRAVITY: 46.0,
    MAX_HP: 100,
    MAX_BOOST: 100,
    BOOST_CHARGE_PER_SEC: 9,
    BOOST_CHARGE_ON_SMASH: 18
  },

  // 障害物・ギミック・ボス設定
  OBSTACLES: {
    SPAWN_Z: -135,
    DESPAWN_Z: 22,
    BASE_SPAWN_INTERVAL: 0.50,
    TYPES: {
      HANKO: {
        id: 'HANKO',
        name: '巨大却下ハンコ',
        scoreHours: 4.5,
        damage: 20,
        words: ['承認!!', '決裁完了!!', 'ハンコ粉砕!!', '直帰ヨシ!!']
      },
      PAPER_TOWER: {
        id: 'PAPER_TOWER',
        name: '暴走稟議書タワー',
        scoreHours: 3.2,
        damage: 15,
        words: ['書類シュレッダー!!', 'ペーパーレス化!!', '稟議突破!!']
      },
      BOSS_CHAIR: {
        id: 'BOSS_CHAIR',
        name: '残業レーザー部長',
        scoreHours: 12.0,
        damage: 26,
        words: ['部長撃破!!', '定時退社確定!!', '残業拒否!!', 'お疲れ様でしたァ!!']
      },
      PAID_LEAVE_TICKET: {
        id: 'PAID_LEAVE_TICKET',
        name: '黄金の有給休暇届',
        scoreHours: 8.5,
        healHp: 25,
        boostGain: 45,
        words: ['有給取得!!', '20連休確定!!', 'メンタル全快!!']
      },
      JUMP_RAMP: {
        id: 'JUMP_RAMP',
        name: '暴走コピー複合機ジャンプ台',
        scoreHours: 10.0,
        boostGain: 30,
        words: ['複合機エアリアル!!', '空中大回転決裁!!', 'スキャナー離陸!!']
      }
    },
    BOSS: {
      name: '巨大決裁ロボ社長「ブラック・カイザー」',
      baseHp: 100,
      damagePerParry: 35,
      damagePerRam: 50,
      clearBonusHours: 45.0,
      words: ['社長論破!!', 'ブラック企業解放!!', '全社一斉定時退社!!']
    }
  },

  // フロア（定時退社ゲート突破ごとに進化）
  FLOORS: [
    { name: '第1営業部フロア', skyColor: 0x0b101d, fogColor: 0x0e1526, speedMult: 1.0 },
    { name: '鬼の経理・監査フロア', skyColor: 0x1e0d28, fogColor: 0x2b1238, speedMult: 1.15 },
    { name: '眠らないシステム開発室', skyColor: 0x071e24, fogColor: 0x0c3038, speedMult: 1.3 },
    { name: '重役会議ペントハウス', skyColor: 0x261009, fogColor: 0x3b180e, speedMult: 1.45 },
    { name: '成層圏・ブラック企業本社屋上', skyColor: 0x050510, fogColor: 0x16082c, speedMult: 1.65 }
  ],

  // スコア（粉砕した残業時間）に応じた退社称号
  RANKS: [
    {
      minHours: 0,
      title: '見習いキャスター社員',
      comment: '「まだ椅子のコマに油が足りないな」と守衛さんに同情されました。Wキー(またはクリック)の回転スピンでハンコを弾き返そう！'
    },
    {
      minHours: 45,
      title: '給湯室のドリフト番長',
      comment: '廊下に鮮やかな黒いタイヤ痕を残し、総務部の掲示板に指名手配されました。'
    },
    {
      minHours: 110,
      title: '音速のハンコ粉砕王',
      comment: '社内の「却下ハンコ」をすべて宇宙へ弾き飛ばしたため、全案件が自動承認されました。'
    },
    {
      minHours: 220,
      title: '重役フロアの暴走機関車',
      comment: '複合機をジャンプ台にして役員会議室を飛び越え、社長ロボのカツラを風圧で吹き飛ばしました。'
    },
    {
      minHours: 380,
      title: '伝説の定時退社ゴッド',
      comment: '物理法則と就業規則を超越！あなたのオフィスチェアは労働基準監督署に永久展示されました。'
    }
  ]
};
