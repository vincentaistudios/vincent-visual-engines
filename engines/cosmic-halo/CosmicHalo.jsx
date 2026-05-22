import { useEffect, useRef } from "react";
import * as THREE from "three";

/**
 * CosmicHaloVisual — Simulação 3D de Nebulosa Orbital em WebGL
 *
 * - 2000 partículas volumétricas em toro orbital
 * - GLSL Shaders com ondas fluidas e distorção por mouse
 * - Núcleo de estrela com glow Fresnel
 * - Limpeza automática de recursos WebGL (dispose)
 *
 * @author Vincent AI Studios
 * @license MIT
 */
export default function CosmicHaloVisual() {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const scene = new THREE.Scene();
    const width = containerRef.current.clientWidth || 360;
    const height = containerRef.current.clientHeight || 360;
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.z = 8;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    renderer.domElement.style.display = "block";
    containerRef.current.appendChild(renderer.domElement);

    const group = new THREE.Group();
    scene.add(group);

    // ─── Partículas Orbitais ──────────────────────────────────────────────
    const particleCount = 2000;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);
    const randoms = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
      const angle = (i / particleCount) * Math.PI * 2 + Math.random() * 0.1;
      const tubeAngle = Math.random() * Math.PI * 2;
      const ringRadius = 2.2 + Math.random() * 0.3;
      const tubeRadius = 0.45;

      const x = Math.cos(angle) * (ringRadius + Math.cos(tubeAngle) * tubeRadius);
      const y = Math.sin(angle) * (ringRadius + Math.cos(tubeAngle) * tubeRadius);
      const z = Math.sin(tubeAngle) * tubeRadius * 1.5;

      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;

      const color = new THREE.Color();
      if (Math.random() > 0.45) {
        color.setHSL(0.53 + Math.random() * 0.05, 1.0, 0.6); // Ciano elétrico
      } else {
        color.setHSL(0.06 + Math.random() * 0.05, 1.0, 0.55); // Laranja de performance
      }
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;

      sizes[i] = Math.random() * 3.0 + 1.0;
      randoms[i] = Math.random();
    }

    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute("size", new THREE.BufferAttribute(sizes, 1));
    geometry.setAttribute("random", new THREE.BufferAttribute(randoms, 1));

    // ─── GLSL Vertex Shader ───────────────────────────────────────────────
    const vertexShader = `
      uniform float time;
      uniform vec2 mouse;
      attribute float size;
      attribute float random;
      varying vec3 vColor;
      varying float vRandom;

      void main() {
        vColor = color;
        vRandom = random;
        vec3 pos = position;
        float wave = sin(pos.x * 1.5 + time * 1.2) * cos(pos.y * 1.5 + time * 1.0) * 0.25;
        pos.z += wave;
        pos.x += sin(time * 0.8 + random * 6.28) * 0.08;
        pos.y += cos(time * 0.8 + random * 6.28) * 0.08;

        float dist = distance(pos.xy, mouse * 6.0 - vec2(3.0));
        if (dist < 2.0) {
          pos.xy += normalize(pos.xy - (mouse * 6.0 - vec2(3.0))) * (2.0 - dist) * 0.15;
        }
        vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
        gl_Position = projectionMatrix * mvPosition;
        gl_PointSize = size * (320.0 / -mvPosition.z);
      }
    `;

    // ─── GLSL Fragment Shader ─────────────────────────────────────────────
    const fragmentShader = `
      varying vec3 vColor;
      varying float vRandom;
      void main() {
        float dist = distance(gl_PointCoord, vec2(0.5));
        if (dist > 0.5) discard;
        float glow = pow(max(0.0, 1.0 - (dist * 2.0)), 2.2);
        gl_FragColor = vec4(vColor, glow * 0.95);
      }
    `;

    const material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        time: { value: 0 },
        mouse: { value: new THREE.Vector2(0, 0) }
      },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });

    const particles = new THREE.Points(geometry, material);
    group.add(particles);

    // ─── Núcleo de Estrela com Glow Fresnel ───────────────────────────────
    const glowGeo = new THREE.SphereGeometry(0.8, 32, 32);
    const glowMat = new THREE.ShaderMaterial({
      vertexShader: `
        varying vec3 vNormal;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vNormal;
        void main() {
          float intensity = pow(max(0.0, 0.7 - dot(vNormal, vec3(0, 0, 1.0))), 2.5);
          gl_FragColor = vec4(0.0, 0.95, 1.0, intensity * 0.6);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide
    });
    const centralGlow = new THREE.Mesh(glowGeo, glowMat);
    group.add(centralGlow);

    // ─── Interação com Mouse ──────────────────────────────────────────────
    let mouseX = 0;
    let mouseY = 0;
    let targetX = 0;
    let targetY = 0;

    const handleMouseMove = (e) => {
      const rect = containerRef.current.getBoundingClientRect();
      targetX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      targetY = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    };
    containerRef.current.addEventListener("mousemove", handleMouseMove);

    // ─── Loop de Animação ─────────────────────────────────────────────────
    let animationFrameId;
    const startTime = Date.now();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsed = (Date.now() - startTime) * 0.001;

      mouseX += (targetX - mouseX) * 0.07;
      mouseY += (targetY - mouseY) * 0.07;

      material.uniforms.time.value = elapsed;
      material.uniforms.mouse.value.set((mouseX + 1) * 0.5, (mouseY + 1) * 0.5);

      group.rotation.x = elapsed * 0.08 + mouseY * 0.3;
      group.rotation.y = elapsed * 0.12 + mouseX * 0.3;

      renderer.render(scene, camera);
    };
    animate();

    // ─── Responsividade ───────────────────────────────────────────────────
    const handleResize = () => {
      if (!containerRef.current || !renderer.domElement) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", handleResize);

    // ─── Cleanup / Dispose de Recursos WebGL ─────────────────────────────
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);
      if (containerRef.current) {
        containerRef.current.removeEventListener("mousemove", handleMouseMove);
        if (renderer.domElement && renderer.domElement.parentNode === containerRef.current) {
          containerRef.current.removeChild(renderer.domElement);
        }
      }
      geometry.dispose();
      material.dispose();
      glowGeo.dispose();
      glowMat.dispose();
      scene.clear();
      renderer.dispose();
    };
  }, []);

  return <div ref={containerRef} className="w-full h-full min-h-[360px]" />;
}
