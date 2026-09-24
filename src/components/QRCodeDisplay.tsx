import { useEffect, useState } from 'react'
import QRCode from 'qrcode'

type Props = {
  value: string
  size?: number
  title?: string
  subtitle?: string
  roomName?: string
  showCopyBtn?: boolean
  showUrlPreview?: boolean
  className?: string
}

export default function QRCodeDisplay({
  value,
  size = 180,
  title,
  subtitle,
  roomName,
  showCopyBtn = true,
  showUrlPreview = true,
  className = '',
}: Props) {
  const [dataUrl, setDataUrl] = useState<string>('')
  const [copied, setCopied] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)

  useEffect(() => {
    if (!value) return
    setIsGenerating(true)
    QRCode.toDataURL(value, {
      width: Math.max(size * 2, 256), // Sharp retina output
      margin: 1.5,
      color: {
        dark: '#160d29',
        light: '#ffffff',
      },
      errorCorrectionLevel: 'M',
    })
      .then((url) => {
        setDataUrl(url)
        setIsGenerating(false)
      })
      .catch((err) => {
        console.error('Failed to generate QR code:', err)
        setIsGenerating(false)
      })
  }, [value, size])

  const handleCopy = () => {
    navigator.clipboard.writeText(value)
    setCopied(true)
    setTimeout(() => setCopied(false), 2200)
  }

  return (
    <div className={`qr-display-container ${className}`}>
      {title && <h4 className="qr-display-title">{title}</h4>}
      {subtitle && <p className="qr-display-subtitle">{subtitle}</p>}

      <div className="qr-code-card">
        <div className="qr-image-frame" style={{ width: size, height: size }}>
          {dataUrl ? (
            <img
              src={dataUrl}
              alt={roomName ? `Mã QR Phòng ${roomName}` : 'Mã QR Face Fortune AI'}
              className="qr-image"
              style={{ width: size, height: size }}
            />
          ) : (
            <div className="qr-placeholder" style={{ width: size, height: size }}>
              {isGenerating ? 'Đang tạo QR...' : 'Chưa có dữ liệu'}
            </div>
          )}
          <span className="qr-corner top-left" />
          <span className="qr-corner top-right" />
          <span className="qr-corner bottom-left" />
          <span className="qr-corner bottom-right" />
        </div>

        {roomName && (
          <div className="qr-room-tag">
            <span>Phòng:</span> <b>{roomName}</b>
          </div>
        )}

        {showUrlPreview && (
          <div className="qr-url-snippet" title={value}>
            {value.replace(/^https?:\/\//, '')}
          </div>
        )}
      </div>

      {showCopyBtn && (
        <div className="qr-actions-row">
          <button
            type="button"
            className={`btn-qr-action ${copied ? 'copied' : ''}`}
            onClick={handleCopy}
          >
            {copied ? '✅ Đã Copy Đường Dẫn!' : '🔗 Sao Chép Link Nhanh'}
          </button>
        </div>
      )}
    </div>
  )
}
