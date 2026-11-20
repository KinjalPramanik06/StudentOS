import React from 'react';
import { motion } from 'motion/react';

export const BackgroundGlow: React.FC = () => {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {/* Light mode soft gradients */}
      <motion.div
        animate={{
          x: [0, 30, -20, 0],
          y: [0, -30, 20, 0],
          scale: [1, 1.1, 0.95, 1],
        }}
        transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-blue-400/20 dark:bg-blue-600/15 blur-3xl"
      />

      <motion.div
        animate={{
          x: [0, -40, 25, 0],
          y: [0, 35, -25, 0],
          scale: [1, 1.15, 0.9, 1],
        }}
        transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-1/3 -right-32 w-[30rem] h-[30rem] rounded-full bg-indigo-400/20 dark:bg-purple-600/15 blur-3xl"
      />

      <motion.div
        animate={{
          x: [0, 25, -30, 0],
          y: [0, -20, 30, 0],
          scale: [1, 0.9, 1.1, 1],
        }}
        transition={{ duration: 25, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute -bottom-32 left-1/3 w-96 h-96 rounded-full bg-sky-300/20 dark:bg-cyan-500/10 blur-3xl"
      />

      {/* Subtle grid pattern overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] dark:bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-40 dark:opacity-30" />
    </div>
  );
};
