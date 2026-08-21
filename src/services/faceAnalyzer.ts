import type { FaceLandmarkerResult } from '@mediapipe/tasks-vision'
import type {
  FaceAnalysis,
  EmotionResult,
  TamDinh,
  NguHanh,
  SymmetryInfo,
  LuckyFortune,
} from '../types'

type P = { x: number; y: number; z?: number }

const distance = (a: P, b: P) => Math.hypot(a.x - b.x, a.y - b.y)

function emotionFromBlendshapes(result: FaceLandmarkerResult): EmotionResult {
  const categories = result.faceBlendshapes?.[0]?.categories ?? []
  const score = (name: string) =>
    categories.find((c) => c.categoryName === name)?.score ?? 0

  const smile = (score('mouthSmileLeft') + score('mouthSmileRight')) / 2
  const frown = (score('mouthFrownLeft') + score('mouthFrownRight')) / 2
  const browDown = (score('browDownLeft') + score('browDownRight')) / 2
  const eyeWide = (score('eyeWideLeft') + score('eyeWideRight')) / 2
  const mouthOpen = score('jawOpen')

  if (smile > 0.45) return { label: 'Rạng rỡ / Vui vẻ', confidence: smile, emoji: '😊' }
  if (frown > 0.35 && browDown < 0.3) return { label: 'Trầm tư / Buồn', confidence: frown, emoji: '🥺' }
  if (browDown > 0.45) return { label: 'Nghiêm nghị / Tập trung', confidence: browDown, emoji: '🧐' }
  if (eyeWide > 0.45 && mouthOpen > 0.35) return { label: 'Ngạc nhiên / Phấn khích', confidence: Math.min(1, (eyeWide + mouthOpen) / 2), emoji: '✨' }
  return { label: 'Điềm tĩnh / Tự nhiên', confidence: 0.72, emoji: '😌' }
}

function calculateTamDinh(landmarks: P[]): TamDinh {
  // Landmark 10: Forehead top
  // Landmark 168: Mid eyebrows / Glabella
  // Landmark 2: Subnasale (base of nose)
  // Landmark 152: Menton (bottom of chin)
  const topForehead = landmarks[10]
  const glabella = landmarks[168]
  const subnasale = landmarks[2]
  const chin = landmarks[152]

  const h1 = Math.max(Math.abs(glabella.y - topForehead.y), 0.01)
  const h2 = Math.max(Math.abs(subnasale.y - glabella.y), 0.01)
  const h3 = Math.max(Math.abs(chin.y - subnasale.y), 0.01)

  const total = h1 + h2 + h3
  const p1 = Math.round((h1 / total) * 100)
  const p2 = Math.round((h2 / total) * 100)
  const p3 = 100 - p1 - p2

  let danhGia = 'Tam Đình Hài Hòa'
  let yNghia = 'Ba phần khuôn mặt tương đối cân xứng, báo hiệu cuộc sống vững vàng, linh hoạt thích ứng trước mọi hoàn cảnh.'

  const maxPct = Math.max(p1, p2, p3)
  const diff = maxPct - Math.min(p1, p2, p3)

  if (diff <= 6) {
    danhGia = 'Tam Đình Bình Đẳng (Cực Tốt)'
    yNghia = 'Tỷ lệ Thượng - Trung - Hạ đình cân đối lý tưởng. Tiền vận học vấn, trung vận lập nghiệp và hậu vận an khang đều hài hòa thuận lợi.'
  } else if (p1 === maxPct) {
    danhGia = 'Thượng Đình Nổi Trội (Tiền Vận Vượng)'
    yNghia = 'Vầng trán cao rộng biểu thị tư duy sáng suốt, khả năng tiếp thu kiến thức nhanh và có nhiều cơ hội phát triển từ sớm.'
  } else if (p2 === maxPct) {
    danhGia = 'Trung Đình Nổi Trội (Trung Vận Phát Đạt)'
    yNghia = 'Sống mũi và gò má vững chãi biểu thị ý chí kiên định, tinh thần tự lập cao, giai đoạn 30 - 50 tuổi gặt hái nhiều thành tựu.'
  } else {
    danhGia = 'Hạ Đình Đầy Đặn (Hậu Vận Hưng Thịnh)'
    yNghia = 'Cung cằm đầy đặn, khuôn miệng phúc hậu tượng trưng cho sự tích lũy bền bỉ, hậu vận an nhàn và giàu phúc lộc.'
  }

  return {
    thuongDinhPct: p1,
    trungDinhPct: p2,
    haDinhPct: p3,
    danhGia,
    yNghia,
  }
}

