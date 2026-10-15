/**
 * js/entities/Player.js
 * リアルなPBR質感のエルゴノミクス・オフィスチェア、真鍮バルブ＆圧力計付き消火器ジェット、
 * ピンストライプスーツを着た多関節サラリーマン、5関節クロス物理風ネクタイ、
 * 複合機ジャンプ台でのエアリアル跳躍物理、およびゲームオーバー時の「社畜ラグドール吹っ飛び」物理演算を制御します。
 */
window.OfficeDriftGame = window.OfficeDriftGame || {};

class Player {
  constructor(scene) {
    this.scene = scene;
    this.config = window.OfficeDriftGame.Config;

    this.group = new window.THREE.Group();
    this.swivelGroup = new window.THREE.Group();     // 座面・背もたれ・消火器ジェット
    this.upperBodyGroup = new window.THREE.Group();  // 社員ボディ（ラグドール時に椅子から分離して吹っ飛ぶ）
    this.laptopGroup = new window.THREE.Group();     // ノートPC（ラグドール時に別軌道で宙を舞う）
    this.casterWheels = [];
    this.tieSegments = [];

    this.group.add(this.swivelGroup);

    this.textures = {
      meshFabric: this.createMeshFabricTexture(),
      suitPinstripe: this.createSuitTexture(),
      laptopScreen: this.createLaptopScreenTexture(),
      extinguisherLabel: this.createExtinguisherLabelTexture()
    };

    this.buildModel();
    this.scene.add(this.group);

    this.reset();
  }

