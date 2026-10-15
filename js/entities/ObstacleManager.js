/**
 * js/entities/ObstacleManager.js
 * PBR質感の障害物・アイテム・複合機ジャンプ台・巨大決裁ロボ社長ボス戦の統合管理（100点満点完成版）
 * - 巨大却下ハンコ：漆塗りクリアコート木目・真鍮あたり・朱肉印面（ボス戦時は回転スピンで社長へ跳ね返せる！）
 * - 暴走稟議書タワー：紙断面テクスチャ＆キングファイル風バインダー
 * - 残業レーザー部長：チェスターフィールド革張り重役椅子＆2条の立体赤レーザーコーン
 * - 暴走コピー複合機ジャンプ台（JUMP_RAMP）：緑色のスキャナー光を放つ大型複合機スロープ（大ジャンプ＆空中決裁！）
 * - 巨大決裁ロボ社長「ブラック・カイザー」：ゲート前に立ちふさがる巨大ボス！ハンコ弾幕とパリィ撃破システム搭載
 */
window.OfficeDriftGame = window.OfficeDriftGame || {};

class ObstacleManager {
  constructor(scene) {
    this.scene = scene;
    this.config = window.OfficeDriftGame.Config;
    this.items = [];
    this.spawnTimer = 0;

    // 巨大決裁ロボ社長 ボスインスタンス
    this.bossMesh = null;
    this.bossPhase = 0;
    this.bossAttackTimer = 0;

    this.textures = {
      hankoSeal: this.createHankoSealTexture(),
      woodGrain: this.createWoodGrainTexture(),
      paperEdges: this.createPaperEdgesTexture(),
      urgentDoc: this.createUrgentDocTexture(),
      bossBanner: this.createLabelTexture('残業命令!!', '#ffee00', '#2b0518'),
      paidLeave: this.createPaidLeaveTexture(),
      jumpRamp: this.createJumpRampTexture(),
      ceoCore: this.createLabelTexture('社長決裁', '#ff0044', '#110008')
    };
  }

  createHankoSealTexture() {
    const THREE = window.THREE;
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#d91e18';
    ctx.fillRect(0, 0, 256, 256);

    ctx.strokeStyle = '#ff4433';
    ctx.lineWidth = 14;
    ctx.beginPath();
    ctx.arc(128, 128, 108, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = '#fff0ee';
    ctx.font = '900 84px "Hiragino Mincho ProN", "Yu Mincho", serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('却下', 128, 128);

    return new THREE.CanvasTexture(canvas);
  }

  createWoodGrainTexture() {
    const THREE = window.THREE;
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    const grad = ctx.createLinearGradient(0, 0, 256, 256);
    grad.addColorStop(0, '#3a0808');
    grad.addColorStop(0.5, '#5e1111');
    grad.addColorStop(1, '#260404');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 256, 256);

    ctx.strokeStyle = 'rgba(0,0,0,0.28)';
    ctx.lineWidth = 2;
    for (let i = 0; i < 40; i++) {
      ctx.beginPath();
      const y = i * 6.5;
      ctx.moveTo(0, y);
      ctx.bezierCurveTo(80, y + 10, 180, y - 10, 256, y);
      ctx.stroke();
    }

    return new THREE.CanvasTexture(canvas);
  }

