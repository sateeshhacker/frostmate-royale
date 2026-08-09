import * as THREE from 'three';
import { createTimeline, animate } from 'animejs';
import { RPSChoice, RPSOutcome } from '../engine/RPSGameEngine.js';

export interface RPSResultAnimatorOptions {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  rockMesh: THREE.Mesh;
  paperMesh: THREE.Mesh;
  scissorsGroup: THREE.Group;
  rimLight: THREE.PointLight;
  isMobile?: boolean;
  reducedMotion?: boolean;
}

export class RPSResultAnimator {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private rockMesh: THREE.Mesh;
  private paperMesh: THREE.Mesh;
  private scissorsGroup: THREE.Group;
  private rimLight: THREE.PointLight;

  private isMobile: boolean;
  private reducedMotion: boolean;

  // Track active anime.js timeline to prevent leftover animation leaks
  private activeTimeline: any = null;

  // Object Pool for Paper Fragments / Particles (12-20 on desktop, 5-8 on mobile)
  private fragmentPool: THREE.Mesh[] = [];
  private fragmentGeo: THREE.PlaneGeometry;
  private fragmentMat: THREE.MeshStandardMaterial;

  // Split Paper Half Meshes
  private paperLeftMesh: THREE.Mesh | null = null;
  private paperRightMesh: THREE.Mesh | null = null;
  private paperSplitGroup: THREE.Group | null = null;

  constructor(options: RPSResultAnimatorOptions) {
    this.scene = options.scene;
    this.camera = options.camera;
    this.rockMesh = options.rockMesh;
    this.paperMesh = options.paperMesh;
    this.scissorsGroup = options.scissorsGroup;
    this.rimLight = options.rimLight;
    this.isMobile = options.isMobile || false;
    this.reducedMotion = options.reducedMotion || false;

    // Shared Off-White Paper Fragment Geometry & Warm Material (NO RAINBOW CONFETTI)
    this.fragmentGeo = new THREE.PlaneGeometry(0.06, 0.06);
    this.fragmentMat = new THREE.MeshStandardMaterial({
      color: 0xf8fafc,
      roughness: 0.6,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.95
    });

    this.initFragmentPool();
  }

  // Pre-create Lightweight Fragment Object Pool to eliminate runtime allocations
  private initFragmentPool() {
    const poolSize = this.isMobile ? 8 : 18;
    for (let i = 0; i < poolSize; i++) {
      const mesh = new THREE.Mesh(this.fragmentGeo, this.fragmentMat);
      mesh.visible = false;
      this.scene.add(mesh);
      this.fragmentPool.push(mesh);
    }
  }

  /**
   * Main Entry: Plays deterministic, physically directed result animation based on authoritative game state.
   */
  public playResultAnimation(
    playerChoice: RPSChoice,
    opponentChoice: RPSChoice,
    outcome: RPSOutcome,
    onComplete?: () => void
  ) {
    this.resetScene();

    if (this.reducedMotion) {
      this.playReducedMotionAnimation(onComplete);
      return;
    }

    if (playerChoice === opponentChoice || outcome === 'draw') {
      this.playDrawAnimation(playerChoice, onComplete);
    } else if (
      (playerChoice === 'scissors' && opponentChoice === 'paper') ||
      (playerChoice === 'paper' && opponentChoice === 'scissors')
    ) {
      this.playCinematicScissorsCutsPaper(playerChoice === 'scissors', onComplete);
    } else if (
      (playerChoice === 'rock' && opponentChoice === 'scissors') ||
      (playerChoice === 'scissors' && opponentChoice === 'rock')
    ) {
      this.playCinematicRockCrushesScissors(playerChoice === 'rock', onComplete);
    } else if (
      (playerChoice === 'paper' && opponentChoice === 'rock') ||
      (playerChoice === 'rock' && opponentChoice === 'paper')
    ) {
      this.playCinematicPaperCoversRock(playerChoice === 'paper', onComplete);
    } else {
      if (onComplete) onComplete();
    }
  }

