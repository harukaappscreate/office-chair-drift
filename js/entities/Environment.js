/**
 * js/entities/Environment.js
 * リアルな日本のオフィスビル廊下・執務室空間の3D構築
 * タイルカーペット＆磨き床のバンプ/ラフネステクスチャ、東京の夜景が透けるブラインド窓、
 * デュアルモニター付きデスク、キャビネット、ウォーターサーバー、天井ルーバー照明を再現します。
 */
window.OfficeDriftGame = window.OfficeDriftGame || {};

class Environment {
  constructor(scene) {
    this.scene = scene;
    this.config = window.OfficeDriftGame.Config;
    this.segments = [];
    this.segmentLength = 30;
    this.numSegments = 7;

    this.textures = {
      floor: this.createFloorTexture(),
      floorBump: this.createFloorBumpTexture(),
      monitor: this.createMonitorScreenTexture(),
      cityWindow: this.createCityWindowTexture(),
      ceiling: this.createCeilingTexture()
    };

    this.buildRoad();
    this.buildExitGate();
  }

  // オフィス床（中央は光沢リノリウム通路＋両脇はOAフロアタイルカーペット）のテクスチャ
  createFloorTexture() {
    const THREE = window.THREE;
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    // ベース：ダークグレーのOAタイルカーペット模様
    ctx.fillStyle = '#1e2533';
    ctx.fillRect(0, 0, 512, 512);

    // 64pxごとのタイル目地と微細な織り目ノイズ
    for (let y = 0; y < 512; y += 64) {
      for (let x = 0; x < 512; x += 64) {
        const shade = ((x / 64 + y / 64) % 2 === 0) ? '#212938' : '#1b2230';
        ctx.fillStyle = shade;
        ctx.fillRect(x + 1, y + 1, 62, 62);
      }
    }

    // 繊維ノイズ
    ctx.fillStyle = 'rgba(255,255,255,0.025)';
    for (let i = 0; i < 1600; i++) {
      ctx.fillRect(Math.random() * 512, Math.random() * 512, 2, 2);
    }

    // レーンガイドライン（路面標示風）
    ctx.fillStyle = 'rgba(0, 225, 255, 0.45)';
    ctx.fillRect(22, 0, 6, 512);
    ctx.fillRect(484, 0, 6, 512);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.18)';
    for (let y = 0; y < 512; y += 64) {
      ctx.fillRect(170, y + 8, 4, 36);
      ctx.fillRect(338, y + 8, 4, 36);
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(1, 2);
    return tex;
  }

