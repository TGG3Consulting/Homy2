"use client";

import React, { useRef, useEffect } from "react";

// Simplified Armenia outline (normalized coordinates)
const ARMENIA_OUTLINE = [
  [0.18, 0.08], [0.22, 0.05], [0.28, 0.04], [0.33, 0.06], [0.40, 0.05],
  [0.48, 0.03], [0.55, 0.04], [0.62, 0.06], [0.68, 0.05], [0.75, 0.07],
  [0.80, 0.05], [0.85, 0.08], [0.86, 0.14], [0.83, 0.20], [0.79, 0.25],
  [0.82, 0.32], [0.78, 0.38], [0.73, 0.42], [0.78, 0.48], [0.74, 0.55],
  [0.69, 0.60], [0.63, 0.58], [0.57, 0.62], [0.52, 0.65], [0.47, 0.68],
  [0.42, 0.72], [0.36, 0.74], [0.30, 0.71], [0.25, 0.68], [0.20, 0.64],
  [0.16, 0.58], [0.12, 0.52], [0.10, 0.45], [0.11, 0.38], [0.13, 0.32],
  [0.14, 0.26], [0.12, 0.19], [0.15, 0.14], [0.18, 0.08],
];

const BUILDING_COUNT = 25;
const CONTOUR_COUNT = 8;
const POINT_COUNT = 40;
const NODE_COUNT = 8;

