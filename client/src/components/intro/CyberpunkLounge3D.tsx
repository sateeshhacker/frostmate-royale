import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { animate, createTimer } from 'animejs';
import { Sparkles, Palette, RotateCcw, Zap } from 'lucide-react';
import { soundEngine } from '../../audio/soundEngine.js';

export type NeonTheme = 'cyber' | 'vaporwave' | 'emerald' | 'gold';

interface CyberpunkLounge3DProps {
  selectedGameId: string;
  onSelectGame: (gameId: string) => void;
}

export const THEME_PALETTES: Record<NeonTheme, { primary: string; secondary: string; ambient: string; name: string; bgGradient: string }> = {
  cyber: {
    primary: '#00f2fe',
    secondary: '#7928ca',
    ambient: '#0b1329',
    name: 'Cyber Neon',
    bgGradient: 'from-cyan-900/40 via-purple-950/40 to-slate-950'
  },
  vaporwave: {
    primary: '#ff007f',
    secondary: '#7928ca',
    ambient: '#1a052e',
    name: 'Vaporwave Sunset',
    bgGradient: 'from-fuchsia-900/40 via-purple-950/40 to-slate-950'
  },
  emerald: {
    primary: '#10b981',
    secondary: '#06b6d4',
    ambient: '#022c22',
    name: 'Matrix Emerald',
    bgGradient: 'from-emerald-900/40 via-teal-950/40 to-slate-950'
  },
  gold: {
    primary: '#f59e0b',
    secondary: '#ef4444',
    ambient: '#2d1a04',
    name: 'Royal Gold',
    bgGradient: 'from-amber-900/40 via-red-950/40 to-slate-950'
  }
};

