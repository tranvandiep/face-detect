import { useEffect, useRef, useState, useCallback } from 'react'
import {
  detectFace,
  detectFaceFromImage,
  getFaceLandmarker,
} from '../services/faceDetector'
import type { FaceLandmarkerResult } from '@mediapipe/tasks-vision'
import FaceMeshOverlay from './FaceMeshOverlay'

type Props = {
  onDetected: (result: FaceLandmarkerResult | null) => void
  onSnapshot: (imageSrc: string) => void
  onResetSnapshot: () => void
  isSnapshotActive: boolean
  smileScore: number
  isSmileUnlocked: boolean
}

export default function CameraScanner({
  onDetected,
  onSnapshot,
  onResetSnapshot,
  isSnapshotActive,
  smileScore,
  isSmileUnlocked,
}: Props) {
  const [mode, setMode] = useState<'camera' | 'upload'>('camera')
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user')
  const [showMesh, setShowMesh] = useState(true)
  const [loadingModel, setLoadingModel] = useState(true)
  const [error, setError] = useState('')
  const [countdown, setCountdown] = useState<number | null>(null)
  const [isScanning, setIsScanning] = useState(false)
  const [uploadedImageSrc, setUploadedImageSrc] = useState<string | null>(null)

  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const animationRef = useRef<number | null>(null)
  const latestResultRef = useRef<FaceLandmarkerResult | null>(null)
  const [dimensions, setDimensions] = useState({ width: 480, height: 480 })

  // Camera start & detection loop
  useEffect(() => {
    if (mode !== 'camera' || isSnapshotActive) return

    let stopped = false

    const startCamera = async () => {
      try {
        setError('')
        // Pre-initialize model
        getFaceLandmarker()
          .then(() => {
            if (!stopped) setLoadingModel(false)
          })
          .catch((err) => {
            console.error('Failed to load face detection model:', err)
            if (!stopped) {
              setError('Không thể tải mô hình AI. Vui lòng kiểm tra mạng và tải lại trang.')
            }
          })

        if (streamRef.current) {
          streamRef.current.getTracks().forEach((t) => t.stop())
        }

        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode,
            width: { ideal: 720 },
            height: { ideal: 720 },
          },
          audio: false,
        })

        if (stopped) {
          stream.getTracks().forEach((t) => t.stop())
          return
        }

        streamRef.current = stream
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          await videoRef.current.play()
          setDimensions({
            width: videoRef.current.videoWidth || 480,
            height: videoRef.current.videoHeight || 480,
          })
        }

        const loop = async () => {
          if (stopped || !videoRef.current) return

          try {
            if (
              videoRef.current.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA &&
              videoRef.current.videoWidth > 0
            ) {
              const result = await detectFace(videoRef.current, performance.now())
              const hasFace = Boolean(result.faceLandmarks?.length)
              latestResultRef.current = hasFace ? result : null
              onDetected(latestResultRef.current)
            }
          } catch (e) {
            console.error('Face detection frame error:', e)
          }

          if (!stopped) {
            animationRef.current = requestAnimationFrame(loop)
          }
        }

        loop()
      } catch (err) {
        console.error(err)
        setError(
          'Không thể mở camera. Hãy cấp quyền camera và chạy ứng dụng trên localhost hoặc HTTPS.',
        )
      }
    }

    startCamera()

    return () => {
      stopped = true
      if (animationRef.current) cancelAnimationFrame(animationRef.current)
      streamRef.current?.getTracks().forEach((t) => t.stop())
    }
  }, [mode, facingMode, isSnapshotActive, onDetected])

  // Capture frame from video element
  const captureCurrentFrame = useCallback((): string | null => {
    if (!videoRef.current) return null
    const v = videoRef.current
    const canvas = document.createElement('canvas')
    canvas.width = v.videoWidth || 720
    canvas.height = v.videoHeight || 720
    const ctx = canvas.getContext('2d')
    if (!ctx) return null

    if (facingMode === 'user') {
      ctx.translate(canvas.width, 0)
      ctx.scale(-1, 1)
    }
    ctx.drawImage(v, 0, 0, canvas.width, canvas.height)
    return canvas.toDataURL('image/jpeg', 0.95)
  }, [facingMode])

  // Trigger 3s countdown & scan
  const handleStartScan = useCallback(() => {
    if (countdown !== null) return
    setIsScanning(true)
    setCountdown(3)

    let count = 3
    const timer = setInterval(() => {
      count -= 1
      if (count > 0) {
        setCountdown(count)
      } else {
        clearInterval(timer)
        setCountdown(null)
        setIsScanning(false)
        const frame = captureCurrentFrame()
        if (frame) {
          onSnapshot(frame)
        }
      }
    }, 1000)
  }, [countdown, captureCurrentFrame, onSnapshot])

  // Handle uploaded image
  const handleFileUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file) return

      setError('')
      const reader = new FileReader()
      reader.onload = async (ev) => {
        const dataUrl = ev.target?.result as string
        setUploadedImageSrc(dataUrl)

        const img = new Image()
        img.crossOrigin = 'anonymous'
        img.onload = async () => {
          try {
            setDimensions({ width: img.width, height: img.height })
            const result = await detectFaceFromImage(img)
            const hasFace = Boolean(result.faceLandmarks?.length)
            if (!hasFace) {
              setError('Không tìm thấy khuôn mặt rõ ràng trong ảnh. Vui lòng chọn ảnh chụp thẳng, đủ sáng.')
              onDetected(null)
            } else {
              latestResultRef.current = result
              onDetected(result)
              onSnapshot(dataUrl)
            }
          } catch (err) {
            console.error('Image detection error:', err)
            setError('Lỗi khi phân tích ảnh. Vui lòng thử lại.')
          }
        }
        img.src = dataUrl
      }
      reader.readAsDataURL(file)
    },
    [onDetected, onSnapshot],
  )

  const toggleCameraFacing = () => {
    setFacingMode((prev) => (prev === 'user' ? 'environment' : 'user'))
  }

  return (
    <div className="camera-card-inner">
      {/* Mode Selector Tabs */}
      <div className="scanner-mode-tabs">
        <button
          className={`tab-btn ${mode === 'camera' ? 'active' : ''}`}
          onClick={() => {
            setMode('camera')
            setUploadedImageSrc(null)
            onResetSnapshot()
          }}
        >
          📷 Camera Trực Tiếp
        </button>
        <button
          className={`tab-btn ${mode === 'upload' ? 'active' : ''}`}
          onClick={() => {
            setMode('upload')
            if (streamRef.current) {
              streamRef.current.getTracks().forEach((t) => t.stop())
            }
          }}
        >
          📁 Tải Ảnh Từ Máy
        </button>
      </div>

      {/* Main Viewport */}
      <div className="camera-viewport-wrap">
        {mode === 'camera' ? (
          <>
            <video
              ref={videoRef}
              className={`camera-video ${facingMode === 'user' ? 'mirrored' : ''}`}
              playsInline
              autoPlay
              muted
            />
            <FaceMeshOverlay
              result={latestResultRef.current}
              enabled={showMesh}
              isScanning={isScanning}
              width={dimensions.width}
              height={dimensions.height}
              isMirrored={facingMode === 'user'}
            />
          </>
        ) : (
          <div className="upload-view-wrap">
            {uploadedImageSrc ? (
              <>
                <img
                  src={uploadedImageSrc}
                  alt="Ảnh tải lên"
                  className="uploaded-preview-img"
                />
                <FaceMeshOverlay
                  result={latestResultRef.current}
                  enabled={showMesh}
                  isScanning={false}
                  width={dimensions.width}
                  height={dimensions.height}
                  isMirrored={false}
                />
              </>
            ) : (
              <label className="upload-dropzone">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  style={{ display: 'none' }}
                />
                <div className="dropzone-icon">🖼️</div>
                <div className="dropzone-title">Bấm để chọn ảnh chân dung</div>
                <div className="dropzone-sub">
                  Hỗ trợ định dạng JPG, PNG, WEBP (ảnh chụp thẳng rõ mặt)
                </div>
              </label>
            )}
          </div>
        )}

        {/* Scan Frame Outline */}
        <div className="scan-target-frame" />

        {/* 3s Countdown Overlay */}
        {countdown !== null && (
          <div className="countdown-overlay">
            <div className="countdown-number">{countdown}</div>
            <div className="countdown-text">Đang định vị diện mạo...</div>
          </div>
        )}

        {/* Loading Overlay */}
        {loadingModel && !error && (
          <div className="camera-loading-overlay">
            <div className="spinner" />
            <div>Đang tải mô hình AI Face Vision...</div>
          </div>
        )}

        {/* Error Overlay */}
        {error && <div className="camera-error-overlay">{error}</div>}
      </div>

      {/* Smile Meter Bar */}
      <div className="smile-meter-container">
        <div className="smile-header">
          <span className="smile-title">
            {isSmileUnlocked ? '✨ Nụ Cười Phúc Khí' : '😊 Cảm xúc nụ cười'}
          </span>
          <span className={`smile-value ${isSmileUnlocked ? 'unlocked' : ''}`}>
            {smileScore}%
          </span>
        </div>
        <div className="smile-track">
          <div
            className={`smile-fill ${isSmileUnlocked ? 'gold' : ''}`}
            style={{ width: `${Math.min(smileScore, 100)}%` }}
          />
        </div>
        {isSmileUnlocked && (
          <div className="smile-badge-pulse">
            🎉 Đã mở khóa Quẻ Đại Cát!
          </div>
        )}
      </div>

      {/* Action Controls Bar */}
      <div className="scanner-controls">
        {mode === 'camera' && (
          <>
            {isSnapshotActive ? (
              <button
                className="btn-primary btn-rescan"
                onClick={onResetSnapshot}
              >
                🔄 Tiếp Tục Quét Real-time
              </button>
            ) : (
              <button
                className="btn-primary btn-scan"
                onClick={handleStartScan}
                disabled={countdown !== null || loadingModel}
              >
                ⚡ Quét & Xem Tướng Số (3s)
              </button>
            )}

            <button
              className={`btn-icon ${showMesh ? 'active' : ''}`}
              title="Bật / Tắt lưới AI Face Mesh"
              onClick={() => setShowMesh(!showMesh)}
            >
              🔮 {showMesh ? 'Ẩn Lưới AI' : 'Hiện Lưới AI'}
            </button>

            <button
              className="btn-icon"
              title="Chuyển đổi Camera Trước / Sau"
              onClick={toggleCameraFacing}
            >
              🔄 Đổi Cam
            </button>
          </>
        )}

        {mode === 'upload' && uploadedImageSrc && (
          <label className="btn-primary btn-upload-again">
            <input
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              style={{ display: 'none' }}
            />
            📂 Chọn Ảnh Khác
          </label>
        )}
      </div>
    </div>
  )
}