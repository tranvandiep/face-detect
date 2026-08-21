import { useEffect, useRef } from 'react'
import type { FaceLandmarkerResult } from '@mediapipe/tasks-vision'

type Props = {
  result: FaceLandmarkerResult | null
  enabled: boolean
  isScanning: boolean
  width: number
  height: number
  isMirrored?: boolean
}

// MediaPipe Landmark index groups for Face Mesh rendering
const OVAL_INDICES = [
  10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365, 379, 378,
  400, 377, 152, 148, 176, 149, 150, 136, 172, 58, 132, 93, 234, 127, 162, 21,
  54, 103, 67, 109, 10,
]

const LEFT_EYE = [33, 160, 158, 133, 153, 144, 33]
const RIGHT_EYE = [362, 385, 387, 263, 373, 380, 362]
const LEFT_EYEBROW = [70, 63, 105, 66, 107]
const RIGHT_EYEBROW = [336, 296, 334, 293, 300]
const NOSE_LINE = [168, 6, 197, 195, 5, 4, 1, 2]
const LIPS_OUTER = [
  61, 185, 40, 39, 37, 0, 267, 269, 270, 409, 291, 375, 321, 405, 314, 17, 84,
  181, 91, 146, 61,
]

export default function FaceMeshOverlay({
  result,
  enabled,
  isScanning,
  width,
  height,
  isMirrored = true,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = width || 600
    canvas.height = height || 600
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    if (!enabled && !isScanning) return

    const landmarks = result?.faceLandmarks?.[0]
    if (!landmarks || landmarks.length < 468) {
      if (isScanning) {
        // Draw standalone scan line if scanning without face
        drawScanLine(ctx, canvas.width, canvas.height)
      }
      return
    }

    const mapX = (x: number) => {
      const actualX = isMirrored ? 1 - x : x
      return actualX * canvas.width
    }
    const mapY = (y: number) => y * canvas.height

    const drawPath = (indices: number[], color: string, lineWidth = 1.5, close = false) => {
      ctx.beginPath()
      for (let i = 0; i < indices.length; i++) {
        const pt = landmarks[indices[i]]
        if (!pt) continue
        const px = mapX(pt.x)
        const py = mapY(pt.y)
        if (i === 0) ctx.moveTo(px, py)
        else ctx.lineTo(px, py)
      }
      if (close) ctx.closePath()
      ctx.strokeStyle = color
      ctx.lineWidth = lineWidth
      ctx.shadowColor = color
      ctx.shadowBlur = 8
      ctx.stroke()
      ctx.shadowBlur = 0
    }

    if (enabled) {
      // 1. Draw facial features
      drawPath(OVAL_INDICES, 'rgba(167, 139, 250, 0.55)', 1.5)
      drawPath(LEFT_EYE, 'rgba(96, 165, 250, 0.75)', 1.5, true)
      drawPath(RIGHT_EYE, 'rgba(96, 165, 250, 0.75)', 1.5, true)
      drawPath(LEFT_EYEBROW, 'rgba(251, 191, 36, 0.8)', 1.5)
      drawPath(RIGHT_EYEBROW, 'rgba(251, 191, 36, 0.8)', 1.5)
      drawPath(NOSE_LINE, 'rgba(52, 211, 153, 0.85)', 1.5)
      drawPath(LIPS_OUTER, 'rgba(244, 114, 182, 0.75)', 1.5, true)

      // 2. Central Symmetry Line
      const topPt = landmarks[10]
      const chinPt = landmarks[152]
      if (topPt && chinPt) {
        ctx.save()
        ctx.beginPath()
        ctx.setLineDash([4, 4])
        ctx.moveTo(mapX(topPt.x), mapY(topPt.y) - 20)
        ctx.lineTo(mapX(chinPt.x), mapY(chinPt.y) + 20)
        ctx.strokeStyle = 'rgba(245, 158, 11, 0.6)'
        ctx.lineWidth = 1.2
        ctx.stroke()
        ctx.restore()
      }

      // 3. Key landmark points
      const keyPoints = [10, 168, 1, 2, 152, 234, 454, 33, 263, 61, 291]
      for (const idx of keyPoints) {
        const pt = landmarks[idx]
        if (!pt) continue
        ctx.beginPath()
        ctx.arc(mapX(pt.x), mapY(pt.y), 2.5, 0, Math.PI * 2)
        ctx.fillStyle = '#ffffff'
        ctx.shadowColor = '#a78bfa'
        ctx.shadowBlur = 10
        ctx.fill()
        ctx.shadowBlur = 0
      }
    }

    // 4. Scanning laser effect
    if (isScanning) {
      drawScanLine(ctx, canvas.width, canvas.height)
    }
  }, [result, enabled, isScanning, width, height, isMirrored])

  return (
    <canvas
      ref={canvasRef}
      className={`face-mesh-canvas ${isScanning ? 'scanning-active' : ''}`}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 5,
      }}
    />
  )
}

function drawScanLine(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const time = performance.now() / 800
  const progress = (Math.sin(time) + 1) / 2 // 0 to 1 back and forth
  const y = progress * h

  ctx.save()
  const grad = ctx.createLinearGradient(0, y - 25, 0, y + 25)
  grad.addColorStop(0, 'rgba(167, 139, 250, 0)')
  grad.addColorStop(0.5, 'rgba(245, 158, 11, 0.4)')
  grad.addColorStop(1, 'rgba(167, 139, 250, 0)')
  ctx.fillStyle = grad
  ctx.fillRect(0, y - 25, w, 50)

  ctx.beginPath()
  ctx.moveTo(0, y)
  ctx.lineTo(w, y)
  ctx.strokeStyle = '#fbbf24'
  ctx.lineWidth = 2
  ctx.shadowColor = '#f59e0b'
  ctx.shadowBlur = 15
  ctx.stroke()
  ctx.restore()
}