export default function NetworkBackground({ isTyping, accentColor = { r: 139, g: 108, b: 255 } }) {
  const canvasRef = useRef(null);
  const animRef = useRef(null);
  const contoursRef = useRef([]);
  const buildingsRef = useRef([]);
  const pointsRef = useRef([]);
  const nodesRef = useRef([]);
  const isTypingRef = useRef(false);
  const timeRef = useRef(0);
  const prefersReducedMotion = useRef(false);
  const accentRef = useRef(accentColor);

  useEffect(() => {
    prefersReducedMotion.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

  useEffect(() => {
    isTypingRef.current = isTyping;
  }, [isTyping]);

  useEffect(() => {
    accentRef.current = accentColor;
  }, [accentColor]);

  const initData = (w, h) => {
    const cx = w / 2;
    const cy = h / 2;

    // Contour lines - slow moving map-like paths
    contoursRef.current = Array.from({ length: CONTOUR_COUNT }, () => {
      const startX = Math.random() * w;
      const startY = Math.random() * h;
      const segments = [];
      let x = startX, y = startY;
      for (let i = 0; i < 4; i++) {
        const dx = (Math.random() - 0.5) * w * 0.5;
        const dy = (Math.random() - 0.5) * h * 0.4;
        segments.push({ x: x + dx, y: y + dy });
        x += dx;
        y += dy;
      }
      return {
        x: startX,
        y: startY,
        segments,
        speed: 0.0001 + Math.random() * 0.0003,
        phase: Math.random() * Math.PI * 2,
        opacity: 0.04 + Math.random() * 0.05,
        lifetime: Math.random() * 600,
      };
    });

    // Buildings - small rectangles fading in/out
    buildingsRef.current = Array.from({ length: BUILDING_COUNT }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      w: 3 + Math.random() * 6,
      h: 4 + Math.random() * 10,
      opacity: 0,
      targetOpacity: 0.01 + Math.random() * 0.06,
      phase: Math.random() * Math.PI * 2,
      fadeSpeed: 0.002 + Math.random() * 0.005,
    }));

    // Glowing connection points
    pointsRef.current = Array.from({ length: POINT_COUNT }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      r: 0.5 + Math.random() * 1.5,
      pulse: Math.random() * Math.PI * 2,
      pulseSpeed: 0.005 + Math.random() * 0.015,
      baseOpacity: 0,
      maxOpacity: 0.02 + Math.random() * 0.08,
    }));

    // Major nodes (neighborhood centers)
    nodesRef.current = Array.from({ length: NODE_COUNT }, () => ({
      x: cx + (Math.random() - 0.5) * w * 0.5,
      y: cy + (Math.random() - 0.5) * h * 0.4,
      r: 2 + Math.random() * 4,
      connections: [],
      pulse: Math.random() * Math.PI * 2,
    }));
    // Connect nodes in a network
    nodesRef.current.forEach((node, i) => {
      const nearby = nodesRef.current
        .map((n, j) => ({ j, dist: Math.hypot(node.x - n.x, node.y - n.y) }))
        .filter((n) => n.j !== i && n.dist < w * 0.35)
        .sort((a, b) => a.dist - b.dist)
        .slice(0, 2);
      node.connections = nearby.map((n) => n.j);
    });
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let w, h, cx, cy;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      w = window.innerWidth;
      h = window.innerHeight;
      cx = w / 2;
      cy = h / 2;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = w + "px";
      canvas.style.height = h + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();
    initData(w, h);
    window.addEventListener("resize", resize);

    const draw = () => {
      if (prefersReducedMotion.current) {
        ctx.clearRect(0, 0, w, h);
        const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, w * 0.5);
        const ac = accentRef.current;
        grad.addColorStop(0, `rgba(${ac.r}, ${ac.g}, ${ac.b}, 0.015)`);
        grad.addColorStop(1, `rgba(${ac.r}, ${ac.g}, ${ac.b}, 0)`);
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);
        return;
      }

      timeRef.current += 1;
      const t = timeRef.current;
      const typing = isTypingRef.current;

      ctx.clearRect(0, 0, w, h);

      const ac = accentRef.current;
      const cr = ac.r, cg = ac.g, cb = ac.b;

      // Typing center-of-attention glow
      if (typing) {
        const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, w * 0.4);
        glow.addColorStop(0, `rgba(${cr}, ${cg}, ${cb}, 0.025)`);
        glow.addColorStop(0.5, `rgba(${cr}, ${cg}, ${cb}, 0.01)`);
        glow.addColorStop(1, `rgba(${cr}, ${cg}, ${cb}, 0)`);
        ctx.fillStyle = glow;
        ctx.fillRect(0, 0, w, h);
      }

      // --- Contour lines ---
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
        const alpha = contour.opacity * fadeIn * fadeOut * (typing ? 1.4 : 1);

        const driftX = Math.sin(t * contour.speed * 100 + contour.phase) * 15;
        const driftY = Math.cos(t * contour.speed * 80 + contour.phase * 1.3) * 10;

        ctx.beginPath();
        ctx.moveTo(contour.x + driftX, contour.y + driftY);
        contour.segments.forEach((seg, i) => {
          const cpX = contour.x + driftX + (seg.x - contour.x) * 0.6;
          const cpY = contour.y + driftY + (seg.y - contour.y) * 0.4;
          ctx.quadraticCurveTo(cpX, cpY, seg.x + driftX, seg.y + driftY);
        });
        ctx.strokeStyle = `rgba(${cr}, ${cg}, ${cb}, ${alpha * 0.4})`;
        ctx.lineWidth = 0.5;
        ctx.stroke();
      });

      // --- Node network ---
      nodesRef.current.forEach((node) => {
        node.pulse += 0.01;
        const npulse = Math.sin(node.pulse) * 0.5 + 0.5;
        const nodeAlpha = typing ? 0.15 : 0.06;

        // Connections
        node.connections.forEach((j) => {
          const target = nodesRef.current[j];
          ctx.beginPath();
          ctx.moveTo(node.x, node.y);
          ctx.lineTo(target.x, target.y);
          ctx.strokeStyle = `rgba(${cr}, ${cg}, ${cb}, ${nodeAlpha * 0.3})`;
          ctx.lineWidth = 0.3;
          ctx.stroke();

          // Animated dot along the line
          const progress = ((t * 0.02 + node.x * 0.01) % 100) / 100;
          const dx = target.x - node.x;
          const dy = target.y - node.y;
          const dotX = node.x + dx * progress;
          const dotY = node.y + dy * progress;
          ctx.beginPath();
          ctx.arc(dotX, dotY, 1, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${cr}, ${cg}, ${cb}, ${nodeAlpha * 0.6})`;
          ctx.fill();
        });

        // Node glow
        const grad = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, node.r * 5);
        grad.addColorStop(0, `rgba(${cr}, ${cg}, ${cb}, ${nodeAlpha * npulse})`);
        grad.addColorStop(1, `rgba(${cr}, ${cg}, ${cb}, 0)`);
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.r * 5, 0, Math.PI * 2);
        ctx.fill();
      });

      // --- Glowing connection points ---
      pointsRef.current.forEach((point) => {
        point.pulse += point.pulseSpeed;
        const pAlpha = Math.sin(point.pulse) * 0.5 + 0.5;
        const pointAlpha = point.baseOpacity + (point.maxOpacity - point.baseOpacity) * pAlpha;
        const finalAlpha = typing ? pointAlpha * 1.8 : pointAlpha;

        const grad = ctx.createRadialGradient(point.x, point.y, 0, point.x, point.y, point.r * 4);
        grad.addColorStop(0, `rgba(${cr}, ${cg}, ${cb}, ${finalAlpha * 1.5})`);
        grad.addColorStop(1, `rgba(${cr}, ${cg}, ${cb}, 0)`);
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(point.x, point.y, point.r * 4, 0, Math.PI * 2);
        ctx.fill();
      });

      // --- Building outlines ---
      buildingsRef.current.forEach((bld) => {
        bld.opacity += (bld.targetOpacity - bld.opacity) * bld.fadeSpeed;
        if (Math.abs(bld.opacity - bld.targetOpacity) < 0.0002) {
          bld.targetOpacity = 0.005 + Math.random() * 0.05;
        }

        const bAlpha = typing ? bld.opacity * 1.6 : bld.opacity;

        ctx.fillStyle = `rgba(${cr}, ${cg}, ${cb}, ${bAlpha})`;
        ctx.fillRect(bld.x - bld.w / 2, bld.y - bld.h, bld.w, bld.h);

        // Subtle outline
        ctx.strokeStyle = `rgba(${cr}, ${cg}, ${cb}, ${bAlpha * 1.4})`;
        ctx.lineWidth = 0.4;
        ctx.strokeRect(bld.x - bld.w / 2, bld.y - bld.h, bld.w, bld.h);
      });

      // --- Armenia outline ---
      const outlineScale = Math.min(w, h) * 1.1;
      const outlineX = cx - outlineScale * 0.5;
      const outlineY = cy - outlineScale * 0.38;
      const outlineAlpha = typing ? 0.07 : 0.035;

      // Draw the outline with dashed animation
      ctx.save();
      ctx.beginPath();
      ARMENIA_OUTLINE.forEach(([px, py], i) => {
        const realX = outlineX + px * outlineScale;
        const realY = outlineY + py * outlineScale;
        if (i === 0) ctx.moveTo(realX, realY);
        else ctx.lineTo(realX, realY);
      });
      ctx.closePath();
      ctx.setLineDash([4, 8]);
      ctx.lineDashOffset = -t * 0.15;
      ctx.strokeStyle = `rgba(${cr}, ${cg}, ${cb}, ${outlineAlpha})`;
      ctx.lineWidth = 0.8;
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();

      // Animated dot traveling along Armenia's border
      const dotIdx = Math.floor(((t * 0.3) % ARMENIA_OUTLINE.length));
      const nextIdx = (dotIdx + 1) % ARMENIA_OUTLINE.length;
      const frac = ((t * 0.3) % 1);
      const dpX = ARMENIA_OUTLINE[dotIdx][0] + (ARMENIA_OUTLINE[nextIdx][0] - ARMENIA_OUTLINE[dotIdx][0]) * frac;
      const dpY = ARMENIA_OUTLINE[dotIdx][1] + (ARMENIA_OUTLINE[nextIdx][1] - ARMENIA_OUTLINE[dotIdx][1]) * frac;
      const dotGrad = ctx.createRadialGradient(
        outlineX + dpX * outlineScale,
        outlineY + dpY * outlineScale,
        0,
        outlineX + dpX * outlineScale,
        outlineY + dpY * outlineScale,
        8,
      );
      dotGrad.addColorStop(0, `rgba(${cr}, ${cg}, ${cb}, ${outlineAlpha * 4})`);
      dotGrad.addColorStop(1, `rgba(${cr}, ${cg}, ${cb}, 0)`);
      ctx.fillStyle = dotGrad;
      ctx.beginPath();
      ctx.arc(outlineX + dpX * outlineScale, outlineY + dpY * outlineScale, 8, 0, Math.PI * 2);
      ctx.fill();

      animRef.current = requestAnimationFrame(draw);
    };

    animRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 0 }}
      aria-hidden="true"
    />
  );
}
