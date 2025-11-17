'use client';

import { useEffect, useState } from 'react';

interface Particle {
  id: number;
  left: number;
  delay: number;
  duration: number;
  emoji: string;
  rotation: number;
  scale: number;
}

const EMOJIS = ['📚', '📖', '🎧', '🎵', '🎶'];

export function Confetti() {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    const newParticles: Particle[] = Array.from({ length: 25 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 0.1,
      duration: 2 + Math.random() * 1,
      emoji: EMOJIS[Math.floor(Math.random() * EMOJIS.length)],
      rotation: Math.random() * 360,
      scale: 0.5 + Math.random() * 0.5,
    }));

    setParticles(newParticles);
  }, []);

  return (
    <>
      <style>{`
        @keyframes confetti-fall {
          0% {
            transform: translateY(0) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(720deg);
            opacity: 1;
          }
        }
      `}</style>
      {particles.map((particle) => (
        <div
          key={particle.id}
          style={{
            position: 'fixed',
            left: `${particle.left}%`,
            top: '-20px',
            fontSize: '81px',
            animation: `confetti-fall ${particle.duration}s ease-in forwards`,
            animationDelay: `${particle.delay}s`,
            willChange: 'transform, opacity',
            transform: `scale(${particle.scale}) rotate(${particle.rotation}deg)`,
            pointerEvents: 'none',
            zIndex: 9999,
          }}
        >
          {particle.emoji}
        </div>
      ))}
    </>
  );
}