export const CyberpunkLounge3D: React.FC<CyberpunkLounge3DProps> = ({ selectedGameId, onSelectGame }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [currentTheme, setCurrentTheme] = useState<NeonTheme>('cyber');
  const [isOrbiting, setIsOrbiting] = useState(false);

  // References for Three.js objects
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const spotlightsRef = useRef<{ main: THREE.SpotLight; rim: THREE.PointLight; fill: THREE.PointLight } | null>(null);
  const pedestalsRef = useRef<Record<string, THREE.Group>>({});
  const particlesMeshRef = useRef<THREE.Points | null>(null);
  const cameraTargetPos = useRef<THREE.Vector3>(new THREE.Vector3(0, 1.2, 4.5));
  const cameraLookTarget = useRef<THREE.Vector3>(new THREE.Vector3(0, 0.5, 0));

  // Mouse interaction state
  const mousePos = useRef({ x: 0, y: 0 });
  const isDragging = useRef(false);
  const previousMousePosition = useRef({ x: 0, y: 0 });
  const sceneRotation = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const { width, height } = container.getBoundingClientRect();
    if (width === 0 || height === 0) return;

    // 1. Setup Scene, Camera, Renderer
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.fog = new THREE.FogExp2(0x060919, 0.12);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 1.2, 4.5);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, preserveDrawingBuffer: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 2. Lighting Setup
    const ambientLight = new THREE.AmbientLight(0x0b1329, 1.2);
    scene.add(ambientLight);

    const mainSpotlight = new THREE.SpotLight(0x00f2fe, 8);
    mainSpotlight.position.set(0, 5, 2);
    mainSpotlight.angle = Math.PI / 3;
    mainSpotlight.penumbra = 0.8;
    mainSpotlight.castShadow = true;
    scene.add(mainSpotlight);

    const rimLight = new THREE.PointLight(0x7928ca, 5, 10);
    rimLight.position.set(-2, 3, -2);
    scene.add(rimLight);

    const fillLight = new THREE.PointLight(0x00f2fe, 3, 8);
    fillLight.position.set(2, 1, 2);
    scene.add(fillLight);

    spotlightsRef.current = { main: mainSpotlight, rim: rimLight, fill: fillLight };

    // 3. Grid Floor & Lounge Stage
    const floorGeo = new THREE.PlaneGeometry(30, 30, 40, 40);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x050814,
      roughness: 0.2,
      metalness: 0.8,
      wireframe: false
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -0.5;
    floor.receiveShadow = true;
    scene.add(floor);

    // Glowing Neon Cyber Grid Lines
    const gridHelper = new THREE.GridHelper(30, 30, 0x00f2fe, 0x1e293b);
    gridHelper.position.y = -0.49;
    scene.add(gridHelper);

    // 4. Create 3D Trophy Pedestals
    const createPedestalBase = (x: number, z: number, colorHex: number) => {
      const group = new THREE.Group();
      group.position.set(x, 0, z);

      // Low-poly octagonal pedestal base
      const baseGeo = new THREE.CylinderGeometry(0.7, 0.85, 0.4, 8);
      const baseMat = new THREE.MeshStandardMaterial({
        color: 0x0f172a,
        metalness: 0.9,
        roughness: 0.3
      });
      const base = new THREE.Mesh(baseGeo, baseMat);
      base.position.y = -0.3;
      base.castShadow = true;
      base.receiveShadow = true;
      group.add(base);

      // Neon glowing ring around pedestal top
      const ringGeo = new THREE.TorusGeometry(0.72, 0.03, 12, 32);
      const ringMat = new THREE.MeshBasicMaterial({ color: colorHex });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = Math.PI / 2;
      ring.position.y = -0.1;
      group.add(ring);

      return group;
    };

    const pedestals: Record<string, THREE.Group> = {};

    // --- A. CHESS PEDESTAL (Position: x = -1.6, z = 0) ---
    const chessGroup = createPedestalBase(-1.6, 0, 0x00f2fe);
    // Low-poly Chess King & Queen
    const kingMat = new THREE.MeshStandardMaterial({ color: 0xe0f2fe, metalness: 0.8, roughness: 0.2 });
    const queenMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, metalness: 0.9, roughness: 0.1, emissive: 0x0284c7, emissiveIntensity: 0.3 });

    // King Piece
    const kingBase = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.25, 0.6, 8), kingMat);
    kingBase.position.y = 0.2;
    const kingCrown = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.25, 8), kingMat);
    kingCrown.position.y = 0.6;
    const cross = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.18, 0.06), kingMat);
    cross.position.y = 0.78;
    const kingGroup = new THREE.Group();
    kingGroup.add(kingBase, kingCrown, cross);
    kingGroup.position.set(-0.25, 0, 0);

    // Queen Piece
    const queenBase = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.23, 0.52, 8), queenMat);
    queenBase.position.y = 0.16;
    const queenCrown = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 8), queenMat);
    queenCrown.position.y = 0.52;
    const queenGroup = new THREE.Group();
    queenGroup.add(queenBase, queenCrown);
    queenGroup.position.set(0.25, 0, 0);

    chessGroup.add(kingGroup, queenGroup);
    scene.add(chessGroup);
    pedestals['chess'] = chessGroup;

    // --- B. LUDO PEDESTAL (Position: x = 0, z = 0.5) ---
    const ludoGroup = createPedestalBase(0, 0.5, 0xf59e0b);
    // 3D Neon Dice
    const diceGeo = new THREE.BoxGeometry(0.5, 0.5, 0.5);
    const diceMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      metalness: 0.6,
      roughness: 0.3,
      emissive: 0xf59e0b,
      emissiveIntensity: 0.2
    });
    const dice = new THREE.Mesh(diceGeo, diceMat);
    dice.position.y = 0.35;
    dice.rotation.set(Math.PI / 6, Math.PI / 4, 0);

    // 4 Corner Pawns
    const pawnColors = [0xef4444, 0x10b981, 0x3b82f6, 0xf59e0b];
    pawnColors.forEach((col, idx) => {
      const pMat = new THREE.MeshStandardMaterial({ color: col, metalness: 0.5 });
      const pawn = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.3, 8), pMat);
      const angle = (idx * Math.PI) / 2;
      pawn.position.set(Math.cos(angle) * 0.45, 0.15, Math.sin(angle) * 0.45);
      ludoGroup.add(pawn);
    });
    ludoGroup.add(dice);
    scene.add(ludoGroup);
    pedestals['ludo'] = ludoGroup;

    // --- C. CHECKERS PEDESTAL (Position: x = 1.6, z = 0) ---
    const checkersGroup = createPedestalBase(1.6, 0, 0xef4444);
    // Stacked Discs
    for (let i = 0; i < 4; i++) {
      const isRed = i % 2 === 0;
      const dMat = new THREE.MeshStandardMaterial({
        color: isRed ? 0xef4444 : 0x38bdf8,
        metalness: 0.8,
        roughness: 0.2
      });
      const disc = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.1, 16), dMat);
      disc.position.y = 0.05 + i * 0.11;
      checkersGroup.add(disc);
    }
    scene.add(checkersGroup);
    pedestals['checkers'] = checkersGroup;

    // --- D. CONNECT 4 PEDESTAL (Position: x = -2.5, z = -1.5) ---
    const connect4Group = createPedestalBase(-2.5, -1.5, 0x3b82f6);
    const gridBoard = new THREE.Mesh(
      new THREE.BoxGeometry(0.7, 0.6, 0.08),
      new THREE.MeshStandardMaterial({ color: 0x1d4ed8, metalness: 0.7 })
    );
    gridBoard.position.y = 0.4;
    connect4Group.add(gridBoard);
    scene.add(connect4Group);
    pedestals['connect4'] = connect4Group;

    // --- E. SNAKE & LADDER PEDESTAL (Position: x = 0, z = -2.0) ---
    const snakeGroup = createPedestalBase(0, -2.0, 0x10b981);
    const ladderMat = new THREE.MeshStandardMaterial({ color: 0x10b981, metalness: 0.8 });
    const ladder = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.8, 0.05), ladderMat);
    ladder.position.y = 0.4;
    ladder.rotation.z = Math.PI / 8;
    snakeGroup.add(ladder);
    scene.add(snakeGroup);
    pedestals['snake'] = snakeGroup;

    // --- F. UNO PEDESTAL (Position: x = 2.5, z = -1.5) ---
    const unoGroup = createPedestalBase(2.5, -1.5, 0xec4899);
    const cardColors = [0xef4444, 0x3b82f6, 0x10b981, 0xf59e0b];
    cardColors.forEach((col, idx) => {
      const cMat = new THREE.MeshStandardMaterial({ color: col, metalness: 0.4, roughness: 0.3 });
      const card = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.38, 0.02), cMat);
      card.position.set((idx - 1.5) * 0.15, 0.35, idx * 0.02);
      card.rotation.z = (idx - 1.5) * -0.2;
      unoGroup.add(card);
    });
    scene.add(unoGroup);
    pedestals['uno'] = unoGroup;

    pedestalsRef.current = pedestals;

    // 5. Floating Dust Particle Field
    const particleCount = 200;
    const particleGeo = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount * 3; i += 3) {
      particlePositions[i] = (Math.random() - 0.5) * 12;
      particlePositions[i + 1] = Math.random() * 4;
      particlePositions[i + 2] = (Math.random() - 0.5) * 12;
    }

    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    const particleMat = new THREE.PointsMaterial({
      color: 0x00f2fe,
      size: 0.04,
      transparent: true,
      opacity: 0.6
    });

    const particlesMesh = new THREE.Points(particleGeo, particleMat);
    scene.add(particlesMesh);
    particlesMeshRef.current = particlesMesh;

    // 6. Animation Loop (Anime.js + Three.js renderer)
    let angleTime = 0;
    const animTimer = createTimer({
      onUpdate: () => {
        angleTime += 0.01;

        // Gentle floating animation for pedestals & trophies
        Object.entries(pedestals).forEach(([id, grp], idx) => {
          grp.position.y = Math.sin(angleTime * 2 + idx) * 0.04;
          // Gentle rotation of trophy piece inside pedestal
          if (grp.children[2]) {
            grp.children[2].rotation.y += 0.015;
          }
        });

        // Rotate particles field
        if (particlesMeshRef.current) {
          particlesMeshRef.current.rotation.y += 0.001;
        }

        // Camera Smooth Interpolation towards target position
        camera.position.lerp(cameraTargetPos.current, 0.05);
        
        // Add subtle mouse parallax offset if not dragging
        if (!isDragging.current) {
          const parallaxX = mousePos.current.x * 0.3;
          const parallaxY = mousePos.current.y * 0.2;
          camera.position.x += (parallaxX - camera.position.x) * 0.02;
          camera.position.y += (1.2 + parallaxY - camera.position.y) * 0.02;
        }

        camera.lookAt(cameraLookTarget.current);
        renderer.render(scene, camera);
      }
    });

    // 7. Mouse & Touch Event Handlers
    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      mousePos.current = { x, y };

      if (isDragging.current) {
        const deltaX = e.clientX - previousMousePosition.current.x;
        const deltaY = e.clientY - previousMousePosition.current.y;

        sceneRotation.current.y += deltaX * 0.005;
        sceneRotation.current.x += deltaY * 0.005;

        // Limit vertical tilt
        sceneRotation.current.x = Math.max(-0.5, Math.min(0.5, sceneRotation.current.x));

        // Adjust camera target pos based on drag orbit
        const radius = 4.5;
        cameraTargetPos.current.x = radius * Math.sin(sceneRotation.current.y);
        cameraTargetPos.current.z = radius * Math.cos(sceneRotation.current.y);
        cameraTargetPos.current.y = 1.2 + sceneRotation.current.x * 2;

        previousMousePosition.current = { x: e.clientX, y: e.clientY };
      }
    };

    const handleMouseDown = (e: MouseEvent) => {
      isDragging.current = true;
      setIsOrbiting(true);
      previousMousePosition.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseUp = () => {
      isDragging.current = false;
      setIsOrbiting(false);
    };

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
    container.addEventListener('mousemove', handleMouseMove);
    container.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('resize', handleResize);
      container.removeEventListener('mousemove', handleMouseMove);
      container.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      animTimer.pause();

      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      scene.clear();
      renderer.dispose();
    };
  }, []);

  // Update Camera Focus when Selected Game Changes using Anime.js
  useEffect(() => {
    const pedestals = pedestalsRef.current;
    const targetPedestal = pedestals[selectedGameId];

    if (targetPedestal) {
      const pos = targetPedestal.position;

      // Animate Camera Look Target smoothly with Anime.js
      animate(cameraLookTarget.current, {
        x: pos.x,
        y: pos.y + 0.3,
        z: pos.z,
        duration: 1200,
        ease: 'outExpo'
      });

      // Animate Camera Position target
      const targetCamX = pos.x * 0.8;
      const targetCamZ = pos.z + 3.2;

      animate(cameraTargetPos.current, {
        x: targetCamX,
        y: 1.4,
        z: targetCamZ,
        duration: 1400,
        ease: 'outExpo'
      });

      // Pulse ring animation on selected pedestal
      const ringMesh = targetPedestal.children[1] as THREE.Mesh;
      if (ringMesh) {
        animate(ringMesh.scale, {
          x: [1, 1.3, 1],
          y: [1, 1.3, 1],
          z: [1, 1.3, 1],
          duration: 800,
          ease: 'outElastic(1, .5)'
        });
      }
    }
  }, [selectedGameId]);

  // Handle Dynamic Theme Switching with Three.js Light Interpolation & Anime.js
  const handleSwitchTheme = (themeKey: NeonTheme) => {
    soundEngine.playClick();
    setCurrentTheme(themeKey);

    const palette = THEME_PALETTES[themeKey];
    const lights = spotlightsRef.current;

    if (lights && sceneRef.current) {
      const primaryColor = new THREE.Color(palette.primary);
      const secondaryColor = new THREE.Color(palette.secondary);

      // Smoothly morph spotlight colors with Anime.js
      animate(lights.main.color, {
        r: primaryColor.r,
        g: primaryColor.g,
        b: primaryColor.b,
        duration: 1000,
        ease: 'inOutQuad'
      });

      animate(lights.rim.color, {
        r: secondaryColor.r,
        g: secondaryColor.g,
        b: secondaryColor.b,
        duration: 1000,
        ease: 'inOutQuad'
      });

      if (particlesMeshRef.current) {
        const mat = particlesMeshRef.current.material as THREE.PointsMaterial;
        animate(mat.color, {
          r: primaryColor.r,
          g: primaryColor.g,
          b: primaryColor.b,
          duration: 1000,
          ease: 'inOutQuad'
        });
      }
    }
  };

  const handleResetCamera = () => {
    soundEngine.playClick();
    sceneRotation.current = { x: 0, y: 0 };
    animate(cameraTargetPos.current, {
      x: 0,
      y: 1.2,
      z: 4.5,
      duration: 1200,
      ease: 'outQuint'
    });
    animate(cameraLookTarget.current, {
      x: 0,
      y: 0.5,
      z: 0,
      duration: 1200,
      ease: 'outQuint'
    });
  };

  return (
    <div className="relative w-full h-[420px] sm:h-[480px] rounded-3xl overflow-hidden bg-slate-950 border border-white/15 shadow-2xl select-none group">
      {/* Dynamic Ambient Background Gradient */}
      <div
        className={`absolute inset-0 bg-gradient-to-b ${THEME_PALETTES[currentTheme].bgGradient} opacity-60 transition-all duration-700 pointer-events-none`}
      />

      {/* 3D WebGL Canvas Container */}
      <div
        ref={containerRef}
        className={`w-full h-full cursor-grab ${isOrbiting ? 'cursor-grabbing' : ''}`}
      />

      {/* Interactive Controls Bar Overlay Top-Left */}
      <div className="absolute top-4 left-4 z-20 flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/80 backdrop-blur-md border border-white/10 text-xs font-semibold text-white shadow-lg">
          <Sparkles size={14} className="text-cyan-400 animate-pulse" />
          <span>Cyberpunk 3D Lounge</span>
        </div>

        <button
          onClick={handleResetCamera}
          className="px-3 py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 backdrop-blur-md border border-white/10 text-xs font-semibold text-gray-300 hover:text-white transition-all flex items-center gap-1.5 active:scale-95 shadow-lg"
          title="Reset 3D Camera Orbit"
        >
          <RotateCcw size={13} />
          <span className="hidden sm:inline">Reset Camera</span>
        </button>
      </div>

      {/* Interactive Neon Theme Picker Top-Right */}
      <div className="absolute top-4 right-4 z-20 flex items-center gap-1.5 p-1 rounded-2xl bg-slate-900/85 backdrop-blur-xl border border-white/15 shadow-2xl">
        <Palette size={14} className="text-gray-400 ml-2 mr-1 hidden sm:inline" />
        {(Object.keys(THEME_PALETTES) as NeonTheme[]).map((themeKey) => {
          const pal = THEME_PALETTES[themeKey];
          const isActive = currentTheme === themeKey;
          return (
            <button
              key={themeKey}
              onClick={() => handleSwitchTheme(themeKey)}
              className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all flex items-center gap-1.5 ${
                isActive
                  ? 'bg-white/20 text-white border border-white/30 shadow-glow-cyan'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <span
                className="w-2.5 h-2.5 rounded-full border border-white/40 shadow-sm"
                style={{ backgroundColor: pal.primary }}
              />
              <span className="hidden md:inline">{pal.name.split(' ')[0]}</span>
            </button>
          );
        })}
      </div>

      {/* Interactive Drag & Orbit Instruction Overlay Bottom */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 pointer-events-none text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-950/70 backdrop-blur-md border border-white/10 text-[11px] text-gray-300 shadow-xl">
          <Zap size={12} className="text-amber-400 animate-bounce" />
          <span>Drag mouse on 3D canvas to orbit & inspect pedestals</span>
        </div>
      </div>
    </div>
  );
};
