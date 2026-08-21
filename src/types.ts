export type EmotionResult = {
  label: string
  confidence: number
  emoji: string
}

export type TamDinh = {
  thuongDinhPct: number // Trán (%)
  trungDinhPct: number  // Mắt - Mũi (%)
  haDinhPct: number     // Miệng - Cằm (%)
  danhGia: string
  yNghia: string
}

export type NguHanh = {
  element: 'Kim' | 'Mộc' | 'Thủy' | 'Hỏa' | 'Thổ'
  elementTitle: string
  description: string
  tinhCach: string
  mauSacHop: string[]
  conSoMayMan: number[]
  huongCatTuong: string
}

export type SymmetryInfo = {
  symmetryScore: number      // 0 - 100%
  goldenRatioScore: number   // 0 - 100%
  danhGiaDoiXung: string
  chiTiet: {
    mat: string
    longMay: string
    mui: string
    mieng: string
  }
}

export type LuckyFortune = {
  overview: string
  personality: string
  career: string
  relationship: string
  finance: string
  dailyAdvice: string
  queBoi: string
}

export type FaceAnalysis = {
  faceShape: string
  forehead: string
  eyes: string
  eyebrows: string
  nose: string
  mouth: string
  chin: string
  smileScore: number
  isSmileUnlocked: boolean
  emotion: EmotionResult
  tamDinh: TamDinh
  nguHanh: NguHanh
  symmetry: SymmetryInfo
  fortune: LuckyFortune
}

export type SnapshotData = {
  imageSrc: string
  analysis: FaceAnalysis
  capturedAt: string
}