import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const CONFETTI_COLORS = ['#10b981', '#14b8a6', '#06b6d4', '#f59e0b', '#ec4899', '#8b5cf6', '#3b82f6'];

export const triggerConfetti = (message = '') => {
  window.dispatchEvent(new CustomEvent('nutrilens_confetti', { detail: { message } }));
};

export const ConfettiEffect = () => {
  const [particles, setParticles] = useState([]);
  const [toastMsg, setToastMsg] = useState(null);

  useEffect(() => {
    const handleConfetti = (e) => {
      const count = 36;
      const newParticles = Array.from({ length: count }, (_, i) => ({
        id: Date.now() + i,
        x: window.innerWidth / 2 + (Math.random() - 0.5) * 300,
        y: window.innerHeight * 0.45 + (Math.random() - 0.5) * 100,
        targetX: (Math.random() - 0.5) * window.innerWidth * 0.9,
        targetY: (Math.random() - 0.5) * window.innerHeight * 0.8,
        scale: Math.random() * 0.8 + 0.5,
        rotation: Math.random() * 720 - 360,
        color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
        shape: Math.random() > 0.4 ? 'square' : 'circle',
      }));

      setParticles((prev) => [...prev, ...newParticles]);

      if (e.detail?.message) {
        setToastMsg(e.detail.message);
        setTimeout(() => setToastMsg(null), 3000);
      }

      setTimeout(() => {
        setParticles((prev) => prev.filter((p) => !newParticles.some((np) => np.id === p.id)));
      }, 2500);
    };

    window.addEventListener('nutrilens_confetti', handleConfetti);
    return () => window.removeEventListener('nutrilens_confetti', handleConfetti);
  }, []);

  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      <AnimatePresence>
        {toastMsg && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.85 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.85 }}
            className="absolute top-20 left-1/2 -translate-x-1/2 px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-black text-sm shadow-2xl flex items-center space-x-2 border border-emerald-300/40"
          >
            <span>🎉</span>
            <span>{toastMsg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {particles.map((p) => (
        <motion.div
          key={p.id}
          initial={{
            opacity: 1,
            x: p.x,
            y: p.y,
            scale: 0.2,
            rotate: 0,
          }}
          animate={{
            opacity: [1, 1, 0],
            x: p.x + p.targetX,
            y: p.y + p.targetY + 120, // add subtle gravity
            scale: p.scale,
            rotate: p.rotation,
          }}
          transition={{
            duration: 1.8 + Math.random() * 0.6,
            ease: [0.25, 1, 0.5, 1],
          }}
          style={{
            position: 'absolute',
            width: p.shape === 'circle' ? '10px' : '8px',
            height: p.shape === 'circle' ? '10px' : '14px',
            borderRadius: p.shape === 'circle' ? '50%' : '2px',
            backgroundColor: p.color,
            boxShadow: `0 0 10px ${p.color}`,
          }}
        />
      ))}
    </div>
  );
};

export default ConfettiEffect;
