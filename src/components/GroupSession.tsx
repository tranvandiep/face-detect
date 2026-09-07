import { useState, useEffect, useCallback, useMemo } from 'react'
import type { FaceAnalysis, RoomMember } from '../types'
import {
  initP2PRoom,
  broadcastMemberData,
  getSelfId,
  calculateCompatibility,
} from '../services/groupP2P'
import ResultPanel from './ResultPanel'

const AVATARS = ['🦊', '🐯', '🐉', '🐱', '🦁', '🐼', '🦄', '🦅', '👑', '💎', '🔮', '✨']

const DEFAULT_ROOM_SUGGESTIONS = [
  'PHONG-MAY-MAN-888',
  'HOI-BAN-THAN-777',
  'XEM-TUONG-SO-999',
  'GIA-DINH-HANH-PHUC',
  'CONG-TY-TAI-LOC',
]

type Props = {
  currentAnalysis: FaceAnalysis | null
  snapshotImageSrc: string | null
  onTriggerSoloScan: () => void
}

export default function GroupSession({
  currentAnalysis,
  snapshotImageSrc,
  onTriggerSoloScan,
}: Props) {
  // Lobby form state
  const [userName, setUserName] = useState(() => {
    return (
      localStorage.getItem('ff_username') ||
      `Khách Quý ${Math.floor(100 + Math.random() * 900)}`
    )
  })
  const [userAvatar, setUserAvatar] = useState(() => {
    return (
      localStorage.getItem('ff_avatar') ||
      AVATARS[Math.floor(Math.random() * AVATARS.length)]
    )
  })
  const [roomIdInput, setRoomIdInput] = useState('')
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null)

  // Room state
  const [members, setMembers] = useState<Record<string, RoomMember>>({})
  const [activeTab, setActiveTab] = useState<'members' | 'elements' | 'leaderboard'>('members')
  const [selectedMemberDetail, setSelectedMemberDetail] = useState<RoomMember | null>(null)
  const [copyToast, setCopyToast] = useState(false)

  // Self member object
  const selfMember = useMemo<RoomMember>(() => {
    return {
      id: getSelfId(),
      name: userName,
      avatar: userAvatar,
      status: currentAnalysis ? 'done' : 'waiting',
      analysis: currentAnalysis,
      thumbnail: snapshotImageSrc || null,
      joinedAt: Date.now(),
      isSelf: true,
    }
  }, [userName, userAvatar, currentAnalysis, snapshotImageSrc])

  // Check URL hash for direct room invite on mount
  useEffect(() => {
    const hash = window.location.hash
    if (hash.startsWith('#room=')) {
      const roomFromUrl = decodeURIComponent(hash.replace('#room=', '')).trim()
      if (roomFromUrl) {
        setRoomIdInput(roomFromUrl)
      }
    }
  }, [])

  // Save profile to localStorage
  useEffect(() => {
    localStorage.setItem('ff_username', userName)
    localStorage.setItem('ff_avatar', userAvatar)
  }, [userName, userAvatar])

  // Handle joining room
  const handleJoinRoom = useCallback(
    (targetRoomId: string) => {
      const cleanId = targetRoomId.trim().toUpperCase().replace(/\s+/g, '-')
      if (!cleanId) {
        alert('Vui lòng nhập hoặc chọn mã phòng.')
        return
      }

      setActiveRoomId(cleanId)
      window.location.hash = `room=${encodeURIComponent(cleanId)}`

      // Initial members map with self
      setMembers({
        [selfMember.id]: selfMember,
      })

      const { leave } = initP2PRoom(cleanId, {
        onPeerJoin: (peerId) => {
          // Broadcast our own info to new peer
          broadcastMemberData(selfMember, peerId)
        },
        onPeerLeave: (peerId) => {
          setMembers((prev) => {
            const next = { ...prev }
            delete next[peerId]
            return next
          })
        },
        onMemberUpdate: (member, peerId) => {
          setMembers((prev) => ({
            ...prev,
            [peerId]: {
              ...member,
              id: peerId,
              isSelf: false,
            },
          }))
        },
        onSyncRequest: (peerId) => {
          broadcastMemberData(selfMember, peerId)
        },
      })

      // Broadcast self initially
      broadcastMemberData(selfMember)

      return leave
    },
    [selfMember],
  )

  // Broadcast updates whenever selfMember changes (e.g. user just scanned)
  useEffect(() => {
    if (activeRoomId) {
      setMembers((prev) => ({
        ...prev,
        [selfMember.id]: selfMember,
      }))
      broadcastMemberData(selfMember)
    }
  }, [selfMember, activeRoomId])

  // Leave room
  const handleLeaveRoom = () => {
    setActiveRoomId(null)
    setMembers({})
    window.location.hash = ''
  }

  // Copy share invite link
  const handleCopyInviteLink = () => {
    const inviteUrl = `${window.location.origin}${window.location.pathname}#room=${encodeURIComponent(activeRoomId || '')}`
    navigator.clipboard.writeText(inviteUrl)
    setCopyToast(true)
    setTimeout(() => setCopyToast(false), 2500)
  }

  // Array of members
  const memberList = useMemo(() => Object.values(members), [members])

  // Elemental Groups
  const elementGroups = useMemo(() => {
    const groups: Record<string, RoomMember[]> = {
      Kim: [],
      Mộc: [],
      Thủy: [],
      Hỏa: [],
      Thổ: [],
    }

    memberList.forEach((m) => {
      if (m.analysis) {
        const el = m.analysis.nguHanh.element
        if (groups[el]) groups[el].push(m)
      }
    })

    return groups
  }, [memberList])

  // Leaderboards
  const leaderboards = useMemo(() => {
    const withAnalysis = memberList.filter((m) => m.analysis)

    const topGoldenRatio = [...withAnalysis].sort(
      (a, b) =>
        (b.analysis?.symmetry.goldenRatioScore ?? 0) -
        (a.analysis?.symmetry.goldenRatioScore ?? 0),
    )

    const topSmile = [...withAnalysis].sort(
      (a, b) => (b.analysis?.smileScore ?? 0) - (a.analysis?.smileScore ?? 0),
    )

    const topSymmetry = [...withAnalysis].sort(
      (a, b) =>
        (b.analysis?.symmetry.symmetryScore ?? 0) -
        (a.analysis?.symmetry.symmetryScore ?? 0),
    )

    // Calculate best compatibility pairs
    const pairs = []
    for (let i = 0; i < withAnalysis.length; i++) {
      for (let j = i + 1; j < withAnalysis.length; j++) {
        const comp = calculateCompatibility(withAnalysis[i], withAnalysis[j])
        if (comp) pairs.push(comp)
      }
    }
    pairs.sort((a, b) => b.score - a.score)

    return {
      topGoldenRatio,
      topSmile,
      topSymmetry,
      pairs,
    }
  }, [memberList])

  // LOBBY VIEW (When not in a room)
  if (!activeRoomId) {
    return (
      <div className="group-lobby-card card-glass animate-fade-in">
        <div className="lobby-header">
          <div className="lobby-icon">👥</div>
          <h2>Hội Quán Tướng Số & Tử Vi Realtime</h2>
          <p>
            Tạo phòng hoặc nhập mã phòng để cùng bạn bè, gia đình, đồng nghiệp quét diện mạo, xem bảng vàng vận khí và so khớp mệnh ngũ hành trực tiếp (Không cần tài khoản)!
          </p>
        </div>

        <div className="lobby-form-grid">
          {/* Profile Setup */}
          <div className="lobby-box">
            <h3>1. Thiết Lập Hồ Sơ Của Bạn</h3>
            <div className="avatar-picker-row">
              <span className="current-avatar-preview">{userAvatar}</span>
              <div className="avatar-grid">
                {AVATARS.map((av) => (
                  <button
                    key={av}
                    type="button"
                    className={`avatar-choice-btn ${userAvatar === av ? 'active' : ''}`}
                    onClick={() => setUserAvatar(av)}
                  >
                    {av}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="user-name-input">Tên hiển thị của bạn:</label>
              <input
                id="user-name-input"
                type="text"
                className="input-modern"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="Nhập tên của bạn..."
                maxLength={24}
              />
            </div>
          </div>

          {/* Room Setup */}
          <div className="lobby-box">
            <h3>2. Tạo Hoặc Vào Phòng</h3>
            <div className="form-group">
              <label htmlFor="room-id-input">Mã Phòng / Tên Phòng:</label>
              <input
                id="room-id-input"
                type="text"
                className="input-modern uppercase"
                value={roomIdInput}
                onChange={(e) => setRoomIdInput(e.target.value)}
                placeholder="Ví dụ: PHONG-MAY-MAN-888"
              />
            </div>

            <div className="room-quick-suggestions">
              <span className="suggestion-label">Gợi ý mã nhanh:</span>
              <div className="suggestion-chips">
                {DEFAULT_ROOM_SUGGESTIONS.map((sug) => (
                  <button
                    key={sug}
                    type="button"
                    className="suggestion-chip"
                    onClick={() => {
                      setRoomIdInput(sug)
                      handleJoinRoom(sug)
                    }}
                  >
                    ⚡ {sug}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="button"
              className="btn-primary btn-join-room"
              onClick={() => handleJoinRoom(roomIdInput || DEFAULT_ROOM_SUGGESTIONS[0])}
            >
              🚀 Tham Gia / Tạo Phòng Ngay
            </button>
          </div>
        </div>

        <div className="p2p-badge-banner">
          🔒 <b>Công nghệ WebRTC P2P Serverless:</b> Dữ liệu kết nối trực tiếp giữa các thiết bị với nhau, không lưu trữ qua máy chủ trung gian, 100% riêng tư & tức thì.
        </div>
      </div>
    )
  }

  // IN-ROOM VIEW
  return (
    <div className="group-room-view card-glass animate-fade-in">
      {/* Room Header Bar */}
      <header className="room-topbar">
        <div className="room-info">
          <div className="room-badge">
            <span className="live-pulse" />
            PHÒNG: <b>{activeRoomId}</b>
          </div>
          <div className="room-member-count">
            👥 <b>{memberList.length}</b> thành viên online
          </div>
        </div>

        <div className="room-actions">
          <button
            type="button"
            className={`btn-action-pill ${copyToast ? 'copied' : ''}`}
            onClick={handleCopyInviteLink}
            title="Sao chép đường dẫn mời bạn bè vào phòng"
          >
            {copyToast ? '✅ Đã Copy Link!' : '🔗 Mời Bạn Bè'}
          </button>
          <button
            type="button"
            className="btn-action-pill btn-leave"
            onClick={handleLeaveRoom}
          >
            🚪 Rời Phòng
          </button>
        </div>
      </header>

      {/* Self Scan Reminder Bar */}
      <div className="self-status-banner">
        <div className="self-profile-mini">
          <span className="self-av">{selfMember.avatar}</span>
          <div>
            <b>{selfMember.name} (Bạn)</b>
            <div className="self-fortune-status">
              {selfMember.analysis ? (
                <span className="status-badge-done">
                  ✨ Đã có quẻ: Mệnh {selfMember.analysis.nguHanh.element} · {selfMember.analysis.fortune.queBoi}
                </span>
              ) : (
                <span className="status-badge-waiting">
                  ⏳ Bạn chưa quét diện mạo
                </span>
              )}
            </div>
          </div>
        </div>

        <button
          type="button"
          className="btn-primary btn-mini-scan"
          onClick={onTriggerSoloScan}
        >
          {selfMember.analysis ? '🔄 Quét Lại Khuôn Mặt' : '⚡ Bật Camera Quét Ngay'}
        </button>
      </div>

      {/* Room Tabs */}
      <div className="room-tabs-nav">
        <button
          type="button"
          className={`room-tab-btn ${activeTab === 'members' ? 'active' : ''}`}
          onClick={() => setActiveTab('members')}
        >
          📋 Thành Viên & Quẻ ({memberList.length})
        </button>
        <button
          type="button"
          className={`room-tab-btn ${activeTab === 'elements' ? 'active' : ''}`}
          onClick={() => setActiveTab('elements')}
        >
          🔮 Phân Loại Ngũ Hành
        </button>
        <button
          type="button"
          className={`room-tab-btn ${activeTab === 'leaderboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('leaderboard')}
        >
          🏆 Bảng Vàng & Ghép Đôi
        </button>
      </div>

      {/* TAB 1: MEMBERS LIST */}
      {activeTab === 'members' && (
        <div className="room-tab-content animate-fade-in">
          <div className="members-grid">
            {memberList.map((m) => (
              <div
                key={m.id}
                className={`member-card ${m.isSelf ? 'is-self' : ''} ${
                  m.analysis ? `element-border-${m.analysis.nguHanh.element.toLowerCase()}` : ''
                }`}
              >
                <div className="member-card-header">
                  <div className="member-avatar-wrap">
                    <span className="member-avatar">{m.avatar}</span>
                    <span
                      className={`member-status-dot ${
                        m.analysis ? 'status-done' : 'status-waiting'
                      }`}
                      title={m.analysis ? 'Đã có quẻ tướng số' : 'Đang chờ quét'}
                    />
                  </div>
                  <div className="member-names">
                    <h4>
                      {m.name} {m.isSelf && <span className="you-tag">(Bạn)</span>}
                    </h4>
                    <span className="member-time">
                      {m.analysis
                        ? `Mệnh ${m.analysis.nguHanh.element} · ${m.analysis.faceShape}`
                        : 'Đang tham gia...'}
                    </span>
                  </div>
                </div>

                {m.analysis ? (
                  <div className="member-analysis-summary">
                    <div className="member-que-title">
                      🔮 {m.analysis.fortune.queBoi}
                    </div>

                    <div className="member-metrics-chips">
                      <span className="metric-chip">
                        📐 Tỉ lệ vàng: <b>{m.analysis.symmetry.goldenRatioScore}%</b>
                      </span>
                      <span className="metric-chip">
                        😄 Nụ cười: <b>{m.analysis.smileScore}%</b>
                      </span>
                      <span className="metric-chip">
                        ⚖️ Cân đối: <b>{m.analysis.symmetry.symmetryScore}%</b>
                      </span>
                    </div>

                    <p className="member-advice-short">
                      💡 {m.analysis.fortune.dailyAdvice}
                    </p>

                    <button
                      type="button"
                      className="btn-view-member"
                      onClick={() => setSelectedMemberDetail(m)}
                    >
                      📜 Xem Toàn Bộ Tướng Số
                    </button>
                  </div>
                ) : (
                  <div className="member-waiting-box">
                    <div className="waiting-spinner" />
                    <span>Chưa quét diện mạo...</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: ELEMENTAL CLASSIFICATION */}
      {activeTab === 'elements' && (
        <div className="room-tab-content animate-fade-in">
          <div className="elements-overview-banner">
            <h3>🌟 Bảng Phân Loại Ngũ Hành Cả Nhóm</h3>
            <p>
              Tập hợp bản mệnh diện tướng của các thành viên để phân tích luân chuyển sinh khí trong phòng.
            </p>
          </div>

          <div className="elements-grid">
            {/* KIM */}
            <div className="element-group-card element-kim">
              <div className="element-header">
                <span className="el-badge">⚪ MỆNH KIM</span>
                <span className="el-count">{elementGroups.Kim.length} người</span>
              </div>
              <p className="el-desc">
                Trán cao, ngũ quan cương trực, tư duy lý trí và quyết đoán.
              </p>
              <div className="el-members-list">
                {elementGroups.Kim.length > 0 ? (
                  elementGroups.Kim.map((m) => (
                    <span key={m.id} className="el-member-tag">
                      {m.avatar} {m.name}
                    </span>
                  ))
                ) : (
                  <span className="el-empty">Chưa có ai</span>
                )}
              </div>
            </div>

            {/* MỘC */}
            <div className="element-group-card element-moc">
              <div className="element-header">
                <span className="el-badge">🟢 MỆNH MỘC</span>
                <span className="el-count">{elementGroups.Mộc.length} người</span>
              </div>
              <p className="el-desc">
                Khuôn mặt thanh tú, nhân hậu, sáng tạo và thích phát triển bản thân.
              </p>
              <div className="el-members-list">
                {elementGroups.Mộc.length > 0 ? (
                  elementGroups.Mộc.map((m) => (
                    <span key={m.id} className="el-member-tag">
                      {m.avatar} {m.name}
                    </span>
                  ))
                ) : (
                  <span className="el-empty">Chưa có ai</span>
                )}
              </div>
            </div>

            {/* THỦY */}
            <div className="element-group-card element-thuy">
              <div className="element-header">
                <span className="el-badge">🔵 MỆNH THỦY</span>
                <span className="el-count">{elementGroups.Thủy.length} người</span>
              </div>
              <p className="el-desc">
                Mặt tròn đầy, mềm mỏng, giao tiếp khéo léo và thích ứng cực nhanh.
              </p>
              <div className="el-members-list">
                {elementGroups.Thủy.length > 0 ? (
                  elementGroups.Thủy.map((m) => (
                    <span key={m.id} className="el-member-tag">
                      {m.avatar} {m.name}
                    </span>
                  ))
                ) : (
                  <span className="el-empty">Chưa có ai</span>
                )}
              </div>
            </div>

            {/* HỎA */}
            <div className="element-group-card element-hoa">
              <div className="element-header">
                <span className="el-badge">🔴 MỆNH HỎA</span>
                <span className="el-count">{elementGroups.Hỏa.length} người</span>
              </div>
              <p className="el-desc">
                Khí sắc rực rỡ, nhiệt huyết, tinh thần tiên phong và truyền cảm hứng.
              </p>
              <div className="el-members-list">
                {elementGroups.Hỏa.length > 0 ? (
                  elementGroups.Hỏa.map((m) => (
                    <span key={m.id} className="el-member-tag">
                      {m.avatar} {m.name}
                    </span>
                  ))
                ) : (
                  <span className="el-empty">Chưa có ai</span>
                )}
              </div>
            </div>

            {/* THỔ */}
            <div className="element-group-card element-tho">
              <div className="element-header">
                <span className="el-badge">🟡 MỆNH THỔ</span>
                <span className="el-count">{elementGroups.Thổ.length} người</span>
              </div>
              <p className="el-desc">
                Mặt chữ điền vuông vức, đôn hậu, trọng chữ tín và giàu phúc lộc.
              </p>
              <div className="el-members-list">
                {elementGroups.Thổ.length > 0 ? (
                  elementGroups.Thổ.map((m) => (
                    <span key={m.id} className="el-member-tag">
                      {m.avatar} {m.name}
                    </span>
                  ))
                ) : (
                  <span className="el-empty">Chưa có ai</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: LEADERBOARD & COMPATIBILITY */}
      {activeTab === 'leaderboard' && (
        <div className="room-tab-content animate-fade-in">
          <div className="leaderboards-grid">
            {/* Top Golden Ratio */}
            <div className="rank-card">
              <h4>👑 Gương Mặt Tỉ Lệ Vàng Phi</h4>
              <div className="rank-list">
                {leaderboards.topGoldenRatio.length > 0 ? (
                  leaderboards.topGoldenRatio.slice(0, 3).map((m, idx) => (
                    <div key={m.id} className={`rank-row rank-${idx + 1}`}>
                      <span className="rank-num">{idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉'}</span>
                      <span className="rank-name">
                        {m.avatar} {m.name}
                      </span>
                      <b className="rank-val">{m.analysis?.symmetry.goldenRatioScore}%</b>
                    </div>
                  ))
                ) : (
                  <div className="rank-empty">Chưa có ai quét</div>
                )}
              </div>
            </div>

            {/* Top Smile */}
            <div className="rank-card">
              <h4>😄 Thánh Nụ Cười Phúc Khí</h4>
              <div className="rank-list">
                {leaderboards.topSmile.length > 0 ? (
                  leaderboards.topSmile.slice(0, 3).map((m, idx) => (
                    <div key={m.id} className={`rank-row rank-${idx + 1}`}>
                      <span className="rank-num">{idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉'}</span>
                      <span className="rank-name">
                        {m.avatar} {m.name}
                      </span>
                      <b className="rank-val">{m.analysis?.smileScore}%</b>
                    </div>
                  ))
                ) : (
                  <div className="rank-empty">Chưa có ai quét</div>
                )}
              </div>
            </div>

            {/* Top Symmetry */}
            <div className="rank-card">
              <h4>⚖️ Đệ Nhất Cân Đối Ngũ Quan</h4>
              <div className="rank-list">
                {leaderboards.topSymmetry.length > 0 ? (
                  leaderboards.topSymmetry.slice(0, 3).map((m, idx) => (
                    <div key={m.id} className={`rank-row rank-${idx + 1}`}>
                      <span className="rank-num">{idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉'}</span>
                      <span className="rank-name">
                        {m.avatar} {m.name}
                      </span>
                      <b className="rank-val">{m.analysis?.symmetry.symmetryScore}%</b>
                    </div>
                  ))
                ) : (
                  <div className="rank-empty">Chưa có ai quét</div>
                )}
              </div>
            </div>
          </div>

          {/* Compatibility Matcher */}
          <div className="compatibility-section">
            <h3>💖 Ghép Đôi & Tương Sinh Ngũ Hành Nhóm</h3>
            <p className="compatibility-sub">
              Tự động tính độ hòa hợp phong thủy giữa các thành viên để tìm cặp đôi đồng hành đại cát!
            </p>

            <div className="pairs-list">
              {leaderboards.pairs.length > 0 ? (
                leaderboards.pairs.map((p, idx) => (
                  <div key={idx} className={`pair-card relation-${p.relation.toLowerCase().replace(/\s+/g, '-')}`}>
                    <div className="pair-header">
                      <div className="pair-names">
                        <span>{p.person1.avatar} <b>{p.person1.name}</b> ({p.person1.analysis?.nguHanh.element})</span>
                        <span className="pair-connector">💞</span>
                        <span>{p.person2.avatar} <b>{p.person2.name}</b> ({p.person2.analysis?.nguHanh.element})</span>
                      </div>
                      <span className={`pair-badge badge-${p.relation.toLowerCase().replace(/\s+/g, '-')}`}>
                        {p.relation} ({p.score}%)
                      </span>
                    </div>
                    <p className="pair-desc">{p.description}</p>
                  </div>
                ))
              ) : (
                <div className="pair-empty-box">
                  Cần ít nhất 2 thành viên quét diện mạo để bắt đầu ghép đôi phong thủy!
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal of a Member */}
      {selectedMemberDetail && selectedMemberDetail.analysis && (
        <div className="member-modal-overlay" onClick={() => setSelectedMemberDetail(null)}>
          <div className="member-modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="member-modal-header">
              <h3>
                {selectedMemberDetail.avatar} Tướng Số Của {selectedMemberDetail.name}
              </h3>
              <button
                type="button"
                className="btn-modal-close"
                onClick={() => setSelectedMemberDetail(null)}
              >
                ✕
              </button>
            </div>
            <div className="member-modal-body">
              <ResultPanel
                result={selectedMemberDetail.analysis}
                capturedImageSrc={selectedMemberDetail.thumbnail || null}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
