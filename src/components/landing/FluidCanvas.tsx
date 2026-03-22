'use client'

import React, { useState, useEffect } from 'react'

export function FluidCanvas() {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  if (!mounted) return null

  return (
    <div 
      style={{ 
        position: 'absolute', 
        top: 0, 
        left: 0, 
        width: '100%', 
        height: '100%', 
        zIndex: 0, 
        pointerEvents: 'none', 
        opacity: 0.15,
        overflow: 'hidden'
      }}
    >
      <div className="css-fluid-gradient"></div>
      <style jsx>{`
        .css-fluid-gradient {
          position: absolute;
          width: 150vw;
          height: 150vh;
          top: -25vh;
          left: -25vw;
          background: radial-gradient(circle at 50% 50%, rgba(15, 110, 86, 0.4) 0%, rgba(26, 115, 232, 0) 50%),
                      radial-gradient(circle at 80% 20%, rgba(26, 115, 232, 0.4) 0%, rgba(15, 110, 86, 0) 40%),
                      radial-gradient(circle at 20% 80%, rgba(15, 110, 86, 0.3) 0%, rgba(26, 115, 232, 0) 50%);
          filter: blur(40px);
          animation: fluidMove 25s infinite alternate ease-in-out;
          transform-origin: center center;
          will-change: transform;
          backface-visibility: hidden;
        }

        @keyframes fluidMove {
          0% {
            transform: rotate(0deg) scale(1) translate(0, 0);
          }
          33% {
            transform: rotate(5deg) scale(1.1) translate(2vw, 3vh);
          }
          66% {
            transform: rotate(-5deg) scale(0.9) translate(-2vw, 1vh);
          }
          100% {
            transform: rotate(0deg) scale(1.05) translate(1vw, -2vh);
          }
        }
      `}</style>
    </div>
  )
}

