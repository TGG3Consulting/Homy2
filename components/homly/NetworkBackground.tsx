'use client';

import React, { useRef, useEffect } from "react";

const ARMENIA_OUTLINE: [number, number][] = [
  [0.18, 0.08], [0.22, 0.05], [0.28, 0.04], [0.33, 0.06], [0.40, 0.05],
  [0.48, 0.03], [0.55, 0.04], [0.62, 0.06], [0.68, 0.05], [0.75, 0.07],
  [0.80, 0.05], [0.85, 0.08], [0.86, 0.14], [0.83, 0.20], [0.79, 0.25],
  [0.82, 0.32], [0.78, 0.38], [0.73, 0.42], [0.78, 0.48], [0.74, 0.55],
  [0.69, 0.60], [0.63, 0.58], [0.57, 0.62], [0.52, 0.65], [0.47, 0.68],
  [0.42, 0.72], [0.36, 0.74], [0.30, 0.71], [0.25, 0.68], [0.20, 0.64],
  [0.16, 0.58], [0.12, 0.52], [0.10, 0.45], [0.11, 0.38], [0.13, 0.32],
  [0.14, 0.26], [0.12, 0.19], [0.15, 0.14], [0.18, 0.08],
];

const BUILDING_COUNT = 20;
const CONTOUR_COUNT = 6;
const POINT_COUNT = 30;
const NODE_COUNT = 6;

export interface AccentColor {
  r: number;
  g: number;
  b: number;
}

interface NetworkBackgroundProps {
  isTyping: boolean;
  accentColor?: AccentColor;
  isLightBg?: boolean;
}

interface Contour {
  x: number;
  y: number;
  segments: { x: number; y: number }[];
  speed: number;
  phase: number;
  opacity: number;
  lifetime: number;
}

interface Building {
  x: number;
  y: number;
  w: number;
  h: number;
  opacity: number;
  targetOpacity: number;
  phase: number;
  fadeSpeed: number;
}

interface Point {
  x: number;
  y: number;
  r: number;
  pulse: number;
  pulseSpeed: number;
  baseOpacity: number;
  maxOpacity: number;
}

interface Node {
  x: number;
  y: number;
  r: number;
  connections: number[];
  pulse: number;
}