function calculateNguHanh(
  faceWidth: number,
  faceHeight: number,
  jawWidth: number,
  chinShape: string,
): NguHanh {
  const ratio = faceHeight / Math.max(faceWidth, 0.001)
  const jawRatio = jawWidth / Math.max(faceWidth, 0.001)

  if (ratio > 1.36) {
    return {
      element: 'Mộc',
      elementTitle: 'Diện Mạo Mộc Đức · Thanh Tú & Uyên Bác',
      description: 'Dáng mặt thon dài thanh nhã, trán cao, mũi thẳng đại diện cho trí tuệ sáng suốt, tính cầu tiến và lòng nhân hậu.',
      tinhCach: 'Điềm đạm, cầu tiến, có chiều sâu tư duy và luôn hướng tới sự hoàn thiện bản thân.',
      mauSacHop: ['Xanh Ngọc Lam', 'Xanh Lục', 'Đen Huyền'],
      conSoMayMan: [3, 8, 9],
      huongCatTuong: 'Chính Đông & Đông Nam',
    }
  }

  if (ratio < 1.1) {
    return {
      element: 'Thủy',
      elementTitle: 'Diện Mạo Thủy Linh · Khéo Léo & Hưng Vượng',
      description: 'Đường nét mềm mại, khuôn mặt tròn đầy đặn mang năng lượng nước ôn hòa, biểu thị tài ngoại giao và khả năng tích lũy tài lộc.',
      tinhCach: 'Linh hoạt, giao tiếp tinh tế, trực giác nhạy bén và rất được lòng mọi người.',
      mauSacHop: ['Xanh Biển Sâu', 'Trắng Ánh Kim', 'Đen Thạch Anh'],
      conSoMayMan: [1, 6, 8],
      huongCatTuong: 'Chính Bắc & Tây Bắc',
    }
  }

  if (jawRatio < 0.72 && chinShape === 'Cằm thon / V-line') {
    return {
      element: 'Hỏa',
      elementTitle: 'Diện Mạo Hỏa Quang · Nhiệt Huyết & Tiên Phong',
      description: 'Khuôn mặt góc cạnh sắc sảo, cằm thon thanh thoát tràn đầy năng lượng sáng tạo, quyết đoán và khí chất tiên phong.',
      tinhCach: 'Nhiệt huyết, sáng tạo vượt trội, dám nghĩ dám làm và luôn tạo ấn tượng nổi bật.',
      mauSacHop: ['Đỏ Ruby', 'Cam Hổ Phách', 'Tím Thạch Anh'],
      conSoMayMan: [2, 7, 9],
      huongCatTuong: 'Chính Nam',
    }
  }

  if (jawRatio > 0.82) {
    return {
      element: 'Thổ',
      elementTitle: 'Diện Mạo Thổ Dưỡng · Trầm Tĩnh & Bền Vững',
      description: 'Khuôn mặt vuông vức phúc hậu, khung xương chắc khỏe tượng trưng cho nền tảng vững vàng, uy tín và sự kiên trì.',
      tinhCach: 'Trọng chữ tín, vững vàng, thực tế, luôn là điểm tựa đáng tin cậy trong tập thể.',
      mauSacHop: ['Vàng Hoàng Thổ', 'Nâu Hạt Dẻ', 'Đỏ Chu Sa'],
      conSoMayMan: [2, 5, 8],
      huongCatTuong: 'Đông Bắc & Tây Nam',
    }
  }

  return {
    element: 'Kim',
    elementTitle: 'Diện Mạo Kim Khí · Cương Trực & Lãnh Đạo',
    description: 'Khuôn mặt cân đối hài hòa, góc cạnh rõ nét biểu thị tính kỷ luật cao, tư duy logic sắc bén và năng lực lãnh đạo tự nhiên.',
    tinhCach: 'Cương trực, quyết đoán, có nguyên tắc rõ ràng và khả năng quản lý xuất sắc.',
    mauSacHop: ['Vàng Ánh Kim', 'Trắng Sứ', 'Xám Bạc'],
    conSoMayMan: [6, 7, 8],
    huongCatTuong: 'Chính Tây & Tây Bắc',
  }
}

