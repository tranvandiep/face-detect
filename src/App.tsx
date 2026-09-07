import { useCallback, useState, useEffect } from 'react'
import type { FaceLandmarkerResult } from '@mediapipe/tasks-vision'
import CameraScanner from './components/CameraScanner'
import ResultPanel from './components/ResultPanel'
import GroupSession from './components/GroupSession'
import { analyzeFace } from './services/faceAnalyzer'
import type { FaceAnalysis, SnapshotData } from './types'

export default function App() {
  const [viewMode, setViewMode] = useState<'solo' | 'group'>('solo')
  const [liveAnalysis, setLiveAnalysis] = useState<FaceAnalysis | null>(null)
  const [snapshotData, setSnapshotData] = useState<SnapshotData | null>(null)
  const [faceFound, setFaceFound] = useState(false)

  // Auto switch to group mode if URL contains room hash
  useEffect(() => {
    if (window.location.hash.startsWith('#room=')) {
      setViewMode('group')
    }
  }, [])

  // Real-time detection callback
  const onDetected = useCallback(
    (result: FaceLandmarkerResult | null) => {
      setFaceFound(Boolean(result))
      if (result && !snapshotData) {
        const next = analyzeFace(result)
        if (next) setLiveAnalysis(next)
      }
    },
    [snapshotData],
  )

  // Snapshot callback (from 3s countdown or image upload)
  const onSnapshot = useCallback(
    (imageSrc: string) => {
      if (liveAnalysis) {
        setSnapshotData({
          imageSrc,
          analysis: liveAnalysis,
          capturedAt: new Date().toLocaleTimeString('vi-VN'),
        })

        if (window.innerWidth <= 960) {
          setTimeout(() => {
            document.querySelector('.results-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
          }, 200)
        }
      }
    },
    [liveAnalysis],
  )

  // Reset snapshot to return to live scanning
  const onResetSnapshot = useCallback(() => {
    setSnapshotData(null)
  }, [])

  const currentAnalysis = snapshotData ? snapshotData.analysis : liveAnalysis

  const handleTriggerSoloScan = () => {
    document.querySelector('.scanner-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <main className="app-container">
      {/* Header Hero Section */}
      <header className="hero-header">
        <div className="hero-badge">
          <span className="sparkle">✦</span> FACE FORTUNE AI · NHÂN TƯỚNG HỌC HIỆN ĐẠI <span className="sparkle">✦</span>
        </div>
        <h1 className="hero-title">Khám Phá Tướng Diện & Vận Khí</h1>
        <p className="hero-subtitle">
          Nhận diện cấu trúc ngũ quan, phân tích Tam Đình - Ngũ Hành, đo độ cân xứng tỷ lệ vàng và xuất thẻ may mắn phong thủy thời gian thực.
        </p>

        {/* Global Mode Switcher */}
        <div className="app-mode-switch">
          <button
            type="button"
            className={`mode-switch-btn ${viewMode === 'solo' ? 'active' : ''}`}
            onClick={() => setViewMode('solo')}
          >
            👤 Khám Phá Cá Nhân
          </button>
          <button
            type="button"
            className={`mode-switch-btn ${viewMode === 'group' ? 'active' : ''}`}
            onClick={() => setViewMode('group')}
          >
            👥 Hội Quán Nhiều Người (P2P Realtime)
          </button>
        </div>
      </header>

      {/* Main Content: Solo or Group */}
      {viewMode === 'solo' ? (
        <div className="app-main-layout">
          {/* Left Column: Camera / Image Scanner */}
          <section className="scanner-section">
            <div className="card-glass scanner-card-glass">
              <CameraScanner
                onDetected={onDetected}
                onSnapshot={onSnapshot}
                onResetSnapshot={onResetSnapshot}
                isSnapshotActive={Boolean(snapshotData)}
                smileScore={currentAnalysis?.smileScore ?? 0}
                isSmileUnlocked={currentAnalysis?.isSmileUnlocked ?? false}
              />

              {/* Status Footer */}
              <div className="scanner-status-footer">
                <div className={`status-pill ${faceFound ? 'found' : 'searching'}`}>
                  <span className="status-dot" />
                  {snapshotData
                    ? `Đã khóa kết quả (${snapshotData.capturedAt})`
                    : faceFound
                      ? 'Đang nhận diện diện mạo'
                      : 'Đang tìm khuôn mặt...'}
                </div>
                <div className="privacy-tag">
                  🔒 Xử lý AI trực tiếp trên máy · Tuyệt đối bảo mật
                </div>
              </div>
            </div>
          </section>

          {/* Right Column: Result Panel / Empty State */}
          <section className="results-section">
            {currentAnalysis ? (
              <ResultPanel
                result={currentAnalysis}
                capturedImageSrc={snapshotData?.imageSrc || null}
              />
            ) : (
              <div className="card-glass empty-state-card">
                <div className="empty-oracle-orb">🔮</div>
                <h2>Sẵn Sàng Quét Tướng Diện</h2>
                <p>
                  Hãy ngồi thẳng trước camera, giữ ánh sáng hài hòa hoặc tải ảnh chân dung lên để AI phân tích toàn diện tướng mạo của bạn.
                </p>
                <div className="empty-features-hint">
                  <span>✨ Tam Đình</span>
                  <span>•</span>
                  <span>✨ Ngũ Hành</span>
                  <span>•</span>
                  <span>✨ Tỉ Lệ Vàng</span>
                  <span>•</span>
                  <span>✨ Thẻ May Mắn</span>
                </div>
              </div>
            )}
          </section>
        </div>
      ) : (
        <div className="app-group-layout">
          {/* Top/Side Mini Scanner in Group Mode */}
          <section className="scanner-section group-scanner-section">
            <div className="card-glass scanner-card-glass">
              <div className="group-scanner-title">
                <span>📷</span>
                <h4>Camera Quét Tướng Số Của Bạn</h4>
              </div>
              <CameraScanner
                onDetected={onDetected}
                onSnapshot={onSnapshot}
                onResetSnapshot={onResetSnapshot}
                isSnapshotActive={Boolean(snapshotData)}
                smileScore={currentAnalysis?.smileScore ?? 0}
                isSmileUnlocked={currentAnalysis?.isSmileUnlocked ?? false}
              />
              <div className="scanner-status-footer">
                <div className={`status-pill ${faceFound ? 'found' : 'searching'}`}>
                  <span className="status-dot" />
                  {snapshotData
                    ? `Đã cập nhật quẻ lên phòng (${snapshotData.capturedAt})`
                    : faceFound
                      ? 'Đang nhận diện diện mạo'
                      : 'Bấm Quét (3s) để gửi kết quả vào phòng...'}
                </div>
              </div>
            </div>
          </section>

          {/* Group Session Room View */}
          <section className="group-session-container">
            <GroupSession
              currentAnalysis={currentAnalysis}
              snapshotImageSrc={snapshotData?.imageSrc || null}
              onTriggerSoloScan={handleTriggerSoloScan}
            />
          </section>
        </div>
      )}

      <footer className="app-footer">
        <p>© 2026 Face Fortune AI · Trải nghiệm phong thủy diện mạo & công nghệ thị giác máy tính.</p>
      </footer>
    </main>
  )
}