  createPaperEdgesTexture() {
    const THREE = window.THREE;
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#f1f5f9';
    ctx.fillRect(0, 0, 128, 256);

    for (let y = 0; y < 256; y += 3) {
      ctx.fillStyle = (y % 6 === 0) ? '#cbd5e1' : '#e2e8f0';
      ctx.fillRect(0, y, 128, 1);
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(1, 2);
    return tex;
  }

  createUrgentDocTexture() {
    const THREE = window.THREE;
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 320;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 256, 320);

    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 3;
    ctx.strokeRect(14, 14, 228, 292);

    for (let i = 0; i < 3; i++) {
      ctx.strokeRect(130 + i * 34, 24, 32, 32);
      ctx.strokeStyle = '#dc2626';
      ctx.beginPath();
      ctx.arc(146 + i * 34, 40, 11, 0, Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle = '#334155';
    }

    ctx.fillStyle = '#0f172a';
    ctx.font = '900 28px serif';
    ctx.fillText('緊 急 稟 議 書', 28, 52);

    for (let y = 80; y < 280; y += 22) {
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(26, y, 204, 2);
    }

    ctx.save();
    ctx.translate(128, 180);
    ctx.rotate(-0.22);
    ctx.strokeStyle = '#e11d48';
    ctx.lineWidth = 6;
    ctx.strokeRect(-85, -32, 170, 64);
    ctx.fillStyle = '#e11d48';
    ctx.font = '900 40px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('至急決裁', 0, 0);
    ctx.restore();

    return new THREE.CanvasTexture(canvas);
  }

  createPaidLeaveTexture() {
    const THREE = window.THREE;
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 320;
    const ctx = canvas.getContext('2d');

    const grad = ctx.createLinearGradient(0, 0, 512, 320);
    grad.addColorStop(0, '#fffbeb');
    grad.addColorStop(0.5, '#fef08a');
    grad.addColorStop(1, '#f59e0b');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 320);

    ctx.strokeStyle = '#b45309';
    ctx.lineWidth = 12;
    ctx.strokeRect(14, 14, 484, 292);

    ctx.fillStyle = '#78350f';
    ctx.font = '900 68px "Hiragino Mincho ProN", serif';
    ctx.textAlign = 'center';
    ctx.fillText('有給休暇届', 256, 130);

    ctx.fillStyle = '#dc2626';
    ctx.font = '900 42px sans-serif';
    ctx.fillText('【完全承認・20連休】', 256, 220);

    return new THREE.CanvasTexture(canvas);
  }

  // 複合機ジャンプ台のスキャナー発光スロープテクスチャ
  createJumpRampTexture() {
    const THREE = window.THREE;
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#062e22';
    ctx.fillRect(0, 0, 256, 256);

    ctx.strokeStyle = '#00ff88';
    ctx.lineWidth = 10;
    ctx.strokeRect(8, 8, 240, 240);

    ctx.fillStyle = '#00ff88';
    ctx.font = '900 42px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('▲ JUMP ▲', 128, 70);
    ctx.fillText('▲ 複合機離陸 ▲', 128, 145);
    ctx.fillStyle = '#ffee00';
    ctx.fillText('SCANNER BOOST', 128, 210);

    return new THREE.CanvasTexture(canvas);
  }

  createLabelTexture(text, fgColor, bgColor) {
    const THREE = window.THREE;
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = fgColor;
    ctx.lineWidth = 8;
    ctx.strokeRect(6, 6, canvas.width - 12, canvas.height - 12);

    ctx.fillStyle = fgColor;
    ctx.font = '900 46px "Hiragino Kaku Gothic StdN", "Meiryo", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, canvas.width / 2, canvas.height / 2);

    return new THREE.CanvasTexture(canvas);
  }

