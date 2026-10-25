import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';

export type MascotMood = 'idle' | 'happy' | 'thinking' | 'cheering' | 'sad';

interface Props {
  mood?: MascotMood;
  size?: 'sm' | 'md' | 'lg';
  interactive?: boolean;
  className?: string;
}

export const Mascot: React.FC<Props> = ({
  mood = 'idle',
  size = 'md',
  interactive = true,
  className = '',
}) => {
  const [isBlinking, setIsBlinking] = useState(false);
  const [clicked, setClicked] = useState(false);

  // Periodic eye blink
  useEffect(() => {
    const blinkInterval = setInterval(() => {
      setIsBlinking(true);
      setTimeout(() => setIsBlinking(false), 200);
    }, 3500);

    return () => clearInterval(blinkInterval);
  }, []);

  const sizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-24 h-24 sm:w-28 sm:h-28',
    lg: 'w-36 h-36 sm:w-44 sm:h-44',
  }[size];

  const handleClick = () => {
    if (!interactive) return;
    setClicked(true);
    setTimeout(() => setClicked(false), 600);
  };

  return (
    <motion.div
      onClick={handleClick}
      className={`relative select-none ${sizeClasses} ${interactive ? 'cursor-pointer active:scale-95' : ''} ${className}`}
      animate={
        clicked
          ? { y: [-15, 0], rotate: [0, -8, 8, 0], scale: [1, 1.1, 1] }
          : mood === 'cheering' || mood === 'happy'
          ? { y: [0, -10, 0], rotate: [-2, 2, -2] }
          : mood === 'thinking'
          ? { rotate: [0, 8, 0], y: [0, -3, 0] }
          : mood === 'sad'
          ? { y: [0, 4, 0], rotate: [-2, 0, -2] }
          : { y: [0, -6, 0] } // idle floating
      }
      transition={{
        repeat: clicked ? 0 : Infinity,
        duration: mood === 'cheering' ? 1.2 : 2.6,
        ease: 'easeInOut',
      }}
    >
      {/* 3D Glow Ground Shadow */}
      <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-3/4 h-3 rounded-full bg-indigo-500/20 blur-sm pointer-events-none" />

      {/* SVG Mascot Character - "Si Ku" */}
      <svg
        viewBox="0 0 200 200"
        className="w-full h-full drop-shadow-xl overflow-visible"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="mascotBody" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#6366F1" />
            <stop offset="50%" stop-color="#8B5CF6" />
            <stop offset="100%" stop-color="#EC4899" />
          </linearGradient>

          <linearGradient id="bellyGlow" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.35" />
            <stop offset="100%" stop-color="#FFFFFF" stop-opacity="0" />
          </linearGradient>

          <filter id="softGlowMascot">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Halo / Star decoration when cheering or happy */}
        {(mood === 'cheering' || mood === 'happy' || clicked) && (
          <g>
            <motion.path
              d="M30 40 L35 50 L46 51 L38 58 L40 68 L30 63 L20 68 L22 58 L14 51 L25 50 Z"
              fill="#FDE047"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: [0.8, 1.2, 0.8], opacity: [0.8, 1, 0.8] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
            />
            <motion.path
              d="M165 45 L170 53 L179 54 L172 60 L174 68 L165 64 L156 68 L158 60 L151 54 L160 53 Z"
              fill="#FDE047"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: [1, 1.3, 1], opacity: [0.7, 1, 0.7] }}
              transition={{ repeat: Infinity, duration: 1.8, delay: 0.3 }}
            />
          </g>
        )}

        {/* Mascot Main Question Mark Body with Chubby Friendly Curves */}
        <g>
          {/* Main rounded character hook */}
          <path
            d="M 68 85 C 68 45 88 28 102 28 C 128 28 148 45 148 76 C 148 98 132 112 116 124 C 104 133 98 142 98 152 L 102 152 C 102 140 110 130 122 120 C 142 104 162 86 162 58 C 162 20 132 10 102 10 C 62 10 52 38 52 85 Z"
            fill="url(#mascotBody)"
            stroke="#FFFFFF"
            strokeWidth="5"
            strokeLinejoin="round"
          />

          {/* Question dot body/feet as bouncy ball with rosy cheeks */}
          <circle
            cx="100"
            cy="176"
            r="16"
            fill="url(#mascotBody)"
            stroke="#FFFFFF"
            strokeWidth="4"
          />
        </g>

        {/* Eyes */}
        <g>
          {isBlinking || mood === 'cheering' ? (
            // Closed happy curved eye arcs
            <>
              <path
                d="M 82 72 Q 90 62 98 72"
                fill="none"
                stroke="#FFFFFF"
                strokeWidth="4"
                strokeLinecap="round"
              />
              <path
                d="M 112 72 Q 120 62 128 72"
                fill="none"
                stroke="#FFFFFF"
                strokeWidth="4"
                strokeLinecap="round"
              />
            </>
          ) : mood === 'sad' ? (
            // Sad worried eyes
            <>
              <ellipse cx="90" cy="74" rx="6" ry="7" fill="#FFFFFF" />
              <ellipse cx="120" cy="74" rx="6" ry="7" fill="#FFFFFF" />
              <circle cx="91" cy="76" r="3.5" fill="#1E1B4B" />
              <circle cx="121" cy="76" r="3.5" fill="#1E1B4B" />
              {/* Tear drop */}
              <circle cx="128" cy="85" r="3" fill="#67E8F9" />
            </>
          ) : mood === 'thinking' ? (
            // Thinking looking up eyes
            <>
              <ellipse cx="90" cy="70" rx="7" ry="8" fill="#FFFFFF" />
              <ellipse cx="120" cy="70" rx="7" ry="8" fill="#FFFFFF" />
              <circle cx="92" cy="67" r="4" fill="#1E1B4B" />
              <circle cx="122" cy="67" r="4" fill="#1E1B4B" />
              <circle cx="94" cy="65" r="1.5" fill="#FFFFFF" />
              <circle cx="124" cy="65" r="1.5" fill="#FFFFFF" />
            </>
          ) : (
            // Big shiny curious anime eyes
            <>
              <ellipse cx="90" cy="72" rx="7.5" ry="9" fill="#FFFFFF" />
              <ellipse cx="120" cy="72" rx="7.5" ry="9" fill="#FFFFFF" />
              <ellipse cx="90" cy="72" rx="5" ry="6.5" fill="#1E1B4B" />
              <ellipse cx="120" cy="72" rx="5" ry="6.5" fill="#1E1B4B" />
              {/* Big twinkle light reflection */}
              <circle cx="88" cy="69" r="2.5" fill="#FFFFFF" />
              <circle cx="118" cy="69" r="2.5" fill="#FFFFFF" />
              <circle cx="92" cy="74" r="1.2" fill="#FFFFFF" />
              <circle cx="122" cy="74" r="1.2" fill="#FFFFFF" />
            </>
          )}

          {/* Rosy blush cheeks */}
          <circle cx="78" cy="84" r="6" fill="#F472B6" fillOpacity="0.55" />
          <circle cx="132" cy="84" r="6" fill="#F472B6" fillOpacity="0.55" />

          {/* Cute mouth */}
          {mood === 'happy' || mood === 'cheering' || clicked ? (
            <path
              d="M 98 83 Q 105 93 112 83"
              fill="#FFFFFF"
              stroke="#1E1B4B"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          ) : mood === 'sad' ? (
            <path
              d="M 100 88 Q 105 82 110 88"
              fill="none"
              stroke="#FFFFFF"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          ) : mood === 'thinking' ? (
            <path
              d="M 101 84 Q 106 87 110 83"
              fill="none"
              stroke="#FFFFFF"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          ) : (
            <path
              d="M 100 83 Q 105 88 110 83"
              fill="none"
              stroke="#FFFFFF"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          )}
        </g>
      </svg>
    </motion.div>
  );
};