  createFloorBumpTexture() {
    const THREE = window.THREE;
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#808080';
    ctx.fillRect(0, 0, 256, 256);

    ctx.strokeStyle = '#303030';
    ctx.lineWidth = 2;
    for (let i = 0; i <= 256; i += 32) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, 256);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(256, i);
      ctx.stroke();
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(2, 4);
    return tex;
  }

  // PCモニターに表示されるリアルなエクセル表＆売上グラフ画面
  createMonitorScreenTexture() {
    const THREE = window.THREE;
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, 256, 128);

    // スプレッドシート風ヘッダー
    ctx.fillStyle = '#107c41';
    ctx.fillRect(6, 6, 140, 16);

    // セルグリッド
    ctx.fillStyle = '#e2e8f0';
    for (let r = 0; r < 6; r++) {
      for (let c = 0; c < 4; c++) {
        ctx.fillRect(8 + c * 34, 26 + r * 14, 30, 10);
      }
    }

    // 棒グラフ＆折れ線グラフ
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(154, 6, 96, 114);
    const barColors = ['#38bdf8', '#f43f5e', '#facc15', '#4ade80'];
    for (let i = 0; i < 4; i++) {
      const h = 30 + i * 18;
      ctx.fillStyle = barColors[i];
      ctx.fillRect(164 + i * 20, 110 - h, 14, h);
    }

    return new THREE.CanvasTexture(canvas);
  }

  // オフィス窓の外に広がる高層ビル夜景＆ブラインド
  createCityWindowTexture() {
    const THREE = window.THREE;
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    // 夜空グラデーション
    const grad = ctx.createLinearGradient(0, 0, 0, 256);
    grad.addColorStop(0, '#050814');
    grad.addColorStop(1, '#162447');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 256);

    // 高層ビル群のシルエットと窓明かり
    for (let b = 0; b < 14; b++) {
      const bw = 28 + (b % 3) * 14;
      const bh = 90 + ((b * 37) % 140);
      const bx = b * 36;
      const by = 256 - bh;
      ctx.fillStyle = '#0a0f1d';
      ctx.fillRect(bx, by, bw, bh);

      for (let wy = by + 8; wy < 250; wy += 10) {
        for (let wx = bx + 4; wx < bx + bw - 6; wx += 8) {
          if (((wx * wy + b) % 7) > 2) {
            ctx.fillStyle = ((wx + wy) % 5 === 0) ? '#ffe899' : '#99ddff';
            ctx.fillRect(wx, wy, 4, 5);
          }
        }
      }
    }

    // 上部ブラインドのスラット（横桟）
    ctx.fillStyle = 'rgba(200, 210, 225, 0.25)';
    for (let y = 0; y < 75; y += 7) {
      ctx.fillRect(0, y, 512, 3);
    }

    return new THREE.CanvasTexture(canvas);
  }

  // システム天井（グリッド＋埋め込みLEDベースライト）
  createCeilingTexture() {
    const THREE = window.THREE;
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#d8dee9';
    ctx.fillRect(0, 0, 256, 256);

    ctx.strokeStyle = '#9aa5b8';
    ctx.lineWidth = 3;
    for (let i = 0; i <= 256; i += 64) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, 256);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(256, i);
      ctx.stroke();
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(3, 3);
    return tex;
  }

  createGateBannerTexture() {
    const THREE = window.THREE;
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    const grad = ctx.createLinearGradient(0, 0, 1024, 0);
    grad.addColorStop(0, '#071224');
    grad.addColorStop(0.5, '#0f2942');
    grad.addColorStop(1, '#071224');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 12;
    ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);

    // 非常口ピクトグラム風の緑バッジ
    ctx.fillStyle = '#00b862';
    ctx.fillRect(40, 48, 160, 160);
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 44px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('非常口', 120, 105);
    ctx.fillText('EXIT', 120, 160);

    ctx.fillStyle = '#ffdd00';
    ctx.font = '900 74px "Hiragino Kaku Gothic StdN", "Meiryo", sans-serif';
    ctx.fillText('17:00 定時退社 GATE', 580, 110);

    ctx.fillStyle = '#88eeff';
    ctx.font = '700 34px "Meiryo", sans-serif';
    ctx.fillText('OVERTIME FREE ZONE - 残業放棄エリア突入', 580, 185);

    return new THREE.CanvasTexture(canvas);
  }

  buildRoad() {
    const THREE = window.THREE;
    const roadWidth = this.config.ROAD_WIDTH;

    // 床マテリアル（バンプマップ＆程よいスペキュラ反射）
    const floorMat = new THREE.MeshStandardMaterial({
      map: this.textures.floor,
      bumpMap: this.textures.floorBump,
      bumpScale: 0.03,
      roughness: 0.32,
      metalness: 0.18
    });

    const pillarMat = new THREE.MeshStandardMaterial({
      color: 0xdde3ed,
      roughness: 0.4,
      metalness: 0.1
    });
    const baseboardMat = new THREE.MeshStandardMaterial({
      color: 0x222834,
      roughness: 0.5
    });
    const deskTopMat = new THREE.MeshStandardMaterial({
      color: 0xf2f4f8,
      roughness: 0.25,
      metalness: 0.05
    });
    const steelMat = new THREE.MeshStandardMaterial({
      color: 0x8c96a6,
      roughness: 0.3,
      metalness: 0.8
    });
    const darkFrameMat = new THREE.MeshStandardMaterial({
      color: 0x1b2028,
      roughness: 0.4,
      metalness: 0.5
    });
    const cabinetMat = new THREE.MeshStandardMaterial({
      color: 0xcfd6e2,
      roughness: 0.35,
      metalness: 0.4
    });
    const plantPotMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 });
    const leafMat = new THREE.MeshStandardMaterial({ color: 0x2d7a47, roughness: 0.5 });
    const waterBottleMat = new THREE.MeshPhysicalMaterial({
      color: 0x55ccff,
      transparent: true,
      opacity: 0.65,
      roughness: 0.1,
      metalness: 0.05
    });
    const partitionGlassMat = new THREE.MeshPhysicalMaterial({
      color: 0xaaddff,
      transparent: true,
      opacity: 0.28,
      roughness: 0.08,
      metalness: 0.1
    });
    const windowMat = new THREE.MeshBasicMaterial({ map: this.textures.cityWindow });
    const monitorScreenMat = new THREE.MeshBasicMaterial({ map: this.textures.monitor });
    const ceilingMat = new THREE.MeshStandardMaterial({
      map: this.textures.ceiling,
      roughness: 0.7
    });
    const ledPanelMat = new THREE.MeshBasicMaterial({ color: 0xf8fbff });

    for (let i = 0; i < this.numSegments; i++) {
      const segGroup = new THREE.Group();
      segGroup.position.z = -i * this.segmentLength;

      // 1. オフィスフロア床面
      const floor = new THREE.Mesh(
        new THREE.PlaneGeometry(roadWidth + 8, this.segmentLength),
        floorMat
      );
      floor.rotation.x = -Math.PI / 2;
      floor.receiveShadow = true;
      segGroup.add(floor);

      // 2. システム天井と埋め込みLEDベースライト
      const ceiling = new THREE.Mesh(
        new THREE.PlaneGeometry(roadWidth + 8, this.segmentLength),
        ceilingMat
      );
      ceiling.rotation.x = Math.PI / 2;
      ceiling.position.y = 11.5;
      segGroup.add(ceiling);

      [-7, 7].forEach((zOff) => {
        const ledFrame = new THREE.Mesh(new THREE.BoxGeometry(6.5, 0.15, 1.4), steelMat);
        ledFrame.position.set(0, 11.42, zOff);
        segGroup.add(ledFrame);

        const ledGlow = new THREE.Mesh(new THREE.PlaneGeometry(6.2, 1.1), ledPanelMat);
        ledGlow.rotation.x = Math.PI / 2;
        ledGlow.position.set(0, 11.33, zOff);
        segGroup.add(ledGlow);
      });

      // 3. 左右のオフィス壁面（夜景ウィンドウ）・構造柱・ガラスパーテーション・什器
      [-1, 1].forEach((dir) => {
        const sideX = dir * (roadWidth / 2 + 1.8);

        // 外壁の夜景窓
        const winMesh = new THREE.Mesh(new THREE.PlaneGeometry(this.segmentLength, 9.5), windowMat);
        winMesh.position.set(dir * (roadWidth / 2 + 3.8), 5.5, 0);
        winMesh.rotation.y = -dir * (Math.PI / 2);
        segGroup.add(winMesh);

        // コンクリート構造角柱＋幅木
        const pillar = new THREE.Mesh(new THREE.BoxGeometry(1.1, 11.5, 1.1), pillarMat);
        pillar.position.set(sideX + dir * 1.2, 5.75, 0);
        pillar.castShadow = true;
        segGroup.add(pillar);

        const baseboard = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.3, 1.2), baseboardMat);
        baseboard.position.set(sideX + dir * 1.2, 0.15, 0);
        segGroup.add(baseboard);

        // ガラスパーテーション（アルミフレーム付き）
        const glassPanel = new THREE.Mesh(new THREE.BoxGeometry(0.08, 3.2, 5.5), partitionGlassMat);
        glassPanel.position.set(sideX - dir * 0.6, 1.6, -2);
        segGroup.add(glassPanel);

        const frameTop = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.1, 5.6), steelMat);
        frameTop.position.set(sideX - dir * 0.6, 3.2, -2);
        segGroup.add(frameTop);

        // 島型オフィスデスク＋スチール脚＋デュアルモニター
        const deskGroup = new THREE.Group();
        deskGroup.position.set(sideX, 0, -9);

        const top = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.08, 4.4), deskTopMat);
        top.position.y = 1.05;
        top.castShadow = true;
        top.receiveShadow = true;
        deskGroup.add(top);

        [-0.95, 0.95].forEach((lx) => {
          [-2.0, 2.0].forEach((lz) => {
            const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.05, 8), steelMat);
            leg.position.set(lx, 0.525, lz);
            deskGroup.add(leg);
          });
        });

        // デュアルモニター（スタンド・ベゼル・画面）
        [-1.1, 1.1].forEach((mz) => {
          const stand = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.35, 0.12), darkFrameMat);
          stand.position.set(0, 1.25, mz);
          deskGroup.add(stand);

          const bezel = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.82, 1.45), darkFrameMat);
          bezel.position.set(-dir * 0.1, 1.58, mz);
          deskGroup.add(bezel);

          const screen = new THREE.Mesh(new THREE.PlaneGeometry(1.36, 0.74), monitorScreenMat);
          screen.position.set(-dir * 0.15, 1.58, mz);
          screen.rotation.y = -dir * (Math.PI / 2);
          deskGroup.add(screen);
        });

        segGroup.add(deskGroup);

        // 4段スチールキャビネット（取っ手付き）
        const cabinet = new THREE.Mesh(new THREE.BoxGeometry(1.4, 2.8, 1.6), cabinetMat);
        cabinet.position.set(sideX + dir * 0.3, 1.4, 8);
        cabinet.castShadow = true;
        segGroup.add(cabinet);

        for (let d = 0; d < 4; d++) {
          const handle = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.08, 0.5), steelMat);
          handle.position.set(sideX - dir * 0.42, 0.45 + d * 0.65, 8);
          segGroup.add(handle);
        }

        // ウォーターサーバー＆観葉植物（交互配置）
        if (i % 2 === 0) {
          const coolerBase = new THREE.Mesh(new THREE.BoxGeometry(0.7, 1.45, 0.7), plantPotMat);
          coolerBase.position.set(sideX - dir * 0.2, 0.725, 4.5);
          segGroup.add(coolerBase);

          const waterJug = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.75, 14), waterBottleMat);
          waterJug.position.set(sideX - dir * 0.2, 1.82, 4.5);
          segGroup.add(waterJug);
        } else {
          const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.32, 0.75, 12), plantPotMat);
          pot.position.set(sideX - dir * 0.2, 0.375, 4.5);
          segGroup.add(pot);

          const foliage = new THREE.Mesh(new THREE.DodecahedronGeometry(0.68, 1), leafMat);
          foliage.position.set(sideX - dir * 0.2, 1.25, 4.5);
          segGroup.add(foliage);
        }
      });

      this.scene.add(segGroup);
      this.segments.push(segGroup);
    }
  }

  buildExitGate() {
    const THREE = window.THREE;
    this.gateGroup = new THREE.Group();

    const frameMat = new THREE.MeshStandardMaterial({
      color: 0xd4af37,
      emissive: 0x332200,
      metalness: 0.9,
      roughness: 0.18
    });

    const leftPillar = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.65, 9.5, 16), frameMat);
    leftPillar.position.set(-8.4, 4.75, 0);
    const rightPillar = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.65, 9.5, 16), frameMat);
    rightPillar.position.set(8.4, 4.75, 0);

    const bannerTex = this.createGateBannerTexture();
    const bannerMat = new THREE.MeshBasicMaterial({ map: bannerTex });
    const banner = new THREE.Mesh(new THREE.BoxGeometry(18.0, 3.0, 0.9), bannerMat);
    banner.position.set(0, 8.2, 0);

    this.gateGroup.add(leftPillar, rightPillar, banner);
    this.gateGroup.position.z = -180;
    this.gateGroup.visible = false;
    this.scene.add(this.gateGroup);
  }

  update(dt, speed, distanceToNextGate) {
    const totalLength = this.segmentLength * this.numSegments;
    for (const seg of this.segments) {
      seg.position.z += speed * dt;
      if (seg.position.z > this.segmentLength) {
        seg.position.z -= totalLength;
      }
    }

    if (distanceToNextGate < 95) {
      this.gateGroup.visible = true;
      this.gateGroup.position.z = -distanceToNextGate * 1.6;
    } else {
      this.gateGroup.visible = false;
    }
  }
}

window.OfficeDriftGame.Environment = Environment;