  createObstacleMesh(typeId) {
    const THREE = window.THREE;
    const group = new THREE.Group();

    if (typeId === 'HANKO') {
      const lacquerWoodMat = new THREE.MeshPhysicalMaterial({
        map: this.textures.woodGrain,
        roughness: 0.14,
        metalness: 0.1,
        clearcoat: 1.0,
        clearcoatRoughness: 0.06
      });
      const brassMat = new THREE.MeshStandardMaterial({
        color: 0xfacc15,
        metalness: 0.95,
        roughness: 0.15
      });
      const cinnabarInkMat = new THREE.MeshStandardMaterial({
        map: this.textures.hankoSeal,
        emissive: 0x660808,
        roughness: 0.35
      });

      const lowerBody = new THREE.Mesh(
        new THREE.CylinderGeometry(1.05, 1.32, 2.2, 28),
        lacquerWoodMat
      );
      lowerBody.position.y = 1.3;
      lowerBody.castShadow = true;
      group.add(lowerBody);

      const waist = new THREE.Mesh(
        new THREE.CylinderGeometry(1.18, 1.05, 1.2, 28),
        lacquerWoodMat
      );
      waist.position.y = 3.0;
      waist.castShadow = true;
      group.add(waist);

      const domeTop = new THREE.Mesh(
        new THREE.SphereGeometry(1.18, 28, 18),
        lacquerWoodMat
      );
      domeTop.position.y = 3.6;
      domeTop.scale.y = 0.85;
      group.add(domeTop);

      const atariDot = new THREE.Mesh(
        new THREE.SphereGeometry(0.16, 14, 14),
        brassMat
      );
      atariDot.position.set(0, 2.3, 1.12);
      group.add(atariDot);

      const sealDisc = new THREE.Mesh(
        new THREE.CylinderGeometry(1.3, 1.3, 0.24, 28),
        cinnabarInkMat
      );
      sealDisc.position.y = 0.14;
      group.add(sealDisc);

      const frontPlate = new THREE.Mesh(
        new THREE.CircleGeometry(0.95, 24),
        new THREE.MeshBasicMaterial({ map: this.textures.hankoSeal })
      );
      frontPlate.position.set(0, 1.45, 1.25);
      group.add(frontPlate);

    } else if (typeId === 'PAPER_TOWER') {
      const reamSideMat = new THREE.MeshStandardMaterial({
        map: this.textures.paperEdges,
        roughness: 0.75
      });
      const reamTopMat = new THREE.MeshStandardMaterial({
        map: this.textures.urgentDoc,
        roughness: 0.55
      });
      const binderBlueMat = new THREE.MeshStandardMaterial({
        color: 0x1e3a8a,
        roughness: 0.45,
        metalness: 0.1
      });
      const spineLabelMat = new THREE.MeshBasicMaterial({ color: 0xffffff });

      for (let i = 0; i < 8; i++) {
        const isBinder = i % 3 === 1;
        const blockGroup = new THREE.Group();
        blockGroup.position.set(
          Math.sin(i * 1.1) * 0.22,
          0.22 + i * 0.46,
          Math.cos(i * 0.9) * 0.15
        );
        blockGroup.rotation.y = (i % 2 === 0 ? 1 : -1) * 0.14;
        blockGroup.rotation.z = Math.sin(i * 1.7) * 0.05;

        if (isBinder) {
          const binder = new THREE.Mesh(
            new THREE.BoxGeometry(2.05, 0.44, 1.55),
            binderBlueMat
          );
          binder.castShadow = true;
          blockGroup.add(binder);

          const spineTag = new THREE.Mesh(
            new THREE.PlaneGeometry(0.32, 1.3),
            spineLabelMat
          );
          spineTag.rotation.z = Math.PI / 2;
          spineTag.position.set(0, 0, 0.78);
          blockGroup.add(spineTag);
        } else {
          const paperStack = new THREE.Mesh(
            new THREE.BoxGeometry(1.9, 0.42, 1.42),
            [reamSideMat, reamSideMat, reamTopMat, reamSideMat, reamSideMat, reamSideMat]
          );
          paperStack.castShadow = true;
          blockGroup.add(paperStack);
        }

        group.add(blockGroup);
      }

      const frontSheet = new THREE.Mesh(
        new THREE.PlaneGeometry(1.8, 2.2),
        reamTopMat
      );
      frontSheet.position.set(0, 1.9, 0.85);
      group.add(frontSheet);

    } else if (typeId === 'BOSS_CHAIR') {
      const executiveLeatherMat = new THREE.MeshPhysicalMaterial({
        color: 0x2b1206,
        roughness: 0.28,
        metalness: 0.08,
        clearcoat: 0.65,
        clearcoatRoughness: 0.25
      });
      const goldMat = new THREE.MeshStandardMaterial({
        color: 0xfacc15,
        metalness: 0.92,
        roughness: 0.18
      });
      const bossSuitMat = new THREE.MeshStandardMaterial({
        color: 0x111827,
        roughness: 0.55
      });
      const bossSkinMat = new THREE.MeshPhysicalMaterial({
        color: 0xf59e82,
        roughness: 0.45,
        clearcoat: 0.2
      });
      const grayHairMat = new THREE.MeshStandardMaterial({
        color: 0x9ca3af,
        roughness: 0.7
      });
      const laserBeamMat = new THREE.MeshBasicMaterial({
        color: 0xff0044,
        transparent: true,
        opacity: 0.55
      });

      const chairBack = new THREE.Mesh(
        new THREE.BoxGeometry(2.3, 3.4, 0.45),
        executiveLeatherMat
      );
      chairBack.position.set(0, 2.0, 0.55);
      chairBack.castShadow = true;
      group.add(chairBack);

      const chairSeat = new THREE.Mesh(
        new THREE.BoxGeometry(2.3, 0.35, 1.8),
        executiveLeatherMat
      );
      chairSeat.position.set(0, 0.85, -0.1);
      group.add(chairSeat);

      [-1.18, 1.18].forEach((ax) => {
        const arm = new THREE.Mesh(
          new THREE.BoxGeometry(0.22, 0.65, 1.5),
          goldMat
        );
        arm.position.set(ax, 1.3, -0.05);
        group.add(arm);
      });

      const bossTorso = new THREE.Mesh(
        new THREE.BoxGeometry(1.65, 1.45, 0.95),
        bossSuitMat
      );
      bossTorso.position.set(0, 1.65, -0.05);
      group.add(bossTorso);

      const goldTie = new THREE.Mesh(
        new THREE.BoxGeometry(0.28, 0.95, 0.08),
        goldMat
      );
      goldTie.position.set(0, 1.65, -0.54);
      group.add(goldTie);

      const bossHead = new THREE.Mesh(
        new THREE.SphereGeometry(0.85, 22, 20),
        bossSkinMat
      );
      bossHead.position.set(0, 2.95, -0.1);
      bossHead.scale.set(1.0, 1.08, 0.95);
      bossHead.castShadow = true;
      group.add(bossHead);

      [-0.78, 0.78].forEach((hx) => {
        const sideHair = new THREE.Mesh(
          new THREE.SphereGeometry(0.28, 12, 12),
          grayHairMat
        );
        sideHair.position.set(hx, 3.05, -0.05);
        group.add(sideHair);
      });

      const mustache = new THREE.Mesh(
        new THREE.BoxGeometry(0.68, 0.16, 0.2),
        grayHairMat
      );
      mustache.position.set(0, 2.68, -0.88);
      group.add(mustache);

      [-0.34, 0.34].forEach((ex) => {
        const eyeGlow = new THREE.Mesh(
          new THREE.SphereGeometry(0.22, 12, 12),
          new THREE.MeshBasicMaterial({ color: 0xff1144 })
        );
        eyeGlow.position.set(ex, 3.05, -0.85);
        group.add(eyeGlow);

        const beamCone = new THREE.Mesh(
          new THREE.ConeGeometry(0.45, 7.5, 14, 1, true),
          laserBeamMat
        );
        beamCone.position.set(ex * 1.4, 1.6, 2.6);
        beamCone.rotation.x = -Math.PI / 2 - 0.38;
        group.add(beamCone);
      });

      const bossSign = new THREE.Mesh(
        new THREE.PlaneGeometry(2.6, 1.15),
        new THREE.MeshBasicMaterial({ map: this.textures.bossBanner })
      );
      bossSign.position.set(0, 4.45, 0);
      group.add(bossSign);

    } else if (typeId === 'PAID_LEAVE_TICKET') {
      const goldMat = new THREE.MeshPhysicalMaterial({
        color: 0xffd700,
        emissive: 0x553300,
        metalness: 0.95,
        roughness: 0.12,
        clearcoat: 1.0
      });

      const frame = new THREE.Mesh(new THREE.BoxGeometry(2.35, 1.55, 0.22), goldMat);
      frame.position.y = 1.85;
      frame.castShadow = true;
      group.add(frame);

      const frontFace = new THREE.Mesh(
        new THREE.PlaneGeometry(2.15, 1.35),
        new THREE.MeshBasicMaterial({ map: this.textures.paidLeave })
      );
      frontFace.position.set(0, 1.85, 0.12);
      group.add(frontFace);

      const backFace = new THREE.Mesh(
        new THREE.PlaneGeometry(2.15, 1.35),
        new THREE.MeshBasicMaterial({ map: this.textures.paidLeave })
      );
      backFace.position.set(0, 1.85, -0.12);
      backFace.rotation.y = Math.PI;
      group.add(backFace);

      const halo = new THREE.Mesh(
        new THREE.RingGeometry(1.35, 1.55, 28),
        new THREE.MeshBasicMaterial({
          color: 0xffee55,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.65
        })
      );
      halo.position.y = 1.85;
      group.add(halo);

    } else if (typeId === 'JUMP_RAMP') {
      // =====================================================================
      // 5. 暴走コピー複合機ジャンプ台（緑のスキャナー光を放つオフィス複合機＋傾斜スロープ）
      // =====================================================================
      const copierBodyMat = new THREE.MeshStandardMaterial({
        color: 0xe2e8f0,
        roughness: 0.35,
        metalness: 0.15
      });
      const darkPanelMat = new THREE.MeshStandardMaterial({
        color: 0x1e293b,
        roughness: 0.4
      });
      const rampSurfaceMat = new THREE.MeshBasicMaterial({
        map: this.textures.jumpRamp
      });
      const scannerLightMat = new THREE.MeshBasicMaterial({
        color: 0x00ff88
      });

      // 複合機本体（給紙トレイ4段付き）
      const body = new THREE.Mesh(new THREE.BoxGeometry(3.2, 1.6, 2.2), copierBodyMat);
      body.position.set(0, 0.8, -0.6);
      body.castShadow = true;
      group.add(body);

      for (let t = 0; t < 3; t++) {
        const tray = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.28, 0.08), darkPanelMat);
        tray.position.set(0, 0.35 + t * 0.38, 0.52);
        group.add(tray);
      }