  createMeshFabricTexture() {
    const THREE = window.THREE;
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#182030';
    ctx.fillRect(0, 0, 128, 128);

    ctx.fillStyle = '#0d121c';
    for (let y = 0; y < 128; y += 8) {
      for (let x = 0; x < 128; x += 8) {
        ctx.fillRect(x + ((y / 8) % 2) * 4, y, 3, 3);
      }
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(6, 6);
    return tex;
  }

  createSuitTexture() {
    const THREE = window.THREE;
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#1c2331';
    ctx.fillRect(0, 0, 128, 128);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.07)';
    for (let x = 0; x < 128; x += 8) {
      ctx.fillRect(x, 0, 1, 128);
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(3, 3);
    return tex;
  }

  createLaptopScreenTexture() {
    const THREE = window.THREE;
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 160;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#0d1522';
    ctx.fillRect(0, 0, 256, 160);

    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, 0, 256, 18);
    ctx.fillStyle = '#ff5f56';
    ctx.beginPath(); ctx.arc(12, 9, 4, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ffbd2e';
    ctx.beginPath(); ctx.arc(24, 9, 4, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#27c93f';
    ctx.beginPath(); ctx.arc(36, 9, 4, 0, Math.PI * 2); ctx.fill();

    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 14px monospace';
    ctx.fillText('> RESIGNATION_PROTOCOL.exe', 12, 42);
    ctx.fillStyle = '#4ade80';
    ctx.fillText('STATUS: REFUSING OVERTIME', 12, 64);
    ctx.fillStyle = '#facc15';
    ctx.fillText('JET THRUST: 100% READY', 12, 86);

    ctx.fillStyle = '#f43f5e';
    ctx.fillRect(12, 102, 232, 38);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 20px sans-serif';
    ctx.fillText('定時退社モード稼働中', 26, 128);

    return new THREE.CanvasTexture(canvas);
  }

  createExtinguisherLabelTexture() {
    const THREE = window.THREE;
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#cc0e1e';
    ctx.fillRect(0, 0, 256, 256);

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(28, 40, 200, 176);

    ctx.fillStyle = '#cc0e1e';
    ctx.fillRect(34, 46, 188, 36);
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 22px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('強化液消火器 (改)', 128, 72);

    ctx.fillStyle = '#111111';
    ctx.font = 'bold 18px sans-serif';
    ctx.fillText('用途：残業・上司・ハンコ消火', 128, 112);
    ctx.fillText('噴射推力：マッハ2.4', 128, 142);

    ctx.fillStyle = '#0066cc';
    ctx.fillRect(46, 162, 164, 36);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 18px sans-serif';
    ctx.fillText('労働基準監督署 認可済', 128, 186);

    return new THREE.CanvasTexture(canvas);
  }

  buildModel() {
    const THREE = window.THREE;

    const dieCastAluminumMat = new THREE.MeshStandardMaterial({
      color: 0xd8dee9,
      metalness: 0.92,
      roughness: 0.14
    });
    const darkSteelMat = new THREE.MeshStandardMaterial({
      color: 0x22262e,
      metalness: 0.75,
      roughness: 0.32
    });
    const rubberMat = new THREE.MeshStandardMaterial({
      color: 0x121417,
      roughness: 0.85,
      metalness: 0.05
    });
    const meshCushionMat = new THREE.MeshStandardMaterial({
      map: this.textures.meshFabric,
      bumpMap: this.textures.meshFabric,
      bumpScale: 0.015,
      roughness: 0.65,
      metalness: 0.08
    });
    const suitMat = new THREE.MeshStandardMaterial({
      map: this.textures.suitPinstripe,
      bumpMap: this.textures.suitPinstripe,
      bumpScale: 0.008,
      roughness: 0.62,
      metalness: 0.05
    });
    const skinMat = new THREE.MeshPhysicalMaterial({
      color: 0xffd2b5,
      roughness: 0.48,
      clearcoat: 0.15,
      clearcoatRoughness: 0.4
    });
    const shirtMat = new THREE.MeshStandardMaterial({
      color: 0xf8fafc,
      roughness: 0.45
    });
    const silkTieMat = new THREE.MeshPhysicalMaterial({
      color: 0xd91438,
      emissive: 0x2a0008,
      roughness: 0.3,
      metalness: 0.1,
      clearcoat: 0.6
    });
    const extinguisherMat = new THREE.MeshPhysicalMaterial({
      map: this.textures.extinguisherLabel,
      roughness: 0.15,
      metalness: 0.25,
      clearcoat: 1.0,
      clearcoatRoughness: 0.08
    });
    const brassMat = new THREE.MeshStandardMaterial({
      color: 0xe5b842,
      metalness: 0.9,
      roughness: 0.2
    });
    const leatherShoeMat = new THREE.MeshPhysicalMaterial({
      color: 0x140d09,
      roughness: 0.25,
      clearcoat: 0.85
    });

    // 1. ダイキャスト5本脚ベース＆双輪キャスター
    const baseGroup = new THREE.Group();
    const outerCylinder = new THREE.Mesh(
      new THREE.CylinderGeometry(0.11, 0.12, 0.48, 18),
      darkSteelMat
    );
    outerCylinder.position.y = 0.36;
    baseGroup.add(outerCylinder);

    const innerPiston = new THREE.Mesh(
      new THREE.CylinderGeometry(0.075, 0.075, 0.45, 18),
      dieCastAluminumMat
    );
    innerPiston.position.y = 0.68;
    baseGroup.add(innerPiston);

    for (let i = 0; i < 5; i++) {
      const angle = (i / 5) * Math.PI * 2;
      const legGroup = new THREE.Group();
      legGroup.rotation.y = angle;

      const legArm = new THREE.Mesh(
        new THREE.BoxGeometry(0.11, 0.075, 0.84),
        dieCastAluminumMat
      );
      legArm.position.set(0, 0.22, 0.42);
      legArm.rotation.x = 0.08;
      legArm.castShadow = true;
      legGroup.add(legArm);

      const casterPivot = new THREE.Group();
      casterPivot.position.set(0, 0.11, 0.8);

      const hood = new THREE.Mesh(
        new THREE.CylinderGeometry(0.08, 0.09, 0.08, 12),
        darkSteelMat
      );
      hood.position.y = 0.05;
      casterPivot.add(hood);

      [-0.045, 0.045].forEach((wx) => {
        const wheel = new THREE.Mesh(
          new THREE.CylinderGeometry(0.105, 0.105, 0.032, 16),
          rubberMat
        );
        wheel.rotation.z = Math.PI / 2;
        wheel.position.x = wx;
        casterPivot.add(wheel);
      });

      this.casterWheels.push(casterPivot);
      legGroup.add(casterPivot);
      baseGroup.add(legGroup);
    }
    this.group.add(baseGroup);

    // 2. エルゴノミクス座面・背もたれ
    const mechBox = new THREE.Mesh(
      new THREE.BoxGeometry(0.55, 0.14, 0.62),
      darkSteelMat
    );
    mechBox.position.set(0, 0.84, 0.05);
    this.swivelGroup.add(mechBox);

    const seatMain = new THREE.Mesh(
      new THREE.BoxGeometry(1.24, 0.15, 1.18),
      meshCushionMat
    );
    seatMain.position.set(0, 0.96, 0.02);
    seatMain.castShadow = true;
    this.swivelGroup.add(seatMain);

    const seatFrontRoll = new THREE.Mesh(
      new THREE.CylinderGeometry(0.08, 0.08, 1.22, 16),
      meshCushionMat
    );
    seatFrontRoll.rotation.z = Math.PI / 2;
    seatFrontRoll.position.set(0, 0.95, -0.57);
    this.swivelGroup.add(seatFrontRoll);

    const spineFrame = new THREE.Mesh(
      new THREE.BoxGeometry(0.22, 1.35, 0.12),
      dieCastAluminumMat
    );
    spineFrame.position.set(0, 1.55, 0.66);
    spineFrame.rotation.x = 0.12;
    this.swivelGroup.add(spineFrame);

    const backrest = new THREE.Mesh(
      new THREE.BoxGeometry(1.16, 1.38, 0.11),
      meshCushionMat
    );
    backrest.position.set(0, 1.72, 0.56);
    backrest.rotation.x = 0.1;
    backrest.castShadow = true;
    this.swivelGroup.add(backrest);

    const lumbarPad = new THREE.Mesh(
      new THREE.BoxGeometry(0.95, 0.26, 0.14),
      darkSteelMat
    );
    lumbarPad.position.set(0, 1.38, 0.54);
    this.swivelGroup.add(lumbarPad);

    const headrest = new THREE.Mesh(
      new THREE.BoxGeometry(0.68, 0.32, 0.14),
      meshCushionMat
    );
    headrest.position.set(0, 2.58, 0.62);
    headrest.rotation.x = -0.1;
    this.swivelGroup.add(headrest);

    [-0.68, 0.68].forEach((xPos) => {
      const armPillar = new THREE.Mesh(
        new THREE.CylinderGeometry(0.05, 0.06, 0.48, 12),
        dieCastAluminumMat
      );
      armPillar.position.set(xPos, 1.18, 0.08);
      this.swivelGroup.add(armPillar);

      const armPad = new THREE.Mesh(
        new THREE.BoxGeometry(0.18, 0.07, 0.68),
        rubberMat
      );
      armPad.position.set(xPos, 1.43, 0.06);
      this.swivelGroup.add(armPad);
    });

    // 3. 背面の改造ツイン消火器ジェットブースター
    this.flames = [];
    [-0.4, 0.4].forEach((xPos) => {
      const extGroup = new THREE.Group();
      extGroup.position.set(xPos, 1.72, 0.84);
      extGroup.rotation.x = 0.2;

      const cylinder = new THREE.Mesh(
        new THREE.CylinderGeometry(0.19, 0.19, 0.98, 20),
        extinguisherMat
      );
      cylinder.castShadow = true;
      extGroup.add(cylinder);

      const topDome = new THREE.Mesh(
        new THREE.SphereGeometry(0.19, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2),
        extinguisherMat
      );
      topDome.position.y = 0.49;
      extGroup.add(topDome);

      const valve = new THREE.Mesh(
        new THREE.CylinderGeometry(0.05, 0.06, 0.16, 12),
        brassMat
      );
      valve.position.y = 0.68;
      extGroup.add(valve);

      const lever = new THREE.Mesh(
        new THREE.BoxGeometry(0.06, 0.04, 0.24),
        darkSteelMat
      );
      lever.position.set(0, 0.76, 0.08);
      lever.rotation.x = -0.25;
      extGroup.add(lever);

      const clampBand = new THREE.Mesh(
        new THREE.CylinderGeometry(0.202, 0.202, 0.08, 20),
        dieCastAluminumMat
      );
      clampBand.position.y = 0.12;
      extGroup.add(clampBand);

      const nozzle = new THREE.Mesh(
        new THREE.ConeGeometry(0.15, 0.34, 16),
        darkSteelMat
      );
      nozzle.position.set(0, -0.62, 0.06);
      nozzle.rotation.x = Math.PI;
      extGroup.add(nozzle);

      const flameGroup = new THREE.Group();
      flameGroup.position.set(0, -1.15, 0.06);
      flameGroup.rotation.x = Math.PI;

      const outerFlame = new THREE.Mesh(
        new THREE.ConeGeometry(0.24, 1.25, 14),
        new THREE.MeshBasicMaterial({
          color: 0x00e5ff,
          transparent: true,
          opacity: 0.85
        })
      );
      const innerCore = new THREE.Mesh(
        new THREE.ConeGeometry(0.12, 0.85, 12),
        new THREE.MeshBasicMaterial({ color: 0xffffff })
      );
      innerCore.position.y = 0.15;
      flameGroup.add(outerFlame, innerCore);
      extGroup.add(flameGroup);

      this.flames.push({ group: flameGroup, outer: outerFlame, inner: innerCore });
      this.swivelGroup.add(extGroup);
    });

    this.jetLight = new THREE.PointLight(0x00e5ff, 2.5, 9);
    this.jetLight.position.set(0, 0.7, 1.3);
    this.swivelGroup.add(this.jetLight);

    // 4. 多関節サラリーマン（upperBodyGroup 内に全身を格納し、ラグドール時に丸ごと吹っ飛べる構造）
    this.upperBodyGroup.position.set(0, 1.05, 0.12);
    this.swivelGroup.add(this.upperBodyGroup);

    const torso = new THREE.Mesh(
      new THREE.BoxGeometry(0.82, 1.02, 0.48),
      suitMat
    );
    torso.position.set(0, 0.62, 0);
    torso.castShadow = true;
    this.upperBodyGroup.add(torso);

    const shirtV = new THREE.Mesh(
      new THREE.BoxGeometry(0.32, 0.48, 0.5),
      shirtMat
    );
    shirtV.position.set(0, 0.84, -0.01);
    this.upperBodyGroup.add(shirtV);

    [-1, 1].forEach((side) => {
      const shoulder = new THREE.Mesh(new THREE.SphereGeometry(0.19, 12, 12), suitMat);
      shoulder.position.set(side * 0.48, 0.96, 0);
      this.upperBodyGroup.add(shoulder);

      const upperArm = new THREE.Mesh(
        new THREE.CylinderGeometry(0.13, 0.11, 0.52, 12),
        suitMat
      );
      upperArm.position.set(side * 0.48, 0.68, -0.15);
      upperArm.rotation.x = 0.55;
      upperArm.rotation.z = -side * 0.15;
      this.upperBodyGroup.add(upperArm);

      const forearm = new THREE.Mesh(
        new THREE.CylinderGeometry(0.11, 0.09, 0.48, 12),
        suitMat
      );
      forearm.position.set(side * 0.34, 0.44, -0.42);
      forearm.rotation.x = 1.25;
      forearm.rotation.y = side * 0.35;
      this.upperBodyGroup.add(forearm);

      const hand = new THREE.Mesh(new THREE.SphereGeometry(0.09, 10, 10), skinMat);
      hand.position.set(side * 0.2, 0.36, -0.62);
      this.upperBodyGroup.add(hand);
    });

    const headGroup = new THREE.Group();
    headGroup.position.set(0, 1.46, -0.02);

    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.16, 0.24, 12), skinMat);
    neck.position.y = -0.22;
    headGroup.add(neck);

    const head = new THREE.Mesh(new THREE.SphereGeometry(0.34, 20, 20), skinMat);
    head.scale.set(0.92, 1.05, 0.95);
    head.castShadow = true;
    headGroup.add(head);

    const hair = new THREE.Mesh(
      new THREE.SphereGeometry(0.355, 18, 14, 0, Math.PI * 2, 0, Math.PI * 0.58),
      rubberMat
    );
    hair.position.set(0, 0.04, 0.02);
    hair.rotation.x = -0.25;
    headGroup.add(hair);

    const glassLensMat = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      emissive: 0x336699,
      roughness: 0.05,
      metalness: 0.2,
      clearcoat: 1.0
    });
    [-0.13, 0.13].forEach((gx) => {
      const lens = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.1, 0.03), glassLensMat);
      lens.position.set(gx, 0.03, -0.32);
      headGroup.add(lens);
    });
    const bridge = new THREE.Mesh(
      new THREE.BoxGeometry(0.08, 0.02, 0.03),
      dieCastAluminumMat
    );
    bridge.position.set(0, 0.04, -0.32);
    headGroup.add(bridge);

    this.upperBodyGroup.add(headGroup);

    // 5関節シルクネクタイ
    let parentTie = this.upperBodyGroup;
    for (let s = 0; s < 5; s++) {
      const segPivot = new THREE.Group();
      if (s === 0) {
        segPivot.position.set(0, 1.02, -0.22);
      } else {
        segPivot.position.set(0, 0, 0.24);
      }
      const width = 0.12 + s * 0.012;
      const segMesh = new THREE.Mesh(
        new THREE.BoxGeometry(width, 0.035, 0.26),
        silkTieMat
      );
      segMesh.position.set(0, 0, 0.13);
      segPivot.add(segMesh);
      parentTie.add(segPivot);
      this.tieSegments.push(segPivot);
      parentTie = segPivot;
    }

    // 脚と革靴（upperBodyGroupに所属させてラグドール時に全身一緒に宙を舞う）
    [-0.23, 0.23].forEach((xPos) => {
      const thigh = new THREE.Mesh(
        new THREE.CylinderGeometry(0.15, 0.13, 0.72, 14),
        suitMat
      );
      thigh.rotation.x = Math.PI / 2 - 0.1;
      thigh.position.set(xPos, 0.1, -0.38);
      this.upperBodyGroup.add(thigh);

      const calf = new THREE.Mesh(
        new THREE.CylinderGeometry(0.12, 0.095, 0.62, 14),
        suitMat
      );
      calf.position.set(xPos, -0.27, -0.72);
      calf.rotation.x = -0.22;
      this.upperBodyGroup.add(calf);

      const shoe = new THREE.Mesh(
        new THREE.BoxGeometry(0.2, 0.14, 0.42),
        leatherShoeMat
      );
      shoe.position.set(xPos, -0.59, -0.86);
      this.upperBodyGroup.add(shoe);
    });

    // 5. アルミ削り出しノートPC（laptopGroup にまとめてラグドール時に別軌道で吹っ飛ぶ）
    this.laptopGroup.position.set(0, 1.32, -0.44);
    this.swivelGroup.add(this.laptopGroup);

    const laptopBase = new THREE.Mesh(
      new THREE.BoxGeometry(0.66, 0.03, 0.46),
      dieCastAluminumMat
    );
    this.laptopGroup.add(laptopBase);

    const keyboardArea = new THREE.Mesh(
      new THREE.PlaneGeometry(0.58, 0.24),
      rubberMat
    );
    keyboardArea.rotation.x = -Math.PI / 2;
    keyboardArea.position.set(0, 0.018, 0.04);
    this.laptopGroup.add(keyboardArea);

    const laptopLid = new THREE.Mesh(
      new THREE.BoxGeometry(0.66, 0.44, 0.025),
      dieCastAluminumMat
    );
    laptopLid.position.set(0, 0.2, -0.22);
    laptopLid.rotation.x = -0.28;
    this.laptopGroup.add(laptopLid);

    const laptopDisplay = new THREE.Mesh(
      new THREE.PlaneGeometry(0.61, 0.39),
      new THREE.MeshBasicMaterial({ map: this.textures.laptopScreen })
    );
    laptopDisplay.position.set(0, 0.2, -0.205);
    laptopDisplay.rotation.x = -0.28;
    this.laptopGroup.add(laptopDisplay);

    // 6. ソニックブームリング
    const ringGeo = new THREE.TorusGeometry(1.8, 0.07, 12, 40);
    this.auraMat = new THREE.MeshBasicMaterial({
      color: 0x00f0ff,
      transparent: true,
      opacity: 0.0
    });
    this.auraRing = new THREE.Mesh(ringGeo, this.auraMat);
    this.auraRing.rotation.x = Math.PI / 2;
    this.auraRing.position.y = 1.25;
    this.group.add(this.auraRing);
  }

  reset() {
    this.x = 0;
    this.y = 0;
    this.vy = 0;
    this.targetX = 0;
    this.vx = 0;
    this.speed = this.config.PLAYER.BASE_SPEED;

    this.isSpinning = false;
    this.spinTimer = 0;
    this.spinCooldown = 0;

    this.invincibleTimer = 0;
    this.isRagdoll = false;

    this.group.position.set(0, 0, 0);
    this.group.rotation.set(0, 0, 0);
    this.swivelGroup.position.set(0, 0, 0);
    this.swivelGroup.rotation.set(0, 0, 0);

    // ラグドール状態のパーツを元の座席位置へ戻す
    this.upperBodyGroup.position.set(0, 1.05, 0.12);
    this.upperBodyGroup.rotation.set(0, 0, 0);
    this.laptopGroup.position.set(0, 1.32, -0.44);
    this.laptopGroup.rotation.set(0, 0, 0);
    this.group.visible = true;
  }

  // 複合機ジャンプ台に乗った時の大ジャンプ発動
  triggerJump() {
    this.vy = this.config.PLAYER.JUMP_VELOCITY;
    this.isSpinning = true;
    this.spinTimer = 1.35;
  }

  isAirborne() {
    return this.y > 0.15;
  }

  triggerSpin() {
    if (this.isSpinning || this.spinCooldown > 0 || this.isRagdoll) return false;
    this.isSpinning = true;
    this.spinTimer = this.config.PLAYER.SPIN_DURATION;
    return true;
  }

  isAttacking(isBoosting) {
    return this.isSpinning || isBoosting || this.isAirborne();
  }

  // ゲームオーバー（メンタル0）時の「社畜ラグドール吹っ飛び」物理演算開始！
  triggerRagdollCrash() {
    if (this.isRagdoll) return;
    const THREE = window.THREE;
    this.isRagdoll = true;
    this.invincibleTimer = 0;
    this.group.visible = true;
    this.auraMat.opacity = 0;

    // 社員の身体・ノートPC・椅子本体がそれぞれ異なる物理ベクトルで空中に投げ出される
    this.ragdollState = {
      bodyVel: new THREE.Vector3((Math.random() - 0.5) * 14, 19.5, -18),
      bodyRot: new THREE.Vector3(11.5, (Math.random() - 0.5) * 14, 8.5),
      laptopVel: new THREE.Vector3((Math.random() - 0.5) * 20, 24.0, -24),
      laptopRot: new THREE.Vector3(18, 22, -15),
      chairVel: new THREE.Vector3((Math.random() - 0.5) * 10, 9.5, -6),
      chairRotY: 16
    };
  }

  updateRagdoll(dt, effectSystem, soundSystem) {
    if (!this.isRagdoll || !this.ragdollState) return;
    const st = this.ragdollState;
    const g = 38.0;

    // 1. 社畜サラリーマンの空中回転＆廊下バウンド物理
    st.bodyVel.y -= g * dt;
    this.upperBodyGroup.position.addScaledVector(st.bodyVel, dt);
    this.upperBodyGroup.rotation.x += st.bodyRot.x * dt;
    this.upperBodyGroup.rotation.y += st.bodyRot.y * dt;
    this.upperBodyGroup.rotation.z += st.bodyRot.z * dt;

    if (this.upperBodyGroup.position.y < 0.65 && st.bodyVel.y < 0) {
      this.upperBodyGroup.position.y = 0.65;
      st.bodyVel.y = -st.bodyVel.y * 0.58; // 床でバウンド！
      st.bodyVel.x *= 0.8;
      st.bodyVel.z *= 0.8;
      if (effectSystem) {
        const bounceWorldPos = this.group.position.clone().add(this.upperBodyGroup.position);
        effectSystem.spawnSmashExplosion(bounceWorldPos, 0xffffff, true);
      }
      if (soundSystem && Math.abs(st.bodyVel.y) > 3) {
        soundSystem.playDamage();
      }
    }

    // 2. ノートPCの吹っ飛び＆バウンド物理
    st.laptopVel.y -= g * dt;
    this.laptopGroup.position.addScaledVector(st.laptopVel, dt);
    this.laptopGroup.rotation.x += st.laptopRot.x * dt;
    this.laptopGroup.rotation.y += st.laptopRot.y * dt;
    this.laptopGroup.rotation.z += st.laptopRot.z * dt;

    if (this.laptopGroup.position.y < 0.25 && st.laptopVel.y < 0) {
      this.laptopGroup.position.y = 0.25;
      st.laptopVel.y = -st.laptopVel.y * 0.65;
    }

    // 3. 空になったオフィスチェアの暴走スピン
    st.chairVel.y -= g * dt;
    this.group.position.x += st.chairVel.x * dt;
    this.group.position.y = Math.max(0, this.group.position.y + st.chairVel.y * dt);
    this.swivelGroup.rotation.y += st.chairRotY * dt;
  }

  update(dt, inputState, isBoosting, floorSpeedMult, effectSystem) {
    if (this.isRagdoll) return;

    const THREE = window.THREE;
    const cfg = this.config.PLAYER;
    const now = performance.now();

    // 1. スピード計算
    const baseTarget = cfg.BASE_SPEED * floorSpeedMult;
    const targetSpeed = isBoosting ? baseTarget + cfg.BOOST_SPEED_BONUS : baseTarget;
    this.speed = THREE.MathUtils.lerp(this.speed, targetSpeed, dt * 5);

    // 2. 左右ドリフト移動
    let moveDir = 0;
    if (inputState.left) moveDir -= 1;
    if (inputState.right) moveDir += 1;

    if (moveDir !== 0) {
      this.x += moveDir * cfg.STRAFE_SPEED * dt;
      this.vx = moveDir * cfg.STRAFE_SPEED;
    } else if (inputState.pointerActive) {
      const diff = inputState.pointerWorldX - this.x;
      this.vx = THREE.MathUtils.clamp(diff * 10, -cfg.STRAFE_SPEED * 1.3, cfg.STRAFE_SPEED * 1.3);
      this.x += this.vx * dt;
    } else {
      this.vx = THREE.MathUtils.lerp(this.vx, 0, dt * 10);
    }

    const limit = this.config.LANE_LIMIT;
    this.x = THREE.MathUtils.clamp(this.x, -limit, limit);
    this.group.position.x = this.x;

    // 3. Y軸ジャンプ物理（複合機ジャンプ台からの大跳躍）
    if (this.y > 0 || this.vy > 0) {
      this.vy -= cfg.GRAVITY * dt;
      this.y += this.vy * dt;
      if (this.y <= 0) {
        this.y = 0;
        this.vy = 0;
        if (effectSystem) {
          effectSystem.spawnJetTrail(this.group.position, true);
        }
      }
    }
    this.group.position.y = this.y;

    // 4. 路面微振動（接地中のみ）
    const suspensionBob = this.isAirborne()
      ? 0
      : Math.sin(now * 0.055) * 0.025 + Math.cos(now * 0.09) * 0.015;
    this.swivelGroup.position.y = suspensionBob;

    // 5. ドリフト時の車体ロール＆上半身の横Gリーン
    const targetTiltZ = THREE.MathUtils.clamp(-this.vx * 0.022, -cfg.DRIFT_TILT_MAX, cfg.DRIFT_TILT_MAX);
    const targetYaw = THREE.MathUtils.clamp(-this.vx * 0.016, -0.38, 0.38);
    this.group.rotation.z = THREE.MathUtils.lerp(this.group.rotation.z, targetTiltZ, dt * 10);
    this.upperBodyGroup.rotation.z = THREE.MathUtils.lerp(
      this.upperBodyGroup.rotation.z,
      targetTiltZ * 0.45,
      dt * 8
    );

    // 6. 双輪キャスターの旋回
    const wheelSteer = THREE.MathUtils.clamp(this.vx * 0.04, -0.6, 0.6);
    this.casterWheels.forEach((cw) => {
      cw.rotation.y = wheelSteer;
    });

    // 7. 大回転スピン・有給ブースト回転アニメーション
    if (this.spinCooldown > 0) {
      this.spinCooldown -= dt;
    }

    if (this.isSpinning) {
      this.spinTimer -= dt;
      this.swivelGroup.rotation.y += dt * 28;
      if (this.spinTimer <= 0) {
        this.isSpinning = false;
        this.spinCooldown = cfg.SPIN_COOLDOWN;
      }
    } else if (isBoosting) {
      this.swivelGroup.rotation.y += dt * 34;
    } else {
      this.swivelGroup.rotation.y = THREE.MathUtils.lerp(this.swivelGroup.rotation.y, targetYaw, dt * 10);
    }

    // 8. 5関節シルクネクタイの風圧ウェーブ
    this.tieSegments.forEach((seg, idx) => {
      const wavePhase = now * 0.024 - idx * 0.65;
      seg.rotation.x = (idx === 0 ? 0.32 : 0.06) + Math.sin(wavePhase) * 0.14;
      seg.rotation.y = Math.cos(wavePhase * 0.85) * 0.16 - this.vx * 0.008;
    });

    // 9. ジェット炎・ポイントライト・オーラリング
    const attacking = this.isAttacking(isBoosting);
    this.auraMat.opacity = attacking ? 0.78 : 0.0;
    this.auraMat.color.setHex(isBoosting ? 0xffcc00 : 0x00f0ff);
    this.auraRing.scale.setScalar(1 + Math.sin(now * 0.025) * 0.12);

    const flameScale = isBoosting ? 2.4 : this.isSpinning ? 1.6 : 0.9;
    this.flames.forEach((f) => {
      f.group.scale.set(
        1 + Math.random() * 0.25,
        flameScale * (0.85 + Math.random() * 0.45),
        1 + Math.random() * 0.25
      );
      f.outer.material.color.setHex(isBoosting ? 0xffaa00 : 0x00e5ff);
    });

    if (this.jetLight) {
      this.jetLight.color.setHex(isBoosting ? 0xffaa22 : 0x00e5ff);
      this.jetLight.intensity = (isBoosting ? 5.0 : 2.2) + Math.random() * 1.2;
    }

    // 10. ジェット煙・火花・ドリフトタイヤ痕の放出（接地時のみタイヤ痕）
    if (effectSystem) {
      if (attacking || Math.abs(this.vx) > 5 || Math.random() < 0.5) {
        effectSystem.spawnJetTrail(this.group.position, isBoosting);
      }
      if (!this.isAirborne() && (Math.abs(this.vx) > 9.5 || this.isSpinning)) {
        effectSystem.spawnSkidmark(this.group.position, this.vx);
      }
    }

    if (this.invincibleTimer > 0) {
      this.invincibleTimer -= dt;
      this.group.visible = Math.floor(this.invincibleTimer * 20) % 2 === 0;
    } else {
      this.group.visible = true;
    }
  }
}

window.OfficeDriftGame.Player = Player;
