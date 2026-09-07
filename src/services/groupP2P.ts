import { joinRoom, selfId } from '@trystero-p2p/mqtt'
import type { RoomMember, GroupCompatibility } from '../types'

const APP_ID = 'face-fortune-ai-group-v1'

export interface P2PCallbacks {
  onPeerJoin: (peerId: string) => void
  onPeerLeave: (peerId: string) => void
  onMemberUpdate: (member: RoomMember, peerId: string) => void
  onSyncRequest: (peerId: string) => void
}

let activeRoom: ReturnType<typeof joinRoom> | null = null
let memberAction: any = null
let syncAction: any = null

export function getSelfId(): string {
  return selfId
}

export function initP2PRoom(
  roomId: string,
  callbacks: P2PCallbacks,
): { selfId: string; leave: () => void } {
  // Clean up any existing room
  if (activeRoom) {
    try {
      activeRoom.leave()
    } catch (e) {
      console.warn('Error leaving previous room:', e)
    }
  }

  const cleanRoomId = roomId.trim().toLowerCase().replace(/\s+/g, '-')
  const room = joinRoom({ appId: APP_ID }, cleanRoomId)
  activeRoom = room

  memberAction = room.makeAction<RoomMember>('memberUpdate')
  syncAction = room.makeAction<{ from: string }>('requestSync')

  room.onPeerJoin = (peerId: string) => {
    callbacks.onPeerJoin(peerId)
    // Request peer to send their member data
    if (syncAction) {
      syncAction.send({ from: selfId }, { target: peerId })
    }
  }

  room.onPeerLeave = (peerId: string) => {
    callbacks.onPeerLeave(peerId)
  }

  memberAction.onMessage = (data: RoomMember, meta: { peerId: string }) => {
    callbacks.onMemberUpdate(data, meta?.peerId || '')
  }

  syncAction.onMessage = (_data: { from: string }, meta: { peerId: string }) => {
    callbacks.onSyncRequest(meta?.peerId || '')
  }

  return {
    selfId,
    leave: () => {
      try {
        room.leave()
      } catch (e) {
        console.warn('Error leaving room:', e)
      }
      activeRoom = null
      memberAction = null
      syncAction = null
    },
  }
}

export function broadcastMemberData(member: RoomMember, targetPeerId?: string) {
  if (memberAction) {
    if (targetPeerId) {
      memberAction.send(member, { target: targetPeerId })
    } else {
      memberAction.send(member)
    }
  }
}

// Elemental Compatibility Matrix (Ngũ Hành Tương Sinh - Tương Khắc)
export function calculateCompatibility(
  p1: RoomMember,
  p2: RoomMember,
): GroupCompatibility | null {
  if (!p1.analysis || !p2.analysis) return null

  const e1 = p1.analysis.nguHanh.element
  const e2 = p2.analysis.nguHanh.element

  // Tương sinh: Mộc sinh Hỏa, Hỏa sinh Thổ, Thổ sinh Kim, Kim sinh Thủy, Thủy sinh Mộc
  const sinhPairs: Record<string, string> = {
    'Mộc': 'Hỏa',
    'Hỏa': 'Thổ',
    'Thổ': 'Kim',
    'Kim': 'Thủy',
    'Thủy': 'Mộc',
  }

  // Tương khắc: Mộc khắc Thổ, Thổ khắc Thủy, Thủy khắc Hỏa, Hỏa khắc Kim, Kim khắc Mộc
  const khacPairs: Record<string, string> = {
    'Mộc': 'Thổ',
    'Thổ': 'Thủy',
    'Thủy': 'Hỏa',
    'Hỏa': 'Kim',
    'Kim': 'Mộc',
  }

  if (sinhPairs[e1] === e2 || sinhPairs[e2] === e1) {
    const isP1SupportsP2 = sinhPairs[e1] === e2
    return {
      person1: p1,
      person2: p2,
      score: 95,
      relation: 'Tương Sinh',
      description: isP1SupportsP2
        ? `Mệnh ${e1} của ${p1.name} tương sinh bồi đắp tài lộc, vượng khí cho mệnh ${e2} của ${p2.name}. Cặp đôi đồng hành đại cát!`
        : `Mệnh ${e2} của ${p2.name} tương sinh nuôi dưỡng sinh khí cho mệnh ${e1} của ${p1.name}. Hợp tác vô cùng hanh thông!`,
    }
  }

  if (e1 === e2) {
    return {
      person1: p1,
      person2: p2,
      score: 85,
      relation: 'Tương Hợp',
      description: `Cùng chung bản mệnh ${e1}, ${p1.name} và ${p2.name} có sự đồng điệu sâu sắc về tư duy, phong thái và nhân sinh quan.`,
    }
  }

  if (khacPairs[e1] === e2 || khacPairs[e2] === e1) {
    return {
      person1: p1,
      person2: p2,
      score: 65,
      relation: 'Tương Khắc',
      description: `Mệnh ${e1} và ${e2} mang tính chất đối nghịch nhưng có thể bổ khuyết, rèn giũa cho nhau nếu biết lắng nghe và tôn trọng dị biệt.`,
    }
  }

  return {
    person1: p1,
    person2: p2,
    score: 75,
    relation: 'Bình Hòa',
    description: `Khí chất hai người cân bằng, hỗ trợ nhau hài hòa trong công việc và các mối quan hệ xã giao.`,
  }
}
