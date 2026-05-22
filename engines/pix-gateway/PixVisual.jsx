import { useState, useEffect, useRef } from "react";
import * as THREE from "three";

/**
 * PixVisual — Portal 3D de Pagamentos via Pix (Mercado Pago)
 * Dados fictícios — apenas demonstração visual
 * @author Vincent AI Studios
 * @license MIT
 */
function PixVisual() {
  const containerRef = useRef(null);
  const [isSandbox, setIsSandbox] = useState(false);
  const [telemetry, setTelemetry] = useState({
    processedVolume: 12842.50,
    latency: 18,
    txHistory: [
      { id: "TX-9D8A3", amount: "42,90", status: "APROVADO" },
      { id: "TX-4F2E9", amount: "120,00", status: "APROVADO" },
      { id: "TX-7B1C4", amount: "85,50", status: "APROVADO" }
    ]
  });

  const isSandboxRef = useRef(false);
  const transactionActiveRef = useRef(false);
  const pulseTimerRef = useRef(0.0);
  const cameraShakeRef = useRef(0.0);
  const processedVolumeRef = useRef(12842.50);

  const simulatePayment = () => {
    transactionActiveRef.current = true;
    pulseTimerRef.current = 1.0;
    cameraShakeRef.current = 1.0;

    const val = 15.0 + Math.random() * 435.0;
    const latency = 12 + Math.floor(Math.random() * 24);
    const txId = "TX-" + Math.random().toString(36).substring(2, 7).toUpperCase();

    processedVolumeRef.current += val;

    setTelemetry((prev) => {
      const newHistory = [
        {
          id: txId,
          amount: val.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
          status: "APROVADO"
        },
        ...prev.txHistory
      ].slice(0, 3);

      return {
        processedVolume: processedVolumeRef.current,
        latency: latency,
        txHistory: newHistory
      };
    });
  };

  const toggleNetwork = () => {
    setIsSandbox((prev) => {
      const next = !prev;
      isSandboxRef.current = next;
      return next;
    });
  };

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    container.innerHTML = "";

    const scene = new THREE.Scene();
    const rect = container.getBoundingClientRect();
    const width = rect.width > 0 && rect.width < 800 ? rect.width : 500;
    const height = rect.height > 0 && rect.height < 500 ? rect.height : 360;

    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    camera.position.set(0, -0.2, 7.5);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    renderer.domElement.style.display = "block";
    renderer.domElement.style.cursor = "pointer";
    container.appendChild(renderer.domElement);

    const mainGroup = new THREE.Group();
    scene.add(mainGroup);

    // Procedural Studio EnvMap
    const createStudioEnvMap = () => {
      const canvas = document.createElement("canvas");
      canvas.width = 256;
      canvas.height = 128;
      const ctx = canvas.getContext("2d");
      const grad = ctx.createLinearGradient(0, 0, 256, 0);
      grad.addColorStop(0, "#030305");
      grad.addColorStop(0.2, "#101622");
      grad.addColorStop(0.3, "#ffffff");
      grad.addColorStop(0.4, "#101622");
      grad.addColorStop(0.5, "#030305");
      grad.addColorStop(0.7, "#0b203c");
      grad.addColorStop(0.8, "#ffffff");
      grad.addColorStop(1, "#030305");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 256, 128);
      const texture = new THREE.CanvasTexture(canvas);
      texture.mapping = THREE.EquirectangularReflectionMapping;
      return texture;
    };

    const studioEnvMap = createStudioEnvMap();
    scene.environment = studioEnvMap;

    // Logo Pix Group
    const logoGroup = new THREE.Group();
    mainGroup.add(logoGroup);

    const outerMat = new THREE.MeshStandardMaterial({
      color: 0x9ba4b0,
      metalness: 0.95,
      roughness: 0.15,
      envMap: studioEnvMap,
      envMapIntensity: 1.5
    });

    const neonMat = new THREE.MeshStandardMaterial({
      color: 0x00bdae,
      emissive: 0x00bdae,
      emissiveIntensity: 1.5,
      transparent: true,
      opacity: 0.95
    });

    // Helper para criar cilindros entre dois pontos
    const createCylinderBetweenPoints = (p1, p2, radius, material) => {
      const direction = new THREE.Vector3().subVectors(p2, p1);
      const length = direction.length();
      const geom = new THREE.CylinderGeometry(radius, radius, length, 12);
      geom.translate(0, length / 2, 0);
      const mesh = new THREE.Mesh(geom, material);
      mesh.position.copy(p1);
      mesh.lookAt(p2);
      mesh.rotateX(Math.PI / 2);
      return mesh;
    };

    const sizeVal = 1.15;
    const top = new THREE.Vector3(0, sizeVal, 0);
    const right = new THREE.Vector3(sizeVal, 0, 0);
    const bottom = new THREE.Vector3(0, -sizeVal, 0);
    const left = new THREE.Vector3(-sizeVal, 0, 0);

    // Losango Externo Cromado
    const rOuter = 0.055;
    const out1 = createCylinderBetweenPoints(left, top, rOuter, outerMat);
    const out2 = createCylinderBetweenPoints(top, right, rOuter, outerMat);
    const out3 = createCylinderBetweenPoints(right, bottom, rOuter, outerMat);
    const out4 = createCylinderBetweenPoints(bottom, left, rOuter, outerMat);

    logoGroup.add(out1);
    logoGroup.add(out2);
    logoGroup.add(out3);
    logoGroup.add(out4);

    // Losango Interno Neon (ligeiramente deslocado no eixo Z para frente)
    const rInner = 0.024;
    const zOffset = 0.045;
    const inTop = top.clone().add(new THREE.Vector3(0, 0, zOffset));
    const inRight = right.clone().add(new THREE.Vector3(0, 0, zOffset));
    const inBottom = bottom.clone().add(new THREE.Vector3(0, 0, zOffset));
    const inLeft = left.clone().add(new THREE.Vector3(0, 0, zOffset));

    const in1 = createCylinderBetweenPoints(inLeft, inTop, rInner, neonMat);
    const in2 = createCylinderBetweenPoints(inTop, inRight, rInner, neonMat);
    const in3 = createCylinderBetweenPoints(inRight, inBottom, rInner, neonMat);
    const in4 = createCylinderBetweenPoints(inBottom, inLeft, rInner, neonMat);

    logoGroup.add(in1);
    logoGroup.add(in2);
    logoGroup.add(in3);
    logoGroup.add(in4);

    // NÃºcleo central de transaÃ§Ã£o (Esfera luminosa)
    const coreGeo = new THREE.SphereGeometry(0.28, 32, 32);
    const coreMat = new THREE.MeshStandardMaterial({
      color: 0x00f3ff,
      emissive: 0x00f3ff,
      emissiveIntensity: 2.0,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending
    });
    const coreMesh = new THREE.Mesh(coreGeo, coreMat);
    logoGroup.add(coreMesh);

    // Toros orbitais hologrÃ¡ficos
    const torusGeo1 = new THREE.TorusGeometry(1.9, 0.012, 12, 100);
    const torusMat1 = new THREE.MeshBasicMaterial({
      color: 0x00bdae,
      transparent: true,
      opacity: 0.35
    });
    const torus1 = new THREE.Mesh(torusGeo1, torusMat1);
    mainGroup.add(torus1);

    const torusGeo2 = new THREE.TorusGeometry(2.1, 0.008, 12, 100);
    const torusMat2 = new THREE.MeshBasicMaterial({
      color: 0x009ee3,
      transparent: true,
      opacity: 0.2
    });
    const torus2 = new THREE.Mesh(torusGeo2, torusMat2);
    torus2.rotation.x = Math.PI / 2.5;
    mainGroup.add(torus2);

    // Textura circular de glow para partÃ­culas
    const createGlowTexture = () => {
      const canvas = document.createElement("canvas");
      canvas.width = 64;
      canvas.height = 64;
      const ctx = canvas.getContext("2d");
      const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
      grad.addColorStop(0, "rgba(255, 255, 255, 1.0)");
      grad.addColorStop(0.2, "rgba(255, 255, 255, 0.8)");
      grad.addColorStop(0.5, "rgba(255, 255, 255, 0.2)");
      grad.addColorStop(1.0, "rgba(255, 255, 255, 0.0)");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 64, 64);
      return new THREE.CanvasTexture(canvas);
    };

    const glowTexture = createGlowTexture();

    // PartÃ­culas de fluxo
    const flowCount = 60;
    const flowGeo = new THREE.BufferGeometry();
    const flowPositions = new Float32Array(flowCount * 3);
    const flowColors = new Float32Array(flowCount * 3);

    const flowData = [];
    const colorMP = new THREE.Color(0x009ee3);
    const colorPix = new THREE.Color(0x00bdae);

    const updateFlowParticlePosition = (index, progress, angleOffset, heightOffset) => {
      const radius = 3.2 * (1.0 - progress) + 0.1;
      const angle = progress * Math.PI * 6 + angleOffset;
      flowPositions[index * 3] = Math.cos(angle) * radius;
      flowPositions[index * 3 + 1] = Math.sin(angle) * radius;
      flowPositions[index * 3 + 2] = (1.0 - progress) * 1.5 - 0.75 + heightOffset * (1.0 - progress);
    };

    for (let i = 0; i < flowCount; i++) {
      const progress = Math.random();
      const angleOffset = Math.random() * Math.PI * 2;
      const speed = 0.18 + Math.random() * 0.16;
      const heightOffset = (Math.random() - 0.5) * 1.2;

      flowData.push({ progress, angleOffset, speed, heightOffset });
      updateFlowParticlePosition(i, progress, angleOffset, heightOffset);

      const col = Math.random() > 0.4 ? colorPix : colorMP;
      flowColors[i * 3] = col.r;
      flowColors[i * 3 + 1] = col.g;
      flowColors[i * 3 + 2] = col.b;
    }

    flowGeo.setAttribute("position", new THREE.BufferAttribute(flowPositions, 3));
    flowGeo.setAttribute("color", new THREE.BufferAttribute(flowColors, 3));

    const flowMat = new THREE.PointsMaterial({
      size: 0.13,
      map: glowTexture,
      vertexColors: true,
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    const flowParticles = new THREE.Points(flowGeo, flowMat);
    mainGroup.add(flowParticles);

    // PartÃ­culas de explosÃ£o
    const explosionCount = 80;
    const explosionGeo = new THREE.BufferGeometry();
    const explosionPositions = new Float32Array(explosionCount * 3);
    const explosionColors = new Float32Array(explosionCount * 3);

    const explosionData = [];
    for (let i = 0; i < explosionCount; i++) {
      explosionData.push({
        x: 0.0,
        y: 0.0,
        z: 0.0,
        vx: 0.0,
        vy: 0.0,
        vz: 0.0,
        life: 0.0,
        maxLife: 1.0,
        col: new THREE.Color()
      });
      explosionPositions[i * 3] = 9999.0;
      explosionPositions[i * 3 + 1] = 9999.0;
      explosionPositions[i * 3 + 2] = 9999.0;

      explosionColors[i * 3] = 0;
      explosionColors[i * 3 + 1] = 0;
      explosionColors[i * 3 + 2] = 0;
    }

    explosionGeo.setAttribute("position", new THREE.BufferAttribute(explosionPositions, 3));
    explosionGeo.setAttribute("color", new THREE.BufferAttribute(explosionColors, 3));

    const explosionMat = new THREE.PointsMaterial({
      size: 0.18,
      map: glowTexture,
      vertexColors: true,
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    const explosionParticles = new THREE.Points(explosionGeo, explosionMat);
    mainGroup.add(explosionParticles);

    const triggerExplosion3D = (isSandboxMode) => {
      const expPosAttr = explosionParticles.geometry.attributes.position;
      const expColAttr = explosionParticles.geometry.attributes.color;

      for (let i = 0; i < explosionCount; i++) {
        const p = explosionData[i];
        p.x = 0.0;
        p.y = 0.0;
        p.z = 0.0;

        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(Math.random() * 2 - 1);
        const speed = 1.8 + Math.random() * 3.2;

        p.vx = Math.sin(phi) * Math.cos(theta) * speed;
        p.vy = Math.sin(phi) * Math.sin(theta) * speed;
        p.vz = Math.cos(phi) * speed;

        p.life = 1.0;
        p.maxLife = 0.6 + Math.random() * 0.7;

        const rand = Math.random();
        if (rand > 0.6) {
          p.col.setHex(0xffcb2b);
        } else if (isSandboxMode) {
          p.col.setHex(0x009ee3);
        } else {
          p.col.setHex(0x00bdae);
        }

        expColAttr.setXYZ(i, p.col.r, p.col.g, p.col.b);
      }
      expColAttr.needsUpdate = true;
      expPosAttr.needsUpdate = true;
    };

    // Luzes da Cena
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    const dirKeyLight = new THREE.DirectionalLight(0xffffff, 2.0);
    dirKeyLight.position.set(5, 5, 5);
    scene.add(dirKeyLight);

    const cyanLight = new THREE.DirectionalLight(0x00bdae, 2.5);
    cyanLight.position.set(-5, -3, 2);
    scene.add(cyanLight);

    const blueLight = new THREE.DirectionalLight(0x009ee3, 2.0);
    blueLight.position.set(4, 4, -2);
    scene.add(blueLight);

    let mouseX = 0;
    let mouseY = 0;
    let currentTiltX = 0;
    let currentTiltY = 0;

    const handleMouseMove = (event) => {
      const boundary = container.getBoundingClientRect();
      mouseX = (event.clientX - boundary.left) / boundary.width - 0.5;
      mouseY = (event.clientY - boundary.top) / boundary.height - 0.5;
    };

    const handleCanvasClick = (e) => {
      if (e) e.stopPropagation();
      simulatePayment();
    };

    window.addEventListener("mousemove", handleMouseMove);
    container.addEventListener("click", handleCanvasClick);

    let animationFrameId;
    let lastTime = Date.now();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      const currentTime = Date.now();
      const delta = (currentTime - lastTime) * 0.001;
      lastTime = currentTime;
      const timeSecs = currentTime * 0.001;

      const targetColor = isSandboxRef.current ? new THREE.Color(0x009ee3) : new THREE.Color(0x00bdae);
      neonMat.color.lerp(targetColor, 0.08);
      neonMat.emissive.lerp(targetColor, 0.08);
      coreMat.color.lerp(targetColor, 0.08);
      coreMat.emissive.lerp(targetColor, 0.08);
      torusMat1.color.lerp(targetColor, 0.08);

      if (transactionActiveRef.current) {
        pulseTimerRef.current *= 0.93;
        cameraShakeRef.current *= 0.92;

        if (pulseTimerRef.current < 0.01) {
          transactionActiveRef.current = false;
          pulseTimerRef.current = 0.0;
          cameraShakeRef.current = 0.0;
        }
      }

      if (cameraShakeRef.current > 0.01) {
        camera.position.x = (Math.random() - 0.5) * 0.14 * cameraShakeRef.current;
        camera.position.y = -0.2 + (Math.random() - 0.5) * 0.14 * cameraShakeRef.current;
        camera.position.z = 7.5 + (Math.random() - 0.5) * 0.14 * cameraShakeRef.current;
      } else {
        camera.position.set(0, -0.2, 7.5);
      }

      neonMat.emissiveIntensity = 1.2 + pulseTimerRef.current * 7.5;
      coreMat.emissiveIntensity = 2.0 + pulseTimerRef.current * 9.5;

      const coreScale = 1.0 + Math.sin(timeSecs * 4.5) * 0.07 + pulseTimerRef.current * 1.3;
      coreMesh.scale.set(coreScale, coreScale, coreScale);

      logoGroup.rotation.y = timeSecs * 0.45;
      logoGroup.rotation.x = Math.sin(timeSecs * 1.2) * 0.1;

      torus1.rotation.y = -timeSecs * 0.2;
      torus2.rotation.z = timeSecs * 0.35;

      currentTiltX += (mouseX - currentTiltX) * 0.08;
      currentTiltY += (mouseY - currentTiltY) * 0.08;
      mainGroup.rotation.x = currentTiltY * 0.45;
      mainGroup.rotation.y = currentTiltX * 0.45 + timeSecs * 0.08;

      const flowGeoAttr = flowParticles.geometry.attributes.position;
      for (let i = 0; i < flowCount; i++) {
        const p = flowData[i];
        p.progress += delta * p.speed;
        if (p.progress > 1.0) {
          p.progress = 0.0;
          p.angleOffset = Math.random() * Math.PI * 2;
        }
        updateFlowParticlePosition(i, p.progress, p.angleOffset, p.heightOffset);
      }
      flowGeoAttr.needsUpdate = true;

      const expPosAttr = explosionParticles.geometry.attributes.position;
      const expColAttr = explosionParticles.geometry.attributes.color;

      let expUpdated = false;
      for (let i = 0; i < explosionCount; i++) {
        const p = explosionData[i];
        if (p.life > 0.0) {
          p.life -= delta / p.maxLife;

          p.x += p.vx * delta;
          p.y += p.vy * delta;
          p.z += p.vz * delta;

          p.vx *= 0.94;
          p.vy *= 0.94;
          p.vz *= 0.94;

          explosionPositions[i * 3] = p.x;
          explosionPositions[i * 3 + 1] = p.y;
          explosionPositions[i * 3 + 2] = p.z;

          const opacity = Math.max(0.0, p.life);
          expColAttr.setXYZ(i, p.col.r * opacity, p.col.g * opacity, p.col.b * opacity);
          expUpdated = true;
        } else {
          explosionPositions[i * 3] = 9999.0;
        }
      }
      if (expUpdated || pulseTimerRef.current > 0.0) {
        expPosAttr.needsUpdate = true;
        expColAttr.needsUpdate = true;
      }

      if (transactionActiveRef.current && pulseTimerRef.current > 0.95) {
        triggerExplosion3D(isSandboxRef.current);
      }

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!container || !renderer.domElement) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("resize", handleResize);
      container.removeEventListener("click", handleCanvasClick);
      if (container && renderer.domElement && renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }

      scene.traverse((obj) => {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) {
          if (Array.isArray(obj.material)) {
            obj.material.forEach((mat) => mat.dispose());
          } else {
            obj.material.dispose();
          }
        }
      });
      scene.clear();
      renderer.dispose();
      studioEnvMap.dispose();
      glowTexture.dispose();
    };
  }, []);

  return (
    <div className="w-full h-full min-h-[400px] relative select-none">
      <div ref={containerRef} className="w-full h-full min-h-[400px] flex items-center justify-center relative bg-slate-950/20" />

      {/* HUD - Telemetria do Pix */}
      <div className="absolute top-4 left-4 z-10 w-64 p-4 rounded-xl border border-slate-700/30 bg-slate-900/60 backdrop-blur-md text-xs font-mono text-slate-300 pointer-events-none select-none transition-all duration-300 group-hover:border-[#00bdae]/30 shadow-lg">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2">
          <span className="text-[#00bdae] font-bold tracking-widest uppercase">PIX CORE ENGINE</span>
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
        </div>

        <div className="space-y-1.5">
          <div className="flex justify-between">
            <span className="text-slate-500">REDE:</span>
            <span className={`font-bold transition-all duration-300 ${isSandbox ? "text-amber-400" : "text-[#00bdae]"}`}>
              {isSandbox ? "SANDBOX (HOMOLOG)" : "PRODUCTION (LIVE)"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">LATÃŠNCIA DA API:</span>
            <span className="text-slate-200 font-bold">{telemetry.latency} ms</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">VALOR INTEGRADO:</span>
            <span className="text-slate-200 font-bold">
              R$ {telemetry.processedVolume.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">CONEXÃƒO:</span>
            <span className="text-emerald-400 font-bold">100% OPERACIONAL</span>
          </div>
          <div className="flex justify-between border-t border-slate-800/50 pt-1.5 text-[9px] text-amber-500/90 font-bold">
            <span>MODO:</span>
            <span className="uppercase tracking-wider">VALORES FICTÃCIOS</span>
          </div>
        </div>

        {/* HistÃ³rico recente */}
        <div className="mt-3 pt-2 border-t border-slate-800 space-y-1 text-[10px] text-slate-400">
          <div className="text-[9px] uppercase tracking-wider text-[#ff6b00] font-bold">Ãšltimas LiquidaÃ§Ãµes</div>
          <div className="h-16 overflow-hidden flex flex-col justify-end space-y-1 font-mono">
            {telemetry.txHistory.map((tx, idx) => (
              <div key={idx} className="flex justify-between items-center text-[9px] border-b border-slate-800/10 pb-0.5">
                <span className="text-[#00f3ff]">{tx.id}</span>
                <span className="text-slate-300 font-semibold">R$ {tx.amount}</span>
                <span className="font-bold text-emerald-400">{tx.status}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Controles de SimulaÃ§Ã£o */}
      <div className="absolute bottom-4 right-4 z-10 flex gap-2">
        <button
          onClick={(e) => {
            e.stopPropagation();
            simulatePayment();
          }}
          className="px-4 py-2 bg-slate-900/80 hover:bg-[#00bdae]/20 border border-[#00bdae]/30 hover:border-[#00bdae]/80 rounded-lg text-xs font-mono text-[#00bdae] hover:text-[#00f3ff] font-semibold tracking-wider transition-all duration-300 active:scale-95 shadow-md flex items-center gap-1.5 backdrop-blur-sm cursor-pointer"
          title="Simula o recebimento de um pagamento via Pix"
        >
          <span className="w-2 h-2 rounded-full bg-[#00bdae] animate-pulse"></span>
          SIMULAR VENDA
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleNetwork();
          }}
          className={`px-4 py-2 bg-slate-900/80 border rounded-lg text-xs font-mono font-semibold tracking-wider transition-all duration-300 active:scale-95 shadow-md flex items-center gap-1.5 backdrop-blur-sm cursor-pointer ${
            isSandbox
              ? "text-amber-300 border-amber-500/50 hover:bg-amber-900/30 hover:border-amber-500"
              : "text-[#009ee3] border-[#009ee3]/30 hover:bg-cyan-900/30 hover:border-[#009ee3]"
          }`}
          title="Alterna o ambiente entre ProduÃ§Ã£o e Sandbox"
        >
          <span className={`w-2 h-2 rounded-full ${isSandbox ? "bg-amber-400" : "bg-[#009ee3]"}`}></span>
          REDE: {isSandbox ? "SANDBOX" : "PRODUCTION"}
        </button>
      </div>

      <div className="absolute bottom-4 left-4 z-10 pointer-events-none select-none text-[10px] font-mono text-slate-500 bg-slate-950/60 px-2 py-1.5 rounded flex flex-col gap-0.5 border border-slate-800/40">
        <span>* Clique na tela para pagar | Movimente o mouse para inclinar o portal 3D</span>
