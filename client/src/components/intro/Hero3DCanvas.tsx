import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { animate, createTimer } from 'animejs';
import { GameId, HeroFocusState, PointerState } from '../../hooks/useHeroState.js';

interface Hero3DCanvasProps {
  activeGame: GameId;
  focusState: HeroFocusState;
  pointer: PointerState;
  reducedMotion: boolean;
}

// Helper to generate crisp, error-free 3D Dice Face Canvas Textures
const createDiceFaceTexture = (faceColor: string, pipCount: number): THREE.CanvasTexture => {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new THREE.CanvasTexture(canvas);

  // Rounded square face background
  ctx.fillStyle = faceColor;
  ctx.fillRect(0, 0, 256, 256);

  // Subtle inner glossy gradient
  const grad = ctx.createLinearGradient(0, 0, 256, 256);
  grad.addColorStop(0, 'rgba(255, 255, 255, 0.35)');
  grad.addColorStop(0.5, 'rgba(255, 255, 255, 0)');
  grad.addColorStop(1, 'rgba(0, 0, 0, 0.25)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 256, 256);

  // Outer border trim
  ctx.lineWidth = 14;
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
  ctx.strokeRect(7, 7, 242, 242);

  // Draw white circular pips (1 to 6)
  ctx.fillStyle = '#ffffff';
  const radius = 22;
  const positions: Record<number, Array<[number, number]>> = {
    1: [[128, 128]],
    2: [[72, 72], [184, 184]],
    3: [[72, 72], [128, 128], [184, 184]],
    4: [[72, 72], [184, 72], [72, 184], [184, 184]],
    5: [[72, 72], [184, 72], [128, 128], [72, 184], [184, 184]],
    6: [[72, 72], [184, 72], [72, 128], [184, 128], [72, 184], [184, 184]]
  };

  const pips = positions[pipCount] || positions[1];
  pips.forEach(([x, y]) => {
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.stroke();
  });

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
};

export const Hero3DCanvas: React.FC<Hero3DCanvasProps> = ({
  activeGame,
  focusState,
  pointer,
  reducedMotion
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);

  // Object references
  const kingGroupRef = useRef<THREE.Group | null>(null);
  const diceGroupRef = useRef<THREE.Group | null>(null);
  const rpsGroupRef = useRef<THREE.Group | null>(null);
  const cursorLightRef = useRef<THREE.PointLight | null>(null);
  const rimLightRef = useRef<THREE.PointLight | null>(null);
  const bgLightRef = useRef<THREE.PointLight | null>(null);
  const particlesMeshRef = useRef<THREE.Points | null>(null);

  // Materials
  const materialsRef = useRef<{
    king: THREE.MeshStandardMaterial;
    dice: THREE.MeshStandardMaterial[];
    rock: THREE.MeshStandardMaterial;
    paper: THREE.MeshStandardMaterial;
    scissors: THREE.MeshStandardMaterial;
  } | null>(null);

  const cameraTargetPos = useRef(new THREE.Vector3(0.5, 0, 5.2));
  const cameraLookTarget = useRef(new THREE.Vector3(0.5, 0, 0));

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const { width, height } = container.getBoundingClientRect();
    if (width === 0 || height === 0) return;

    // 1. Setup Three.js WebGL Renderer
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0.5, 0, 5.2);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, preserveDrawingBuffer: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 2. High Contrast Studio Lighting
    const ambientLight = new THREE.AmbientLight(0x475569, 2.8);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 5.5);
    keyLight.position.set(4, 6, 5);
    scene.add(keyLight);

    // Active Colored Rim Light (#8B5CF6 Violet initial)
    const rimLight = new THREE.PointLight(0x8b5cf6, 12, 16);
    rimLight.position.set(0.5, 1.0, 2.0);
    scene.add(rimLight);
    rimLightRef.current = rimLight;

    // Background Aura Light
    const bgLight = new THREE.PointLight(0x00f2fe, 15, 20);
    bgLight.position.set(1.0, 0.2, -1.0);
    scene.add(bgLight);
    bgLightRef.current = bgLight;

    // Cursor Point Light
    const cursorLight = new THREE.PointLight(0x22d3ee, 5, 8);
    cursorLight.position.set(0, 0, 3);
    scene.add(cursorLight);
    cursorLightRef.current = cursorLight;

    // 3. SLIM, PROPORTIONED CHESS KING (Position: x = 0.2, y = -0.1)
    const kingGroup = new THREE.Group();
    kingGroup.position.set(0.2, -0.1, 0);

    const kingMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      metalness: 0.9,
      roughness: 0.15,
      emissive: 0x8b5cf6,
      emissiveIntensity: 0.5,
      transparent: true,
      opacity: 1.0
    });

    const silverMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      metalness: 0.95,
      roughness: 0.1,
      emissive: 0xffffff,
      emissiveIntensity: 0.3
    });

    const kBase = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.45, 0.25, 32), kingMat);
    kBase.position.y = -0.5;
    const kRing = new THREE.Mesh(new THREE.TorusGeometry(0.38, 0.03, 16, 32), silverMat);
    kRing.rotation.x = Math.PI / 2;
    kRing.position.y = -0.38;

    const kBody = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.32, 0.8, 32), kingMat);
    kBody.position.y = 0.02;

    const kCrown = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.25, 0.3, 16), kingMat);
    kCrown.position.y = 0.55;

    const kCrossV = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.25, 0.08), silverMat);
    kCrossV.position.y = 0.8;
    const kCrossH = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.07, 0.07), silverMat);
    kCrossH.position.y = 0.81;

    kingGroup.add(kBase, kRing, kBody, kCrown, kCrossV, kCrossH);
    kingGroup.rotation.y = -Math.PI / 6;
    kingGroup.scale.set(0.65, 0.65, 0.65);
    scene.add(kingGroup);
    kingGroupRef.current = kingGroup;

    // 4. ERROR-FREE AAA 3D LUDO DICE (Position: x = 1.3, y = 0.5)
    const diceGroup = new THREE.Group();
    diceGroup.position.set(1.3, 0.5, 0.3);

    // Create 6 face materials with crisp canvas textures & proper pip counts
    const diceFaceConfigs = [
      { color: '#ef4444', pips: 1 }, // Right: Red (1 pip)
      { color: '#3b82f6', pips: 2 }, // Left: Blue (2 pips)
      { color: '#d9f84a', pips: 3 }, // Top: Lime (3 pips)
      { color: '#8b5cf6', pips: 4 }, // Bottom: Violet (4 pips)
      { color: '#f59e0b', pips: 5 }, // Front: Amber/Yellow (5 pips)
      { color: '#10b981', pips: 6 }  // Back: Green (6 pips)
    ];

    const diceMaterials = diceFaceConfigs.map(
      (cfg) =>
        new THREE.MeshStandardMaterial({
          map: createDiceFaceTexture(cfg.color, cfg.pips),
          metalness: 0.2,
          roughness: 0.2,
          roughnessMap: null,
          transparent: true,
          opacity: 0.8
        })
    );

    const diceMesh = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.75, 0.75), diceMaterials);
    diceMesh.castShadow = true;
    diceGroup.add(diceMesh);
    diceGroup.rotation.set(Math.PI / 5, Math.PI / 4, Math.PI / 6);
    diceGroup.scale.set(0.75, 0.75, 0.75);
    scene.add(diceGroup);
    diceGroupRef.current = diceGroup;

    // 5. 3D ROCK PAPER SCISSORS GROUP (Position: x = 2.0, y = -0.3)
    const rpsGroup = new THREE.Group();
    rpsGroup.position.set(2.0, -0.3, 0.2);

    const rockMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.95, metalness: 0.05, emissive: 0x1e293b, emissiveIntensity: 0.15, flatShading: true });
    const rockMesh = new THREE.Mesh(new THREE.DodecahedronGeometry(0.35, 1), rockMat);
    rockMesh.position.set(-0.25, 0.15, 0.1);

    const paperMat = new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 0.1, roughness: 0.2, emissive: 0xff6672, emissiveIntensity: 0.4, transparent: true, opacity: 0.8 });
    const paperMesh = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.6, 0.03), paperMat);
    paperMesh.position.set(0.15, 0.25, -0.1);
    paperMesh.rotation.set(0.2, -0.3, 0.2);

    const scissorsMat = new THREE.MeshStandardMaterial({ color: 0xff6672, metalness: 0.6, emissive: 0xff6672, emissiveIntensity: 0.4, transparent: true, opacity: 0.8 });
    const scissorsGroup = new THREE.Group();
    const b1 = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.45, 0.02), silverMat);
    b1.rotation.z = -0.3;
    const b2 = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.45, 0.02), silverMat);
    b2.rotation.z = 0.3;
    const r1 = new THREE.Mesh(new THREE.TorusGeometry(0.08, 0.02, 12, 24), scissorsMat);
    r1.position.set(-0.15, -0.22, 0);
    const r2 = new THREE.Mesh(new THREE.TorusGeometry(0.08, 0.02, 12, 24), scissorsMat);
    r2.position.set(0.15, -0.22, 0);
    scissorsGroup.add(b1, b2, r1, r2);
    scissorsGroup.position.set(0, -0.2, 0.15);

    rpsGroup.add(rockMesh, paperMesh, scissorsGroup);
    rpsGroup.scale.set(0.75, 0.75, 0.75);
    scene.add(rpsGroup);
    rpsGroupRef.current = rpsGroup;

    materialsRef.current = {
      king: kingMat,
      dice: diceMaterials,
      rock: rockMat,
      paper: paperMat,
      scissors: scissorsMat
    };

    // 6. Floating Particles
    const pCount = reducedMotion ? 40 : 150;
    const pGeo = new THREE.BufferGeometry();
    const pPos = new Float32Array(pCount * 3);
    const pColors = new Float32Array(pCount * 3);
    const colorPalette = [new THREE.Color(0x00f2fe), new THREE.Color(0x8b5cf6), new THREE.Color(0xd9f84a), new THREE.Color(0xff4757)];

    for (let i = 0; i < pCount; i++) {
      pPos[i * 3] = (Math.random() - 0.5) * 14;
      pPos[i * 3 + 1] = (Math.random() - 0.5) * 8;
      pPos[i * 3 + 2] = (Math.random() - 0.5) * 8;
      const col = colorPalette[Math.floor(Math.random() * colorPalette.length)];
      pColors[i * 3] = col.r;
      pColors[i * 3 + 1] = col.g;
      pColors[i * 3 + 2] = col.b;
    }
    pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
    pGeo.setAttribute('color', new THREE.BufferAttribute(pColors, 3));
    const pMat = new THREE.PointsMaterial({ size: 0.06, vertexColors: true, transparent: true, opacity: 0.8 });
    const pMesh = new THREE.Points(pGeo, pMat);
    scene.add(pMesh);
    particlesMeshRef.current = pMesh;

    // 7. High Performance Render Loop
    let clock = 0;
    const animTimer = createTimer({
      onUpdate: () => {
        clock += 0.015;

        if (!reducedMotion && kingGroupRef.current) {
          kingGroupRef.current.position.y = -0.1 + Math.sin(clock * 1.4) * 0.04;
          kingGroupRef.current.rotation.y += 0.005;
        }

        if (!reducedMotion && diceGroupRef.current) {
          diceGroupRef.current.position.y = 0.5 + Math.cos(clock * 1.7) * 0.06;
          diceGroupRef.current.rotation.x += 0.008;
          diceGroupRef.current.rotation.y += 0.01;
        }

        if (!reducedMotion && rpsGroupRef.current) {
          rpsGroupRef.current.position.y = -0.3 + Math.sin(clock * 1.3 + 1) * 0.05;
          rockMesh.rotation.y += 0.012;
        }

        if (!reducedMotion && particlesMeshRef.current) {
          particlesMeshRef.current.rotation.y += 0.0008;
        }

        // Camera Smooth Parallax
        if (!reducedMotion) {
          camera.position.lerp(cameraTargetPos.current, 0.05);
          const parallaxX = pointer.x * 0.25;
          const parallaxY = pointer.y * 0.15;
          camera.position.x += (0.5 + parallaxX - camera.position.x) * 0.03;
          camera.position.y += (parallaxY - camera.position.y) * 0.03;
          camera.lookAt(cameraLookTarget.current);
        }

        renderer.render(scene, camera);
      }
    });

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      if (w === 0 || h === 0) return;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      animTimer.pause();
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      scene.clear();
      renderer.dispose();
    };
  }, []);

  // Update Cursor Pointer Light position smoothly
  useEffect(() => {
    if (cursorLightRef.current) {
      cursorLightRef.current.position.set(pointer.x * 3, pointer.y * 2, 2.5);
    }
  }, [pointer]);

  // VIBRANT COLOR SHIFTS FOR ACTIVE GAME
  useEffect(() => {
    if (
      !kingGroupRef.current ||
      !diceGroupRef.current ||
      !rpsGroupRef.current ||
      !materialsRef.current ||
      !rimLightRef.current ||
      !bgLightRef.current
    )
      return;

    const king = kingGroupRef.current;
    const dice = diceGroupRef.current;
    const rps = rpsGroupRef.current;
    const mats = materialsRef.current;
    const rimLight = rimLightRef.current;
    const bgLight = bgLightRef.current;

    if (activeGame === 'chess') {
      // Chess Active
      animate(king.scale, { x: 0.75, y: 0.75, z: 0.75, duration: 400, ease: 'outExpo' });
      animate(dice.scale, { x: 0.6, y: 0.6, z: 0.6, duration: 400, ease: 'outExpo' });
      animate(rps.scale, { x: 0.6, y: 0.6, z: 0.6, duration: 400, ease: 'outExpo' });

      mats.king.opacity = 1.0;
      mats.king.emissiveIntensity = 0.6;
      mats.dice.forEach((m) => (m.opacity = 0.4));
      mats.rock.opacity = 0.4;
      mats.paper.opacity = 0.4;
      mats.scissors.opacity = 0.4;

      animate(rimLight.color, { r: 0.54, g: 0.36, b: 0.96, duration: 400, ease: 'inOutQuad' });
      animate(bgLight.color, { r: 0.54, g: 0.36, b: 0.96, duration: 400, ease: 'inOutQuad' });

      animate(cameraLookTarget.current, { x: 0.2, y: 0, z: 0, duration: 500, ease: 'outExpo' });
      animate(cameraTargetPos.current, { x: 0.2, y: 0, z: 4.8, duration: 500, ease: 'outExpo' });
    } else if (activeGame === 'ludo') {
      // Ludo Active
      animate(dice.scale, { x: 0.9, y: 0.9, z: 0.9, duration: 400, ease: 'outExpo' });
      animate(king.scale, { x: 0.5, y: 0.5, z: 0.5, duration: 400, ease: 'outExpo' });
      animate(rps.scale, { x: 0.5, y: 0.5, z: 0.5, duration: 400, ease: 'outExpo' });

      mats.king.opacity = 0.4;
      mats.king.emissiveIntensity = 0.15;
      mats.dice.forEach((m) => (m.opacity = 1.0));
      mats.rock.opacity = 0.4;
      mats.paper.opacity = 0.4;
      mats.scissors.opacity = 0.4;

      animate(rimLight.color, { r: 0.85, g: 0.97, b: 0.29, duration: 400, ease: 'inOutQuad' });
      animate(bgLight.color, { r: 0.85, g: 0.97, b: 0.29, duration: 400, ease: 'inOutQuad' });

      animate(cameraLookTarget.current, { x: 1.3, y: 0.5, z: 0.3, duration: 500, ease: 'outExpo' });
      animate(cameraTargetPos.current, { x: 1.2, y: 0.5, z: 4.5, duration: 500, ease: 'outExpo' });
    } else if (activeGame === 'rps') {
      // RPS Active
      animate(rps.scale, { x: 0.9, y: 0.9, z: 0.9, duration: 400, ease: 'outExpo' });
      animate(king.scale, { x: 0.5, y: 0.5, z: 0.5, duration: 400, ease: 'outExpo' });
      animate(dice.scale, { x: 0.5, y: 0.5, z: 0.5, duration: 400, ease: 'outExpo' });

      mats.king.opacity = 0.4;
      mats.king.emissiveIntensity = 0.15;
      mats.dice.forEach((m) => (m.opacity = 0.4));
      mats.rock.opacity = 1.0;
      mats.paper.opacity = 1.0;
      mats.scissors.opacity = 1.0;

      animate(rimLight.color, { r: 1.0, g: 0.4, b: 0.45, duration: 400, ease: 'inOutQuad' });
      animate(bgLight.color, { r: 1.0, g: 0.4, b: 0.45, duration: 400, ease: 'inOutQuad' });

      animate(cameraLookTarget.current, { x: 2.0, y: -0.3, z: 0.2, duration: 500, ease: 'outExpo' });
      animate(cameraTargetPos.current, { x: 1.8, y: -0.2, z: 4.5, duration: 500, ease: 'outExpo' });
    }
  }, [activeGame]);

  return (
    <div className="absolute inset-0 w-full h-full pointer-events-none select-none z-0 overflow-hidden">
      <div
        className={`absolute top-1/4 right-1/4 w-[450px] h-[450px] rounded-full blur-[140px] opacity-35 transition-all duration-500 pointer-events-none ${
          activeGame === 'chess'
            ? 'bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-500'
            : activeGame === 'ludo'
            ? 'bg-gradient-to-r from-lime-400 via-emerald-500 to-amber-400'
            : 'bg-gradient-to-r from-rose-500 via-pink-600 to-purple-600'
        }`}
      />
      <div ref={containerRef} className="w-full h-full" />
    </div>
  );
};