  /**
   * 🎬 MATCHUP 1: ROCK VS SCISSORS — PHYSICALLY DIRECTED HEAVY IMPACT & RECOIL
   * 
   * Sequence:
   * 0.00–0.35s: Staging (Rock at x = -2.4, Scissors at x = +2.4)
   * 0.35–0.75s: Tension & Rotational Wind-Up
   * 0.75–1.35s: Physical Approach (Accelerating to center meeting point)
   * 1.35–1.65s: Final Attack & Slow-Motion Anticipation
   * 1.65–1.90s: Direct Physical Impact at x = 0.0 (Rock hits Scissors)
   * 1.90–2.40s: Scissors Recoil, Tumble & Air Drift
   * 1.90–2.30s: Rock Heavy Momentum Follow-Through
   * 2.30–3.20s: Zero-Gravity Aftermath & Smooth Camera Pull-Back
   * 3.20–3.80s: Result & Score Reveal
   */
  private playCinematicRockCrushesScissors(isPlayerWinner: boolean, onComplete?: () => void) {
    const rock = this.rockMesh;
    const scissors = this.scissorsGroup;
    const paper = this.paperMesh;

    paper.visible = false;

    // Determine left vs right staging based on who picked Rock
    const rockOnLeft = isPlayerWinner;
    const rockStartPos = rockOnLeft ? -2.4 : 2.4;
    const scissorsStartPos = rockOnLeft ? 2.4 : -2.4;

    rock.position.set(rockStartPos, 0, 0);
    scissors.position.set(scissorsStartPos, 0, 0);

    const tl = createTimeline({
      onComplete: () => {
        if (onComplete) onComplete();
      }
    });
    this.activeTimeline = tl;

    // PHASE 1: STAGING (0.00 - 0.35s)
    tl.add(this.camera.position, { z: 4.6, duration: 350, ease: 'easeInOutSine' }, 0);
    tl.add(this.rimLight, { intensity: 18, duration: 350 }, 0);

    // PHASE 2: TENSION & WIND-UP (0.35 - 0.75s)
    // Rock draws back slightly; Scissors tilts into defense posture
    tl.add(rock.position, { x: rockOnLeft ? -2.6 : 2.6, y: 0.1, duration: 400, ease: 'outQuad' }, 350);
    tl.add(rock.rotation, { z: rockOnLeft ? -0.3 : 0.3, duration: 400 }, 350);

    tl.add(scissors.position, { x: rockOnLeft ? 2.2 : -2.2, y: -0.05, duration: 400, ease: 'outQuad' }, 350);
    tl.add(scissors.rotation, { z: rockOnLeft ? 0.3 : -0.3, duration: 400 }, 350);

    // PHASE 3 & 4: PHYSICAL APPROACH & IMPACT RUN (0.75 - 1.65s)
    // Both objects rush toward central collision point (x = -0.3 vs x = +0.3)
    const rockImpactX = rockOnLeft ? -0.2 : 0.2;
    const scissorsImpactX = rockOnLeft ? 0.25 : -0.25;

    tl.add(rock.position, { x: rockImpactX, z: 0.2, duration: 850, ease: 'easeInOutQuart' }, 750);
    tl.add(rock.rotation, { z: rockOnLeft ? 1.4 : -1.4, duration: 850, ease: 'easeInOutQuart' }, 750);

    tl.add(scissors.position, { x: scissorsImpactX, z: 0.1, duration: 850, ease: 'easeInOutCubic' }, 750);
    tl.add(scissors.rotation, { z: rockOnLeft ? -0.4 : 0.4, duration: 850 }, 750);

    // PHASE 5: HERO IMPACT (1.65s - 1.90s)
    // At 1.65s, Rock strikes Scissors at center (x = 0)!
    tl.add(this.rimLight, { intensity: 28, duration: 120, ease: 'outExpo' }, 1650);
    tl.add(this.rimLight, { intensity: 10, duration: 250, ease: 'outSine' }, 1770);

    // Camera impact shake
    tl.add(this.camera.position, { y: -0.09, duration: 60, ease: 'outQuad' }, 1650);
    tl.add(this.camera.position, { y: 0, duration: 120, ease: 'outSine' }, 1710);

    // PHASE 6: SCISSORS RECOIL & TUMBLE (1.90s - 2.40s)
    // Scissors is blasted backward by the heavy impact
    const recoilX = rockOnLeft ? 2.5 : -2.5;
    tl.add(scissors.position, { x: recoilX, y: -0.4, z: -0.6, duration: 750, ease: 'outExpo' }, 1650);
    tl.add(scissors.rotation, { z: rockOnLeft ? -1.8 : 1.8, y: 0.8, duration: 750, ease: 'outExpo' }, 1650);

    // PHASE 7: ROCK HEAVY MOMENTUM FOLLOW-THROUGH (1.90s - 2.30s)
    // Heavy Rock continues moving forward past impact point before settling
    const followX = rockOnLeft ? 0.35 : -0.35;
    const settleX = rockOnLeft ? 0.15 : -0.15;

    tl.add(rock.position, { x: followX, duration: 250, ease: 'outQuad' }, 1650);
    tl.add(rock.position, { x: settleX, duration: 400, ease: 'outSine' }, 1900);

    // PHASE 8: AFTERMATH & CAMERA PULL-BACK (2.30s - 3.20s)
    tl.add(this.camera.position, { x: 0, y: 0, z: 5.0, duration: 800, ease: 'easeInOutSine' }, 2300);
  }

