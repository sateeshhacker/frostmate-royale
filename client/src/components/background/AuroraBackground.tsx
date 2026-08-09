import React, { useEffect, useRef } from 'react';
import { useGameStore } from '../../store/useGameStore.js';

export const AuroraBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const viewMode = useGameStore((s) => s.viewMode);
  const roomState = useGameStore((s) => s.roomState);

  // Target RGB color channels for smooth transition
  const targetColorRef = useRef({ r1: 0, g1: 242, b1: 254, r2: 79, g2: 172, b2: 254 });
  const currentColorRef = useRef({ r1: 0, g1: 242, b1: 254, r2: 79, g2: 172, b2: 254 });
  const paceSpeedRef = useRef(0.005);

  useEffect(() => {
    if (viewMode === 'landing' || !roomState) {
      targetColorRef.current = { r1: 0, g1: 242, b1: 254, r2: 79, g2: 172, b2: 254 };
      paceSpeedRef.current = 0.005;
    } else if (roomState.status === 'checkmate' || roomState.status === 'resigned' || roomState.status === 'timeout') {
      targetColorRef.current = { r1: 255, g1: 215, b1: 0, r2: 255, g2: 140, b2: 0 };
      paceSpeedRef.current = 0.015;
    } else if (roomState.isCheck) {
      targetColorRef.current = { r1: 255, g1: 30, b1: 50, r2: 180, g2: 0, b2: 30 };
      paceSpeedRef.current = 0.02; // Fast pulse during check
    } else if (roomState.moveHistory.length > 20) {
      targetColorRef.current = { r1: 127, g1: 0, b1: 255, r2: 225, g2: 0, b2: 255 };
      paceSpeedRef.current = 0.012;
    } else if (roomState.status === 'playing') {
      targetColorRef.current = { r1: 14, g1: 165, b1: 233, r2: 99, g2: 102, b2: 241 };
      paceSpeedRef.current = 0.008;
    } else {
      targetColorRef.current = { r1: 0, g1: 242, b1: 254, r2: 79, g2: 172, b2: 254 };
      paceSpeedRef.current = 0.005;
    }
  }, [viewMode, roomState?.status, roomState?.isCheck, roomState?.moveHistory.length]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    const particles = Array.from({ length: 65 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: Math.random() * 2 + 0.8,
      speedX: (Math.random() - 0.5) * 0.4,
      speedY: -Math.random() * 0.5 - 0.2,
      opacity: Math.random() * 0.7 + 0.3
    }));

    let step = 0;

    const render = () => {
      step += paceSpeedRef.current;

      const cur = currentColorRef.current;
      const tgt = targetColorRef.current;
      cur.r1 += (tgt.r1 - cur.r1) * 0.04;
      cur.g1 += (tgt.g1 - cur.g1) * 0.04;
      cur.b1 += (tgt.b1 - cur.b1) * 0.04;
      cur.r2 += (tgt.r2 - cur.r2) * 0.04;
      cur.g2 += (tgt.g2 - cur.g2) * 0.04;
      cur.b2 += (tgt.b2 - cur.b2) * 0.04;

      ctx.clearRect(0, 0, width, height);

      // Base background
      const baseGrad = ctx.createRadialGradient(width / 2, height / 2, 0, width / 2, height / 2, Math.max(width, height));
      baseGrad.addColorStop(0, '#090d18');
      baseGrad.addColorStop(1, '#030712');
      ctx.fillStyle = baseGrad;
      ctx.fillRect(0, 0, width, height);

      // Aurora Mesh Blob 1
      const cx1 = width * 0.3 + Math.sin(step) * 160;
      const cy1 = height * 0.4 + Math.cos(step * 0.8) * 110;
      const grad1 = ctx.createRadialGradient(cx1, cy1, 10, cx1, cy1, width * 0.55);
      grad1.addColorStop(0, `rgba(${Math.round(cur.r1)}, ${Math.round(cur.g1)}, ${Math.round(cur.b1)}, 0.28)`);
      grad1.addColorStop(1, 'rgba(3, 7, 18, 0)');
      ctx.fillStyle = grad1;
      ctx.beginPath();
      ctx.arc(cx1, cy1, width * 0.55, 0, Math.PI * 2);
      ctx.fill();

      // Aurora Mesh Blob 2
      const cx2 = width * 0.7 + Math.cos(step * 0.9) * 190;
      const cy2 = height * 0.6 + Math.sin(step * 1.1) * 130;
      const grad2 = ctx.createRadialGradient(cx2, cy2, 10, cx2, cy2, width * 0.5);
      grad2.addColorStop(0, `rgba(${Math.round(cur.r2)}, ${Math.round(cur.g2)}, ${Math.round(cur.b2)}, 0.25)`);
      grad2.addColorStop(1, 'rgba(3, 7, 18, 0)');
      ctx.fillStyle = grad2;
      ctx.beginPath();
      ctx.arc(cx2, cy2, width * 0.5, 0, Math.PI * 2);
      ctx.fill();

      // Check State Red Vignette Edge Pulse
      if (roomState?.isCheck) {
        const edgeGrad = ctx.createRadialGradient(width / 2, height / 2, Math.min(width, height) * 0.3, width / 2, height / 2, Math.max(width, height) * 0.7);
        edgeGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
        edgeGrad.addColorStop(1, `rgba(255, 0, 40, ${0.35 + Math.sin(step * 8) * 0.15})`);
        ctx.fillStyle = edgeGrad;
        ctx.fillRect(0, 0, width, height);
      }

      // Render Floating Dust Particles
      particles.forEach((p) => {
        p.x += p.speedX * (paceSpeedRef.current / 0.005);
        p.y += p.speedY * (paceSpeedRef.current / 0.005);
        if (p.y < 0) {
          p.y = height;
          p.x = Math.random() * width;
        }
        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;

        ctx.fillStyle = `rgba(255, 255, 255, ${p.opacity * 0.6})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
      });

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0 transition-opacity duration-1000"
      style={{ filter: 'contrast(105%)' }}
    />
  );
};
