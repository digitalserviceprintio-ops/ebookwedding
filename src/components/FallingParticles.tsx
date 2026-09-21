import React, { useEffect, useRef, useState } from 'react';

interface Particle {
  x: number;
  y: number;
  size: number;
  speedY: number;
  speedX: number;
  rotation: number;
  rotationSpeed: number;
  oscillationSpeed: number;
  oscillationDistance: number;
  oscillationAngle: number;
  opacity: number;
  type: 'flower' | 'snow';
  color: string;
}

interface FallingParticlesProps {
  enabled?: boolean;
  onToggle?: () => void;
}

export const FallingParticles: React.FC<FallingParticlesProps> = ({
  enabled = true,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameId = useRef<number | null>(null);

  useEffect(() => {
    if (!enabled) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);

    // Color palettes for flower petals: soft peach, orange blossom, and sakura white-pink
    const flowerColors = [
      'rgba(255, 165, 110, ', // soft citrus peach
      'rgba(255, 138, 101, ', // orange peel coral
      'rgba(254, 215, 170, ', // light orange cream
      'rgba(255, 183, 197, ', // soft rose petal
      'rgba(255, 237, 213, ', // warm ivory citrus
    ];

    // Total particles: balance of flower petals and snowflakes
    const PARTICLE_COUNT = 38;
    const particles: Particle[] = [];

    const createParticle = (initialY = -20): Particle => {
      const isFlower = Math.random() < 0.55; // 55% flower petals, 45% snow
      const colorBase = isFlower
        ? flowerColors[Math.floor(Math.random() * flowerColors.length)]
        : 'rgba(255, 255, 255, ';

      return {
        x: Math.random() * width,
        y: initialY,
        size: isFlower ? Math.random() * 8 + 7 : Math.random() * 4 + 2,
        speedY: isFlower ? Math.random() * 0.9 + 0.6 : Math.random() * 1.2 + 0.5,
        speedX: Math.random() * 0.5 - 0.25,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.03,
        oscillationSpeed: Math.random() * 0.02 + 0.01,
        oscillationDistance: Math.random() * 1.5 + 0.5,
        oscillationAngle: Math.random() * Math.PI * 2,
        opacity: isFlower ? Math.random() * 0.4 + 0.5 : Math.random() * 0.5 + 0.4,
        type: isFlower ? 'flower' : 'snow',
        color: colorBase,
      };
    };

    // Pre-populate particles distributed across full viewport initially
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      particles.push(createParticle(Math.random() * height));
    }

    // Helper to draw flower petal with 3D tumble flip
    const drawPetal = (
      context: CanvasRenderingContext2D,
      x: number,
      y: number,
      size: number,
      angle: number,
      color: string,
      alpha: number
    ) => {
      context.save();
      context.translate(x, y);
      context.rotate(angle);
      // 3D tumble simulation: scale horizontally with sinusoidal oscillation
      const tumbleScale = Math.cos(angle * 1.4);
      context.scale(tumbleScale, 1);

      context.beginPath();
      // Draw smooth petal contour
      context.moveTo(0, -size);
      context.bezierCurveTo(size * 0.75, -size * 0.7, size * 0.95, size * 0.35, 0, size);
      context.bezierCurveTo(-size * 0.95, size * 0.35, -size * 0.75, -size * 0.7, 0, -size);

      context.fillStyle = `${color}${alpha})`;
      context.shadowColor = 'rgba(249, 115, 22, 0.25)';
      context.shadowBlur = 4;
      context.fill();

      // Subtle center vein line of petal
      context.beginPath();
      context.moveTo(0, -size * 0.6);
      context.lineTo(0, size * 0.5);
      context.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.6})`;
      context.lineWidth = 0.8;
      context.stroke();

      context.restore();
    };

    // Helper to draw crystalline snowflake
    const drawSnowflake = (
      context: CanvasRenderingContext2D,
      x: number,
      y: number,
      size: number,
      alpha: number
    ) => {
      context.save();
      context.translate(x, y);

      if (size > 4) {
        // Detailed 6-arm crystal snowflake for larger particles
        context.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
        context.lineWidth = 1;
        context.shadowColor = 'rgba(255, 255, 255, 0.8)';
        context.shadowBlur = 6;

        for (let i = 0; i < 6; i++) {
          context.beginPath();
          context.moveTo(0, 0);
          context.lineTo(0, size);
          // branch
          context.moveTo(0, size * 0.5);
          context.lineTo(size * 0.3, size * 0.7);
          context.moveTo(0, size * 0.5);
          context.lineTo(-size * 0.3, size * 0.7);
          context.stroke();
          context.rotate(Math.PI / 3);
        }
      } else {
        // Soft glowing circular snow dot
        const gradient = context.createRadialGradient(0, 0, 0, 0, 0, size);
        gradient.addColorStop(0, `rgba(255, 255, 255, ${alpha})`);
        gradient.addColorStop(0.6, `rgba(255, 255, 255, ${alpha * 0.7})`);
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

        context.beginPath();
        context.arc(0, 0, size, 0, Math.PI * 2);
        context.fillStyle = gradient;
        context.shadowColor = 'rgba(255, 255, 255, 0.9)';
        context.shadowBlur = 4;
        context.fill();
      }

      context.restore();
    };

    // Main animation loop
    const render = () => {
      ctx.clearRect(0, 0, width, height);

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        // Update oscillation and position
        p.oscillationAngle += p.oscillationSpeed;
        p.x += Math.sin(p.oscillationAngle) * p.oscillationDistance + p.speedX;
        p.y += p.speedY;
        p.rotation += p.rotationSpeed;

        // Render particle
        if (p.type === 'flower') {
          drawPetal(ctx, p.x, p.y, p.size, p.rotation, p.color, p.opacity);
        } else {
          drawSnowflake(ctx, p.x, p.y, p.size, p.opacity);
        }

        // Recycle particle when it drifts off screen
        if (p.y > height + 20 || p.x < -30 || p.x > width + 30) {
          particles[i] = createParticle(-15);
        }
      }

      animFrameId.current = requestAnimationFrame(render);
    };

    animFrameId.current = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animFrameId.current) {
        cancelAnimationFrame(animFrameId.current);
      }
    };
  }, [enabled]);

  if (!enabled) return null;

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-30 w-full h-full"
      style={{ pointerEvents: 'none' }}
    />
  );
};
