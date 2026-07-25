'use client'

import { useEffect, useRef } from 'react'

export default function MatrixRain() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const currentCanvas = canvas
    const currentCtx = ctx

    currentCanvas.width = window.innerWidth
    currentCanvas.height = window.innerHeight

    const chars = 'python01{}[]<>/\\;:=+-*&^%$#@!~`|?.,kleia'
    const fontSize = 14
    const columns = currentCanvas.width / fontSize
    const drops: number[] = Array(Math.floor(columns)).fill(1)

    function draw() {
      currentCtx.fillStyle = 'rgba(26, 26, 46, 0.05)'
      currentCtx.fillRect(0, 0, currentCanvas.width, currentCanvas.height)

      currentCtx.fillStyle = '#30699820'
      currentCtx.font = `${fontSize}px monospace`

      for (let i = 0; i < drops.length; i++) {
        const text = chars[Math.floor(Math.random() * chars.length)]
        currentCtx.fillText(text, i * fontSize, drops[i] * fontSize)

        if (drops[i] * fontSize > currentCanvas.height && Math.random() > 0.975) {
          drops[i] = 0
        }
        drops[i]++
      }
    }

    const interval = setInterval(draw, 50)

    const handleResize = () => {
      currentCanvas.width = window.innerWidth
      currentCanvas.height = window.innerHeight
    }
    window.addEventListener('resize', handleResize)

    return () => {
      clearInterval(interval)
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none opacity-20"
      aria-hidden="true"
    />
  )
}