  /**
   * 🎬 MATCHUP 2: PAPER VS ROCK — PHYSICALLY DIRECTED ENVELOPMENT
   */
  private playCinematicPaperCoversRock(isPlayerWinner: boolean, onComplete?: () => void) {
    const paper = this.paperMesh;
    const rock = this.rockMesh;
    const scissors = this.scissorsGroup;

    scissors.visible = false;

    const paperOnLeft = isPlayerWinner;
    const paperStartPos = paperOnLeft ? -2.4 : 2.4;
    const rockStartPos = paperOnLeft ? 2.4 : -2.4;

    paper.position.set(paperStartPos, 0, 0);
    rock.position.set(rockStartPos, 0, 0);

    const tl = createTimeline({
      onComplete: () => {
        if (onComplete) onComplete();
      }
    });
    this.activeTimeline = tl;

    // PHASE 1 & 2: STAGING & TENSION (0.00 - 0.75s)
    tl.add(this.camera.position, { z: 4.6, duration: 600, ease: 'easeInOutSine' }, 0);
    tl.add(this.rimLight, { intensity: 18, duration: 600 }, 0);

    // PHASE 3: PHYSICAL APPROACH (0.75 - 1.50s)
    // Both objects approach center; Paper floats higher on Z/Y axis to prepare for envelopment
    const rockTargetX = paperOnLeft ? -0.3 : 0.3;
    const paperTargetX = paperOnLeft ? -0.3 : 0.3;

    tl.add(rock.position, { x: rockTargetX, z: 0.1, duration: 750, ease: 'easeInOutSine' }, 750);
    tl.add(paper.position, { x: paperTargetX, y: 0.15, z: 0.4, duration: 750, ease: 'easeInOutCubic' }, 750);
    tl.add(paper.scale, { x: 1.6, y: 1.6, z: 1.6, duration: 750, ease: 'easeInOutCubic' }, 750);

    // PHASE 4 & 5: ENVELOPMENT IMPACT (1.50s - 2.10s)
    // Paper wraps directly around Rock
    tl.add(paper.position, { x: rockTargetX, y: 0.05, z: 0.25, duration: 400, ease: 'outCubic' }, 1500);
    tl.add(paper.rotation, { x: 0.4, y: -0.5, z: 0.2, duration: 400 }, 1500);

    // Rock scales down underneath paper cover
    tl.add(rock.scale, { x: 0.4, y: 0.4, z: 0.4, duration: 400, ease: 'outSine' }, 1700);

    // PHASE 6 & 8: AFTERMATH & CAMERA PULL-BACK (2.30s - 3.20s)
    tl.add(this.camera.position, { x: 0, y: 0, z: 5.0, duration: 800, ease: 'easeInOutSine' }, 2300);
  }

