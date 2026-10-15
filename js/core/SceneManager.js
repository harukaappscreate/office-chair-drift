/**
 * js/core/SceneManager.js
 * PBR（物理ベースレンダリング）、ACESFilmicトーンマッピング、
 * PMREMGeneratorによるプロシージャル環境反射マップ、
 * UnrealBloomPass（Post-Processing発光エフェクト）、
 * およびドリフト時のカメラバンク・ジャンプ追従・スローモーションカメラを管理します。
 */
window.OfficeDriftGame = window.OfficeDriftGame || {};

class SceneManager {
  constructor(containerId) {
    const THREE = window.THREE;
    this.container = document.getElementById(containerId);

    // シーンと空気遠近フォグの初期化
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0b101d);
    this.scene.fog = new THREE.FogExp2(0x0e1526, 0.0105);

    // カメラ初期化
    this.baseFov = 58;
    this.targetFov = 58;
    this.camera = new THREE.PerspectiveCamera(
      this.baseFov,
      window.innerWidth / window.innerHeight,
      0.1,
      280
    );
    this.baseCamPos = new THREE.Vector3(0, 4.6, 9.2);
    this.camera.position.copy(this.baseCamPos);
    this.camera.lookAt(0, 1.8, -14);

    // レンダラー初期化（PBRトーンマッピング・ソフトシャドウ有効化）
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    if (THREE.ACESFilmicToneMapping !== undefined) {
      this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
      this.renderer.toneMappingExposure = 1.15;
    }
    if (THREE.SRGBColorSpace !== undefined) {
      this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    }

    if (this.container) {
      this.container.innerHTML = '';
      this.container.appendChild(this.renderer.domElement);
    }

    // プロシージャル環境反射マップ生成
    this.setupEnvironmentMap();

    // ライティング構築
    this.setupLights();

    // Post-Processing (UnrealBloomPass) セットアップ
    this.setupPostProcessing();

    // カメラシェイク＆バンク状態
    this.shakeIntensity = 0;
    this.shakeTimer = 0;
    this.camRoll = 0;

