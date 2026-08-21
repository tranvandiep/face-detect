import { useState } from 'react'
import type { FaceAnalysis } from '../types'
import { generateFortuneCard, downloadFortuneCard } from '../services/cardGenerator'

type Props = {
  result: FaceAnalysis
  capturedImageSrc: string | null
}

export default function ResultPanel({ result, capturedImageSrc }: Props) {
  const [activeTab, setActiveTab] = useState<'nguHanh' | 'tyLe' | 'tuongSo' | 'theMayMan'>('nguHanh')
  const [isGeneratingCard, setIsGeneratingCard] = useState(false)
  const [cardPreviewUrl, setCardPreviewUrl] = useState<string | null>(null)

  const handleDownloadCard = async () => {
    try {
      setIsGeneratingCard(true)
      // Use captured snapshot image or create placeholder
      const imageToUse =
        capturedImageSrc ||
        'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300"><rect fill="%237c3aed" width="100%" height="100%"/><text x="50%" y="50%" fill="white" font-size="24" text-anchor="middle" dominant-baseline="middle">Face Fortune</text></svg>'
      const cardDataUrl = await generateFortuneCard(imageToUse, result)
      setCardPreviewUrl(cardDataUrl)
      downloadFortuneCard(
        cardDataUrl,
        `face-fortune-${result.nguHanh.element.toLowerCase()}-${Date.now()}.png`,
      )
    } catch (err) {
      console.error('Error generating card:', err)
      alert('Không thể tạo thẻ ảnh. Hãy thử chụp lại ảnh trước khi tải thẻ.')
    } finally {
      setIsGeneratingCard(false)
    }
  }

  const handlePreviewCard = async () => {
    try {
      setIsGeneratingCard(true)
      const imageToUse =
        capturedImageSrc ||
        'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300"><rect fill="%237c3aed" width="100%" height="100%"/><text x="50%" y="50%" fill="white" font-size="24" text-anchor="middle" dominant-baseline="middle">Face Fortune</text></svg>'
      const cardDataUrl = await generateFortuneCard(imageToUse, result)
      setCardPreviewUrl(cardDataUrl)
    } catch (err) {
      console.error('Error previewing card:', err)
    } finally {
      setIsGeneratingCard(false)
    }
  }

  return (
    <section className="result-panel-modern">
      {/* Top Identity Hero Card */}
      <div className={`element-hero-card element-${result.nguHanh.element.toLowerCase()}`}>
        <div className="element-badge">
          ✦ BẢN MỆNH DIỆN TƯỚNG: MỆNH {result.nguHanh.element.toUpperCase()} ✦
        </div>
        <h2 className="element-hero-title">{result.nguHanh.elementTitle}</h2>
        <p className="element-hero-desc">{result.nguHanh.description}</p>

        <div className="quick-metrics-row">
          <div className="quick-metric">
            <span className="metric-icon">{result.emotion.emoji}</span>
            <div>
              <div className="metric-label">Khí sắc hiện tại</div>
              <div className="metric-val">{result.emotion.label}</div>
            </div>
          </div>

          <div className="quick-metric">
            <span className="metric-icon">⚖️</span>
            <div>
              <div className="metric-label">Độ cân đối</div>
              <div className="metric-val">{result.symmetry.symmetryScore}%</div>
            </div>
          </div>

          <div className="quick-metric">
            <span className="metric-icon">📐</span>
            <div>
              <div className="metric-label">Tỉ lệ vàng Phi</div>
              <div className="metric-val">{result.symmetry.goldenRatioScore}%</div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Header */}
      <div className="panel-tab-nav">
        <button
          className={`tab-nav-btn ${activeTab === 'nguHanh' ? 'active' : ''}`}
          onClick={() => setActiveTab('nguHanh')}
        >
          🔮 Ngũ Hành & Tam Đình
        </button>
        <button
          className={`tab-nav-btn ${activeTab === 'tyLe' ? 'active' : ''}`}
          onClick={() => setActiveTab('tyLe')}
        >
          ⚖️ Cân Đối & Tỉ Lệ
        </button>
        <button
          className={`tab-nav-btn ${activeTab === 'tuongSo' ? 'active' : ''}`}
          onClick={() => setActiveTab('tuongSo')}
        >
          ✨ Tướng Số & Cát Khí
        </button>
        <button
          className={`tab-nav-btn ${activeTab === 'theMayMan' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('theMayMan')
            if (!cardPreviewUrl) handlePreviewCard()
          }}
        >
          🎴 Thẻ May Mắn
        </button>
      </div>

      {/* Tab 1: Ngũ Hành & Tam Đình */}
      {activeTab === 'nguHanh' && (
        <div className="tab-content animate-fade-in">
          {/* Tam Đình Section */}
          <div className="content-card">
            <div className="card-header-bar">
              <h3>📐 Phân Tích Tam Đình (Ba Tầng Diện Mạo)</h3>
              <span className="tag-badge">{result.tamDinh.danhGia}</span>
            </div>
            <p className="card-intro-text">{result.tamDinh.yNghia}</p>

            {/* Proportion Visualizer */}
            <div className="tamdinh-visualizer">
              <div className="tamdinh-bars">
                <div
                  className="bar-segment bar-thuong"
                  style={{ width: `${result.tamDinh.thuongDinhPct}%` }}
                  title="Thượng Đình (Trán)"
                >
                  <span>{result.tamDinh.thuongDinhPct}%</span>
                </div>
                <div
                  className="bar-segment bar-trung"
                  style={{ width: `${result.tamDinh.trungDinhPct}%` }}
                  title="Trung Đình (Mắt - Mũi)"
                >
                  <span>{result.tamDinh.trungDinhPct}%</span>
                </div>
                <div
                  className="bar-segment bar-ha"
                  style={{ width: `${result.tamDinh.haDinhPct}%` }}
                  title="Hạ Đình (Miệng - Cằm)"
                >
                  <span>{result.tamDinh.haDinhPct}%</span>
                </div>
              </div>

              <div className="tamdinh-legend">
                <div className="legend-item">
                  <span className="legend-dot dot-thuong" />
                  <div>
                    <b>Thượng Đình (Trán)</b>
                    <small>Tiền vận & Khả năng học vấn</small>
                  </div>
                </div>
                <div className="legend-item">
                  <span className="legend-dot dot-trung" />
                  <div>
                    <b>Trung Đình (Mắt - Mũi)</b>
                    <small>Trung vận & Ý chí lập nghiệp</small>
                  </div>
                </div>
                <div className="legend-item">
                  <span className="legend-dot dot-ha" />
                  <div>
                    <b>Hạ Đình (Miệng - Cằm)</b>
                    <small>Hậu vận & Phúc đức dài lâu</small>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Ngũ Hành Details */}
          <div className="content-card">
            <h3>🌟 Đặc Tính & Khí Chất Bản Mệnh</h3>
            <p className="card-intro-text">{result.nguHanh.tinhCach}</p>

            <div className="lucky-grid">
              <div className="lucky-box">
                <span className="lucky-icon">🎨</span>
                <div>
                  <div className="lucky-label">Màu sắc tương sinh</div>
                  <div className="lucky-value">{result.nguHanh.mauSacHop.join(' • ')}</div>
                </div>
              </div>

              <div className="lucky-box">
                <span className="lucky-icon">🔢</span>
                <div>
                  <div className="lucky-label">Con số may mắn</div>
                  <div className="lucky-value">{result.nguHanh.conSoMayMan.join(', ')}</div>
                </div>
              </div>

              <div className="lucky-box">
                <span className="lucky-icon">🧭</span>
                <div>
                  <div className="lucky-label">Hướng cát tường</div>
                  <div className="lucky-value">{result.nguHanh.huongCatTuong}</div>
                </div>
              </div>

              <div className="lucky-box">
                <span className="lucky-icon">👤</span>
                <div>
                  <div className="lucky-label">Hình thái khuôn mặt</div>
                  <div className="lucky-value">{result.faceShape}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Cân Đối & Tỉ Lệ */}
      {activeTab === 'tyLe' && (
        <div className="tab-content animate-fade-in">
          <div className="content-card">
            <div className="card-header-bar">
              <h3>⚖️ Đánh Giá Độ Đối Xứng Khuôn Mặt</h3>
              <span className="score-badge">{result.symmetry.symmetryScore}%</span>
            </div>
            <p className="card-intro-text">{result.symmetry.danhGiaDoiXung}</p>

            <div className="features-grid">
              <div className="feature-item">
                <span className="feature-icon">👁️</span>
                <span className="feature-name">Đôi Mắt</span>
                <b className="feature-val">{result.symmetry.chiTiet.mat}</b>
              </div>
              <div className="feature-item">
                <span className="feature-icon">✨</span>
                <span className="feature-name">Lông Mày</span>
                <b className="feature-val">{result.symmetry.chiTiet.longMay}</b>
              </div>
              <div className="feature-item">
                <span className="feature-icon">👃</span>
                <span className="feature-name">Sống Mũi</span>
                <b className="feature-val">{result.symmetry.chiTiet.mui}</b>
              </div>
              <div className="feature-item">
                <span className="feature-icon">👄</span>
                <span className="feature-name">Khuôn Miệng</span>
                <b className="feature-val">{result.symmetry.chiTiet.mieng}</b>
              </div>
              <div className="feature-item">
                <span className="feature-icon">🏛️</span>
                <span className="feature-name">Vầng Trán</span>
                <b className="feature-val">{result.forehead}</b>
              </div>
              <div className="feature-item">
                <span className="feature-icon">🛡️</span>
                <span className="feature-name">Cung Cằm</span>
                <b className="feature-val">{result.chin}</b>
              </div>
            </div>
          </div>

          <div className="content-card">
            <div className="card-header-bar">
              <h3>📐 Tỉ Lệ Vàng Khuôn Mặt (Phi = 1.618)</h3>
              <span className="score-badge gold">{result.symmetry.goldenRatioScore}%</span>
            </div>
            <p className="card-intro-text">
              Chỉ số đo lường mức độ tiệm cận tỷ lệ vàng giữa chiều dài khuôn mặt, độ rộng gò má và khoảng cách giữa các giác quan. Tỷ lệ {result.symmetry.goldenRatioScore}% cho thấy cấu trúc khuôn mặt đạt độ hài hòa cao về mặt thị giác.
            </p>
          </div>
        </div>
      )}

      {/* Tab 3: Tướng Số & Phong Thủy */}
      {activeTab === 'tuongSo' && (
        <div className="tab-content animate-fade-in">
          {/* Quẻ Bói Hôm Nay */}
          <div className="oracle-banner">
            <div className="oracle-title">{result.fortune.queBoi}</div>
            <div className="oracle-advice">💡 {result.fortune.dailyAdvice}</div>
          </div>

          <div className="fortune-cards-list">
            <article className="fortune-article">
              <h4>🔮 Tổng Quan Vận Mệnh</h4>
              <p>{result.fortune.overview}</p>
            </article>

            <article className="fortune-article">
              <h4>🧠 Khí Chất & Tính Cách</h4>
              <p>{result.fortune.personality}</p>
            </article>

            <article className="fortune-article">
              <h4>💼 Công Danh & Sự Nghiệp</h4>
              <p>{result.fortune.career}</p>
            </article>

            <article className="fortune-article">
              <h4>❤️ Tình Duyên & Gia Đạo</h4>
              <p>{result.fortune.relationship}</p>
            </article>

            <article className="fortune-article">
              <h4>💰 Tài Vận & Tích Lũy</h4>
              <p>{result.fortune.finance}</p>
            </article>
          </div>
        </div>
      )}

      {/* Tab 4: Xuất Thẻ May Mắn */}
      {activeTab === 'theMayMan' && (
        <div className="tab-content animate-fade-in card-export-tab">
          <div className="content-card card-export-center">
            <h3>🎴 Thẻ Tướng Số Phong Thủy (Story Card)</h3>
            <p className="card-intro-text">
              Tải tấm thẻ may mắn độ phân giải cao kèm ảnh chân dung và các chỉ số ngũ hành để chia sẻ lên Story Facebook, Instagram hoặc lưu lại làm kỷ niệm.
            </p>

            {/* Preview Box */}
            <div className="card-preview-box">
              {cardPreviewUrl ? (
                <img
                  src={cardPreviewUrl}
                  alt="Thẻ May Mắn Preview"
                  className="card-preview-image"
                />
              ) : (
                <div className="card-preview-placeholder">
                  {isGeneratingCard ? (
                    <div>Đang tạo thẻ phong thủy...</div>
                  ) : (
                    <div>Bấm nút bên dưới để tạo thẻ xem trước</div>
                  )}
                </div>
              )}
            </div>

            <div className="card-export-actions">
              <button
                className="btn-primary btn-download-card"
                onClick={handleDownloadCard}
                disabled={isGeneratingCard}
              >
                📥 {isGeneratingCard ? 'Đang Tạo Ảnh...' : 'Tải Thẻ May Mắn (PNG HD)'}
              </button>

              <button
                className="btn-secondary"
                onClick={handlePreviewCard}
                disabled={isGeneratingCard}
              >
                🔄 Làm Mới Xem Trước
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cultural & Entertainment Disclaimer */}
      <div className="disclaimer-modern">
        ℹ️ <b>Lưu ý:</b> Ứng dụng sử dụng công nghệ thị giác máy tính MediaPipe AI kết hợp kiến giải nhân tướng học truyền thống nhằm mang lại trải nghiệm giải trí và góc nhìn tích cực. Mọi quyết định trong cuộc sống luôn nằm ở bản lĩnh và sự nỗ lực của chính bạn!
      </div>
    </section>
  )
}