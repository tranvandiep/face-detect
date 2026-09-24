import { useEffect } from 'react'
import QRCodeDisplay from './QRCodeDisplay'

type Props = {
  isOpen: boolean
  onClose: () => void
  url: string
  title?: string
  roomName?: string
  subtitle?: string
}

export default function QRCodeModal({
  isOpen,
  onClose,
  url,
  title = 'Quét Mã QR Bằng Điện Thoại',
  roomName,
  subtitle = 'Dùng ứng dụng Camera hoặc Zalo trên điện thoại để quét mã bên dưới và tham gia ngay',
}: Props) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
    }
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div className="modal-backdrop animate-fade-in" onClick={onClose}>
      <div
        className="modal-content card-glass qr-modal-window animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className="modal-close-btn"
          onClick={onClose}
          aria-label="Đóng cửa sổ QR"
        >
          ✕
        </button>

        <div className="qr-modal-header">
          <div className="qr-modal-icon-orb">📱</div>
          <h3>{title}</h3>
          <p>{subtitle}</p>
        </div>

        <div className="qr-modal-body">
          <QRCodeDisplay
            value={url}
            size={210}
            roomName={roomName}
            showCopyBtn={true}
            showUrlPreview={true}
          />
        </div>

        <div className="qr-modal-footer">
          <div className="qr-steps-list">
            <div className="qr-step-item">
              <span className="step-badge">1</span>
              <span>Bật Camera máy ảnh hoặc Zalo trên điện thoại</span>
            </div>
            <div className="qr-step-item">
              <span className="step-badge">2</span>
              <span>Đưa khung hình vào mã QR ở trên</span>
            </div>
            <div className="qr-step-item">
              <span className="step-badge">3</span>
              <span>Chạm vào liên kết để vào phòng và quét tướng số!</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
