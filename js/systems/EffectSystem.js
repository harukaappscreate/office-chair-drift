/**
 * js/systems/EffectSystem.js
 * リアルな物理パーティクル＆路面エフェクト管理
 * - 印刷済みA4稟議書（罫線・決裁印付き）の空気抵抗ひらひら落下
 * - ドリフト時に床面に刻まれる双輪キャスターのブラックマーク（タイヤ痕デカール）
 * - 消火器ジェットのCO2白煙＆アフターバーナー火花
 * - 3D衝撃波リングとバカゲー風ポップアップ文字
 */
window.OfficeDriftGame = window.OfficeDriftGame || {};

class EffectSystem {
  constructor(scene, camera) {
    this.scene = scene;
    this.camera = camera;
    this.particles = [];
    this.skidmarks = [];
    this.popupContainer = document.getElementById('popup-container');
    this.flashEl = document.getElementById('screen-flash');

    const THREE = window.THREE;
    this.sparkGeo = new THREE.BoxGeometry(0.18, 0.18, 0.45);
    this.smokeGeo = new THREE.SphereGeometry(0.32, 10, 10);
    this.paperGeo = new THREE.PlaneGeometry(0.68, 0.94);
    this.skidGeo = new THREE.PlaneGeometry(0.18, 0.95);

    this.printedPaperMat = new THREE.MeshStandardMaterial({
      map: this.createPrintedPaperTexture(),
      roughness: 0.6,
      side: THREE.DoubleSide
    });

    this.skidMat = new THREE.MeshBasicMaterial({
      color: 0x090b10,
      transparent: true,
      opacity: 0.55,
      depthWrite: false
    });
  }

  // 舞い散るA4用紙1枚1枚に描かれるリアルな「稟議書・承認印」テクスチャ
  createPrintedPaperTexture() {
    const THREE = window.THREE;
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 180;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 128, 180);

    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 2;
    ctx.strokeRect(8, 8, 112, 164);

    ctx.fillStyle = '#1e293b';
    ctx.fillRect(16, 18, 60, 8);

    for (let y = 38; y < 150; y += 12) {
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(16, y, 96, 3);
    }

    // 朱肉の丸印
    ctx.strokeStyle = '#e11d48';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(96, 26, 12, 0, Math.PI * 2);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(92, 142, 16, 0, Math.PI * 2);
    ctx.stroke();

