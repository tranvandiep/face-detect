import type { FaceAnalysis } from '../types'

export async function generateFortuneCard(
  imageSrc: string,
  analysis: FaceAnalysis,
): Promise<string> {
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas context not available')

  const width = 900
  const height = 1350
  canvas.width = width
  canvas.height = height

  // 1. Background gradient
  const bgGrad = ctx.createLinearGradient(0, 0, width, height)
  bgGrad.addColorStop(0, '#0c071e')
  bgGrad.addColorStop(0.5, '#170f35')
  bgGrad.addColorStop(1, '#0b061a')
  ctx.fillStyle = bgGrad
  ctx.fillRect(0, 0, width, height)

  // 2. Subtle celestial background glow & patterns
  ctx.save()
  const radialGlow = ctx.createRadialGradient(
    width / 2,
    380,
    50,
    width / 2,
    380,
    450,
  )
  radialGlow.addColorStop(0, 'rgba(124, 58, 237, 0.25)')
  radialGlow.addColorStop(0.7, 'rgba(217, 119, 6, 0.12)')
  radialGlow.addColorStop(1, 'rgba(0, 0, 0, 0)')
  ctx.fillStyle = radialGlow
  ctx.fillRect(0, 0, width, height)

  // Subtle border lines
  ctx.strokeStyle = 'rgba(217, 119, 6, 0.35)'
  ctx.lineWidth = 2
  ctx.strokeRect(28, 28, width - 56, height - 56)

  ctx.strokeStyle = 'rgba(167, 139, 250, 0.45)'
  ctx.lineWidth = 1
  ctx.strokeRect(36, 36, width - 72, height - 72)
  ctx.restore()

  // 3. Header
  ctx.save()
  ctx.fillStyle = '#fbbf24'
  ctx.font = 'bold 15px "Segoe UI", Inter, sans-serif'
  ctx.textAlign = 'center'
  ctx.letterSpacing = '4px'
  ctx.fillText('✦ FACE FORTUNE · NHÂN TƯỚNG AI ✦', width / 2, 78)

  ctx.fillStyle = '#ffffff'
  ctx.font = '900 28px "Segoe UI", Inter, sans-serif'
  ctx.letterSpacing = '1px'
  ctx.fillText(analysis.nguHanh.elementTitle.toUpperCase(), width / 2, 120)
  ctx.restore()

  // 4. Portrait Image (Draw cropped in circle)
  try {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve()
      img.onerror = () => reject(new Error('Cannot load image'))
      img.src = imageSrc
    })

    const portraitCenterX = width / 2
    const portraitCenterY = 280
    const portraitRadius = 115

    ctx.save()
    // Glowing ring
    ctx.beginPath()
    ctx.arc(portraitCenterX, portraitCenterY, portraitRadius + 6, 0, Math.PI * 2)
    ctx.strokeStyle = '#f59e0b'
    ctx.lineWidth = 4
    ctx.shadowColor = '#f59e0b'
    ctx.shadowBlur = 20
    ctx.stroke()
    ctx.restore()

    ctx.save()
    ctx.beginPath()
    ctx.arc(portraitCenterX, portraitCenterY, portraitRadius, 0, Math.PI * 2)
    ctx.clip()

    // Aspect ratio fit
    const minDim = Math.min(img.width, img.height)
    const sx = (img.width - minDim) / 2
    const sy = (img.height - minDim) / 2
    ctx.drawImage(
      img,
      sx,
      sy,
      minDim,
      minDim,
      portraitCenterX - portraitRadius,
      portraitCenterY - portraitRadius,
      portraitRadius * 2,
      portraitRadius * 2,
    )
    ctx.restore()
  } catch (err) {
    console.warn('Could not draw snapshot portrait on canvas:', err)
  }

  // 5. Stat Badges (Symmetry, Golden Ratio, Emotion)
  const badgeY = 440
  const badgeWidth = 240
  const badgeHeight = 72

  const drawBadge = (
    x: number,
    y: number,
    label: string,
    val: string,
    sub: string,
  ) => {
    ctx.save()
    ctx.fillStyle = 'rgba(255, 255, 255, 0.06)'
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.roundRect(x, y, badgeWidth, badgeHeight, 16)
    ctx.fill()
    ctx.stroke()

    ctx.fillStyle = '#a78bfa'
    ctx.font = '11px Inter, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(label.toUpperCase(), x + badgeWidth / 2, y + 22)

    ctx.fillStyle = '#ffffff'
    ctx.font = 'bold 20px Inter, sans-serif'
    ctx.fillText(val, x + badgeWidth / 2, y + 46)

    ctx.fillStyle = '#fbbf24'
    ctx.font = '11px Inter, sans-serif'
    ctx.fillText(sub, x + badgeWidth / 2, y + 62)
    ctx.restore()
  }

  drawBadge(
    65,
    badgeY,
    'Độ Cân Đối',
    `${analysis.symmetry.symmetryScore}%`,
    'Hài hòa ngũ quan',
  )
  drawBadge(
    330,
    badgeY,
    'Tỉ Lệ Vàng Phi',
    `${analysis.symmetry.goldenRatioScore}%`,
    'Tỷ lệ cấu trúc',
  )
  drawBadge(
    595,
    badgeY,
    'Khí Sắc Hiện Tại',
    `${analysis.emotion.emoji} ${analysis.emotion.label}`,
    `Tin cậy ${Math.round(analysis.emotion.confidence * 100)}%`,
  )

  // 6. Tam Đình Section
  const tamDinhY = 545
  ctx.save()
  ctx.fillStyle = 'rgba(255, 255, 255, 0.05)'
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.roundRect(65, tamDinhY, 770, 110, 18)
  ctx.fill()
  ctx.stroke()

  ctx.fillStyle = '#fde68a'
  ctx.font = 'bold 15px Inter, sans-serif'
  ctx.textAlign = 'left'
  ctx.fillText(`✦ TAM ĐÌNH DIỆN TƯỚNG: ${analysis.tamDinh.danhGia}`, 90, tamDinhY + 32)

  // Proportion mini-bars
  const barX = 90
  const barY = tamDinhY + 48
  const barW = 720
  const barH = 14

  const w1 = (barW * analysis.tamDinh.thuongDinhPct) / 100
  const w2 = (barW * analysis.tamDinh.trungDinhPct) / 100
  const w3 = barW - w1 - w2

  // Section 1: Thượng đình (Purple)
  ctx.fillStyle = '#8b5cf6'
  ctx.beginPath()
  ctx.roundRect(barX, barY, w1, barH, [6, 0, 0, 6])
  ctx.fill()

  // Section 2: Trung đình (Amber)
  ctx.fillStyle = '#f59e0b'
  ctx.fillRect(barX + w1, barY, w2, barH)

  // Section 3: Hạ đình (Emerald)
  ctx.fillStyle = '#10b981'
  ctx.beginPath()
  ctx.roundRect(barX + w1 + w2, barY, w3, barH, [0, 6, 6, 0])
  ctx.fill()

  // Labels below bar
  ctx.font = '12px Inter, sans-serif'
  ctx.fillStyle = '#c4b5fd'
  ctx.fillText(`Thượng Đình (Trán): ${analysis.tamDinh.thuongDinhPct}%`, 90, tamDinhY + 86)
  ctx.fillStyle = '#fcd34d'
  ctx.fillText(`Trung Đình (Mắt-Mũi): ${analysis.tamDinh.trungDinhPct}%`, 340, tamDinhY + 86)
  ctx.fillStyle = '#6ee7b7'
  ctx.fillText(`Hạ Đình (Cằm): ${analysis.tamDinh.haDinhPct}%`, 610, tamDinhY + 86)
  ctx.restore()

  // 7. Fortune Quote & Quẻ Bói
  const quoteY = 680
  ctx.save()
  ctx.fillStyle = 'rgba(245, 158, 11, 0.08)'
  ctx.strokeStyle = 'rgba(245, 158, 11, 0.35)'
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.roundRect(65, quoteY, 770, 200, 20)
  ctx.fill()
  ctx.stroke()

  ctx.fillStyle = '#fbbf24'
  ctx.font = 'bold 18px Inter, sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText(analysis.fortune.queBoi, width / 2, quoteY + 42)

  ctx.fillStyle = '#e2e8f0'
  ctx.font = '14.5px Inter, sans-serif'
  ctx.textAlign = 'left'

  // Text wrap for overview
  const wrapText = (
    text: string,
    x: number,
    y: number,
    maxWidth: number,
    lineHeight: number,
  ) => {
    const words = text.split(' ')
    let line = ''
    let curY = y
    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + ' '
      const metrics = ctx.measureText(testLine)
      if (metrics.width > maxWidth && n > 0) {
        ctx.fillText(line, x, curY)
        line = words[n] + ' '
        curY += lineHeight
      } else {
        line = testLine
      }
    }
    ctx.fillText(line, x, curY)
    return curY
  }

  wrapText(analysis.fortune.overview, 95, quoteY + 80, 710, 24)
  ctx.fillStyle = '#34d399'
  wrapText(`💡 Lời khuyên: ${analysis.fortune.dailyAdvice}`, 95, quoteY + 144, 710, 24)
  ctx.restore()

  // 8. Lucky Elements (Màu sắc, Con số, Hướng)
  const luckyY = 905
  ctx.save()
  ctx.fillStyle = 'rgba(255, 255, 255, 0.04)'
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)'
  ctx.beginPath()
  ctx.roundRect(65, luckyY, 770, 140, 18)
  ctx.fill()
  ctx.stroke()

  ctx.fillStyle = '#fbbf24'
  ctx.font = 'bold 14px Inter, sans-serif'
  ctx.textAlign = 'left'
  ctx.fillText('✦ CÁT KHÍ & MAY MẮN TRONG NGÀY', 90, luckyY + 34)

  ctx.fillStyle = '#ffffff'
  ctx.font = '13.5px Inter, sans-serif'
  ctx.fillText(
    `🎨 Màu hợp mệnh: ${analysis.nguHanh.mauSacHop.join(' • ')}`,
    90,
    luckyY + 70,
  )
  ctx.fillText(
    `🔢 Số may mắn: ${analysis.nguHanh.conSoMayMan.join(', ')}`,
    90,
    luckyY + 104,
  )
  ctx.fillText(
    `🧭 Hướng cát tường: ${analysis.nguHanh.huongCatTuong}`,
    470,
    luckyY + 70,
  )
  ctx.fillText(
    `👤 Dáng mặt: ${analysis.faceShape}`,
    470,
    luckyY + 104,
  )
  ctx.restore()

  // 9. Footer & Disclaimer
  ctx.save()
  ctx.fillStyle = 'rgba(255, 255, 255, 0.4)'
  ctx.font = '11px Inter, sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText(
    'Ứng dụng AI Vision nhận diện khuôn mặt kết hợp kiến giải nhân tướng học tham khảo vui.',
    width / 2,
    height - 58,
  )
  ctx.fillStyle = '#a78bfa'
  ctx.font = 'bold 13px Inter, sans-serif'
  ctx.fillText('✦ FACE FORTUNE · AI VISION EXPERIENCE ✦', width / 2, height - 36)
  ctx.restore()

  return canvas.toDataURL('image/png')
}

export function downloadFortuneCard(dataUrl: string, filename = 'face-fortune-card.png') {
  const link = document.createElement('a')
  link.download = filename
  link.href = dataUrl
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
