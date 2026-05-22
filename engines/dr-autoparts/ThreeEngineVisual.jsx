import { useState, useEffect, useRef } from "react";
import * as THREE from "three";

/**
 * ThreeEngineVisual — Simulação 3D de Freio a Disco Dr. Auto Parts
 * @author Vincent AI Studios
 * @license MIT
 */
function ThreeEngineVisual() {
  const containerRef = useRef(null);
  const [telemetry, setTelemetry] = useState({
    temp: 24,
    rpm: 380,
    psi: 0,
    status: "STANDBY",
    statusColor: "text-[#00f3ff]"
  });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Clear any previous elements to avoid duplication (e.g. during React StrictMode)
    container.innerHTML = "";

    // Simulation variables
    let isBraking = false;
    let isLocked = false;
    let brakeTemp = 24.0;
    let rotationSpeed = 0.035;
    let targetRotationSpeed = 0.035;
    let brakePressure = 0.0;
    let lockTimer = 0;

    // 1. Procedural Studio EnvMap (Provides realistic metal and lacquer reflections)
    const createStudioEnvMap = () => {
      const canvas = document.createElement("canvas");
      canvas.width = 512;
      canvas.height = 256;
      const ctx = canvas.getContext("2d");

      // Dark background gradient
      const grad = ctx.createLinearGradient(0, 0, 512, 0);
      grad.addColorStop(0, "#030305");
      grad.addColorStop(0.18, "#101622");
      grad.addColorStop(0.28, "#ffffff"); // Bright light panel 1
      grad.addColorStop(0.38, "#101622");
      grad.addColorStop(0.5, "#030305");
      grad.addColorStop(0.62, "#0b203c"); // Soft blue ambient highlight
      grad.addColorStop(0.72, "#ffffff"); // Bright light panel 2
      grad.addColorStop(0.85, "#0d0f14");
      grad.addColorStop(1, "#030305");

      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 512, 256);

      // Neon cyan reflection ring
      ctx.fillStyle = "rgba(0, 243, 255, 0.06)";
      ctx.fillRect(0, 100, 512, 40);

      // Neon orange reflection ring
      ctx.fillStyle = "rgba(255, 107, 0, 0.05)";
      ctx.fillRect(0, 160, 512, 30);

      const texture = new THREE.CanvasTexture(canvas);
      texture.mapping = THREE.EquirectangularReflectionMapping;
      return texture;
    };

    // 2. Procedural Brushed Steel Base Map for the rotor face
    const createBrushedSteelTexture = () => {
      const canvas = document.createElement("canvas");
      canvas.width = 512;
      canvas.height = 512;
      const ctx = canvas.getContext("2d");

      const cx = 256;
      const cy = 256;

      // Base jateada de ferro fundido nas bordas nÃ£o polidas (centro e extremidades)
      ctx.fillStyle = "#1e2226";
      ctx.fillRect(0, 0, 512, 512);

      // Pista de frenagem (Sweep Area): Polida e metalizada
      const sweepRadiusMax = 246;
      const sweepRadiusMin = 98;
      
      // Desenha o fundo de metal polido para a Sweep Area
      ctx.beginPath();
      ctx.arc(cx, cy, sweepRadiusMax, 0, Math.PI * 2);
      ctx.fillStyle = "#9ba4b0";
      ctx.fill();

      ctx.beginPath();
      ctx.arc(cx, cy, sweepRadiusMin, 0, Math.PI * 2);
      ctx.fillStyle = "#1e2226"; // Miolo volta a ser ferro fundido
      ctx.fill();

      // Lathe concentric micro-grooves inside the Sweep Area
      for (let r = sweepRadiusMin; r < sweepRadiusMax; r += 0.4 + Math.random() * 1.6) {
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        const gray = 110 + Math.random() * 85;
        const alpha = 0.07 + Math.random() * 0.16;
        ctx.strokeStyle = `rgba(${gray}, ${gray}, ${gray + 10}, ${alpha})`;
        ctx.lineWidth = 0.35 + Math.random() * 0.9;
        ctx.stroke();
      }

      // Radial wear micro-scratches from brake dust and pads
      for (let i = 0; i < 200; i++) {
        const angle = (i / 200) * Math.PI * 2 + Math.random() * 0.05;
        const r1 = sweepRadiusMin + Math.random() * 15;
        const r2 = sweepRadiusMax - Math.random() * 15;
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(angle) * r1, cy + Math.sin(angle) * r1);
        ctx.lineTo(cx + Math.cos(angle) * r2, cy + Math.sin(angle) * r2);
        ctx.strokeStyle = `rgba(255, 255, 255, ${0.01 + Math.random() * 0.035})`;
        ctx.lineWidth = 0.3 + Math.random() * 0.55;
        ctx.stroke();
      }

      const texture = new THREE.CanvasTexture(canvas);
      return texture;
    };

    // 3. Procedural Brushed Steel Roughness Map for light anisotropy
    const createBrushedSteelRoughness = () => {
      const canvas = document.createElement("canvas");
      canvas.width = 512;
      canvas.height = 512;
      const ctx = canvas.getContext("2d");

      // Default high roughness for cast iron sections (hat center and extreme border)
      ctx.fillStyle = "#a8a8a8"; // Roughness = ~0.65
      ctx.fillRect(0, 0, 512, 512);

      const cx = 256;
      const cy = 256;
      const sweepRadiusMax = 246;
      const sweepRadiusMin = 98;

      // Friction area: Much smoother, metallic polish (base roughness = ~0.15)
      ctx.beginPath();
      ctx.arc(cx, cy, sweepRadiusMax, 0, Math.PI * 2);
      ctx.fillStyle = "#262626"; // low roughness
      ctx.fill();

      ctx.beginPath();
      ctx.arc(cx, cy, sweepRadiusMin, 0, Math.PI * 2);
      ctx.fillStyle = "#a8a8a8"; // inner hat area goes back to rough
      ctx.fill();

      // Variations in grooves (grooves are rougher than the polished surface)
      for (let r = sweepRadiusMin; r < sweepRadiusMax; r += 0.8 + Math.random() * 2) {
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        const grayVal = Math.floor(45 + Math.random() * 75);
        ctx.strokeStyle = `rgb(${grayVal}, ${grayVal}, ${grayVal})`;
        ctx.lineWidth = 0.4 + Math.random() * 1.1;
        ctx.stroke();
      }

      const texture = new THREE.CanvasTexture(canvas);
      return texture;
    };

    // Setup Scene, Camera, and WebGL Renderer
    const scene = new THREE.Scene();
    const rect = container.getBoundingClientRect();
    const width = (rect.width > 0 && rect.width < 800) ? rect.width : 500;
    const height = (rect.height > 0 && rect.height < 500) ? rect.height : 360;

    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    camera.position.set(0, -0.2, 9.0); // Detailed direct perspective view

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Enable high-fidelity shadows
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    renderer.domElement.style.display = "block";
    renderer.domElement.style.cursor = "pointer"; // cursor indicating clickability
    container.appendChild(renderer.domElement);

    // Parent group (tilts on mouse hover)
    const mainGroup = new THREE.Group();
    scene.add(mainGroup);

    // Dynamic environmental map
    const studioEnvMap = createStudioEnvMap();
    scene.environment = studioEnvMap;

    // Disc rotation group
    const discGroup = new THREE.Group();
    mainGroup.add(discGroup);

    // Procedural textures
    const brushedSteelTex = createBrushedSteelTexture();
    const brushedSteelRoughnessTex = createBrushedSteelRoughness();

    // 4. Materials Setup (PBR Metallic Roughness workflow)
    const castIronMat = new THREE.MeshStandardMaterial({
      color: 0x22262a, // Dark rough steel
      metalness: 0.8,
      roughness: 0.65,
      envMap: studioEnvMap,
      envMapIntensity: 0.6
    });

    const polishedMetalMat = new THREE.MeshStandardMaterial({
      color: 0xe0e5eb,
      metalness: 0.95,
      roughness: 0.22,
      envMap: studioEnvMap,
      envMapIntensity: 1.3
    });

    // Rotor disc surface material with friction texture, roughness map, and thermal emissive support
    const frictionPlateMatFront = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      map: brushedSteelTex,
      bumpMap: brushedSteelTex,
      bumpScale: 0.007,
      roughnessMap: brushedSteelRoughnessTex,
      metalness: 0.96,
      envMap: studioEnvMap,
      envMapIntensity: 1.6,
      emissive: new THREE.Color(0x000000),
      emissiveIntensity: 0.0
    });

    const frictionPlateMatBack = frictionPlateMatFront.clone(); // Separate back plate material for thermal variations

    // 5. Ventilated Double Rotor Geometry (Front face, Back face, and Cooling Vanes)
    const discThickness = 0.035;
    const discRadius = 2.7;

    // Front plate
    const rotorPlateFrontGeo = new THREE.CylinderGeometry(discRadius, discRadius, discThickness, 64);
    const rotorPlateFront = new THREE.Mesh(rotorPlateFrontGeo, [castIronMat, frictionPlateMatFront, frictionPlateMatFront]);
    rotorPlateFront.rotation.x = Math.PI / 2;
    rotorPlateFront.position.z = 0.055;
    rotorPlateFront.castShadow = true;
    rotorPlateFront.receiveShadow = true;
    discGroup.add(rotorPlateFront);

    // Back plate
    const rotorPlateBackGeo = new THREE.CylinderGeometry(discRadius, discRadius, discThickness, 64);
    const rotorPlateBack = new THREE.Mesh(rotorPlateBackGeo, [castIronMat, frictionPlateMatBack, frictionPlateMatBack]);
    rotorPlateBack.rotation.x = Math.PI / 2;
    rotorPlateBack.position.z = -0.055;
    rotorPlateBack.castShadow = true;
    rotorPlateBack.receiveShadow = true;
    discGroup.add(rotorPlateBack);

    // Internal curved cooling vanes (Vanes situated inside the ventilated core)
    const vaneCount = 36;
    const vaneGroup = new THREE.Group();
    discGroup.add(vaneGroup);

    const vaneGeo = new THREE.BoxGeometry(0.045, 0.75, 0.075);
    for (let i = 0; i < vaneCount; i++) {
      const angle = (i / vaneCount) * Math.PI * 2;
      const radius = 1.85;

      const vane = new THREE.Mesh(vaneGeo, castIronMat);
      // Position vanes radially between the front and back plates
      vane.position.set(Math.cos(angle) * radius, Math.sin(angle) * radius, 0);
      // Curve alignment
      vane.rotation.z = angle + 0.35; // curved cooling vane aesthetic
      vaneGroup.add(vane);
    }

    // 6. Central Rotor Hat (Hub Core)
    const hubHatGeo = new THREE.CylinderGeometry(0.96, 1.06, 0.44, 32);
    const hubHat = new THREE.Mesh(hubHatGeo, castIronMat);
    hubHat.rotation.x = Math.PI / 2;
    hubHat.position.z = 0.22;
    hubHat.castShadow = true;
    hubHat.receiveShadow = true;
    discGroup.add(hubHat);

    // 7. Five Hex Bolts with Washers
    const washerGeo = new THREE.CylinderGeometry(0.14, 0.14, 0.025, 16);
    const washerMat = new THREE.MeshStandardMaterial({
      color: 0x6e7379,
      metalness: 0.9,
      roughness: 0.35,
      envMap: studioEnvMap
    });

    const boltHexGeo = new THREE.CylinderGeometry(0.09, 0.09, 0.13, 6); // Hexagonal shape (6 sides)
    const chromeMat = new THREE.MeshStandardMaterial({
      color: 0xf5f8fa,
      metalness: 0.98,
      roughness: 0.08,
      envMap: studioEnvMap,
      envMapIntensity: 1.5
    });

    for (let i = 0; i < 5; i++) {
      const angle = (i / 5) * Math.PI * 2;
      const r = 0.56;
      const x = Math.cos(angle) * r;
      const y = Math.sin(angle) * r;

      const washer = new THREE.Mesh(washerGeo, washerMat);
      washer.position.set(x, y, 0.45);
      washer.rotation.x = Math.PI / 2;
      washer.castShadow = true;
      discGroup.add(washer);

      const bolt = new THREE.Mesh(boltHexGeo, chromeMat);
      bolt.position.set(x, y, 0.51);
      bolt.rotation.x = Math.PI / 2;
      bolt.rotation.y = Math.random() * Math.PI; // Randomized bolt angle
      bolt.castShadow = true;
      discGroup.add(bolt);
    }

    // 8. Sports Drilled Ventilation Holes (Radial spiral pattern on both sides)
    const holeGeo = new THREE.CylinderGeometry(0.042, 0.042, 0.22, 12);
    const holeIntMat = new THREE.MeshStandardMaterial({
      color: 0x0c0d0f, // Dark shadows inside drilled holes
      roughness: 0.9,
      metalness: 0.1
    });

    const holeChamferFrontGeo = new THREE.TorusGeometry(0.044, 0.007, 4, 12);
    const holeChamferBackGeo = new THREE.TorusGeometry(0.044, 0.007, 4, 12);

    for (let radius = 1.35; radius <= 2.35; radius += 0.33) {
      const count = Math.floor(radius * 10);
      for (let i = 0; i < count; i++) {
        const angle = (i / count) * Math.PI * 2 + (radius * 1.3); // spiral offsets
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;

        // Visual hole cavity mesh
        const hole = new THREE.Mesh(holeGeo, holeIntMat);
        hole.position.set(x, y, 0);
        hole.rotation.x = Math.PI / 2;
        discGroup.add(hole);

        // Front face hole chamfer rings
        const chamferFront = new THREE.Mesh(holeChamferFrontGeo, polishedMetalMat);
        chamferFront.position.set(x, y, 0.0725);
        discGroup.add(chamferFront);

        // Back face hole chamfer rings
        const chamferBack = new THREE.Mesh(holeChamferBackGeo, polishedMetalMat);
        chamferBack.position.set(x, y, -0.0725);
        chamferBack.rotation.y = Math.PI;
        discGroup.add(chamferBack);
      }
    }

    // 9. Slotted Performance Rotor Grooves
    const slotGeo = new THREE.BoxGeometry(0.038, 0.65, 0.016);
    const slotMat = new THREE.MeshStandardMaterial({
      color: 0x1a1c1f,
      metalness: 0.85,
      roughness: 0.45
    });

    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const r = 1.88;

      const slotFront = new THREE.Mesh(slotGeo, slotMat);
      slotFront.position.set(Math.cos(angle) * r, Math.sin(angle) * r, 0.072);
      slotFront.rotation.z = angle + 0.45;
      slotFront.castShadow = true;
      slotFront.receiveShadow = true;
      discGroup.add(slotFront);

      const slotBack = slotFront.clone();
      slotBack.position.z = -0.072;
      slotBack.rotation.z = angle - 0.45;
      discGroup.add(slotBack);
    }

    // Chrome Center Cap & Lock Nut
    const centerCapGeo = new THREE.CylinderGeometry(0.38, 0.38, 0.16, 24);
    const centerCap = new THREE.Mesh(centerCapGeo, polishedMetalMat);
    centerCap.rotation.x = Math.PI / 2;
    centerCap.position.z = 0.43;
    centerCap.castShadow = true;
    discGroup.add(centerCap);

    const axleLockNutGeo = new THREE.CylinderGeometry(0.14, 0.14, 0.12, 6);
    const axleLockNut = new THREE.Mesh(axleLockNutGeo, castIronMat);
    axleLockNut.rotation.x = Math.PI / 2;
    axleLockNut.position.z = 0.51;
    discGroup.add(axleLockNut);

    // 10. High-Performance 6-Piston Caliper (Performance Orange Lacquer)
    const caliperGroup = new THREE.Group();
    const placementAngle = Math.PI / 4.2; // 2 o'clock position
    caliperGroup.position.set(Math.cos(placementAngle) * 2.46, Math.sin(placementAngle) * 2.46, 0);
    caliperGroup.rotation.z = placementAngle;

    const caliperLacquerMat = new THREE.MeshStandardMaterial({
      color: 0xff4b00, // Rich high performance orange HSL token
      metalness: 0.75,
      roughness: 0.12,
      envMap: studioEnvMap,
      envMapIntensity: 1.5
    });

    // Sculpted caliper body (composing curves with modular boxes and cylinders)
    const bodyFrontMainGeo = new THREE.BoxGeometry(0.35, 1.7, 0.28);
    const bodyFrontMain = new THREE.Mesh(bodyFrontMainGeo, caliperLacquerMat);
    bodyFrontMain.position.set(0.2, 0, 0.23);
    bodyFrontMain.castShadow = true;
    bodyFrontMain.receiveShadow = true;
    caliperGroup.add(bodyFrontMain);

    const bodyBackMain = new THREE.Mesh(bodyFrontMainGeo, caliperLacquerMat);
    bodyBackMain.position.set(0.2, 0, -0.23);
    bodyBackMain.castShadow = true;
    bodyBackMain.receiveShadow = true;
    caliperGroup.add(bodyBackMain);

    // Curved front aerodynamic ridges
    const ridgeGeo = new THREE.CylinderGeometry(0.08, 0.08, 1.3, 12);
    const ridgeFront = new THREE.Mesh(ridgeGeo, caliperLacquerMat);
    ridgeFront.position.set(0.36, 0, 0.23);
    ridgeFront.castShadow = true;
    caliperGroup.add(ridgeFront);

    const ridgeBack = ridgeFront.clone();
    ridgeBack.position.set(0.36, 0, -0.23);
    caliperGroup.add(ridgeBack);

    // Caliper Bridges (Top, Bottom, Middle structure clamping over the rotor)
    const bridgeTopGeo = new THREE.BoxGeometry(0.55, 0.32, 0.72);
    const bridgeTop = new THREE.Mesh(bridgeTopGeo, caliperLacquerMat);
    bridgeTop.position.set(0.1, 0.7, 0);
    bridgeTop.castShadow = true;
    caliperGroup.add(bridgeTop);

    const bridgeBottom = bridgeTop.clone();
    bridgeBottom.position.set(0.1, -0.7, 0);
    caliperGroup.add(bridgeBottom);

    const bridgeMidGeo = new THREE.BoxGeometry(0.48, 0.2, 0.72);
    const bridgeMid = new THREE.Mesh(bridgeMidGeo, caliperLacquerMat);
    bridgeMid.position.set(0.13, 0, 0);
    bridgeMid.castShadow = true;
    caliperGroup.add(bridgeMid);

    // Caliper mounting bolts
    const mountBoltGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.28, 16);
    const mountBolt1 = new THREE.Mesh(mountBoltGeo, castIronMat);
    mountBolt1.position.set(0.05, 0.65, -0.38);
    mountBolt1.rotation.x = Math.PI / 2;
    caliperGroup.add(mountBolt1);

    const mountBolt2 = mountBolt1.clone();
    mountBolt2.position.y = -0.65;
    caliperGroup.add(mountBolt2);

    // 11. Brake Pad Assembly (Floating components that clamp under hydraulic pressure)
    const padBackingMat = new THREE.MeshStandardMaterial({
      color: 0x33353a, // Dark steel backing plate
      metalness: 0.8,
      roughness: 0.5
    });

    const frictionPadMat = new THREE.MeshStandardMaterial({
      color: 0x4a4d53, // Abrasive carbon pad composite
      metalness: 0.2,
      roughness: 0.85
    });

    // Front Brake Pad
    const padFrontGroup = new THREE.Group();
    const padBackingFront = new THREE.Mesh(new THREE.BoxGeometry(0.07, 1.25, 0.05), padBackingMat);
    padBackingFront.position.set(0, 0, 0.025);
    const padFrictionFront = new THREE.Mesh(new THREE.BoxGeometry(0.07, 1.15, 0.05), frictionPadMat);
    padFrictionFront.position.set(-0.02, 0, -0.025);
    padFrontGroup.add(padBackingFront);
    padFrontGroup.add(padFrictionFront);
    padFrontGroup.position.set(0.055, 0, 0.08); // resting position
    caliperGroup.add(padFrontGroup);

    // Back Brake Pad
    const padBackGroup = new THREE.Group();
    const padBackingBack = padBackingFront.clone();
    padBackingBack.position.set(0, 0, -0.025);
    const padFrictionBack = padFrictionFront.clone();
    padFrictionBack.position.set(-0.02, 0, 0.025);
    padBackGroup.add(padBackingBack);
    padBackGroup.add(padFrictionBack);
    padBackGroup.position.set(0.055, 0, -0.08); // resting position
    caliperGroup.add(padBackGroup);

    // Pad retention clip/pins
    const pinGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.74, 8);
    const clipPin1 = new THREE.Mesh(pinGeo, chromeMat);
    clipPin1.position.set(0.24, 0.42, 0);
    clipPin1.rotation.x = Math.PI / 2;
    caliperGroup.add(clipPin1);

    const clipPin2 = clipPin1.clone();
    clipPin2.position.y = -0.42;
    caliperGroup.add(clipPin2);

    // 12. Six Hydraulic Pistons (3 per side, chromed metal cylinder cylinders that push pads)
    const pistonGeoSmall = new THREE.CylinderGeometry(0.08, 0.08, 0.16, 16);
    const pistonGeoLarge = new THREE.CylinderGeometry(0.11, 0.11, 0.16, 16);

    const frontPistons = [];
    const backPistons = [];

    // Front pistons
    const fp1 = new THREE.Mesh(pistonGeoSmall, chromeMat);
    fp1.position.set(0.18, 0.38, 0.165);
    fp1.rotation.x = Math.PI / 2;
    caliperGroup.add(fp1);
    frontPistons.push(fp1);

    const fp2 = new THREE.Mesh(pistonGeoLarge, chromeMat);
    fp2.position.set(0.18, 0.0, 0.165);
    fp2.rotation.x = Math.PI / 2;
    caliperGroup.add(fp2);
    frontPistons.push(fp2);

    const fp3 = new THREE.Mesh(pistonGeoSmall, chromeMat);
    fp3.position.set(0.18, -0.38, 0.165);
    fp3.rotation.x = Math.PI / 2;
    caliperGroup.add(fp3);
    frontPistons.push(fp3);

    // Back pistons
    const bp1 = new THREE.Mesh(pistonGeoSmall, chromeMat);
    bp1.position.set(0.18, 0.38, -0.165);
    bp1.rotation.x = -Math.PI / 2;
    caliperGroup.add(bp1);
    backPistons.push(bp1);

    const bp2 = new THREE.Mesh(pistonGeoLarge, chromeMat);
    bp2.position.set(0.18, 0.0, -0.165);
    bp2.rotation.x = -Math.PI / 2;
    caliperGroup.add(bp2);
    backPistons.push(bp2);

    const bp3 = new THREE.Mesh(pistonGeoSmall, chromeMat);
    bp3.position.set(0.18, -0.38, -0.165);
    bp3.rotation.x = -Math.PI / 2;
    caliperGroup.add(bp3);
    backPistons.push(bp3);

    // Caliper Carbon Logo Backing Plate
    const logoPlateGeo = new THREE.BoxGeometry(0.04, 1.1, 0.22);
    const logoPlateMat = new THREE.MeshStandardMaterial({
      color: 0x0b0d10, // Matte black carbon background
      metalness: 0.9,
      roughness: 0.15
    });
    const logoPlate = new THREE.Mesh(logoPlateGeo, logoPlateMat);
    logoPlate.position.set(0.395, 0, 0.23);
    caliperGroup.add(logoPlate);

    // Logo text canvas "DR. AUTO PARTS"
    const textCanvas = document.createElement("canvas");
    textCanvas.width = 256;
    textCanvas.height = 64;
    const textCtx = textCanvas.getContext("2d");
    textCtx.fillStyle = "#0b0d10";
    textCtx.fillRect(0, 0, 256, 64);
    textCtx.font = "900 24px sans-serif";
    textCtx.fillStyle = "#ffffff";
    textCtx.textAlign = "center";
    textCtx.textBaseline = "middle";
    textCtx.fillText("DR. AUTO PARTS", 128, 32);

    // Decorative racing stripes on caliper logo
    textCtx.fillStyle = "#ff4b00";
    textCtx.fillRect(10, 28, 16, 8);
    textCtx.fillRect(230, 28, 16, 8);

    const logoTex = new THREE.CanvasTexture(textCanvas);
    const logoPlaneMat = new THREE.MeshStandardMaterial({
      map: logoTex,
      metalness: 0.5,
      roughness: 0.3
    });
    const logoPlaneGeo = new THREE.PlaneGeometry(0.2, 0.9);
    const logoPlane = new THREE.Mesh(logoPlaneGeo, logoPlaneMat);
    logoPlane.position.set(0.42, 0, 0.23);
    logoPlane.rotation.y = Math.PI / 2;
    logoPlane.rotation.z = -Math.PI / 2; // vertical label
    caliperGroup.add(logoPlane);

    // Copper cross-over hydraulic fluid line run
    const copperPipeGeo = new THREE.CylinderGeometry(0.015, 0.015, 1.25, 8);
    const copperMat = new THREE.MeshStandardMaterial({
      color: 0xc87d38, // Metallic copper
      metalness: 0.95,
      roughness: 0.15,
      envMap: studioEnvMap
    });
    const copperPipe = new THREE.Mesh(copperPipeGeo, copperMat);
    copperPipe.position.set(0.2, 0, -0.395);
    caliperGroup.add(copperPipe);

    mainGroup.add(caliperGroup); // Caliper moves/tilts with mouse, stays static when disc spins

    // 13. Telemetry Digital Rings (Electric accents)
    const innerRingGeo = new THREE.TorusGeometry(3.1, 0.01, 8, 120);
    const innerRingMat = new THREE.MeshBasicMaterial({
      color: 0x00f3ff, // Electric Cyan HSL
      transparent: true,
      opacity: 0.4
    });
    const innerRing = new THREE.Mesh(innerRingGeo, innerRingMat);
    mainGroup.add(innerRing);

    const outerRingGeo = new THREE.TorusGeometry(3.4, 0.008, 8, 120);
    const outerRingMat = new THREE.MeshBasicMaterial({
      color: 0xff4b00, // Performance Orange HSL
      transparent: true,
      opacity: 0.25
    });
    const outerRing = new THREE.Mesh(outerRingGeo, outerRingMat);
    outerRing.rotation.x = Math.PI / 2.7;
    mainGroup.add(outerRing);

    // Setup detailed scene lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    const directionalKeyLight = new THREE.DirectionalLight(0xffffff, 2.5);
    directionalKeyLight.position.set(6, 8, 7);
    directionalKeyLight.castShadow = true;
    directionalKeyLight.shadow.mapSize.width = 1024;
    directionalKeyLight.shadow.mapSize.height = 1024;
    directionalKeyLight.shadow.camera.near = 0.5;
    directionalKeyLight.shadow.camera.far = 25;
    directionalKeyLight.shadow.camera.left = -4;
    directionalKeyLight.shadow.camera.right = 4;
    directionalKeyLight.shadow.camera.top = 4;
    directionalKeyLight.shadow.camera.bottom = -4;
    directionalKeyLight.shadow.bias = -0.0006;
    scene.add(directionalKeyLight);

    // Cyan accent light (glow from lower left)
    const cyanAccentLight = new THREE.DirectionalLight(0x00f3ff, 2.2);
    cyanAccentLight.position.set(-6, -4, 3);
    scene.add(cyanAccentLight);

    // Orange accent light (glow from upper right back)
    const orangeAccentLight = new THREE.DirectionalLight(0xff4b00, 2.0);
    orangeAccentLight.position.set(4, 5, -3);
    scene.add(orangeAccentLight);

    // Soft fill light
    const pointFillLight = new THREE.PointLight(0xffffff, 1.2, 12);
    pointFillLight.position.set(0, -3, 45);
    scene.add(pointFillLight);

    // Interaction mouse handler
    let mouseX = 0;
    let mouseY = 0;
    let currentTiltX = 0;
    let currentTiltY = 0;

    const handleMouseMove = (event) => {
      const boundary = container.getBoundingClientRect();
      mouseX = ((event.clientX - boundary.left) / boundary.width) - 0.5;
      mouseY = ((event.clientY - boundary.top) / boundary.height) - 0.5;
    };

    const handleCanvasClick = (e) => {
      if (e) {
        e.stopPropagation();
      }
      // Trigger hydraulic braking cycle
      if (!isBraking) {
        isBraking = true;
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    container.addEventListener("click", handleCanvasClick);

    // Animation & Physics loops
    let animationFrameId;
    let frameCount = 0;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      // 14. Physics Cycle (Rotational deceleration, heat generation, mechanical clamp)
      if (isBraking) {
        // Clamp down brake pressure
        brakePressure += (1.0 - brakePressure) * 0.22;
        
        // Decelerate rotation rapidly
        rotationSpeed += (0.0 - rotationSpeed) * 0.085;

        // Kinetic friction translates to thermal energy (heat rotor)
        const frictionWork = rotationSpeed * 1550.0;
        brakeTemp += frictionWork;
        if (brakeTemp > 720.0) brakeTemp = 720.0; // Peak sports rotor thermal capacity

        // Locking point
        if (rotationSpeed < 0.0008) {
          rotationSpeed = 0.0;
          if (!isLocked) {
            isLocked = true;
            lockTimer = Date.now();
          }

          // Locked state: hold calipers closed for 1.3 seconds
          if (Date.now() - lockTimer > 1300) {
            isBraking = false;
            isLocked = false;
          }
        }
      } else {
        // Release caliper pressure
        brakePressure += (0.0 - brakePressure) * 0.12;

        // Thermal radiation / convection (cool down back to ambient 24Â°C)
        brakeTemp += (24.0 - brakeTemp) * 0.0075;

        // Safely resume spinning after heat index drops
        if (brakeTemp < 480.0) {
          rotationSpeed += (0.035 - rotationSpeed) * 0.03;
        }
      }

      // Rotate sports brake disc
      discGroup.rotation.z += rotationSpeed;

      // Telemetry ring orbits
      innerRing.rotation.z -= 0.004;
      outerRing.rotation.y += 0.0055;

      // 15. Dynamic Caliper Compression & Mechanical displacements
      // Caliper assembly flexes sutilly under load
      caliperGroup.position.x = (Math.cos(placementAngle) * 2.46) - (brakePressure * 0.015);
      caliperGroup.position.y = (Math.sin(placementAngle) * 2.46) - (brakePressure * 0.015);

      // Brake pads squeeze closer to disc
      padFrontGroup.position.z = 0.08 - (brakePressure * 0.008);
      padBackGroup.position.z = -0.08 + (brakePressure * 0.008);

      // Chromed pistons eject from housing cylinders pushing pads
      frontPistons.forEach((piston) => {
        piston.position.z = 0.165 - (brakePressure * 0.024);
      });
      backPistons.forEach((piston) => {
        piston.position.z = -0.165 + (brakePressure * 0.024);
      });

      // 16. Rotor Glow (Thermal luminescence)
      // Visual temperature curve (rotor starts glowing red above 140Â°C)
      const glowScale = Math.max(0.0, (brakeTemp - 140) / 580);
      if (glowScale > 0) {
        // Red-orange incandescence on front friction face
        frictionPlateMatFront.emissive.setRGB(glowScale * 0.95, glowScale * 0.15, 0.0);
        frictionPlateMatFront.emissiveIntensity = glowScale * 4.6;

        // Red-orange incandescence on back friction face
        frictionPlateMatBack.emissive.setRGB(glowScale * 0.95, glowScale * 0.15, 0.0);
        frictionPlateMatBack.emissiveIntensity = glowScale * 4.6;
      } else {
        frictionPlateMatFront.emissive.setRGB(0, 0, 0);
        frictionPlateMatFront.emissiveIntensity = 0;
        frictionPlateMatBack.emissive.setRGB(0, 0, 0);
        frictionPlateMatBack.emissiveIntensity = 0;
      }

      // 17. Tilt lag interpolation (Mouse visual parallax)
      currentTiltX += (mouseX - currentTiltX) * 0.08;
      currentTiltY += (mouseY - currentTiltY) * 0.08;

      mainGroup.rotation.x = currentTiltY * 0.9;
      mainGroup.rotation.y = currentTiltX * 0.9 + (Date.now() * 0.00035); // Constant slow cinematic drift

      renderer.render(scene, camera);

      // 18. Telemetry React State updates (Throttled to run every 8 frames for efficiency)
      frameCount++;
      if (frameCount % 8 === 0) {
        let statusStr = "ESTÃVEL";
        let statusColorClass = "text-[#00f3ff]";
        if (isBraking) {
          statusStr = rotationSpeed > 0.001 ? "FRENAGEM ATIVA" : "BLOQUEADO";
          statusColorClass = rotationSpeed > 0.001 ? "text-[#ff6b00]" : "text-rose-500 animate-pulse";
        } else if (brakeTemp > 45.0) {
          statusStr = "DISSIPAÃ‡ÃƒO TÃ‰RMICA";
          statusColorClass = "text-amber-500";
        }

        setTelemetry({
          temp: Math.round(brakeTemp),
          rpm: Math.round(rotationSpeed * 9600), // convert visual speed to simulated RPM scale
          psi: Math.round(brakePressure * 1450), // convert pressure to simulated PSI scale
          status: statusStr,
          statusColor: statusColorClass
        });
      }
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

    // 19. Memory Cleanup on Unmount
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("resize", handleResize);
      container.removeEventListener("click", handleCanvasClick);
      if (container && renderer.domElement && renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }

      // Deep traverse scene objects to release GPU assets
      scene.traverse((obj) => {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) {
          if (Array.isArray(obj.material)) {
            obj.material.forEach((mat) => {
              if (mat.map) mat.map.dispose();
              if (mat.bumpMap) mat.bumpMap.dispose();
              if (mat.roughnessMap) mat.roughnessMap.dispose();
              mat.dispose();
            });
          } else {
            if (obj.material.map) obj.material.map.dispose();
            if (obj.material.bumpMap) obj.material.bumpMap.dispose();
            if (obj.material.roughnessMap) obj.material.roughnessMap.dispose();
            obj.material.dispose();
          }
        }
      });
      scene.clear();
      renderer.dispose();
      studioEnvMap.dispose();
      brushedSteelTex.dispose();
      brushedSteelRoughnessTex.dispose();
    };
  }, []);

  return (
    <div className="w-full h-full min-h-[360px] relative select-none">
      {/* 3D Render Canvas target container */}
      <div ref={containerRef} className="w-full h-full min-h-[360px] flex items-center justify-center relative" />

      {/* Floating HUD Telemetry overlay */}
      <div className="absolute bottom-16 left-6 font-mono text-[9px] text-[#a1a1aa] bg-[#050508]/85 backdrop-blur-md border border-[#1a1a26] p-4 rounded-xl shadow-2xl flex flex-col gap-2.5 min-w-[210px] pointer-events-none select-none">
        <div className="text-[10px] text-[#f2f2f4] font-bold border-b border-[#1a1a26] pb-1.5 flex justify-between items-center">
          <span>DR TELEMETRIA 3D</span>
          <span className={`w-1.5 h-1.5 rounded-full bg-[#00f3ff] shadow-[0_0_6px_#00f3ff] ${telemetry.status === "FRENAGEM ATIVA" ? "bg-[#ff6b00] shadow-[0_0_6px_#ff6b00]" : ""}`} />
        </div>

        {/* Rotation Speed (RPM) */}
        <div className="flex justify-between items-center">
          <span>ROTAÃ‡ÃƒO DO DISCO:</span>
          <span className="text-[#f2f2f4] font-bold">{telemetry.rpm} RPM</span>
        </div>

        {/* Hydraulic Caliper Pressure (PSI) */}
        <div className="flex justify-between items-center">
          <span>PRESSÃƒO DA PINÃ‡A:</span>
          <span className="text-[#f2f2f4] font-bold">{telemetry.psi} PSI</span>
        </div>

        {/* Rotor Core Temperature (Â°C) */}
        <div className="flex flex-col gap-1 mt-0.5">
          <div className="flex justify-between items-center">
            <span>TEMPERATURA DO ROTOR:</span>
            <span className={`font-bold transition-colors ${telemetry.temp > 200 ? "text-[#ff6b00]" : "text-[#f2f2f4]"}`}>
              {telemetry.temp} Â°C
            </span>
          </div>
          {/* Visual thermal bar */}
          <div className="w-full h-1.5 bg-[#0f0f16] border border-[#1a1a26] rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-[#00f3ff] via-[#ff6b00] to-rose-600 transition-all duration-150" 
              style={{ width: `${Math.min(100, ((telemetry.temp - 24) / 696) * 100)}%` }}
            />
          </div>
        </div>

        {/* Dynamic System Status */}
        <div className="flex justify-between items-center border-t border-[#1a1a26] pt-1.5 mt-0.5 text-[8px] uppercase tracking-wider">
          <span>STATUS:</span>
          <span className={`font-bold ${telemetry.statusColor}`}>{telemetry.status}</span>
        </div>
      </div>

      {/* Floating click indicator action CTA */}
      <div className="absolute bottom-6 left-6 font-mono text-[9px] tracking-wide text-[#00f3ff]/80 pointer-events-none select-none flex items-center gap-1.5 animate-pulse">
        <span>[ TOQUE NA TELA PARA TESTAR FRENAGEM ]</span>
      </div>
    </div>
  );
}