  /**
   * 🎬 MATCHUP 3: SCISSORS VS PAPER — PHYSICALLY DIRECTED SLOW-MOTION CUT
   */
  private playCinematicScissorsCutsPaper(isPlayerWinner: boolean, onComplete?: () => void) {
    const scissors = this.scissorsGroup;
    const paper = this.paperMesh;
    const rock = this.rockMesh;

    rock.visible = false;
    paper.visible = false; // Swap for split halves at cut moment

    const scissorsOnLeft = isPlayerWinner;
    const scissorsStartPos = scissorsOnLeft ? -2.4 : 2.4;
    const paperStartPos = scissorsOnLeft ? 2.4 : -2.4;

    // Create Split Left & Right Paper Halves
    const halfGeoLeft = new THREE.PlaneGeometry(0.42, 1.15);
    const halfGeoRight = new THREE.PlaneGeometry(0.42, 1.15);
    const paperMat = (paper.material as THREE.MeshStandardMaterial).clone();

    this.paperLeftMesh = new THREE.Mesh(halfGeoLeft, paperMat);
    this.paperRightMesh = new THREE.Mesh(halfGeoRight, paperMat);

    this.paperLeftMesh.position.set(-0.21, 0, 0);
    this.paperRightMesh.position.set(0.21, 0, 0);

    const paperGroup = new THREE.Group();
    paperGroup.add(this.paperLeftMesh, this.paperRightMesh);
    paperGroup.position.set(paperStartPos, 0, 0);
    this.paperSplitGroup = paperGroup;
    this.scene.add(paperGroup);

    // Blades inside scissors group
    const blade1 = scissors.children[0] as THREE.Mesh;
    const blade2 = scissors.children[1] as THREE.Mesh;

    scissors.position.set(scissorsStartPos, 0, 0);
    blade1.rotation.z = -0.15;
    blade2.rotation.z = 0.15;

    const tl = createTimeline({
      onComplete: () => {
        this.scene.remove(paperGroup);
        halfGeoLeft.dispose();
        halfGeoRight.dispose();
        paperMat.dispose();
        if (onComplete) onComplete();
      }
    });
    this.activeTimeline = tl;

    // PHASE 1: STAGING (0.00s - 0.35s)
    tl.add(this.camera.position, { z: 4.6, duration: 350, ease: 'easeInOutSine' }, 0);
    tl.add(this.rimLight, { intensity: 18, duration: 350 }, 0);

    // PHASE 2 & 3: CURVED APPROACH (0.35s - 1.40s)
    // Scissors and Paper move toward central meeting point (x = 0)
    const scissorsTargetX = scissorsOnLeft ? -0.25 : 0.25;
    const paperTargetX = scissorsOnLeft ? 0.1 : -0.1;

    tl.add(scissors.position, { x: scissorsTargetX, y: 0.05, z: 0.2, duration: 900, ease: 'easeInOutCubic' }, 350);
    tl.add(scissors.rotation, { z: scissorsOnLeft ? 0.35 : -0.35, duration: 900, ease: 'easeInOutCubic' }, 350);

    tl.add(paperGroup.position, { x: paperTargetX, duration: 900, ease: 'easeInOutSine' }, 350);
    tl.add(paperGroup.rotation, { z: scissorsOnLeft ? -0.08 : 0.08, duration: 900 }, 350);

    // PHASE 4: BLADE OPEN & ANTICIPATION PAUSE (1.40s - 1.75s)
    tl.add(this.camera.position, { x: 0, y: 0, z: 3.8, duration: 350, ease: 'outCubic' }, 1400);
    tl.add(blade1.rotation, { z: -0.45, duration: 250, ease: 'outQuad' }, 1400);
    tl.add(blade2.rotation, { z: 0.45, duration: 250, ease: 'outQuad' }, 1400);

    // PHASE 5: HERO CUT & CONTACT (1.75s - 2.10s)
    // Blades close tightly through paper
    tl.add(blade1.rotation, { z: -0.05, duration: 200, ease: 'easeInOutExpo' }, 1750);
    tl.add(blade2.rotation, { z: 0.05, duration: 200, ease: 'easeInOutExpo' }, 1750);

    // Exact contact (1.90s): Rim light flash & camera recoil
    tl.add(this.rimLight, { intensity: 28, duration: 120, ease: 'outExpo' }, 1900);
    tl.add(this.rimLight, { intensity: 10, duration: 250, ease: 'outSine' }, 2020);

    tl.add(this.camera.position, { y: -0.06, duration: 60, ease: 'outQuad' }, 1900);
    tl.add(this.camera.position, { y: 0, duration: 100, ease: 'outSine' }, 1960);

    // Scissors recoil slightly
    tl.add(scissors.position, { x: scissorsOnLeft ? -0.45 : 0.45, y: 0.1, duration: 200, ease: 'outQuad' }, 1920);

    // PHASE 6: ZERO-GRAVITY PAPER SEPARATION (2.10s - 2.80s)
    tl.add(this.paperLeftMesh.position, { x: -0.85, y: 0.35, z: -0.3, duration: 700, ease: 'outCubic' }, 2100);
    tl.add(this.paperLeftMesh.rotation, { z: -0.4, y: -0.3, duration: 700, ease: 'outCubic' }, 2100);

    tl.add(this.paperRightMesh.position, { x: 0.85, y: -0.35, z: -0.3, duration: 700, ease: 'outCubic' }, 2100);
    tl.add(this.paperRightMesh.rotation, { z: 0.4, y: 0.3, duration: 700, ease: 'outCubic' }, 2100);

    // Spawn 12-18 Off-White Floating Paper Fragments from pool
    const fragmentCount = this.isMobile ? 8 : 16;
    for (let i = 0; i < fragmentCount; i++) {
      const frag = this.fragmentPool[i];
      if (frag) {
        frag.position.set(0, (Math.random() - 0.5) * 0.3, 0.1);
        frag.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
        frag.scale.set(0.5 + Math.random() * 0.6, 0.5 + Math.random() * 0.6, 1);
        frag.visible = true;

        animate(frag.position, {
          x: (Math.random() - 0.5) * 2.6,
          y: (Math.random() - 0.5) * 2.0,
          z: Math.random() * 1.4 - 0.4,
          duration: 1400,
          ease: 'outExpo'
        });

        animate(frag.rotation, {
          x: Math.random() * Math.PI * 2,
          y: Math.random() * Math.PI * 2,
          duration: 1400,
          ease: 'outSine'
        });
      }
    }

    // PHASE 8: CINEMATIC AFTERMATH (2.80s - 3.50s)
    tl.add(this.camera.position, { x: 0, y: 0, z: 5.0, duration: 700, ease: 'easeInOutSine' }, 2800);
  }