      // プレイヤーが手前から乗り上げる発光スキャナースロープ
      const rampBox = new THREE.Mesh(new THREE.BoxGeometry(3.3, 0.25, 3.8), darkPanelMat);
      rampBox.position.set(0, 0.85, 0.8);
      rampBox.rotation.x = 0.42;
      group.add(rampBox);

      const rampTop = new THREE.Mesh(new THREE.PlaneGeometry(3.1, 3.6), rampSurfaceMat);
      rampTop.rotation.x = -Math.PI / 2 + 0.42;
      rampTop.position.set(0, 1.0, 0.82);
      group.add(rampTop);

      // 左右のネオングリーン・ガイドバー
      [-1.62, 1.62].forEach((rx) => {
        const rail = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.25, 3.8), scannerLightMat);
        rail.position.set(rx, 0.98, 0.8);
        rail.rotation.x = 0.42;
        group.add(rail);
      });
    }

    return group;
  }

  // =========================================================================
  // 巨大決裁ロボ社長「ブラック・カイザー」3Dモデル構築＆出撃
  // =========================================================================
  spawnBoss() {
    if (this.bossMesh) {
      this.scene.remove(this.bossMesh);
    }

    const THREE = window.THREE;
    const boss = new THREE.Group();

    const blackArmorMat = new THREE.MeshPhysicalMaterial({
      color: 0x11131a,
      metalness: 0.85,
      roughness: 0.2,
      clearcoat: 1.0
    });
    const goldTrimMat = new THREE.MeshStandardMaterial({
      color: 0xffcc00,
      emissive: 0x442200,
      metalness: 0.95,
      roughness: 0.15
    });
    const crimsonGlowMat = new THREE.MeshBasicMaterial({ color: 0xff0044 });
    const cyanGlowMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff });

    // 巨大ロボ胴体＆黄金の社長ネクタイ装甲
    const torso = new THREE.Mesh(new THREE.BoxGeometry(5.6, 4.8, 3.2), blackArmorMat);
    torso.position.y = 4.2;
    torso.castShadow = true;
    boss.add(torso);

    const chestPlate = new THREE.Mesh(
      new THREE.PlaneGeometry(3.6, 1.8),
      new THREE.MeshBasicMaterial({ map: this.textures.ceoCore })
    );
    chestPlate.position.set(0, 4.8, 1.65);
    boss.add(chestPlate);

    const mechaTie = new THREE.Mesh(new THREE.BoxGeometry(0.9, 2.8, 0.35), goldTrimMat);
    mechaTie.position.set(0, 3.2, 1.65);
    boss.add(mechaTie);

    // 両肩の巨大ハンコ・ガトリング砲塔
    [-3.8, 3.8].forEach((sx) => {
      const shoulderArmor = new THREE.Mesh(new THREE.BoxGeometry(2.2, 2.2, 2.6), goldTrimMat);
      shoulderArmor.position.set(sx, 5.8, 0);
      boss.add(shoulderArmor);

      const cannon = new THREE.Mesh(
        new THREE.CylinderGeometry(0.75, 0.85, 3.4, 20),
        blackArmorMat
      );
      cannon.rotation.x = Math.PI / 2;
      cannon.position.set(sx, 5.8, 1.8);
      boss.add(cannon);

      const muzzle = new THREE.Mesh(new THREE.CylinderGeometry(0.65, 0.65, 0.2, 16), crimsonGlowMat);
      muzzle.rotation.x = Math.PI / 2;
      muzzle.position.set(sx, 5.8, 3.5);
      boss.add(muzzle);
    });

    // 巨大ロボ頭部＆黄金の社長王冠＆レーザーアイ
    const head = new THREE.Mesh(new THREE.BoxGeometry(2.8, 2.4, 2.4), blackArmorMat);
    head.position.set(0, 7.8, 0);
    boss.add(head);

    const visor = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.55, 0.2), crimsonGlowMat);
    visor.position.set(0, 7.9, 1.22);
    boss.add(visor);

    const crown = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.2, 1.1, 8), goldTrimMat);
    crown.position.set(0, 9.4, 0);
    boss.add(crown);

    // ホバー推進スラスター下部
    const hoverBase = new THREE.Mesh(new THREE.CylinderGeometry(2.8, 1.8, 1.6, 20), goldTrimMat);
    hoverBase.position.y = 1.1;
    boss.add(hoverBase);

    const thrusterRing = new THREE.Mesh(new THREE.TorusGeometry(2.4, 0.25, 12, 32), cyanGlowMat);
    thrusterRing.rotation.x = Math.PI / 2;
    thrusterRing.position.y = 0.35;
    boss.add(thrusterRing);

    boss.position.set(0, 0, -90);
    this.scene.add(boss);
    this.bossMesh = boss;
    this.bossPhase = 0;
    this.bossAttackTimer = 1.0;
  }

  spawnObstacle(floorIndex, forceType = null, customX = null, customZ = null) {
    const THREE = window.THREE;
    const types = this.config.OBSTACLES.TYPES;

    let chosenType = forceType;
    if (!chosenType) {
      const r = Math.random();
      if (r < 0.13) {
        chosenType = types.JUMP_RAMP;
      } else if (r < 0.27) {
        chosenType = types.PAID_LEAVE_TICKET;
      } else if (r < 0.45) {
        chosenType = types.BOSS_CHAIR;
      } else if (r < 0.70) {
        chosenType = types.PAPER_TOWER;
      } else {
        chosenType = types.HANKO;
      }
    }

    const mesh = this.createObstacleMesh(chosenType.id);
    const limit = this.config.LANE_LIMIT - 0.8;
    const x = customX !== null ? customX : (Math.random() * 2 - 1) * limit;
    const z = customZ !== null ? customZ : this.config.OBSTACLES.SPAWN_Z;
    mesh.position.set(x, 0, z);

    this.scene.add(mesh);

    this.items.push({
      type: chosenType,
      mesh,
      baseX: x,
      phase: Math.random() * Math.PI * 2,
      smashed: false,
      parriedToBoss: false,
      flyVelocity: new THREE.Vector3(),
      flyRotSpeed: new THREE.Vector3(),
      floorIndex
    });
  }

  update(dt, player, gameState, effectSystem, soundSystem, sceneManager) {
    const THREE = window.THREE;
    const playerPos = player.group.position;
    const isPlayerAttacking =
      player.isAttacking(gameState.isBoosting) || Math.abs(player.vx) > 13.5;

    // =========================================================================
    // 1. 巨大決裁ロボ社長 ボス戦の挙動更新
    // =========================================================================
    if (gameState.isBossActive) {
      if (!this.bossMesh) {
        this.spawnBoss();
        soundSystem.playBossSiren();
      }

      this.bossPhase += dt * 2.2;
      // 社長ロボが前方 z = -22 まで接近し、左右に威圧感たっぷりにホバー移動
      this.bossMesh.position.z = THREE.MathUtils.lerp(this.bossMesh.position.z, -22, dt * 3.5);
      this.bossMesh.position.x = Math.sin(this.bossPhase) * 5.2;
      this.bossMesh.position.y = Math.sin(this.bossPhase * 2.5) * 0.45;
      this.bossMesh.rotation.z = Math.cos(this.bossPhase) * 0.08;

      // 社長ロボが両肩のガトリング砲から巨大ハンコや有給チケットを射出！
      this.bossAttackTimer -= dt;
      if (this.bossAttackTimer <= 0) {
        this.bossAttackTimer = 0.68;
        const types = this.config.OBSTACLES.TYPES;
        const isTicket = Math.random() < 0.2;
        const spawnX = THREE.MathUtils.clamp(
          this.bossMesh.position.x + (Math.random() - 0.5) * 6,
          -this.config.LANE_LIMIT + 1,
          this.config.LANE_LIMIT - 1
        );
        this.spawnObstacle(
          gameState.floorIndex,
          isTicket ? types.PAID_LEAVE_TICKET : types.HANKO,
          spawnX,
          this.bossMesh.position.z + 3.0
        );
      }
    } else if (this.bossMesh) {
      this.scene.remove(this.bossMesh);
      this.bossMesh = null;
    }

    // =========================================================================
    // 2. 通常時の障害物・複合機ジャンプ台スポーン
    // =========================================================================
    if (!gameState.isBossActive) {
      const interval = Math.max(
        0.24,
        this.config.OBSTACLES.BASE_SPAWN_INTERVAL - gameState.floorIndex * 0.05
      );
      this.spawnTimer -= dt;
      if (this.spawnTimer <= 0) {
        this.spawnTimer = interval;
        this.spawnObstacle(gameState.floorIndex);
      }
    }

    // =========================================================================
    // 3. 各障害物の移動・パリィ反射・衝突判定
    // =========================================================================
    for (let i = this.items.length - 1; i >= 0; i--) {
      const item = this.items[i];
      const m = item.mesh;

      // 弾き飛ばされた障害物（または社長ロボへ跳ね返されたパリィ弾）の物理移動
      if (item.smashed) {
        if (item.parriedToBoss && this.bossMesh) {
          // 社長ロボの胸コアへ向かって超高速ホーミング反射！
          const targetPos = this.bossMesh.position.clone();
          targetPos.y += 4.5;
          const dir = targetPos.sub(m.position).normalize();
          m.position.addScaledVector(dir, 95 * dt);
          m.rotation.x += 25 * dt;
          m.rotation.y += 25 * dt;

          if (m.position.distanceTo(this.bossMesh.position) < 5.5) {
            // 社長ロボに直撃！！
            const bossCfg = this.config.OBSTACLES.BOSS;
            const defeated = gameState.damageBoss(bossCfg.damagePerParry);
            effectSystem.spawnSmashExplosion(this.bossMesh.position, 0xffcc00, true);
            const word = bossCfg.words[Math.floor(Math.random() * bossCfg.words.length)];
            effectSystem.spawnPopupText(
              this.bossMesh.position,
              defeated ? `💥 ${word} +45.0h 💥` : `社長へ倍返し!! -${bossCfg.damagePerParry}HP`,
              { isStamp: true }
            );
            sceneManager.triggerShake(defeated ? 1.1 : 0.65, defeated ? 0.55 : 0.25);

            if (defeated) {
              soundSystem.playBossDefeat();
              this.scene.remove(this.bossMesh);
              this.bossMesh = null;
            } else {
              soundSystem.playSmash(gameState.combo + 3);
            }

            this.scene.remove(m);
            this.items.splice(i, 1);
          }
          continue;
        }

        item.flyVelocity.y -= 32 * dt;
        m.position.addScaledVector(item.flyVelocity, dt);
        m.rotation.x += item.flyRotSpeed.x * dt;
        m.rotation.y += item.flyRotSpeed.y * dt;
        m.rotation.z += item.flyRotSpeed.z * dt;

        if (m.position.y < -10 || m.position.z < -220 || m.position.z > 30) {
          this.scene.remove(m);
          this.items.splice(i, 1);
        }
        continue;
      }

      // プレイヤーに向かって接近
      m.position.z += player.speed * dt;
      item.phase += dt * 5;

      if (item.type.id === 'HANKO') {
        const jumpSin = Math.abs(Math.sin(item.phase * 1.35));
        m.position.y = jumpSin * 1.45;
        m.rotation.z = Math.cos(item.phase * 1.35) * 0.08;
      } else if (item.type.id === 'BOSS_CHAIR') {
        m.position.x = THREE.MathUtils.clamp(
          item.baseX + Math.sin(item.phase * 0.9) * 3.2,
          -this.config.LANE_LIMIT,
          this.config.LANE_LIMIT
        );
        m.rotation.y = Math.cos(item.phase * 0.9) * 0.22;
      } else if (item.type.id === 'PAID_LEAVE_TICKET') {
        m.rotation.y += dt * 3.0;
        m.position.y = Math.sin(item.phase) * 0.25;
      }

      if (m.position.z > this.config.OBSTACLES.DESPAWN_Z) {
        this.scene.remove(m);
        this.items.splice(i, 1);
        continue;
      }

      // プレイヤーとの当たり判定（プレイヤーがジャンプで頭上高く飛び越えている場合は障害物を回避できる！）
      const dz = Math.abs(m.position.z - playerPos.z);
      const dx = Math.abs(m.position.x - playerPos.x);

      // 複合機ジャンプ台に乗った場合
      if (item.type.id === 'JUMP_RAMP' && dz < 2.3 && dx < 2.1 && player.y < 1.8) {
        player.triggerJump();
        soundSystem.playJump();
        gameState.healAndCharge(0, item.type.boostGain);
        const earned = gameState.addSmashScore(item.type.scoreHours);
        const word = item.type.words[Math.floor(Math.random() * item.type.words.length)];
        effectSystem.spawnSmashExplosion(m.position, 0x00ff88, true);
        effectSystem.spawnPopupText(m.position, `🛫 ${word} +${earned.toFixed(1)}h`, {
          color: '#00ff88'
        });
        sceneManager.triggerShake(0.35, 0.2);
        continue;
      }

      // 高度3.8m以上の大ジャンプ中は地上障害物の上を華麗に飛び越える（ただし回転攻撃判定は届く）
      if (player.y > 3.8 && item.type.id !== 'PAID_LEAVE_TICKET') {
        continue;
      }

      const hitRadiusX = isPlayerAttacking ? 2.75 : 1.55;
      if (dz < 2.15 && dx < hitRadiusX) {
        if (item.type.id === 'PAID_LEAVE_TICKET') {
          gameState.healAndCharge(item.type.healHp, item.type.boostGain);
          const earned = gameState.addSmashScore(item.type.scoreHours);
          const word = item.type.words[Math.floor(Math.random() * item.type.words.length)];
          effectSystem.spawnSmashExplosion(m.position, 0xffdd00, false);
          effectSystem.spawnPopupText(m.position, `${word} +${earned.toFixed(1)}h`, {
            color: '#ffee00'
          });
          soundSystem.playSmash(gameState.combo);
          this.scene.remove(m);
          this.items.splice(i, 1);
          continue;
        }

        if (isPlayerAttacking) {
          item.smashed = true;

          // ボス戦中にハンコ等を弾き返した場合は、社長ロボへ向かってホーミング反射！
          if (gameState.isBossActive && this.bossMesh) {
            item.parriedToBoss = true;
          } else {
            item.flyVelocity.set(
              (m.position.x - playerPos.x) * 14 + (Math.random() - 0.5) * 20,
              18 + Math.random() * 14,
              -65 - Math.random() * 35
            );
            item.flyRotSpeed.set(
              (Math.random() - 0.5) * 22,
              (Math.random() - 0.5) * 22,
              (Math.random() - 0.5) * 22
            );
          }

          const earned = gameState.addSmashScore(item.type.scoreHours);
          const word = item.type.words[Math.floor(Math.random() * item.type.words.length)];

          effectSystem.spawnSmashExplosion(m.position, 0xff2a5f, true);
          effectSystem.spawnPopupText(
            m.position,
            `${word} -${earned.toFixed(1)}h`,
            { isStamp: true }
          );
          soundSystem.playSmash(gameState.combo);
          sceneManager.triggerShake(0.42, 0.2);

        } else if (player.invincibleTimer <= 0) {
          const damaged = gameState.takeDamage(item.type.damage);
          if (damaged) {
            player.invincibleTimer = 1.0;
            effectSystem.flashScreen('rgba(255, 20, 60, 0.55)');
            effectSystem.spawnSmashExplosion(m.position, 0xff0000, false);
            effectSystem.spawnPopupText(m.position, `休日出勤確定!! -${item.type.damage}%`, {
              color: '#ff3355'
            });
            soundSystem.playDamage();
            sceneManager.triggerShake(0.75, 0.35);
          }
          this.scene.remove(m);
          this.items.splice(i, 1);
        }
      }
    }
  }

  clear() {
    for (const item of this.items) {
      this.scene.remove(item.mesh);
    }
    this.items = [];
    this.spawnTimer = 0;

    if (this.bossMesh) {
      this.scene.remove(this.bossMesh);
      this.bossMesh = null;
    }
  }
}

window.OfficeDriftGame.ObstacleManager = ObstacleManager;
