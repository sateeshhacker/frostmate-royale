import React, { useState, useEffect, useRef, memo, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { motion } from 'framer-motion';
import { useGameStore } from '../../store/useGameStore.js';
import { emitRollDice, emitMoveLudoToken, socket } from '../../socket/socketClient.js';
import { LudoColor, LudoToken } from '../../types/index.js';
import { Crown, Star, Clock, Sparkles } from 'lucide-react';
import { soundEngine } from '../../audio/soundEngine.js';
import { Dice3D } from '../../games/ludo/components/3DDice.js';

// ─── Track coordinates ───────────────────────────────────────────────
const MAIN_TRACK: Array<{r:number;c:number}> = [
  {r:6,c:1},{r:6,c:2},{r:6,c:3},{r:6,c:4},{r:6,c:5},
  {r:5,c:6},{r:4,c:6},{r:3,c:6},{r:2,c:6},{r:1,c:6},{r:0,c:6},
  {r:0,c:7},
  {r:0,c:8},{r:1,c:8},{r:2,c:8},{r:3,c:8},{r:4,c:8},{r:5,c:8},
  {r:6,c:9},{r:6,c:10},{r:6,c:11},{r:6,c:12},{r:6,c:13},{r:6,c:14},
  {r:7,c:14},
  {r:8,c:14},{r:8,c:13},{r:8,c:12},{r:8,c:11},{r:8,c:10},{r:8,c:9},
  {r:9,c:8},{r:10,c:8},{r:11,c:8},{r:12,c:8},{r:13,c:8},{r:14,c:8},
  {r:14,c:7},
  {r:14,c:6},{r:13,c:6},{r:12,c:6},{r:11,c:6},{r:10,c:6},{r:9,c:6},
  {r:8,c:5},{r:8,c:4},{r:8,c:3},{r:8,c:2},{r:8,c:1},{r:8,c:0},
  {r:7,c:0},
  {r:6,c:0}
];

const HOME_STRETCH: Record<LudoColor, Array<{r:number;c:number}>> = {
  red:   [{r:7,c:1},{r:7,c:2},{r:7,c:3},{r:7,c:4},{r:7,c:5},{r:7,c:6}],
  green: [{r:1,c:7},{r:2,c:7},{r:3,c:7},{r:4,c:7},{r:5,c:7},{r:6,c:7}],
  yellow:[{r:7,c:13},{r:7,c:12},{r:7,c:11},{r:7,c:10},{r:7,c:9},{r:7,c:8}],
  blue:  [{r:13,c:7},{r:12,c:7},{r:11,c:7},{r:10,c:7},{r:9,c:7},{r:8,c:7}]
};

const SAFE_STARS = [
  {r:6,c:1,clr:'text-red-400'},{r:2,c:6,clr:'text-red-400'},
  {r:1,c:8,clr:'text-emerald-400'},{r:6,c:12,clr:'text-emerald-400'},
  {r:8,c:13,clr:'text-amber-300'},{r:12,c:8,clr:'text-amber-300'},
  {r:13,c:6,clr:'text-blue-400'},{r:8,c:2,clr:'text-blue-400'}
];

function getCell(color: LudoColor, step: number): {r:number;c:number}|null {
  if (step < 0) return null;
  if (step >= 51) return HOME_STRETCH[color][Math.min(step - 51, 5)];
  const off: Record<LudoColor,number> = {red:0,green:13,yellow:26,blue:39};
  return MAIN_TRACK[(step+off[color])%52];
}

const CT: Record<LudoColor,{bg:string;text:string;border:string;glow:string;hex:string}> = {
  red:   {bg:'bg-red-600',   text:'text-red-400',     border:'border-red-500',     glow:'shadow-red-500/50',     hex:'#ef4444'},
  green: {bg:'bg-emerald-600',text:'text-emerald-400', border:'border-emerald-500', glow:'shadow-emerald-500/50', hex:'#10b981'},
  yellow:{bg:'bg-amber-500',  text:'text-amber-300',   border:'border-amber-400',   glow:'shadow-amber-400/50',   hex:'#f59e0b'},
  blue:  {bg:'bg-blue-600',   text:'text-blue-400',    border:'border-blue-500',    glow:'shadow-blue-500/50',    hex:'#3b82f6'}
};

// Base token positions (grid row/col inside 6×6 corners)
const BASE_POS: Record<LudoColor, Array<{r:number;c:number}>> = {
  red:   [{r:2,c:2},{r:2,c:4},{r:4,c:2},{r:4,c:4}],
  green: [{r:2,c:11},{r:2,c:13},{r:4,c:11},{r:4,c:13}],
  blue:  [{r:11,c:2},{r:11,c:4},{r:13,c:2},{r:13,c:4}],
  yellow:[{r:11,c:11},{r:11,c:13},{r:13,c:11},{r:13,c:13}]
};

// Pixel offsets when multiple tokens share a cell
const STACK_OFFSETS: Array<Array<{x:number;y:number}>> = [
  [{x:0,y:0}],                                          // 1 token
  [{x:-7,y:0},{x:7,y:0}],                               // 2 tokens
  [{x:-8,y:-6},{x:8,y:-6},{x:0,y:7}],                   // 3 tokens
  [{x:-8,y:-7},{x:8,y:-7},{x:-8,y:7},{x:8,y:7}],        // 4 tokens
];

const GRID_STYLE: React.CSSProperties = {
  display:'grid',
  gridTemplateColumns:'repeat(15, minmax(0, 1fr))',
  gridTemplateRows:'repeat(15, minmax(0, 1fr))',
  gap:'1px', padding:'4px', borderRadius:'1rem'
};

// ─── 3D Athletic Stickman Token Component with Dynamic Limb Walking ──────
const StickmanTokenFigure: React.FC<{
  color: LudoColor;
  id: number;
  isSelected: boolean;
  isMoving?: boolean;
  isCaptured?: boolean;
  isAtHome?: boolean;
  isDisconnected?: boolean;
}> = memo(({ color, id, isSelected, isMoving, isCaptured, isAtHome, isDisconnected }) => {
  const colorSchemes = {
    red:    { main: '#ef4444', dark: '#991b1b', light: '#fca5a5', glow: 'rgba(239,68,68,0.7)', stroke: '#ffffff' },
    green:  { main: '#10b981', dark: '#047857', light: '#6ee7b7', glow: 'rgba(16,185,129,0.7)', stroke: '#ffffff' },
    yellow: { main: '#f59e0b', dark: '#b45309', light: '#fde68a', glow: 'rgba(245,158,11,0.7)', stroke: '#ffffff' },
    blue:   { main: '#3b82f6', dark: '#1d4ed8', light: '#93c5fd', glow: 'rgba(59,130,246,0.7)', stroke: '#ffffff' }
  };
  const ghostScheme = { main: '#64748b', dark: '#334155', light: '#94a3b8', glow: 'transparent', stroke: '#475569' };
  const scheme = isDisconnected ? ghostScheme : (colorSchemes[color] || colorSchemes.red);

  // Orient stickmen towards their active board path: Red & Blue face Right (1), Yellow & Green face Left (-1)
  const baseFacing = { red: 1, green: -1, yellow: -1, blue: 1 }[color] || 1;
  // If captured & walking in reverse, flip orientation!
  const finalFacing = isCaptured ? -1 * baseFacing : baseFacing;
  const isWalking = isMoving || isCaptured;

  // GLOW RULE: Glowing effect is ONLY ON at Home Base OR when it's the token's turn and selectable!
  const showGlow = !isDisconnected && (isSelected || isAtHome);

  return (
    <div className="relative flex flex-col items-center justify-center">
      <div
        className={`transform transition-transform duration-300 ${isSelected ? 'scale-125' : ''}`}
        style={{ transform: `scaleX(${finalFacing}) ${isSelected ? 'scale(1.25)' : 'scale(1)'}` }}
      >
        <svg viewBox="0 0 44 56" className="w-6 h-8 sm:w-7 sm:h-9 drop-shadow-xl overflow-visible">
          {/* Glow Pedestal Ring - Active ONLY at Home Base or on Player Turn */}
          {showGlow && (
            <ellipse
              cx="22"
              cy="50"
              rx="17"
              ry="5"
              fill={scheme.glow}
              opacity={isSelected ? "0.9" : "0.5"}
              className={isSelected ? 'animate-pulse' : ''}
            />
          )}
          <ellipse cx="22" cy="48" rx="15" ry="4" fill={scheme.dark} stroke={scheme.stroke} strokeWidth="1.2" />

          {/* 3D Stickman Body & Head with Stride Bob */}
          <g className={isWalking ? 'anim-human-stride-bob' : ''}>
            {/* Animated Limb Paths */}
            <g strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" fill="none">
              {/* Back Leg */}
              <path
                d="M 22 28 L 13 38 L 8 47"
                stroke={scheme.dark}
                opacity="0.8"
                className={isWalking ? 'anim-human-back-leg' : ''}
              />
              {/* Front Leg */}
              <path
                d="M 22 28 L 29 37 L 34 47"
                stroke={scheme.main}
                strokeWidth="3.5"
                className={isWalking ? 'anim-human-front-leg' : ''}
              />
              {/* Spine / Torso */}
              <path d="M 22 14 Q 20 20 22 28" stroke={scheme.main} strokeWidth="4" />
              {/* Back Arm */}
              <path
                d="M 22 17 L 13 23 L 9 29"
                stroke={scheme.dark}
                strokeWidth="2.8"
                opacity="0.8"
                className={isWalking ? 'anim-human-back-arm' : ''}
              />
              {/* Front Arm */}
              <path
                d="M 22 17 L 30 22 L 35 18"
                stroke={scheme.main}
                strokeWidth="3"
                className={isWalking ? 'anim-human-front-arm' : ''}
              />
            </g>

            {/* Stickman Head Sphere */}
            <circle cx="22" cy="9" r="6.5" fill={`url(#stick-head-${color})`} stroke="#ffffff" strokeWidth="1.2" />
            <circle cx="20" cy="7" r="2" fill="#ffffff" opacity="0.6" />

            {/* Number Badge (Unflipped text readability) */}
            <g style={{ transformOrigin: '22px 23px', transform: `scaleX(${finalFacing})` }}>
              <circle cx="22" cy="23" r="4" fill="#000000" stroke={scheme.stroke} strokeWidth="0.8" opacity="0.9" />
              <text x="22" y="24.2" textAnchor="middle" dominantBaseline="middle" fill="#ffffff" fontSize="5" fontWeight="bold">
                {id + 1}
              </text>
            </g>
          </g>

          {/* Gradients */}
          <defs>
            <radialGradient id={`stick-head-${color}`} cx="35%" cy="35%" r="65%">
              <stop offset="0%" stopColor={scheme.light} />
              <stop offset="60%" stopColor={scheme.main} />
              <stop offset="100%" stopColor={scheme.dark} />
            </radialGradient>
          </defs>
        </svg>
      </div>
    </div>
  );
});

// ─── Spider-Man Theme Components ────────────────────────────────────

// Spiderweb SVG background pattern - Glow & animate ONLY when it's that player's active turn!
const SpiderWebBg: React.FC<{ strokeColor: string; active?: boolean }> = ({ strokeColor, active }) => (
  <svg
    viewBox="0 0 100 100"
    className={`absolute inset-0 w-full h-full pointer-events-none transition-all duration-500 ${
      active ? 'anim-web-active opacity-85 scale-105' : 'opacity-20'
    }`}
  >
    {/* Spokes */}
    <line x1="50" y1="50" x2="50" y2="5" stroke={strokeColor} strokeWidth="1.2" strokeDasharray="3 2" />
    <line x1="50" y1="50" x2="95" y2="50" stroke={strokeColor} strokeWidth="1.2" strokeDasharray="3 2" />
    <line x1="50" y1="50" x2="50" y2="95" stroke={strokeColor} strokeWidth="1.2" strokeDasharray="3 2" />
    <line x1="50" y1="50" x2="5" y2="50" stroke={strokeColor} strokeWidth="1.2" strokeDasharray="3 2" />
    <line x1="50" y1="50" x2="82" y2="18" stroke={strokeColor} strokeWidth="1.2" strokeDasharray="3 2" />
    <line x1="50" y1="50" x2="82" y2="82" stroke={strokeColor} strokeWidth="1.2" strokeDasharray="3 2" />
    <line x1="50" y1="50" x2="18" y2="82" stroke={strokeColor} strokeWidth="1.2" strokeDasharray="3 2" />
    <line x1="50" y1="50" x2="18" y2="18" stroke={strokeColor} strokeWidth="1.2" strokeDasharray="3 2" />

    {/* Concentric Web Rings */}
    <polygon points="50,15 75,25 85,50 75,75 50,85 25,75 15,50 25,25" fill="none" stroke={strokeColor} strokeWidth="1" opacity="0.6" />
    <polygon points="50,28 66,34 72,50 66,66 50,72 34,66 28,50 34,34" fill="none" stroke={strokeColor} strokeWidth="1.2" opacity="0.8" />
    <polygon points="50,40 57,43 60,50 57,57 50,60 43,57 40,50 43,43" fill="none" stroke={strokeColor} strokeWidth="1.2" opacity="0.95" />
  </svg>
);

// Spider Emblem SVG Icon
const SpiderEmblem: React.FC<{ fillColor: string }> = ({ fillColor }) => (
  <svg viewBox="0 0 24 24" className="w-4 h-4 drop-shadow-md opacity-90">
    <path
      fill={fillColor}
      d="M12 2a2.5 2.5 0 0 0-2.5 2.5c0 .4.1.75.3 1.05C8.3 6.3 7 8 7 10c0 1.1.4 2.1 1.1 2.9C7.4 13.7 7 15 7 16.5 7 19.5 9.2 22 12 22s5-2.5 5-5.5c0-1.5-.4-2.8-1.1-3.6.7-.8 1.1-1.8 1.1-2.9 0-2-1.3-3.7-2.8-4.45.2-.3.3-.65.3-1.05A2.5 2.5 0 0 0 12 2zm-1 3.5a1 1 0 1 1 2 0 1 1 0 0 1-2 0zM5 7a1 1 0 0 1 1-1h1v2H6c-.6 0-1-.4-1-1zm14 0a1 1 0 0 0-1-1h-1v2h1c.6 0 1-.4 1-1zM3 12a1 1 0 0 1 1-1h2v2H4c-.6 0-1-.4-1-1zm18 0a1 1 0 0 0-1-1h-2v2h2c.6 0 1-.4 1-1zM5 17a1 1 0 0 1 1-1h1v2H6c-.6 0-1-.4-1-1zm14 0a1 1 0 0 0-1-1h-1v2h1c.6 0 1-.4 1-1z"
    />
  </svg>
);

// ─── Layer 1: Static board ───────────────────────────────────────────
const StaticBoard = memo(({ is2P, currentTurn, disconnectedMap }: { is2P: boolean; currentTurn: LudoColor; disconnectedMap?: Record<LudoColor, boolean> }) => (
  <div className="absolute inset-2 bg-slate-950/90" style={GRID_STYLE}>
    
    {/* ─── Red Spider Base ─── */}
    <div style={{gridRow:'1/7',gridColumn:'1/7'}} className={`rounded-2xl bg-slate-950 border-2 border-red-500/60 p-2 relative overflow-hidden flex flex-col justify-between shadow-2xl ${disconnectedMap?.red ? 'opacity-30 grayscale' : ''}`}>
      <SpiderWebBg strokeColor={CT.red.hex} active={currentTurn === 'red'} />
      <div className="flex items-center justify-between z-10">
        <span className="text-[9px] font-black text-red-400 uppercase tracking-widest flex items-center gap-1">
          <SpiderEmblem fillColor={CT.red.hex} />
          Spidey Base
        </span>
      </div>
    </div>

    {/* Top arm */}
    {Array.from({length:18}).map((_,i)=>{
      const r=Math.floor(i/3),c=6+(i%3);
      const hs=c===7&&r>=1&&r<=5, gs=r===1&&c===8;
      return <div key={`t${i}`} style={{gridRow:r+1,gridColumn:c+1}} className={`flex items-center justify-center rounded-[3px] border border-white/5 ${hs?'bg-emerald-600/70 border-emerald-400/40':gs?'bg-emerald-500/30 border-emerald-400/60':'bg-slate-900/60'}`}>{gs&&<Star className="text-emerald-400 fill-emerald-400 animate-pulse" size={10}/>}</div>;
    })}

    {/* ─── Green Spider Base ─── */}
    <div style={{gridRow:'1/7',gridColumn:'10/16'}} className={`rounded-2xl bg-slate-950 border-2 border-emerald-500/60 p-2 relative overflow-hidden flex flex-col justify-between shadow-2xl ${is2P || disconnectedMap?.green ? 'opacity-30 grayscale' : ''}`}>
      <SpiderWebBg strokeColor={CT.green.hex} active={currentTurn === 'green'} />
      <div className="flex items-center justify-between z-10">
        <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest flex items-center gap-1">
          <SpiderEmblem fillColor={CT.green.hex} />
          Goblin Base
        </span>
      </div>
    </div>

    {/* Left arm */}
    {Array.from({length:18}).map((_,i)=>{
      const r=6+Math.floor(i/6),c=i%6;
      const hs=r===7&&c>=1&&c<=5, rs=r===6&&c===1;
      return <div key={`l${i}`} style={{gridRow:r+1,gridColumn:c+1}} className={`flex items-center justify-center rounded-[3px] border border-white/5 ${hs?'bg-red-600/70 border-red-400/40':rs?'bg-red-500/30 border-red-400/60':'bg-slate-900/60'}`}>{rs&&<Star className="text-red-400 fill-red-400 animate-pulse" size={10}/>}</div>;
    })}

    {/* ─── Centre Victory Home ─── */}
    <div style={{gridRow:'7/10',gridColumn:'7/10'}} className="rounded-xl bg-slate-900 border-2 border-amber-400/60 flex items-center justify-center relative overflow-hidden shadow-2xl">
      <div className="absolute inset-0 bg-gradient-to-br from-red-600/30 via-emerald-600/30 to-amber-500/30"/>
      <Crown className="text-amber-400 animate-pulse z-10" size={24}/>
    </div>

    {/* Right arm */}
    {Array.from({length:18}).map((_,i)=>{
      const r=6+Math.floor(i/6),c=9+(i%6);
      const hs=r===7&&c>=9&&c<=13, ys=r===8&&c===13;
      return <div key={`r${i}`} style={{gridRow:r+1,gridColumn:c+1}} className={`flex items-center justify-center rounded-[3px] border border-white/5 ${hs?'bg-amber-500/70 border-amber-400/40':ys?'bg-amber-500/30 border-amber-400/60':'bg-slate-900/60'}`}>{ys&&<Star className="text-amber-300 fill-amber-300 animate-pulse" size={10}/>}</div>;
    })}

    {/* ─── Blue Spider Base ─── */}
    <div style={{gridRow:'10/16',gridColumn:'1/7'}} className={`rounded-2xl bg-slate-950 border-2 border-blue-500/60 p-2 relative overflow-hidden flex flex-col justify-between shadow-2xl ${is2P || disconnectedMap?.blue ? 'opacity-30 grayscale' : ''}`}>
      <SpiderWebBg strokeColor={CT.blue.hex} active={currentTurn === 'blue'} />
      <div className="flex items-center justify-between z-10">
        <span className="text-[9px] font-black text-blue-400 uppercase tracking-widest flex items-center gap-1">
          <SpiderEmblem fillColor={CT.blue.hex} />
          Suit Base
        </span>
      </div>
    </div>

    {/* Bottom arm */}
    {Array.from({length:18}).map((_,i)=>{
      const r=9+Math.floor(i/3),c=6+(i%3);
      const hs=c===7&&r>=9&&r<=13, bs=r===13&&c===6;
      return <div key={`b${i}`} style={{gridRow:r+1,gridColumn:c+1}} className={`flex items-center justify-center rounded-[3px] border border-white/5 ${hs?'bg-blue-600/70 border-blue-400/40':bs?'bg-blue-500/30 border-blue-400/60':'bg-slate-900/60'}`}>{bs&&<Star className="text-blue-400 fill-blue-400 animate-pulse" size={10}/>}</div>;
    })}

    {/* ─── Yellow Spider Base ─── */}
    <div style={{gridRow:'10/16',gridColumn:'10/16'}} className={`rounded-2xl bg-slate-950 border-2 border-amber-500/60 p-2 relative overflow-hidden flex flex-col justify-between shadow-2xl ${disconnectedMap?.yellow ? 'opacity-30 grayscale' : ''}`}>
      <SpiderWebBg strokeColor={CT.yellow.hex} active={currentTurn === 'yellow'} />
      <div className="flex items-center justify-between z-10">
        <span className="text-[9px] font-black text-amber-300 uppercase tracking-widest flex items-center gap-1">
          <SpiderEmblem fillColor={CT.yellow.hex} />
          Iron Base
        </span>
      </div>
    </div>

    {/* ─── Spider-Man Token Target Pedestals (Web Nests) ─── */}
    {(Object.keys(BASE_POS) as LudoColor[]).map((color) =>
      BASE_POS[color].map((pos, idx) => (
        <div
          key={`pedestal-${color}-${idx}`}
          style={{ gridRowStart: pos.r + 1, gridColumnStart: pos.c + 1 }}
          className="w-5 h-5 sm:w-6 sm:h-6 rounded-full border border-white/20 spidey-pedestal flex items-center justify-center self-center justify-self-center pointer-events-none z-10 shadow-inner"
        >
          <div className="w-1.5 h-1.5 rounded-full bg-white/25" />
        </div>
      ))
    )}

    {/* Safe stars */}
    {SAFE_STARS.map((s,i)=>(
      <div key={`ss${i}`} style={{gridRow:s.r+1,gridColumn:s.c+1}} className="flex items-center justify-center pointer-events-none">
        <Star className={`${s.clr} fill-current animate-pulse`} size={10}/>
      </div>
    ))}
  </div>
));

// ─── Real 3D Stickman Hand & Leg Martial Arts Fight Sequence Component ───────
type FightSequenceType = 'flying_kick_knockout' | 'kungfu_boxing_combo' | 'spinning_leg_sweep' | 'grapple_judo_throw';

const OneOnOneCombatOverlay: React.FC<{
  attackerColor: LudoColor;
  defenderColor: LudoColor;
  sequenceType: FightSequenceType;
}> = memo(({ attackerColor, defenderColor, sequenceType }) => {
  const attScheme = CT[attackerColor] || CT.red;
  const defScheme = CT[defenderColor] || CT.yellow;

  const titleConfig = {
    flying_kick_knockout: { label: '3D DROPKICK KO! 🥋', classAtt: 'anim-3d-dropkick-att', classDef: 'anim-3d-dropkick-def' },
    kungfu_boxing_combo:  { label: '3D KUNG-FU STRIKE! 👊', classAtt: 'anim-3d-boxing-att',   classDef: 'anim-3d-boxing-def' },
    spinning_leg_sweep:   { label: '3D LEG SWEEP & KICK! 🦵', classAtt: 'anim-3d-sweep-att',   classDef: 'anim-3d-sweep-def' },
    grapple_judo_throw:   { label: '3D JUDO ARMBAR SLAM! 🤼', classAtt: 'anim-3d-throw-att',   classDef: 'anim-3d-throw-def' }
  }[sequenceType] || { label: '3D MARTIAL ARTS FIGHT! ⚔️', classAtt: 'anim-3d-boxing-att', classDef: 'anim-3d-boxing-def' };

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-50 overflow-visible">
      {/* 3D Action Battle Arena Backdrop Stage */}
      <div
        className="absolute w-28 h-28 sm:w-36 sm:h-36 rounded-full border-2 border-white/80 shadow-2xl backdrop-blur-md flex items-center justify-center overflow-hidden"
        style={{
          boxShadow: `0 0 45px 15px ${attScheme.hex}`,
          background: `radial-gradient(circle, ${attScheme.hex}66 0%, rgba(15,23,42,0.95) 85%)`
        }}
      >
        {/* 3D Battle Arena Grid Floor Line */}
        <div className="absolute bottom-2 w-full h-4 border-b border-cyan-400/40 transform rotate-x-2 opacity-60" />

        {/* 3D Martial Arts Fighting Stage */}
        <div className="relative w-full h-full flex items-center justify-between px-3">
          
          {/* Attacker 3D Stickman (Punches, Kicks & Sweeps) */}
          <div className={`relative ${titleConfig.classAtt}`}>
            <svg viewBox="0 0 50 60" className="w-10 h-12 sm:w-12 sm:h-14 drop-shadow-2xl overflow-visible">
              {/* Pedestal Aura */}
              <ellipse cx="25" cy="54" rx="16" ry="4" fill={attScheme.hex} opacity="0.6" />
              {/* Jointed Stickman Body */}
              <g stroke={attScheme.hex} strokeWidth="3.8" strokeLinecap="round" strokeLinejoin="round" fill="none">
                {/* Back Leg (Thigh + Shin) */}
                <path d="M 25 30 L 14 42 L 8 52" stroke={attScheme.hex} opacity="0.8" />
                {/* Front Leg (Thigh + Shin Kick/Stride) */}
                <path d="M 25 30 L 35 38 L 44 48" stroke={attScheme.hex} strokeWidth="4.2" />
                {/* Spine & Torso */}
                <path d="M 25 15 Q 22 22 25 30" stroke={attScheme.hex} strokeWidth="4.5" />
                {/* Back Arm (Upper Arm + Forearm) */}
                <path d="M 25 18 L 15 25 L 9 30" stroke={attScheme.hex} strokeWidth="3.2" opacity="0.8" />
                {/* Front Arm (Striking Fist / Jab) */}
                <path d="M 25 18 L 38 16 L 48 14" stroke={attScheme.hex} strokeWidth="4" />
              </g>
              {/* Head Sphere */}
              <circle cx="25" cy="10" r="6.5" fill={attScheme.hex} stroke="#ffffff" strokeWidth="1.2" />
            </svg>
          </div>

          {/* Impact Hit Explosion & Bone Snap Spark */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className="text-3xl sm:text-4xl animate-ping opacity-95">💥</span>
          </div>

          {/* Defender 3D Stickman (Recoiling, Leg Bending & Flying Back) */}
          <div className={`relative ${titleConfig.classDef}`}>
            <svg viewBox="0 0 50 60" className="w-10 h-12 sm:w-12 sm:h-14 drop-shadow-2xl overflow-visible">
              {/* Pedestal Aura */}
              <ellipse cx="25" cy="54" rx="16" ry="4" fill={defScheme.hex} opacity="0.6" />
              {/* Jointed Stickman Body */}
              <g stroke={defScheme.hex} strokeWidth="3.8" strokeLinecap="round" strokeLinejoin="round" fill="none">
                {/* Back Leg (Bent on Impact) */}
                <path d="M 25 30 L 14 38 L 8 48" stroke={defScheme.hex} />
                {/* Front Leg (Tumbling Back) */}
                <path d="M 25 30 L 32 44 L 38 52" stroke={defScheme.hex} strokeWidth="4" />
                {/* Recoiling Spine & Torso */}
                <path d="M 25 15 Q 30 24 25 30" stroke={defScheme.hex} strokeWidth="4.5" />
                {/* Arms Guarding / Flying */}
                <path d="M 25 18 L 13 14 L 6 22" stroke={defScheme.hex} strokeWidth="3.5" />
                <path d="M 25 18 L 34 24 L 40 30" stroke={defScheme.hex} strokeWidth="3.2" opacity="0.8" />
              </g>
              {/* Head Sphere Snapping Back */}
              <circle cx="25" cy="10" r="6.5" fill={defScheme.hex} stroke="#ffffff" strokeWidth="1.2" />
            </svg>
          </div>
        </div>

        {/* Outer Perspective Speed Ring */}
        <div className="absolute inset-0 rounded-full border border-cyan-400/50 animate-ping" />
      </div>

      {/* Hollywood Action Header Badge */}
      <div className="absolute -top-9 px-3 py-0.5 rounded-full font-black text-[10px] sm:text-xs uppercase tracking-widest bg-gradient-to-r from-red-600 via-amber-500 to-yellow-400 text-black border border-white shadow-2xl animate-bounce whitespace-nowrap z-50">
        {titleConfig.label}
      </div>
    </div>
  );
});

// ─── Capture event type ──────────────────────────────────────────────
type CaptureEvent = {
  id: string;
  color: LudoColor;          // Defender color
  attackerColor: LudoColor;  // Attacker color
  r: number;
  c: number;
  sequenceType: FightSequenceType;
};

// ─── Home reach event type ───────────────────────────────────────────
type HomeEvent = {
  id: string;
  color: LudoColor;
};

// ─── Main component ──────────────────────────────────────────────────
export const GlassLudoBoard: React.FC = () => {
  const roomState = useGameStore((s) => s.roomState);
  const ludoState = roomState?.ludoState;

  const [isRolling, setIsRolling] = useState(false);
  const [isMoving, setIsMoving] = useState(false);
  const [steppingTokenKey, setSteppingTokenKey] = useState<string | null>(null);
  const [renderedSteps, setRenderedSteps] = useState<Record<string,number>>({});
  const lastRef = useRef<Record<string,number>>({});

  // Capture & Home animation states
  const [captures, setCaptures] = useState<CaptureEvent[]>([]);
  const [recentCaptures, setRecentCaptures] = useState<Set<string>>(new Set());
  const [homeEvents, setHomeEvents] = useState<HomeEvent[]>([]);

  useEffect(() => { if (ludoState && !ludoState.hasRolled) setIsRolling(false); }, [ludoState?.hasRolled, ludoState?.currentTurn]);

  // Step-by-step walking animation + capture & home reach detection
  useEffect(() => {
    if (!ludoState) return;
    (Object.keys(ludoState.tokens) as LudoColor[]).forEach((color) => {
      ludoState.tokens[color].forEach((tk) => {
        const k = `${color}-${tk.id}`;
        const prev = lastRef.current[k] ?? tk.step;
        const tgt = tk.step;
        if (renderedSteps[k] === undefined) {
          setRenderedSteps(p => ({...p,[k]:tgt}));
          lastRef.current[k] = tgt;
          return;
        }
        if (prev !== tgt) {
          lastRef.current[k] = tgt;

          if (tgt < 0) {
            // CAPTURE DETECTED: Walk BACKWARD step-by-step along the exact path it came!
            if (prev >= 0) {
              setIsMoving(true);
              setSteppingTokenKey(k);
              const fromCoord = getCell(color, prev);
              if (fromCoord) {
                const captureId = `${Date.now()}-${k}`;
                const fightSequences: FightSequenceType[] = ['flying_kick_knockout', 'kungfu_boxing_combo', 'spinning_leg_sweep', 'grapple_judo_throw'];
                const randomSeq = fightSequences[Math.floor(Math.random() * fightSequences.length)];
                const attackerClr = ludoState.currentTurn;

                setCaptures(p => [...p, {
                  id: captureId,
                  color,
                  attackerColor: attackerClr,
                  r: fromCoord.r,
                  c: fromCoord.c,
                  sequenceType: randomSeq
                }]);
                setRecentCaptures(p => new Set(p).add(k));
                try { soundEngine.playCastle(); } catch {}
                setTimeout(() => {
                  setCaptures(p => p.filter(c => c.id !== captureId));
                }, 1200);
              }

              let cur = prev;
              const captureInterval = setInterval(() => {
                cur--;
                soundEngine.playTick();
                setRenderedSteps(p => ({ ...p, [k]: cur }));

                if (cur <= -1) {
                  clearInterval(captureInterval);
                  setIsMoving(false);
                  setSteppingTokenKey(null);
                  setTimeout(() => {
                    setRecentCaptures(p => {
                      const s = new Set(p);
                      s.delete(k);
                      return s;
                    });
                  }, 400);
                }
              }, 70);
            } else {
              setRenderedSteps(p => ({ ...p, [k]: -1 }));
            }
          }
          else if (prev === -1 && tgt === 0) {
            setIsMoving(true); soundEngine.playCastle();
            setRenderedSteps(p => ({...p,[k]:0}));
            setTimeout(() => setIsMoving(false), 300);
          } else if (prev < tgt) {
            setIsMoving(true);
            setSteppingTokenKey(k);
            let cur = prev;
            const iv = setInterval(() => {
              cur++; soundEngine.playTick();
              setRenderedSteps(p => ({...p,[k]:cur}));
              if (cur >= tgt) {
                clearInterval(iv);
                setIsMoving(false);
                setSteppingTokenKey(null);
                // ─── HOME REACHED CELEBRATION ───
                if (cur === 57) {
                  const homeId = `${Date.now()}-${k}`;
                  soundEngine.playCheckmate();
                  try {
                    confetti({
                      particleCount: 80,
                      spread: 70,
                      origin: { y: 0.5 },
                      colors: [CT[color].hex, '#ffd700', '#ffffff', '#00f2fe']
                    });
                  } catch {}
                  setHomeEvents(p => [...p, { id: homeId, color }]);
                  setTimeout(() => {
                    setHomeEvents(p => p.filter(h => h.id !== homeId));
                  }, 1500);
                }
              }
            }, 150);
          }
        }
      });
    });
  }, [ludoState]);

  if (!ludoState) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center text-gray-400 bg-slate-900/60 backdrop-blur-xl rounded-3xl border border-white/10 my-auto">
        <Loader2 className="animate-spin text-cyan-400 mb-3" size={32} />
        <span className="text-sm font-semibold text-white">Initializing Ludo Board State...</span>
        <span className="text-xs text-gray-400 mt-1">Connecting to match room</span>
      </div>
    );
  }

  const { currentTurn, diceValue, hasRolled, canMoveTokens, turnTimerSeconds } = ludoState;
  const timer = turnTimerSeconds ?? 10;
  const is2P = roomState.maxPlayers === 2;
  const active = ludoState.activeColors || (is2P ? ['red', 'yellow'] : ['red', 'green', 'yellow', 'blue']);
  const myLudoPlayer = Object.values(roomState.ludoPlayers || {}).filter(Boolean).find((p) => p?.id === socket.id);
  const myLudoColor = myLudoPlayer?.ludoColor;
  const isMyTurn = Boolean(myLudoColor && myLudoColor === currentTurn);

  // ─── AUTO-MOVE SINGLE ELIGIBLE TOKEN ─────────────────────────────
  useEffect(() => {
    if (!ludoState) return;
    if (isMyTurn && hasRolled && !isRolling && !isMoving && canMoveTokens.length === 1) {
      const singleTokenId = canMoveTokens[0];
      const autoTimer = setTimeout(() => {
        soundEngine.playMove();
        emitMoveLudoToken(currentTurn, singleTokenId);
      }, 400);

      return () => clearTimeout(autoTimer);
    }
  }, [ludoState?.hasRolled, ludoState?.canMoveTokens, ludoState?.currentTurn, isRolling, isMoving, isMyTurn]);

  const roll = () => {
    if (!isMyTurn||isRolling||isMoving||hasRolled||roomState?.status!=='playing') return;
    setIsRolling(true); soundEngine.playMove(); emitRollDice();
    setTimeout(() => setIsRolling(false), 500);
  };

  const tap = (c: LudoColor, id: number) => {
    if (!isMyTurn||c!==currentTurn||isRolling||isMoving||!hasRolled||!canMoveTokens.includes(id)) return;
    soundEngine.playMove(); emitMoveLudoToken(c, id);
  };

  // ─── Build token render list ───────────────────────────────────────
  type TI = {
    key: string; color: LudoColor; token: LudoToken;
    r: number; c: number; sel: boolean;
    ox: number; oy: number;
    isRecentCapture: boolean;
    stackCount: number;
    stackIndex: number;
    isAtHome: boolean;
  };
  const tks: TI[] = [];
  const trackOcc: Record<string, Array<{color:LudoColor; token:LudoToken}>> = {};

  (Object.keys(ludoState.tokens) as LudoColor[]).forEach(color => {
    if (!active.includes(color)) return;
    ludoState.tokens[color].forEach(tk => {
      const k = `${color}-${tk.id}`;
      const step = renderedSteps[k] ?? tk.step;
      if (step < 0) {
        // Base token (Home)
        const baseArr = BASE_POS[color] || BASE_POS.red;
        const bp = baseArr[tk.id % baseArr.length] || { r: 2, c: 2 };
        tks.push({
          key: `b-${color}-${tk.id}`, color, token: tk,
          r: bp.r, c: bp.c, ox: 0, oy: 0,
          sel: isMyTurn && currentTurn===color && hasRolled && canMoveTokens.includes(tk.id) && !isRolling && !isMoving && (!is2P || color==='red' || color==='yellow'),
          isRecentCapture: recentCaptures.has(k),
          stackCount: 1,
          stackIndex: 0,
          isAtHome: true
        });
      } else {
        const coord = getCell(color, step);
        if (coord) {
          const ck = `${coord.r}-${coord.c}`;
          if (!trackOcc[ck]) trackOcc[ck] = [];
          trackOcc[ck].push({color, token: tk});
        }
      }
    });
  });

  // Render EVERY track token individually with stack indicators
  Object.entries(trackOcc).forEach(([ck, items]) => {
    const [rs, cs] = ck.split('-');
    const count = items.length;
    const offsets = STACK_OFFSETS[Math.min(count, 4) - 1] || [{ x: 0, y: 0 }];
    items.forEach((item, idx) => {
      const off = offsets[Math.min(idx, offsets.length - 1)] || { x: 0, y: 0 };
      tks.push({
        key: `t-${item.color}-${item.token.id}`,
        color: item.color, token: item.token,
        r: +rs, c: +cs,
        ox: off.x, oy: off.y,
        sel: isMyTurn && item.color===currentTurn && hasRolled && canMoveTokens.includes(item.token.id) && !isRolling && !isMoving,
        isRecentCapture: false,
        stackCount: count,
        stackIndex: idx,
        isAtHome: false
      });
    });
  });

  const disconnectedMap: Record<LudoColor, boolean> = {
    red: roomState?.ludoPlayers?.red ? !roomState.ludoPlayers.red.connected : false,
    green: roomState?.ludoPlayers?.green ? !roomState.ludoPlayers.green.connected : false,
    yellow: roomState?.ludoPlayers?.yellow ? !roomState.ludoPlayers.yellow.connected : false,
    blue: roomState?.ludoPlayers?.blue ? !roomState.ludoPlayers.blue.connected : false,
  };

  const turnConfig = CT[currentTurn] || CT.red;

  return (
    <div className="relative flex flex-col items-center justify-center gap-2 w-full max-w-5xl mx-auto select-none min-h-0">
      <div className="flex flex-col items-center justify-center gap-2 max-h-full">

        {/* Header bar */}
        <div className="flex items-center justify-between w-full max-w-[clamp(260px,56dvh,500px)] p-2 rounded-2xl bg-slate-900/80 backdrop-blur-xl border border-white/15 shadow-xl">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-xl bg-amber-500/20 border border-amber-400/40 text-amber-300 font-mono font-bold text-xs">
              <Clock size={12} className="text-amber-400" style={{animation:'spin 3s linear infinite'}}/>
              <span>{timer}s</span>
            </div>
            <div>
              <span className="text-[9px] font-semibold text-gray-400 uppercase tracking-widest block">CURRENT TURN</span>
              <span className={`text-xs font-extrabold uppercase tracking-wider ${turnConfig.text}`}>
                {currentTurn} PLAYER {!isMyTurn&&'(WAITING...)'}
              </span>
            </div>
          </div>
          <Dice3D value={diceValue} isRolling={isRolling} onRoll={roll} disabled={!isMyTurn||hasRolled||isRolling||isMoving||roomState?.status!=='playing'}/>
        </div>

        {/* Board frame (Modern Fluid Auto-Scaling) */}
        <div className="relative p-2 rounded-3xl bg-slate-900/90 backdrop-blur-2xl border border-white/20 shadow-2xl w-[clamp(260px,56dvh,500px)] h-[clamp(260px,56dvh,500px)] aspect-square overflow-hidden">

          {/* LAYER 1: Static board with Spider-Man Theme */}
          <StaticBoard is2P={is2P} currentTurn={currentTurn} disconnectedMap={disconnectedMap} />

          {/* LAYER 2: Token overlay */}
          <div className="absolute inset-2 pointer-events-none" style={{...GRID_STYLE, zIndex: 20}}>

            {/* Tokens */}
            {tks.map(t => (
              <motion.button
                key={t.key}
                layout
                layoutId={t.key}
                onClick={() => tap(t.color, t.token.id)}
                disabled={!t.sel}
                style={{
                  gridRow: t.r + 1,
                  gridColumn: t.c + 1,
                  zIndex: t.sel ? 40 : 30 + t.stackIndex,
                  transform: `translate(${t.ox}px, ${t.oy}px)`,
                }}
                initial={false}
                animate={{
                  scale: t.isRecentCapture ? [1.4, 0.7, 1] : t.sel ? [1, 1.15, 1] : 1,
                  rotate: t.isRecentCapture ? [0, -360] : 0,
                  y: t.sel ? [0, -4, 0] : 0
                }}
                transition={{
                  layout: {
                    type: 'spring',
                    stiffness: t.isRecentCapture ? 120 : 350,
                    damping: t.isRecentCapture ? 15 : 25,
                    mass: t.isRecentCapture ? 1.2 : 0.8
                  },
                  scale: { duration: 0.35, ease: 'easeOut' },
                  rotate: { duration: 0.6, ease: 'easeInOut' }
                }}
                className={`self-center justify-self-center relative pointer-events-auto p-0 bg-transparent border-0 outline-none ${
                  t.sel ? 'cursor-pointer' : 'cursor-not-allowed'
                }`}
              >
                <StickmanTokenFigure
                  color={t.color}
                  id={t.token.id}
                  isSelected={t.sel}
                  isMoving={steppingTokenKey === `${t.color}-${t.token.id}`}
                  isCaptured={t.isRecentCapture}
                  isAtHome={t.isAtHome}
                  isDisconnected={disconnectedMap[t.color]}
                />

                {/* Explicit Stack Count Badge when multiple tokens share the exact same cell */}
                {t.stackCount > 1 && t.stackIndex === t.stackCount - 1 && (
                  <span className="absolute -top-1.5 -right-1.5 px-1.5 py-0.5 rounded-full bg-cyan-400 text-slate-950 font-black text-[9px] border border-white shadow-lg z-50 animate-bounce">
                    x{t.stackCount}
                  </span>
                )}
              </motion.button>
            ))}

            {/* Hollywood 3D Animated Battle Sequence Overlays */}
            {captures.map(cap => (
              <div
                key={cap.id}
                style={{ gridRow: cap.r + 1, gridColumn: cap.c + 1, zIndex: 50 }}
                className="self-center justify-self-center relative pointer-events-none"
              >
                <OneOnOneCombatOverlay
                  attackerColor={cap.attackerColor}
                  defenderColor={cap.color}
                  sequenceType={cap.sequenceType}
                />
              </div>
            ))}

            {/* ─── Home reach celebrations (Center Square) ─── */}
            {homeEvents.map(h => (
              <div
                key={h.id}
                style={{ gridRow: '7 / 10', gridColumn: '7 / 10', zIndex: 50 }}
                className="flex flex-col items-center justify-center pointer-events-none self-center justify-self-center relative"
              >
                <div className="absolute w-14 h-14 rounded-full anim-capture-burst bg-gradient-to-r from-amber-400 to-yellow-500" />
                <Sparkles className="text-amber-300 animate-bounce z-10" size={32} />
                <span className="text-[10px] font-black text-amber-300 uppercase tracking-widest bg-black/80 px-2 py-0.5 rounded-full border border-amber-400 z-10 animate-pulse">
                  +1 HOME 🎉
                </span>
              </div>
            ))}

          </div>
        </div>

        {/* Active Players Esports Score Bar */}
        <div className="flex items-center justify-center gap-1.5 sm:gap-2 max-w-[clamp(260px,56dvh,500px)] w-full px-2.5 py-1.5 rounded-2xl bg-slate-950/85 backdrop-blur-xl border border-white/15 shadow-2xl overflow-hidden mt-1 select-none">
          {active.map(color => {
            const on = currentTurn === color;
            const lp = roomState?.ludoPlayers?.[color];
            const isConnected = lp ? lp.connected : true;
            const done = ludoState.tokens[color]?.filter(t => t.step === 57).length || 0;
            return (
              <div
                key={color}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl border transition-all whitespace-nowrap ${
                  on && isConnected
                    ? `${CT[color].border} bg-slate-900/90 ${CT[color].text} font-bold shadow-glow-cyan ring-1 ring-cyan-400/40 scale-105 z-10`
                    : `${CT[color].border}/40 bg-slate-950/60 ${CT[color].text} ${!isConnected ? 'opacity-50' : 'opacity-70'}`
                }`}
              >
                <span className={`w-2 h-2 rounded-full shrink-0 ${CT[color].bg} ${on && isConnected ? 'animate-ping' : ''}`} />
                <span className="uppercase text-[10px] font-black tracking-wider font-mono">
                  {color}
                </span>
                <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded-md font-mono ${on && isConnected ? 'bg-white/20 text-white' : 'bg-white/10 text-gray-200'}`}>
                  {isConnected ? `${done}/4` : 'LEFT'}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