  /**
   * 🎬 DRAW ANIMATION — PHYSICALLY DIRECTED APPROACH & ENERGY PULSE SEPARATION
   */
  private playDrawAnimation(choice: RPSChoice, onComplete?: () => void) {
    const rock = this.rockMesh;
    const paper = this.paperMesh;
    const scissors = this.scissorsGroup;

    // Position two identical objects on left (x = -2.0) and right (x = +2.0)
    rock.position.set(-2.0, 0, 0);
    scissors.position.set(2.0, 0, 0);
    paper.position.set(0, 0, 0);

    const tl = createTimeline({
      onComplete: () => {
        if (onComplete) onComplete();
      }
    });
    this.activeTimeline = tl;

    // Both objects approach center to meet at x = -0.4 and x = +0.4
    tl.add(rock.position, { x: -0.4, duration: 750, ease: 'easeInOutSine' }, 0);
    tl.add(scissors.position, { x: 0.4, duration: 750, ease: 'easeInOutSine' }, 0);

    // Energy pulse at contact point
    tl.add(this.rimLight, { intensity: 22, duration: 150 }, 750);
    tl.add(this.rimLight, { intensity: 8, duration: 300 }, 900);

    // Objects bounce backward to -1.5 and +1.5
    tl.add(rock.position, { x: -1.5, duration: 600, ease: 'outExpo' }, 900);
    tl.add(scissors.position, { x: 1.5, duration: 600, ease: 'outExpo' }, 900);

    tl.add(this.camera.position, { z: 5.0, duration: 600, ease: 'outSine' }, 1500);
  }

