import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { createTimer, animate } from 'animejs';
import { RPSChoice, RPSGameEngine } from '../engine/RPSGameEngine.js';
import { RPSGamePhase } from '../state/useRPSGameState.js';
import { RPSResultAnimator } from './RPSResultAnimator.js';

interface RPSArenaCanvasProps {
  playerChoice: RPSChoice | null;
  opponentChoice: RPSChoice | null;
  phase: RPSGamePhase;
  reducedMotion?: boolean;
}

export const RPSArenaCanvas: React.FC<RPSArenaCanvasProps> = ({
  playerChoice,
  opponentChoice,
  phase,
  reducedMotion = false
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Three.js References
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);

  // Mesh & Light References
  const rockMeshRef = useRef<THREE.Mesh | null>(null);
  const paperMeshRef = useRef<THREE.Mesh | null>(null);
  const scissorsGroupRef = useRef<THREE.Group | null>(null);
  const cursorLightRef = useRef<THREE.PointLight | null>(null);
  const rimLightRef = useRef<THREE.PointLight | null>(null);

  // Result Animator Instance Reference
  const animatorRef = useRef<RPSResultAnimator | null>(null);

  // Mouse & Camera Parallax Tracking
  const mousePos = useRef({ x: 0, y: 0 });
  const targetMousePos = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Reliable layout measurement with robust fallback
    const rect = container.getBoundingClientRect();
    const width = rect.width > 0 ? rect.width : (container.clientWidth || 600);
    const height = rect.height > 0 ? rect.height : (container.clientHeight || 320);

    // 1. Initialize Scene & Perspective Camera
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 0.25, 5.6);
    cameraRef.current = camera;

    // 2. WebGL Renderer with sRGB Color Management & Capped Pixel Ratio
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, preserveDrawingBuffer: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    
    // Ensure canvas canvas element takes 100% of container
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.domElement.style.display = 'block';

    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 3. Physically Appropriate Studio Lighting
    const ambientLight = new THREE.AmbientLight(0x475569, 2.6);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 5.5);
    keyLight.position.set(4, 6, 5);
    scene.add(keyLight);

    // Accent Coral Rim Light (#FF5F6D)
    const rimLight = new THREE.PointLight(0xff5f6d, 12, 16);
    rimLight.position.set(0, 1.2, 2.0);
    scene.add(rimLight);
    rimLightRef.current = rimLight;

    // Smooth Cursor Point Light (#FF7180)
    const cursorLight = new THREE.PointLight(0xff7180, 5, 8);
    cursorLight.position.set(0, 0, 3);
    scene.add(cursorLight);
    cursorLightRef.current = cursorLight;

    // 4. Create 3D Objects (Rock, Paper, Scissors)
    // 4a. ROCK (Solid, heavy, rough granite mountain stone boulder)
    const rockGeo = new THREE.DodecahedronGeometry(0.58, 1);
    const posAttribute = rockGeo.attributes.position;
    for (let i = 0; i < posAttribute.count; i++) {
      const vx = posAttribute.getX(i);
      const vy = posAttribute.getY(i);
      const vz = posAttribute.getZ(i);
      const noise = (Math.sin(vx * 10) + Math.cos(vy * 10) + Math.sin(vz * 10)) * 0.035;
      posAttribute.setXYZ(i, vx + noise, vy + noise, vz + noise);
    }
    rockGeo.computeVertexNormals();

    const rockMat = new THREE.MeshStandardMaterial({
      color: 0x475569, // Solid slate granite grey
      roughness: 0.95, // Very rough natural stone surface
      metalness: 0.05, // Non-metallic solid rock
      emissive: 0x1e293b, // Subtle dark slate shadow depth
      emissiveIntensity: 0.15,
      transparent: false, // 100% opaque solid stone block
      flatShading: true // Faceted mountain rock look
    });
    const rockMesh = new THREE.Mesh(rockGeo, rockMat);
    rockMesh.position.set(-1.6, 0, 0);
    scene.add(rockMesh);
    rockMeshRef.current = rockMesh;

    // 4b. PAPER (Warm ivory #F8FAFC, folded sheet, lightweight appearance)
    const paperGeo = new THREE.BoxGeometry(0.85, 1.15, 0.04);
    const paperMat = new THREE.MeshStandardMaterial({
      color: 0xf8fafc,
      roughness: 0.4,
      metalness: 0.05,
      emissive: 0xff5f6d,
      emissiveIntensity: 0.35,
      transparent: true,
      opacity: 0.95
    });
    const paperMesh = new THREE.Mesh(paperGeo, paperMat);
    paperMesh.position.set(0, 0, 0);
    paperMesh.rotation.set(0.15, -0.2, 0.1);
    scene.add(paperMesh);
    paperMeshRef.current = paperMesh;

    // 4c. SCISSORS (Chrome blades, dark handles, coral reflections)
    const scissorsGroup = new THREE.Group();
    const chromeMat = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      metalness: 0.95,
      roughness: 0.1,
      emissive: 0xffffff,
      emissiveIntensity: 0.2
    });
    const handleMat = new THREE.MeshStandardMaterial({
      color: 0xff5f6d,
      roughness: 0.3,
      metalness: 0.4,
      emissive: 0xff5f6d,
      emissiveIntensity: 0.4
    });

    const blade1 = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.75, 0.02), chromeMat);
    blade1.rotation.z = -0.3;
    const blade2 = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.75, 0.02), chromeMat);
    blade2.rotation.z = 0.3;

    const ring1 = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.03, 12, 24), handleMat);
    ring1.position.set(-0.22, -0.38, 0);
    const ring2 = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.03, 12, 24), handleMat);
    ring2.position.set(0.22, -0.38, 0);

    scissorsGroup.add(blade1, blade2, ring1, ring2);
    scissorsGroup.position.set(1.6, 0, 0);
    scene.add(scissorsGroup);
    scissorsGroupRef.current = scissorsGroup;

    // 5. Initialize RPSResultAnimator & Pre-compile GPU Shaders
    const animator = new RPSResultAnimator({
      scene,
      camera,
      rockMesh,
      paperMesh,
      scissorsGroup,
      rimLight,
      isMobile: width < 768,
      reducedMotion
    });
    animatorRef.current = animator;

    // Force immediate GPU shader compilation to eliminate first-frame render stutter
    try {
      renderer.compile(scene, camera);
    } catch (e) {
      // Ignored if compile unsupported
    }

    // 6. Mouse Parallax Handler
    const handleMouseMove = (e: MouseEvent) => {
      if (reducedMotion) return;
      targetMousePos.current = {
        x: (e.clientX / window.innerWidth) * 2 - 1,
        y: -(e.clientY / window.innerHeight) * 2 + 1
      };
    };
    window.addEventListener('mousemove', handleMouseMove);

    // 7. Single Authoritative Render Loop
    let clock = 0;
    const renderTimer = createTimer({
      onUpdate: () => {
        if (document.visibilityState === 'hidden') return;

        clock += 0.015;

        // Smooth Lerp for Mouse Cursor Light & Camera Parallax
        mousePos.current.x += (targetMousePos.current.x - mousePos.current.x) * 0.05;
        mousePos.current.y += (targetMousePos.current.y - mousePos.current.y) * 0.05;

        if (cursorLightRef.current) {
          cursorLightRef.current.position.set(mousePos.current.x * 2.5, mousePos.current.y * 1.8, 2.5);
        }

        // Camera subtle Parallax (3-5° horizontal, 2-3° vertical)
        if (!reducedMotion && cameraRef.current) {
          cameraRef.current.position.x = mousePos.current.x * 0.25;
          cameraRef.current.position.y = mousePos.current.y * 0.15;
          cameraRef.current.lookAt(0, 0, 0);
        }

        // Idle Character-Specific Physical Movement with Strict X Separation
        if (!reducedMotion && (phase === 'CHOOSING' || phase === 'PLAYER_LOCKED' || phase === 'BOTH_LOCKED')) {
          if (rockMeshRef.current) {
            rockMeshRef.current.position.set(-1.8, Math.sin(clock * 1.0) * 0.03, 0);
            rockMeshRef.current.rotation.y += 0.003;
          }
          if (paperMeshRef.current) {
            paperMeshRef.current.position.set(0, Math.cos(clock * 1.3) * 0.05, 0);
            paperMeshRef.current.rotation.z = Math.sin(clock * 1.1) * 0.05;
          }
          if (scissorsGroupRef.current) {
            scissorsGroupRef.current.position.set(1.8, Math.sin(clock * 1.2 + 0.5) * 0.04, 0);
            scissorsGroupRef.current.rotation.y += 0.004;
          }
        }

        renderer.render(scene, camera);
      }
    });

    // 8. Robust ResizeObserver for Dynamic Dimension Tracking
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = entry.contentRect.width || container.clientWidth || 600;
        const h = entry.contentRect.height || container.clientHeight || 320;
        if (w > 0 && h > 0) {
          camera.aspect = w / h;
          camera.updateProjectionMatrix();
          renderer.setSize(w, h);
        }
      }
    });
    resizeObserver.observe(container);

    // 9. Complete Disposal on Unmount
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      resizeObserver.disconnect();
      renderTimer.pause();

      if (animatorRef.current) {
        animatorRef.current.dispose();
      }

      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }

      rockGeo.dispose();
      rockMat.dispose();
      paperGeo.dispose();
      paperMat.dispose();
      blade1.geometry.dispose();
      blade2.geometry.dispose();
      ring1.geometry.dispose();
      ring2.geometry.dispose();
      chromeMat.dispose();
      handleMat.dispose();

      scene.clear();
      renderer.dispose();
    };
  }, [reducedMotion]);

  // Trigger Result Animation on Phase Transition
  useEffect(() => {
    if ((phase === 'REVEAL' || phase === 'RESULT') && playerChoice && opponentChoice && animatorRef.current) {
      const outcome = RPSGameEngine.determineOutcome(playerChoice, opponentChoice);
      animatorRef.current.playResultAnimation(playerChoice, opponentChoice, outcome);
    } else if (phase === 'CHOOSING' && animatorRef.current) {
      animatorRef.current.resetScene();
    }
  }, [phase, playerChoice, opponentChoice]);

  // Object Focus & Selection Scale Animations
  useEffect(() => {
    if (!rockMeshRef.current || !paperMeshRef.current || !scissorsGroupRef.current) return;
    if (phase === 'REVEAL' || phase === 'RESULT') return; // Handled by animator

    const rock = rockMeshRef.current;
    const paper = paperMeshRef.current;
    const scissors = scissorsGroupRef.current;

    if (playerChoice === 'rock') {
      animate(rock.scale, { x: 1.15, y: 1.15, z: 1.15, duration: 400, ease: 'outExpo' });
      animate(paper.scale, { x: 0.7, y: 0.7, z: 0.7, duration: 400, ease: 'outExpo' });
      animate(scissors.scale, { x: 0.7, y: 0.7, z: 0.7, duration: 400, ease: 'outExpo' });
    } else if (playerChoice === 'paper') {
      animate(paper.scale, { x: 1.15, y: 1.15, z: 1.15, duration: 400, ease: 'outExpo' });
      animate(rock.scale, { x: 0.7, y: 0.7, z: 0.7, duration: 400, ease: 'outExpo' });
      animate(scissors.scale, { x: 0.7, y: 0.7, z: 0.7, duration: 400, ease: 'outExpo' });
    } else if (playerChoice === 'scissors') {
      animate(scissors.scale, { x: 1.15, y: 1.15, z: 1.15, duration: 400, ease: 'outExpo' });
      animate(rock.scale, { x: 0.7, y: 0.7, z: 0.7, duration: 400, ease: 'outExpo' });
      animate(paper.scale, { x: 0.7, y: 0.7, z: 0.7, duration: 400, ease: 'outExpo' });
    } else {
      animate(rock.scale, { x: 1.0, y: 1.0, z: 1.0, duration: 400, ease: 'outExpo' });
      animate(paper.scale, { x: 1.0, y: 1.0, z: 1.0, duration: 400, ease: 'outExpo' });
      animate(scissors.scale, { x: 1.0, y: 1.0, z: 1.0, duration: 400, ease: 'outExpo' });
    }
  }, [playerChoice, phase]);

  return (
    <div className="w-full h-full relative pointer-events-none select-none overflow-hidden z-0">
      {/* Background Soft Coral Atmosphere Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] rounded-full bg-[#ff5f6d]/15 blur-[120px] pointer-events-none" />
      <div ref={containerRef} className="w-full h-full min-h-[200px]" />
    </div>
  );
};