    window.addEventListener('resize', () => this.onResize());
  }

  setupEnvironmentMap() {
    const THREE = window.THREE;
    if (!THREE.PMREMGenerator) return;

    try {
      const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
      pmremGenerator.compileEquirectangularShader();

      const envScene = new THREE.Scene();
      envScene.background = new THREE.Color(0x182238);

      const ceilingMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
      for (let i = -3; i <= 3; i++) {
        const lightPanel = new THREE.Mesh(new THREE.PlaneGeometry(8, 2.2), ceilingMat);
        lightPanel.position.set(i * 4, 10, -i * 3);
        lightPanel.rotation.x = Math.PI / 2;
        envScene.add(lightPanel);
      }

      const warmSideMat = new THREE.MeshBasicMaterial({ color: 0xffaa55 });
      const sideWindow = new THREE.Mesh(new THREE.PlaneGeometry(30, 8), warmSideMat);
      sideWindow.position.set(-15, 3, 0);
      sideWindow.rotation.y = Math.PI / 2;
      envScene.add(sideWindow);

      const coolSideMat = new THREE.MeshBasicMaterial({ color: 0x44ccff });
      const rightWindow = new THREE.Mesh(new THREE.PlaneGeometry(30, 8), coolSideMat);
      rightWindow.position.set(15, 3, 0);
      rightWindow.rotation.y = -Math.PI / 2;
      envScene.add(rightWindow);

      const envRT = pmremGenerator.fromScene(envScene, 0.04);
      this.scene.environment = envRT.texture;
      pmremGenerator.dispose();
    } catch (e) {
      // フォールバック
    }
  }

  setupLights() {
    const THREE = window.THREE;

    const hemiLight = new THREE.HemisphereLight(0xeef6ff, 0x1e2436, 0.95);
    hemiLight.position.set(0, 25, 0);
    this.scene.add(hemiLight);

    this.dirLight = new THREE.DirectionalLight(0xfff9ee, 1.85);
    this.dirLight.position.set(12, 32, 22);
    this.dirLight.castShadow = true;
    this.dirLight.shadow.mapSize.width = 2048;
    this.dirLight.shadow.mapSize.height = 2048;
    this.dirLight.shadow.bias = -0.0005;
    this.dirLight.shadow.camera.near = 2;
    this.dirLight.shadow.camera.far = 130;
    const d = 24;
    this.dirLight.shadow.camera.left = -d;
    this.dirLight.shadow.camera.right = d;
    this.dirLight.shadow.camera.top = d;
    this.dirLight.shadow.camera.bottom = -d;
    this.scene.add(this.dirLight);

    const rimLight = new THREE.DirectionalLight(0x66ccff, 0.85);
    rimLight.position.set(-10, 8, 16);
    this.scene.add(rimLight);
  }

  setupPostProcessing() {
    const THREE = window.THREE;
    const addons = window.THREE_ADDONS;
    this.composer = null;
    this.bloomPass = null;

    if (addons && addons.EffectComposer && addons.RenderPass && addons.UnrealBloomPass) {
      try {
        this.composer = new addons.EffectComposer(this.renderer);
        const renderPass = new addons.RenderPass(this.scene, this.camera);
        this.composer.addPass(renderPass);

        this.bloomPass = new addons.UnrealBloomPass(
          new THREE.Vector2(window.innerWidth, window.innerHeight),
          0.55, // strength
          0.42, // radius
          0.78  // threshold
        );
        this.composer.addPass(this.bloomPass);

        if (addons.OutputPass) {
          const outputPass = new addons.OutputPass();
          this.composer.addPass(outputPass);
        }
      } catch (e) {
        this.composer = null;
      }
    }
  }

  applyFloorTheme(floorConfig) {
    const THREE = window.THREE;
    if (!floorConfig) return;
    this.scene.background = new THREE.Color(floorConfig.skyColor);
    this.scene.fog.color = new THREE.Color(floorConfig.fogColor);
  }

  triggerShake(intensity = 0.45, duration = 0.25) {
    this.shakeIntensity = Math.max(this.shakeIntensity, intensity);
    this.shakeTimer = Math.max(this.shakeTimer, duration);
  }

  update(
    dt,
    playerX = 0,
    isSpinning = false,
    isBoosting = false,
    playerVx = 0,
    playerY = 0,
    isCrashing = false
  ) {
    const THREE = window.THREE;

    // 1. ダイナミックFOV＆ブルーム発光強度の制御
    if (isCrashing) {
      this.targetFov = 50; // クラッシュ時は映画風ズーム
    } else if (isBoosting) {
      this.targetFov = 86;
    } else if (isSpinning || playerY > 1.0) {
      this.targetFov = 70;
    } else {
      this.targetFov = this.baseFov;
    }
    this.camera.fov = THREE.MathUtils.lerp(this.camera.fov, this.targetFov, dt * 7);
    this.camera.updateProjectionMatrix();

    if (this.bloomPass) {
      const targetBloom = isBoosting ? 0.92 : isSpinning ? 0.68 : 0.52;
      this.bloomPass.strength = THREE.MathUtils.lerp(this.bloomPass.strength, targetBloom, dt * 6);
    }

    // 2. プレイヤー追従（ジャンプ高度・クラッシュ演出にも対応）
    const targetCamX = playerX * 0.62;
    const targetCamY = (isBoosting ? 3.7 : this.baseCamPos.y) + playerY * 0.55;
    const targetCamZ = isCrashing ? 6.8 : isBoosting ? 7.6 : this.baseCamPos.z;

    this.camera.position.x = THREE.MathUtils.lerp(this.camera.position.x, targetCamX, dt * 8.5);
    this.camera.position.y = THREE.MathUtils.lerp(this.camera.position.y, targetCamY, dt * 6);
    this.camera.position.z = THREE.MathUtils.lerp(this.camera.position.z, targetCamZ, dt * 6);

    // 3. カメラシェイク加算
    if (this.shakeTimer > 0) {
      this.shakeTimer -= dt;
      const sx = (Math.random() - 0.5) * 2 * this.shakeIntensity;
      const sy = (Math.random() - 0.5) * 2 * this.shakeIntensity;
      this.camera.position.x += sx;
      this.camera.position.y += sy;
      if (this.shakeTimer <= 0) {
        this.shakeIntensity = 0;
      }
    }

    this.camera.lookAt(playerX * 0.42, 1.65 + playerY * 0.35, -16);

    // 4. ドリフト横Gに応じたカメラのリアルなロール（バンク角）
    const targetRoll = THREE.MathUtils.clamp(-playerVx * 0.0035, -0.09, 0.09);
    this.camRoll = THREE.MathUtils.lerp(this.camRoll, targetRoll, dt * 8);
    this.camera.rotation.z += this.camRoll;
  }

  render() {
    if (this.composer) {
      this.composer.render();
    } else {
      this.renderer.render(this.scene, this.camera);
    }
  }

  onResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    if (this.composer) {
      this.composer.setSize(window.innerWidth, window.innerHeight);
    }
  }
}

window.OfficeDriftGame.SceneManager = SceneManager;