export default function NetworkBackground({ isTyping, accentColor = { r: 139, g: 108, b: 255 }, isLightBg = false }: NetworkBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const contoursRef = useRef<Contour[]>([]);
  const buildingsRef = useRef<Building[]>([]);
  const pointsRef = useRef<Point[]>([]);
  const nodesRef = useRef<Node[]>([]);
  const isTypingRef = useRef(false);
  const timeRef = useRef(0);
  const prefersReducedMotion = useRef(false);
  const accentRef = useRef(accentColor);

  useEffect(() => {
    prefersReducedMotion.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

  useEffect(() => { isTypingRef.current = isTyping; }, [isTyping]);
  useEffect(() => { accentRef.current = accentColor; }, [accentColor]);

  const initData = (w: number, h: number) => {
    const cx = w / 2;
    const cy = h / 2;

    contoursRef.current = Array.from({ length: CONTOUR_COUNT }, () => {
      const x = Math.random() * w, y = Math.random() * h;
      const segs: { x: number; y: number }[] = [];
      let sx = x, sy = y;
      for (let i = 0; i < 4; i++) {
        const dx = (Math.random() - 0.5) * w * 0.5;
        const dy = (Math.random() - 0.5) * h * 0.4;
        segs.push({ x: sx + dx, y: sy + dy });
        sx += dx; sy += dy;
      }
      return { x, y, segments: segs, speed: 0.00008 + Math.random() * 0.00025, phase: Math.random() * Math.PI * 2, opacity: 0.03 + Math.random() * 0.04, lifetime: Math.random() * 600 };
    });

    buildingsRef.current = Array.from({ length: BUILDING_COUNT }, () => ({
      x: Math.random() * w, y: Math.random() * h,
      w: 2 + Math.random() * 5, h: 3 + Math.random() * 8,
      opacity: 0, targetOpacity: 0.008 + Math.random() * 0.04, phase: Math.random() * Math.PI * 2, fadeSpeed: 0.002 + Math.random() * 0.004,
    }));

    pointsRef.current = Array.from({ length: POINT_COUNT }, () => ({
      x: Math.random() * w, y: Math.random() * h,
      r: 0.4 + Math.random() * 1.2, pulse: Math.random() * Math.PI * 2,
      pulseSpeed: 0.004 + Math.random() * 0.012, baseOpacity: 0, maxOpacity: 0.015 + Math.random() * 0.05,
    }));

    nodesRef.current = Array.from({ length: NODE_COUNT }, () => ({
      x: cx + (Math.random() - 0.5) * w * 0.45, y: cy + (Math.random() - 0.5) * h * 0.35,
      r: 1.5 + Math.random() * 3, connections: [], pulse: Math.random() * Math.PI * 2,
    }));
    nodesRef.current.forEach((node, i) => {
      node.connections = nodesRef.current
        .map((n, j) => ({ j, dist: Math.hypot(node.x - n.x, node.y - n.y) }))
        .filter((n) => n.j !== i && n.dist < w * 0.3)
        .sort((a, b) => a.dist - b.dist).slice(0, 2)
        .map((n) => n.j);
    });
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let w: number, h: number, cx: number, cy: number;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      w = window.innerWidth; h = window.innerHeight;
      cx = w / 2; cy = h / 2;
      canvas.width = w * dpr; canvas.height = h * dpr;
      canvas.style.width = w + "px"; canvas.style.height = h + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();
    initData(w!, h!);
    window.addEventListener("resize", resize);

    const lightMul = isLightBg ? 0.4 : 1; // subtler on light bg

    const draw = () => {
      if (prefersReducedMotion.current) {
        ctx.clearRect(0, 0, w, h);
        return;
      }

      timeRef.current += 1;
      const t = timeRef.current;
      const typing = isTypingRef.current;

      ctx.clearRect(0, 0, w, h);
      const ac = accentRef.current;
      const cr = ac.r, cg = ac.g, cb = ac.b;

      // Contour lines
      contoursRef.current.forEach((contour) => {
        contour.lifetime += 1;
        if (contour.lifetime > 800) {
          contour.x = Math.random() * w;
          contour.y = Math.random() * h;
          contour.segments = contour.segments.map(() => ({
            x: contour.x + (Math.random() - 0.5) * w * 0.5,
            y: contour.y + (Math.random() - 0.5) * h * 0.4,
          }));
          contour.lifetime = 0;
        }
        const fadeIn = Math.min(1, contour.lifetime / 120);
        const fadeOut = Math.min(1, (800 - contour.lifetime) / 120);
        const alpha = contour.opacity * fadeIn * fadeOut * lightMul * (typing ? 1.3 : 1);
        const driftX = Math.sin(t * contour.speed * 100 + contour.phase) * 12;
        const driftY = Math.cos(t * contour.speed * 80 + contour.phase * 1.3) * 8;

        ctx.beginPath();
        ctx.moveTo(contour.x + driftX, contour.y + driftY);
        contour.segments.forEach((seg) => {
          const cpX = contour.x + driftX + (seg.x - contour.x) * 0.6;
          const cpY = contour.y + driftY + (seg.y - contour.y) * 0.4;
          ctx.quadraticCurveTo(cpX, cpY, seg.x + driftX, seg.y + driftY);
        });
        ctx.strokeStyle = `rgba(${cr},${cg},${cb},${alpha * 0.35})`;
        ctx.lineWidth = 0.4;
        ctx.stroke();
      });

      // Node network
      nodesRef.current.forEach((node) => {
        node.pulse += 0.01;
        const npulse = Math.sin(node.pulse) * 0.5 + 0.5;
        const nodeAlpha = (typing ? 0.12 : 0.04) * lightMul;

        node.connections.forEach((j) => {
          const target = nodesRef.current[j];
          ctx.beginPath();
          ctx.moveTo(node.x, node.y);
          ctx.lineTo(target.x, target.y);
          ctx.strokeStyle = `rgba(${cr},${cg},${cb},${nodeAlpha * 0.25})`;
          ctx.lineWidth = 0.25;
          ctx.stroke();

          const progress = ((t * 0.015 + node.x * 0.01) % 100) / 100;
          const dx = target.x - node.x, dy = target.y - node.y;
          ctx.beginPath();
          ctx.arc(node.x + dx * progress, node.y + dy * progress, 0.8, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${cr},${cg},${cb},${nodeAlpha * 0.5})`;
          ctx.fill();
        });

        const grad = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, node.r * 4);
        grad.addColorStop(0, `rgba(${cr},${cg},${cb},${nodeAlpha * npulse})`);
        grad.addColorStop(1, `rgba(${cr},${cg},${cb},0)`);
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.r * 4, 0, Math.PI * 2);
        ctx.fill();
      });

      // Points
      pointsRef.current.forEach((point) => {
        point.pulse += point.pulseSpeed;
        const pAlpha = Math.sin(point.pulse) * 0.5 + 0.5;
        const pointAlpha = point.baseOpacity + (point.maxOpacity - point.baseOpacity) * pAlpha;
        const finalAlpha = (typing ? pointAlpha * 1.6 : pointAlpha) * lightMul;
        const grad = ctx.createRadialGradient(point.x, point.y, 0, point.x, point.y, point.r * 3);
        grad.addColorStop(0, `rgba(${cr},${cg},${cb},${finalAlpha * 1.4})`);
        grad.addColorStop(1, `rgba(${cr},${cg},${cb},0)`);
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(point.x, point.y, point.r * 3, 0, Math.PI * 2);
        ctx.fill();
      });

      // Buildings
      buildingsRef.current.forEach((bld) => {
        bld.opacity += (bld.targetOpacity - bld.opacity) * bld.fadeSpeed;
        if (Math.abs(bld.opacity - bld.targetOpacity) < 0.0002) bld.targetOpacity = 0.004 + Math.random() * 0.035;
        const bAlpha = (typing ? bld.opacity * 1.5 : bld.opacity) * lightMul;
        ctx.fillStyle = `rgba(${cr},${cg},${cb},${bAlpha})`;
        ctx.fillRect(bld.x - bld.w / 2, bld.y - bld.h, bld.w, bld.h);
        ctx.strokeStyle = `rgba(${cr},${cg},${cb},${bAlpha * 1.3})`;
        ctx.lineWidth = 0.3;
        ctx.strokeRect(bld.x - bld.w / 2, bld.y - bld.h, bld.w, bld.h);
      });

      // Armenia outline
      const outlineScale = Math.min(w, h) * 0.9;
      const outlineX = cx - outlineScale * 0.5;
      const outlineY = cy - outlineScale * 0.38;
      const outlineAlpha = (typing ? 0.05 : 0.022) * lightMul;

      ctx.save();
      ctx.beginPath();
      ARMENIA_OUTLINE.forEach(([px, py], i) => {
        const rx = outlineX + px * outlineScale;
        const ry = outlineY + py * outlineScale;
        if (i === 0) ctx.moveTo(rx, ry);
        else ctx.lineTo(rx, ry);
      });
      ctx.closePath();
      ctx.setLineDash([4, 8]);
      ctx.lineDashOffset = -t * 0.12;
      ctx.strokeStyle = `rgba(${cr},${cg},${cb},${outlineAlpha})`;
      ctx.lineWidth = 0.6;
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();

      animRef.current = requestAnimationFrame(draw);
    };

    animRef.current = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener("resize", resize);
    };
  }, [isLightBg]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 0 }}
      aria-hidden="true"
    />
  );
}