  /**
   * REDUCED MOTION FALLBACK (0.8s)
   */
  private playReducedMotionAnimation(onComplete?: () => void) {
    animate(this.camera.position, {
      z: 5.0,
      duration: 400,
      onComplete: () => {
        if (onComplete) onComplete();
      }
    });
  }

  /**
   * Reset All Scene Objects & Recycle Fragment Pool
   */
  public resetScene() {
    if (this.activeTimeline) {
      try {
        this.activeTimeline.pause();
      } catch (e) {}
      this.activeTimeline = null;
    }

    this.rockMesh.visible = true;
    this.paperMesh.visible = true;
    this.scissorsGroup.visible = true;

    // Reset blade angles inside scissors group
    if (this.scissorsGroup.children.length >= 2) {
      (this.scissorsGroup.children[0] as THREE.Mesh).rotation.z = -0.3;
      (this.scissorsGroup.children[1] as THREE.Mesh).rotation.z = 0.3;
    }

    // Force strict initial positions: Rock (left), Paper (center), Scissors (right)
    this.rockMesh.position.set(-1.8, 0, 0);
    this.rockMesh.scale.set(1, 1, 1);
    this.rockMesh.rotation.set(0, 0, 0);

    this.paperMesh.position.set(0, 0, 0);
    this.paperMesh.scale.set(1, 1, 1);
    this.paperMesh.rotation.set(0.15, -0.2, 0.1);

    this.scissorsGroup.position.set(1.8, 0, 0);
    this.scissorsGroup.scale.set(1, 1, 1);
    this.scissorsGroup.rotation.set(0, 0, 0);

    this.rimLight.intensity = 8;
    this.camera.position.set(0, 0, 5.0);

    // Hide and recycle all fragments in pool
    this.fragmentPool.forEach((frag) => {
      frag.visible = false;
      frag.position.set(0, 0, 0);
    });

    if (this.paperLeftMesh && this.paperLeftMesh.parent) {
      this.paperLeftMesh.parent.remove(this.paperLeftMesh);
      this.paperLeftMesh = null;
    }
    if (this.paperRightMesh && this.paperRightMesh.parent) {
      this.paperRightMesh.parent.remove(this.paperRightMesh);
      this.paperRightMesh = null;
    }
    if (this.paperSplitGroup && this.paperSplitGroup.parent) {
      this.paperSplitGroup.parent.remove(this.paperSplitGroup);
      this.paperSplitGroup = null;
    }
  }

  /**
   * Complete Memory Disposal on Scene Destruction
   */
  public dispose() {
    this.resetScene();
    this.fragmentPool.forEach((frag) => {
      this.scene.remove(frag);
    });
    this.fragmentPool = [];
    this.fragmentGeo.dispose();
    this.fragmentMat.dispose();
  }
}
