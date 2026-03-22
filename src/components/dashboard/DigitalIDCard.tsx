'use client'

import React, { useState, useRef, useEffect } from 'react'

interface IDCardProps {
  name: string
  role: string
  idNumber: string
  department: string
  batch: string
  imageUrl?: string
  accentColor?: string
}

export function DigitalIDCard({ 
  name, 
  role, 
  idNumber, 
  department, 
  batch, 
  imageUrl, 
  accentColor = '#0F6E56' 
}: IDCardProps) {
  const [rotate, setRotate] = useState({ x: 0, y: 0 })
  const cardRef = useRef<HTMLDivElement>(null)

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return
    const rect = cardRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const centerX = rect.width / 2
    const centerY = rect.height / 2
    
    const rotateX = (centerY - y) / 10
    const rotateY = (x - centerX) / 10
    
    setRotate({ x: rotateX, y: rotateY })
  }

  const handleMouseLeave = () => {
    setRotate({ x: 0, y: 0 })
  }

  return (
    <div 
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        width: '340px',
        height: '200px',
        perspective: '1000px',
        cursor: 'pointer',
        margin: '20px auto'
      }}
    >
      <div
        style={{
          width: '100%',
          height: '100%',
          position: 'relative',
          transformStyle: 'preserve-3d',
          transform: `rotateX(${rotate.x}deg) rotateY(${rotate.y}deg)`,
          transition: 'transform 0.1s ease-out',
        }}
      >
        {/* Front of Card */}
        <div
          style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            background: `linear-gradient(135deg, ${accentColor} 0%, #1a1a1a 100%)`,
            borderRadius: '16px',
            padding: '20px',
            color: 'white',
            boxShadow: '0 15px 35px rgba(0,0,0,0.3)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            overflow: 'hidden',
            backfaceVisibility: 'hidden',
            border: '1px solid rgba(255,255,255,0.1)'
          }}
        >
          {/* Holographic Flash Effect */}
          <div style={{
            position: 'absolute',
            top: '-50%',
            left: '-50%',
            width: '200%',
            height: '200%',
            background: 'linear-gradient(45deg, transparent 45%, rgba(255,255,255,0.1) 50%, transparent 55%)',
            transform: `translateX(${rotate.y * 5}px) translateY(${rotate.x * 5}px)`,
            pointerEvents: 'none'
          }} />

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', gap: '12px' }}>
              <div style={{ 
                width: '60px', 
                height: '60px', 
                borderRadius: '50%', 
                background: '#ddd', 
                overflow: 'hidden',
                border: '2px solid rgba(255,255,255,0.2)'
              }}>
                {imageUrl ? (
                  <img src={imageUrl} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#444', fontSize: '24px', fontWeight: 'bold' }}>
                    {name[0]}
                  </div>
                )}
              </div>
              <div style={{ marginTop: '5px' }}>
                <div style={{ fontSize: '16px', fontWeight: 600, letterSpacing: '0.5px' }}>{name}</div>
                <div style={{ fontSize: '11px', opacity: 0.8, textTransform: 'uppercase' }}>{role}</div>
              </div>
            </div>
            <div style={{ fontSize: '10px', opacity: 0.6, fontWeight: 500 }}>DEPT PORTAL V2</div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <div>
              <div style={{ fontSize: '10px', opacity: 0.7, marginBottom: '2px' }}>ID NUMBER</div>
              <div style={{ fontSize: '14px', fontWeight: 500, fontFamily: 'monospace' }}>{idNumber}</div>
              
              <div style={{ marginTop: '12px' }}>
                <div style={{ fontSize: '9px', opacity: 0.7 }}>DEPARTMENT</div>
                <div style={{ fontSize: '11px', fontWeight: 500 }}>{department}</div>
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={{ 
                width: '50px', 
                height: '50px', 
                background: 'white', 
                padding: '4px',
                borderRadius: '4px',
                marginBottom: '8px',
                marginLeft: 'auto'
              }}>
                {/* Fake QR Code */}
                <div style={{ width: '100%', height: '100%', border: '4px solid #000', position: 'relative' }}>
                    <div style={{ position: 'absolute', top: 2, left: 2, right: 2, bottom: 2, background: 'repeating-conic-gradient(#000 0% 25%, #fff 0% 50%) 50% / 8px 8px' }}></div>
                </div>
              </div>
              <div style={{ fontSize: '9px', opacity: 0.7 }}>BATCH</div>
              <div style={{ fontSize: '11px', fontWeight: 500 }}>{batch}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