function calculateSymmetry(landmarks: P[]): SymmetryInfo {
  // Center midline points
  const midX = (landmarks[10].x + landmarks[168].x + landmarks[2].x + landmarks[152].x) / 4

  // Eye asymmetry: compare distance of left eye inner(133) and right eye inner(362) to midline
  const leftEyeDist = Math.abs(midX - landmarks[133].x)
  const rightEyeDist = Math.abs(landmarks[362].x - midX)
  const eyeDiff = Math.abs(leftEyeDist - rightEyeDist) / Math.max((leftEyeDist + rightEyeDist) / 2, 0.001)

  // Eyebrow asymmetry: Y difference
  const browYDiff = Math.abs(landmarks[107].y - landmarks[336].y) / 0.1

  // Mouth corner asymmetry
  const leftMouthDist = Math.abs(midX - landmarks[61].x)
  const rightMouthDist = Math.abs(landmarks[291].x - midX)
  const mouthDiff = Math.abs(leftMouthDist - rightMouthDist) / Math.max((leftMouthDist + rightMouthDist) / 2, 0.001)

  // Overall symmetry penalty calculation
  const totalPenalty = (eyeDiff * 18) + (browYDiff * 15) + (mouthDiff * 12)
  const rawScore = Math.max(86, Math.min(98, 97 - totalPenalty))
  const symmetryScore = Math.round(rawScore)

  // Golden ratio score calculation
  const faceHeight = distance(landmarks[10], landmarks[152])
  const faceWidth = distance(landmarks[234], landmarks[454])
  const goldenRatio = 1.618
  const actualRatio = faceHeight / Math.max(faceWidth, 0.001)
  const ratioDiff = Math.abs(goldenRatio - actualRatio) / goldenRatio
  const goldenRatioScore = Math.round(Math.max(82, Math.min(97, 96 - ratioDiff * 35)))

  let danhGiaDoiXung = 'Độ Cân Đối Rất Cao'
  if (symmetryScore >= 94) danhGiaDoiXung = 'Tuyệt Vời · Tướng Mạo Cực Kỳ Cân Xứng'
  else if (symmetryScore >= 90) danhGiaDoiXung = 'Rất Tốt · Ngũ Quan Hài Hòa Tự Nhiên'
  else danhGiaDoiXung = 'Hài Hòa · Nét Duyên Biểu Cảm Sinh Động'

  return {
    symmetryScore,
    goldenRatioScore,
    danhGiaDoiXung,
    chiTiet: {
      mat: eyeDiff < 0.1 ? 'Đôi mắt đối xứng chuẩn' : 'Mắt biểu cảm linh hoạt',
      longMay: browYDiff < 0.08 ? 'Cung mày cân bằng' : 'Cung mày cá tính',
      mui: 'Sống mũi thẳng trục chính diện',
      mieng: mouthDiff < 0.12 ? 'Khuôn miệng cân đối' : 'Nụ cười duyên lệch nhẹ',
    },
  }
}