    return new THREE.CanvasTexture(canvas);
  }

  // 障害物撃破時の大爆発・衝撃波・印刷済み稟議書の飛散
  spawnSmashExplosion(position, colorHex = 0xff3333, includePapers = true) {
    const THREE = window.THREE;

    // 1. 火花＆破片パーティクル
    const count = 20;
    for (let i = 0; i < count; i++) {
      const mat = new THREE.MeshBasicMaterial({
        color: i % 3 === 0 ? 0xffe600 : colorHex
      });
      const mesh = new THREE.Mesh(this.sparkGeo, mat);
      mesh.position.copy(position);
      mesh.position.y += 1.0;

      const angle = Math.random() * Math.PI * 2;
      const speed = 7 + Math.random() * 19;
      const velocity = new THREE.Vector3(
        Math.cos(angle) * speed,
        6 + Math.random() * 15,
        Math.sin(angle) * speed
      );

      this.scene.add(mesh);
      this.particles.push({
        mesh,
        velocity,
        rotSpeed: new THREE.Vector3(
          (Math.random() - 0.5) * 15,
          (Math.random() - 0.5) * 15,
          (Math.random() - 0.5) * 15
        ),
        gravity: 30,
        flutter: false,
        disposeMat: true,
        life: 0.75 + Math.random() * 0.35,
        maxLife: 1.0
      });
    }

    // 2. リアルな印刷済みA4稟議書が空気抵抗でひらひら舞い散る
    if (includePapers) {
      const paperCount = 16;
      for (let i = 0; i < paperCount; i++) {
        const mesh = new THREE.Mesh(this.paperGeo, this.printedPaperMat);
        mesh.position.copy(position);
        mesh.position.y += 1.2 + Math.random() * 1.2;

        const velocity = new THREE.Vector3(
          (Math.random() - 0.5) * 18,
          7 + Math.random() * 14,
          (Math.random() - 0.5) * 18
        );

        this.scene.add(mesh);
        this.particles.push({
          mesh,
          velocity,
          rotSpeed: new THREE.Vector3(
            (Math.random() - 0.5) * 8,
            (Math.random() - 0.5) * 8,
            (Math.random() - 0.5) * 8
          ),
          gravity: 8.5, // 紙の軽い重力
          flutter: true,
          flutterPhase: Math.random() * Math.PI * 2,
          disposeMat: false,
          life: 1.35 + Math.random() * 0.45,
          maxLife: 1.7
        });
      }
    }
  }

  // 消火器ジェットの白煙（CO2スモーク）＆火花トレイル
  spawnJetTrail(position, isBoost = false) {
    const THREE = window.THREE;

    // 消火器CO2白煙パフ
    const smokeMat = new THREE.MeshBasicMaterial({
      color: isBoost ? 0xfff3cc : 0xdbeafe,
      transparent: true,
      opacity: 0.42
    });
    const smokeMesh = new THREE.Mesh(this.smokeGeo, smokeMat);
    smokeMesh.position.set(
      position.x + (Math.random() - 0.5) * 0.85,
      position.y + 0.38 + Math.random() * 0.35,
      position.z + 1.05
    );
    const initScale = isBoost ? 1.25 : 0.75;
    smokeMesh.scale.setScalar(initScale);

    this.scene.add(smokeMesh);
    this.particles.push({
      mesh: smokeMesh,
      velocity: new THREE.Vector3(
        (Math.random() - 0.5) * 3.5,
        1.2 + Math.random() * 2.2,
        14 + Math.random() * 8
      ),
      rotSpeed: new THREE.Vector3(2, 2, 2),
      gravity: -2.5, // 煙は少し上昇しながら拡散
      expandSmoke: true,
      disposeMat: true,
      life: 0.34,
      maxLife: 0.34
    });
  }

  // ドリフト時に床に残るリアルなキャスタータイヤ痕（ブラックマーク）
  spawnSkidmark(position, vx) {
    const THREE = window.THREE;
    [-0.55, 0.55].forEach((offsetX) => {
      const skid = new THREE.Mesh(this.skidGeo, this.skidMat);
      skid.rotation.x = -Math.PI / 2;
      skid.rotation.z = THREE.MathUtils.clamp(-vx * 0.018, -0.45, 0.45);
      skid.position.set(position.x + offsetX, 0.025, position.z + 0.3);
      this.scene.add(skid);
      this.skidmarks.push({
        mesh: skid,
        life: 1.4
      });
    });
  }

  spawnPopupText(worldPos, text, options = {}) {
    if (!this.popupContainer) return;
    const projected = worldPos.clone();
    projected.y += 2.2;
    projected.project(this.camera);

    const x = (projected.x * 0.5 + 0.5) * window.innerWidth;
    const y = (-(projected.y * 0.5) + 0.5) * window.innerHeight;

    const el = document.createElement('div');
    el.className = 'comic-popup' + (options.isStamp ? ' stamp-style' : '');
    el.textContent = text;
    el.style.left = `${Math.min(Math.max(x, 80), window.innerWidth - 80)}px`;
    el.style.top = `${Math.min(Math.max(y, 80), window.innerHeight - 100)}px`;
    if (options.color && !options.isStamp) {
      el.style.color = options.color;
    }

    this.popupContainer.appendChild(el);
    setTimeout(() => {
      if (el.parentNode) el.parentNode.removeChild(el);
    }, 850);
  }

  flashScreen(color = 'rgba(255, 40, 80, 0.45)') {
    if (!this.flashEl) return;
    this.flashEl.style.background = color;
    this.flashEl.style.opacity = '1';
    setTimeout(() => {
      this.flashEl.style.opacity = '0';
    }, 120);
  }

  update(dt, roadSpeed = 42) {
    // 1. 空間パーティクル（火花・白煙・稟議書）の更新
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;
      if (p.life <= 0) {
        this.scene.remove(p.mesh);
        if (p.disposeMat && p.mesh.material) p.mesh.material.dispose();
        this.particles.splice(i, 1);
        continue;
      }

      p.velocity.y -= p.gravity * dt;

      // 稟議書のリアルな横揺れ空気抵抗（ひらひら挙動）
      if (p.flutter) {
        p.flutterPhase += dt * 9;
        p.mesh.position.x += Math.sin(p.flutterPhase) * 4.5 * dt;
      }

      p.mesh.position.addScaledVector(p.velocity, dt);
      p.mesh.rotation.x += p.rotSpeed.x * dt;
      p.mesh.rotation.y += p.rotSpeed.y * dt;
      p.mesh.rotation.z += p.rotSpeed.z * dt;

      const ratio = Math.max(0, p.life / p.maxLife);
      if (p.expandSmoke) {
        p.mesh.scale.setScalar(0.7 + (1 - ratio) * 1.8);
        if (p.mesh.material) p.mesh.material.opacity = ratio * 0.42;
      } else if (!p.flutter) {
        p.mesh.scale.setScalar(ratio);
      }
    }

    // 2. 床面のドリフトタイヤ痕を路面速度に合わせて後方へスクロール
    for (let i = this.skidmarks.length - 1; i >= 0; i--) {
      const s = this.skidmarks[i];
      s.life -= dt;
      s.mesh.position.z += roadSpeed * dt;
      if (s.life <= 0 || s.mesh.position.z > 18) {
        this.scene.remove(s.mesh);
        this.skidmarks.splice(i, 1);
      }
    }
  }

  clear() {
    for (const p of this.particles) {
      this.scene.remove(p.mesh);
      if (p.disposeMat && p.mesh.material) p.mesh.material.dispose();
    }
    this.particles = [];

    for (const s of this.skidmarks) {
      this.scene.remove(s.mesh);
    }
    this.skidmarks = [];

    if (this.popupContainer) {
      this.popupContainer.innerHTML = '';
    }
  }
}

window.OfficeDriftGame.EffectSystem = EffectSystem;
