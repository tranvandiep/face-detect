import {
  FaceLandmarker,
  FilesetResolver,
  type FaceLandmarkerResult,
} from '@mediapipe/tasks-vision'

const WASM_PATH =
  'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.35/wasm'

const MODEL_URL =
  'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task'

let detectorPromise: Promise<FaceLandmarker> | null = null
let currentRunningMode: 'VIDEO' | 'IMAGE' = 'VIDEO'

export function getFaceLandmarker(): Promise<FaceLandmarker> {
  if (!detectorPromise) {
    detectorPromise = (async () => {
      const vision = await FilesetResolver.forVisionTasks(WASM_PATH)
      try {
        const detector = await FaceLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: MODEL_URL,
            delegate: 'GPU',
          },
          runningMode: 'VIDEO',
          numFaces: 1,
          minFaceDetectionConfidence: 0.5,
          minFacePresenceConfidence: 0.5,
          minTrackingConfidence: 0.5,
          outputFaceBlendshapes: true,
        })
        currentRunningMode = 'VIDEO'
        return detector
      } catch (gpuError) {
        console.warn('FaceLandmarker GPU delegate failed, falling back to CPU:', gpuError)
        const detector = await FaceLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: MODEL_URL,
            delegate: 'CPU',
          },
          runningMode: 'VIDEO',
          numFaces: 1,
          minFaceDetectionConfidence: 0.5,
          minFacePresenceConfidence: 0.5,
          minTrackingConfidence: 0.5,
          outputFaceBlendshapes: true,
        })
        currentRunningMode = 'VIDEO'
        return detector
      }
    })().catch((err) => {
      detectorPromise = null
      throw err
    })
  }
  return detectorPromise
}

export async function detectFace(
  video: HTMLVideoElement,
  timestamp: number,
): Promise<FaceLandmarkerResult> {
  const detector = await getFaceLandmarker()
  if (currentRunningMode !== 'VIDEO') {
    await detector.setOptions({ runningMode: 'VIDEO' })
    currentRunningMode = 'VIDEO'
  }
  return detector.detectForVideo(video, timestamp)
}

export async function detectFaceFromImage(
  image: HTMLImageElement | HTMLCanvasElement,
): Promise<FaceLandmarkerResult> {
  const detector = await getFaceLandmarker()
  if (currentRunningMode !== 'IMAGE') {
    await detector.setOptions({ runningMode: 'IMAGE' })
    currentRunningMode = 'IMAGE'
  }
  return detector.detect(image)
}