export function analyzeFace(result: FaceLandmarkerResult): FaceAnalysis | null {
  const landmarks = result.faceLandmarks?.[0] as P[] | undefined
  if (!landmarks || landmarks.length < 468) return null

  const leftCheek = landmarks[234]
  const rightCheek = landmarks[454]
  const top = landmarks[10]
  const bottom = landmarks[152]
  const leftJaw = landmarks[172]
  const rightJaw = landmarks[397]

  const faceWidth = distance(leftCheek, rightCheek)
  const faceHeight = distance(top, bottom)
  const jawWidth = distance(leftJaw, rightJaw)
  const ratio = faceHeight / Math.max(faceWidth, 0.0001)

  let faceShape = 'Trái xoan (Oval)'
  if (ratio < 1.1) faceShape = 'Tròn (Round)'
  else if (ratio > 1.38) faceShape = 'Dài thanh tú'
  else if (jawWidth / faceWidth > 0.8) faceShape = 'Vuông chữ Điền'
  else if (jawWidth / faceWidth < 0.72) faceShape = 'Góc cạnh / V-line'

  const forehead = distance(landmarks[10], landmarks[168]) > faceHeight * 0.3 ? 'Trán cao rộng' : 'Trán vừa vặn'
  const eyeWidth = distance(landmarks[33], landmarks[133])
  const eyeHeight = distance(landmarks[159], landmarks[145])
  const eyeRatio = eyeHeight / Math.max(eyeWidth, 0.0001)
  const eyes = eyeRatio > 0.33 ? 'Mắt to sáng, có thần' : 'Mắt cân đối, sâu lắng'

  const browGap = distance(landmarks[107], landmarks[336])
  const eyebrows = browGap < faceWidth * 0.22 ? 'Khoảng cách gần' : 'Khoảng cách thoáng rộng'

  const noseLength = distance(landmarks[6], landmarks[2])
  const nose = noseLength > faceHeight * 0.23 ? 'Sống mũi cao thẳng' : 'Mũi cân đối, thanh tú'

  const mouthWidth = distance(landmarks[61], landmarks[291])
  const mouth = mouthWidth > faceWidth * 0.36 ? 'Miệng rộng quý tướng' : 'Miệng cân đối, duyên dáng'

  const chin = landmarks[152].y - landmarks[2].y > faceHeight * 0.28 ? 'Cằm đầy đặn, nở nang' : 'Cằm thon gọn'

  // Smile blendshape
  const categories = result.faceBlendshapes?.[0]?.categories ?? []
  const score = (name: string) => categories.find((c) => c.categoryName === name)?.score ?? 0
  const smileRaw = (score('mouthSmileLeft') + score('mouthSmileRight')) / 2
  const smileScore = Math.round(smileRaw * 100)
  const isSmileUnlocked = smileScore >= 60

  const emotion = emotionFromBlendshapes(result)
  const tamDinh = calculateTamDinh(landmarks)
  const nguHanh = calculateNguHanh(faceWidth, faceHeight, jawWidth, chin)
  const symmetry = calculateSymmetry(landmarks)

  const fortune: LuckyFortune = {
    overview:
      `Tướng diện mang năng lượng ${nguHanh.element} kết hợp cùng cấu trúc ${faceShape.toLowerCase()}, phản ánh một nhân cách độc lập, có chí tiến thủ và khả năng thu hút vận khí tích cực.`,
    personality:
      `${nguHanh.tinhCach} Đặc điểm ${eyebrows.toLowerCase()} và ${eyes.toLowerCase()} cho thấy khả năng quan sát thấu đáo và thái độ chân thành trong đối nhân xử thế.`,
    career:
      `Tương hợp mạnh mẽ với các lĩnh vực sáng tạo, quản trị hoặc kết nối đối tác. Sự kết hợp giữa ${tamDinh.danhGia.toLowerCase()} giúp bạn vững bước qua các thử thách nghề nghiệp.`,
    relationship:
      `Nét ${mouth.toLowerCase()} cùng ${chin.toLowerCase()} biểu thị sự chu đáo, trọng tình cảm và luôn tạo cảm giác an tâm, ấm áp cho người đồng hành.`,
    finance:
      `Tài vận có xu hướng tích lũy vững chắc theo thời gian. Nên kiên trì với kế hoạch dài hạn và tận dụng các con số may mắn (${nguHanh.conSoMayMan.join(', ')}) để gia tăng cát khí.`,
    dailyAdvice:
      isSmileUnlocked
        ? '✨ Bạn đang sở hữu nụ cười rạng rỡ đầy phúc khí! Nụ cười hôm nay chính là chìa khóa mở ra nhiều cơ hội và quý nhân phù trợ.'
        : '🌟 Hãy giữ tâm thế an nhiên và nở một nụ cười thật tươi trước ống kính để kích hoạt quẻ Đại Cát!',
    queBoi: isSmileUnlocked
      ? '【QUẺ ĐẠI CÁT: VẠN SỰ HANH THÔNG】— Phúc tinh cao chiếu, tâm hỷ sự thành, gặp hung hóa cát.'
      : '【QUẺ TRUNG CÁT: THỜI VẬN ĐANG ĐẾN】— Giữ tâm bình thản, chăm chỉ gieo duyên lành, quả ngọt sắp về.',
  }

  return {
    faceShape,
    forehead,
    eyes,
    eyebrows,
    nose,
    mouth,
    chin,
    smileScore,
    isSmileUnlocked,
    emotion,
    tamDinh,
    nguHanh,
    symmetry,
    fortune,
  }
}