import { useState, useId, useRef, useCallback, useEffect } from 'react'
import { Sparkles, Shield, User, Phone, Home, Hash, UserCheck, Upload, CheckCircle2, ChevronRight, ChevronLeft, Download, MessageCircle, Image as ImageIcon, AlertCircle, Copy, Check, Building2, GraduationCap, BookOpen, Mail } from 'lucide-react'
import './Registration.css'
import { EVENT } from '../../data/event'
import { fetchRegistrationSettings, type RegistrationSettings } from '../../services/adminService'
// import { submitRegistration } from '../../services/registrationService'; // Deprecated: using Google Apps Script
export interface MemberData {
  name: string
  collegeGmail: string
  phone: string
  regNo: string
  year: string
  department: string
  hostelName: string
  roomNo: string
  wardenName: string
  wardenPhone: string
}

export interface SquadRegistrationForm {
  teamName: string
  paymentScreenshot: string | null
  paymentScreenshotName: string
  members: [MemberData, MemberData, MemberData, MemberData]
}

const emptyMember = (): MemberData => ({
  name: '',
  collegeGmail: '',
  phone: '',
  regNo: '',
  year: '',
  department: '',
  hostelName: '',
  roomNo: '',
  wardenName: '',
  wardenPhone: '',
})

interface RegistrationProps {
  isOpen?: boolean
}

export default function Registration({ isOpen = true }: RegistrationProps) {
  const id = useId()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [activeTab, setActiveTab] = useState<number>(0) // 0: Member 1 (Leader), 1: Member 2, 2: Member 3, 3: Member 4, 4: Payment
  const [copiedField, setCopiedField] = useState<string | null>(null)
  const [form, setForm] = useState<SquadRegistrationForm>({
    teamName: '',
    paymentScreenshot: null,
    paymentScreenshotName: '',
    members: [emptyMember(), emptyMember(), emptyMember(), emptyMember()],
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSub] = useState(false)
  const [success, setSuccess] = useState(false)
  const [paymentFile, setPaymentFile] = useState<File | null>(null)
  const [registrationId, setRegistrationId] = useState<string>('')
  const [regSettings, setRegSettings] = useState<RegistrationSettings | null>(null)

  const loadAvailability = useCallback(async () => {
    try {
      const s = await fetchRegistrationSettings()
      setRegSettings(s)
    } catch (err) {
      console.warn('Could not load live registration settings:', err)
    }
  }, [])

  useEffect(() => {
    loadAvailability()
  }, [loadAvailability])

  useEffect(() => {
    if (isOpen) {
      loadAvailability()
      const interval = setInterval(loadAvailability, 15000)
      return () => clearInterval(interval)
    }
  }, [isOpen, loadAvailability])

  useEffect(() => {
    const onFocus = () => loadAvailability()
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [loadAvailability])

  const copyToClipboard = useCallback((text: string, field: string) => {
    navigator.clipboard.writeText(text).catch(() => {})
    setCopiedField(field)
    setTimeout(() => setCopiedField(null), 2000)
  }, [])

  // Handle Team Name Change with stable updater
  const handleTeamNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setForm(prev => ({ ...prev, teamName: val }))
    setErrors(prev => {
      if (!prev['teamName']) return prev
      const next = { ...prev }
      delete next['teamName']
      return next
    })
  }, [])

  // Handle Individual Member Field Change with stable updater
  const handleMemberChange = useCallback((memberIndex: number, field: keyof MemberData, value: string) => {
    setForm(prev => {
      const updatedMembers = [...prev.members] as [MemberData, MemberData, MemberData, MemberData]
      updatedMembers[memberIndex] = {
        ...updatedMembers[memberIndex],
        [field]: value,
      }
      return { ...prev, members: updatedMembers }
    })

    const errorKey = `m${memberIndex}_${field}`
    setErrors(prev => {
      if (!prev[errorKey]) return prev
      const next = { ...prev }
      delete next[errorKey]
      return next
    })
  }, [])

  // Handle Screenshot Upload (PNG, JPG, WEBP)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Store the File object for later upload
    setPaymentFile(file)

    const reader = new FileReader()
    reader.onload = () => {
      setForm(prev => ({
        ...prev,
        paymentScreenshot: reader.result as string,
        paymentScreenshotName: file.name,
      }))
      if (errors['paymentScreenshot']) {
        setErrors(prev => {
          const next = { ...prev }
          delete next['paymentScreenshot']
          return next
        })
      }
    }
    reader.readAsDataURL(file)
  }

  const removeScreenshot = () => {
    setForm(prev => ({
      ...prev,
      paymentScreenshot: null,
      paymentScreenshotName: '',
    }))
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // Form Validation
  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!form.teamName.trim()) {
      newErrors['teamName'] = 'Team name is required.'
    }

    form.members.forEach((m, idx) => {
      const role = idx === 0 ? 'Team leader' : `Member ${idx + 1}`
      if (!m.name.trim()) newErrors[`m${idx}_name`] = `${role} name is required.`
      if (!m.collegeGmail.trim()) {
        newErrors[`m${idx}_collegeGmail`] = `${role} college Gmail is required.`
      } else if (!m.collegeGmail.includes('@') || !m.collegeGmail.includes('.')) {
        newErrors[`m${idx}_collegeGmail`] = 'Enter a valid college email address.'
      }
      if (!m.phone.trim()) {
        newErrors[`m${idx}_phone`] = `${role} phone number is required.`
      } else if (m.phone.trim().length < 8) {
        newErrors[`m${idx}_phone`] = 'Enter a valid phone number.'
      }
      if (!m.regNo.trim()) newErrors[`m${idx}_regNo`] = `${role} registration no is required.`
      if (!m.year.trim()) newErrors[`m${idx}_year`] = 'Year is required.'
      if (!m.department.trim()) newErrors[`m${idx}_department`] = 'Department is required.'
      if (!m.hostelName.trim()) newErrors[`m${idx}_hostelName`] = 'Hostel name is required.'
      if (!m.roomNo.trim()) newErrors[`m${idx}_roomNo`] = 'Room no is required.'
      if (!m.wardenName.trim()) newErrors[`m${idx}_wardenName`] = 'Warden name is required.'
      if (!m.wardenPhone.trim()) {
        newErrors[`m${idx}_wardenPhone`] = 'Warden phone number is required.'
      }
    })

    if (!form.paymentScreenshot) {
      newErrors['paymentScreenshot'] = 'Payment screenshot (PNG/JPG) of ₹1200 is required.'
    }

    return newErrors
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Prevent duplicate submissions while in flight
    if (submitting) return

    // Prevent submission if registration is closed/paused/full
    if (regSettings && !regSettings.allowed) {
      alert(regSettings.reason || 'Registrations are currently closed.')
      return
    }

    const validationErrors = validateForm()

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)

      // Jump to first tab with error
      for (let i = 0; i < 4; i++) {
        const hasMemberError = Object.keys(validationErrors).some(k => k.startsWith(`m${i}_`))
        if (hasMemberError) {
          setActiveTab(i)
          return
        }
      }
      if (validationErrors['paymentScreenshot']) {
        setActiveTab(4)
      }
      return
    }

    if (!paymentFile) {
      // Should not happen due to validation but guard
      alert('Payment screenshot file missing')
      return
    }

    if (regSettings && !regSettings.allowed) {
      alert(`Registration unavailable: ${regSettings.reason || 'Registrations are currently closed.'}`)
      return
    }

    setSub(true)
    try {
      const requestBody = {
        teamName: form.teamName,
        members: form.members,
        paymentScreenshotName: form.paymentScreenshotName,
        paymentScreenshotUrl: form.paymentScreenshot,
      }

      console.log('Submitting registration payload to Google Apps Script:', {
        teamName: requestBody.teamName,
        membersCount: requestBody.members.length,
        paymentScreenshotName: requestBody.paymentScreenshotName,
        hasScreenshotData: Boolean(requestBody.paymentScreenshotUrl),
      })

      // Use text/plain;charset=utf-8 to bypass browser CORS preflight (OPTIONS) check for Google Apps Script Web App
      const response = await fetch('https://script.google.com/macros/s/AKfycbwzBchO29z8hOOhDExK8Od8voS3YVUZBO4HKKImvuO_5jOHFwcThmDLtFzfCuWHeuYA/exec', {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify(requestBody),
      })

      const responseText = await response.text()
      console.log('Google Apps Script server raw response text:', responseText)

      if (!responseText || !responseText.trim()) {
        throw new Error('Empty response received from registration server. Please check your connection and retry.')
      }

      let data: any = {}
      try {
        data = JSON.parse(responseText)
      } catch {
        console.error('Non-JSON response from server:', responseText)
        throw new Error(`Server returned non-JSON format (${response.status}): ${responseText.slice(0, 150)}`)
      }

      if (data.success === false || data.error) {
        throw new Error(data.error || 'Server rejected registration request.')
      }

      if (!response.ok) {
        throw new Error(`Server returned error status (${response.status})`)
      }

      const receivedId = 
        data.registrationId ||
        data.regId ||
        data.id ||
        data.registration_id ||
        data.data?.registrationId ||
        data.data?.id ||
        (Array.isArray(data.registrations) && data.registrations.length > 0
          ? data.registrations[data.registrations.length - 1]?.registrationId
          : undefined)

      if (!receivedId) {
        console.error('Server confirmed request but registrationId was not found in response:', data)
        throw new Error('Server confirmed registration but failed to return a valid Registration ID.')
      }

      setRegistrationId(receivedId)
      setSuccess(true)
      // Refetch live slot capacity immediately
      loadAvailability()
    } catch (err) {
      console.error('Registration error details:', err)
      const errMessage = err instanceof Error ? err.message : 'Unknown network error'
      alert(`Registration submission failed: ${errMessage}`)
    } finally {
      setSub(false)
    }
  }

  // Check if member data is complete for tab status
  const isMemberComplete = useCallback((idx: number) => {
    const m = form.members[idx]
    if (!m) return false
    return Boolean(
      m.name.trim() &&
      m.collegeGmail.trim() &&
      m.phone.trim() &&
      m.regNo.trim() &&
      m.year.trim() &&
      m.department.trim() &&
      m.hostelName.trim() &&
      m.roomNo.trim() &&
      m.wardenName.trim() &&
      m.wardenPhone.trim()
    )
  }, [form.members])

  // Open official KHEPRIX 2K26 WhatsApp group in new tab
  const handleJoinWhatsApp = useCallback(() => {
    window.open(
      'https://chat.whatsapp.com/K8s7V0Eb9KaItOZL0SCaOJ?s=sw&p=a&ilr=4&iam=0',
      '_blank',
      'noopener,noreferrer'
    )
  }, [])

  // Generate and download printable official receipt HTML document
  const handleDownloadReceipt = () => {
    const regId = registrationId || 'KPX-CONFIRMED'
    const teamLeader = form.members[0]?.name || 'Team Leader'
    const receiptHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>KHEPRIX 2K26 Official Receipt - ${regId}</title>
  <style>
    body {
      font-family: 'Cinzel', 'Georgia', serif;
      background: #0d0703;
      color: #faeed4;
      padding: 40px 20px;
      margin: 0;
      display: flex;
      justify-content: center;
    }
    .receipt-card {
      max-width: 650px;
      width: 100%;
      background: radial-gradient(circle at 50% 20%, #2a1608 0%, #150903 85%, #0d0502 100%);
      border: 2px solid #d49818;
      border-radius: 12px;
      padding: 32px 28px;
      box-shadow: 0 10px 40px rgba(0,0,0,0.8), inset 0 0 25px rgba(212, 152, 24, 0.15);
      position: relative;
    }
    .header {
      text-align: center;
      border-bottom: 1px solid rgba(212, 152, 24, 0.35);
      padding-bottom: 20px;
      margin-bottom: 24px;
    }
    .badge {
      display: inline-block;
      font-size: 11px;
      letter-spacing: 3px;
      color: #d49818;
      text-transform: uppercase;
      font-weight: 700;
      margin-bottom: 8px;
    }
    h1 {
      font-size: 28px;
      margin: 4px 0 10px;
      color: #ffd875;
      letter-spacing: 2px;
    }
    .sub {
      font-size: 13px;
      color: #c7ad8d;
      margin: 0;
      letter-spacing: 1px;
    }
    .id-box {
      margin: 20px 0;
      padding: 12px;
      background: rgba(212, 152, 24, 0.1);
      border: 1px dashed #d49818;
      border-radius: 6px;
      text-align: center;
      font-size: 14px;
    }
    .id-code {
      font-family: monospace;
      font-size: 18px;
      font-weight: bold;
      color: #ffd875;
      letter-spacing: 2px;
    }
    .meta-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      margin-bottom: 24px;
      font-size: 13px;
    }
    .meta-item {
      background: rgba(255, 255, 255, 0.03);
      padding: 10px 14px;
      border-radius: 6px;
      border-left: 3px solid #d49818;
    }
    .meta-label {
      color: #a88d74;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    .meta-val {
      font-weight: bold;
      color: #f7e6c9;
      margin-top: 4px;
    }
    .squad-title {
      font-size: 14px;
      letter-spacing: 2px;
      text-transform: uppercase;
      color: #ffd875;
      margin-bottom: 12px;
      border-bottom: 1px solid rgba(212, 152, 24, 0.2);
      padding-bottom: 6px;
    }
    .roster-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      margin-bottom: 24px;
    }
    .member-box {
      background: rgba(20, 10, 4, 0.6);
      border: 1px solid rgba(212, 152, 24, 0.25);
      border-radius: 6px;
      padding: 12px;
      font-size: 12px;
      line-height: 1.5;
    }
    .member-role {
      font-size: 10px;
      letter-spacing: 1.5px;
      color: #d49818;
      font-weight: bold;
      text-transform: uppercase;
    }
    .member-name {
      font-size: 14px;
      font-weight: bold;
      color: #ffffff;
      margin: 4px 0 6px;
    }
    .footer-note {
      text-align: center;
      font-size: 11px;
      color: #8c735d;
      margin-top: 20px;
      border-top: 1px solid rgba(212, 152, 24, 0.2);
      padding-top: 16px;
    }
    .print-btn {
      display: block;
      width: 100%;
      padding: 12px;
      margin-top: 20px;
      background: linear-gradient(135deg, #fff6a8 0%, #f3be3a 50%, #946508 100%);
      color: #120902;
      border: none;
      border-radius: 6px;
      font-weight: bold;
      letter-spacing: 2px;
      cursor: pointer;
      font-family: inherit;
    }
    @media print {
      body { background: #fff; color: #000; padding: 0; }
      .receipt-card { border: 1px solid #333; box-shadow: none; background: #fff; color: #000; }
      .meta-item, .member-box { background: #f9f9f9; border: 1px solid #ccc; color: #000; }
      .meta-val, .member-name, h1, .id-code, .squad-title { color: #000; }
      .print-btn { display: none; }
    }
  </style>
</head>
<body>
  <div class="receipt-card">
    <div class="header">
      <div class="badge">𓆣 IEEE Computer Society KARE 𓁹</div>
      <h1>KHEPRIX 2K26</h1>
      <p class="sub">EXPEDITION SQUAD REGISTRATION CONFIRMATION</p>
    </div>

    <div class="id-box">
      <div class="meta-label">OFFICIAL REGISTRATION IDENTIFIER</div>
      <div class="id-code">${regId}</div>
    </div>

    <div class="meta-grid">
      <div class="meta-item">
        <div class="meta-label">Squad / Team Name</div>
        <div class="meta-val">${form.teamName}</div>
      </div>
      <div class="meta-item">
        <div class="meta-label">Team Leader</div>
        <div class="meta-val">${teamLeader}</div>
      </div>
      <div class="meta-item">
        <div class="meta-label">Event Date & Time</div>
        <div class="meta-val">October 2nd, 2026 • 9:00 AM - 5:00 PM</div>
      </div>
      <div class="meta-item">
        <div class="meta-label">Venue & Rooms</div>
        <div class="meta-val">Srinivasa Ramanujam Block (8501 & 8601)</div>
      </div>
      <div class="meta-item">
        <div class="meta-label">Squad Entry Fee</div>
        <div class="meta-val">₹1,200 (4 Explorers • ₹300 / Member)</div>
      </div>
      <div class="meta-item">
        <div class="meta-label">Payment Status</div>
        <div class="meta-val">Verified & Recorded</div>
      </div>
    </div>

    <div class="squad-title">𓋹 Confirmed Squad Roster (4 Members)</div>
    <div class="roster-grid">
      ${form.members.map((m, idx) => `
        <div class="member-box">
          <div class="member-role">${idx === 0 ? 'Team Leader' : 'Explorer ' + (idx + 1)}</div>
          <div class="member-name">${m.name || 'Member ' + (idx + 1)}</div>
          <div><strong>College Gmail:</strong> ${m.collegeGmail || '—'}</div>
          <div><strong>Reg No:</strong> ${m.regNo || '—'}</div>
          <div><strong>Year:</strong> ${m.year || '—'} • <strong>Dept:</strong> ${m.department || '—'}</div>
          <div><strong>Phone:</strong> ${m.phone || '—'}</div>
          <div><strong>Hostel:</strong> ${m.hostelName || '—'} (Rm ${m.roomNo || '—'})</div>
          <div><strong>Warden:</strong> ${m.wardenName || '—'} (${m.wardenPhone || '—'})</div>
        </div>
      `).join('')}
    </div>

    <div class="footer-note">
      Please present this registration receipt at the reporting desk on October 2nd by 9:00 AM.<br>
      © 2026 KHEPRIX 2K26 • Kalasalingam Academy of Research and Education
    </div>

    <button class="print-btn" onclick="window.print()">PRINT / SAVE AS PDF</button>
  </div>
</body>
</html>`

    const blob = new Blob([receiptHtml], { type: 'text/html;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `KHEPRIX_2K26_Receipt_${regId}.html`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  // Success view (Official Sealed Pass with full squad details and editing capability)
  if (success) {
    return (
      <div className="reg-papyrus-scroll">
        <div className="reg-success-box" role="status" aria-live="polite">
          <div className="reg-seal-stamp">
            <span className="stamp-glyph">𓆣</span>
          </div>


          <div className="pharaoh-divider">
            <span className="pharaoh-divider-emblem">𓋹</span>
          </div>

          <p className="reg-success-msg">
            Greetings, <strong>{form.members[0].name || 'Team Leader'}</strong>! Your squad <strong>"{form.teamName}"</strong> has been officially confirmed for KHEPRIX 2K26.
            {registrationId && (
              <div className="reg-id-box">
                <span className="reg-id-label">Registration ID:</span> <code>{registrationId}</code>
              </div>
            )}
          </p>

          <div className="reg-fee-verified-badge">
            <CheckCircle2 size={18} className="success-icon" />
            <span>FEE STATUS: ₹1200 PAYMENT SCREENSHOT SUBMITTED &amp; RECORDED</span>
          </div>

          {/* Squad Roster Overview */}
          <div className="success-squad-roster">
            <h4 className="roster-heading">REGISTERED 4-MEMBER EXPEDITION SQUAD</h4>
            <div className="roster-grid">
              {form.members.map((m, idx) => (
                <div key={idx} className="roster-member-card">
                  <div className="roster-badge">{idx === 0 ? 'TEAM LEADER' : `EXPLORER ${idx + 1}`}</div>
                  <strong className="roster-name">{m.name}</strong>
                  <p className="roster-meta">Gmail: <span>{m.collegeGmail}</span></p>
                  <p className="roster-meta">Reg No: <span>{m.regNo}</span></p>
                  <p className="roster-meta">Year: <span>{m.year}</span> • Dept: <span>{m.department}</span></p>
                  <p className="roster-meta">Phone: <span>{m.phone}</span></p>
                  <p className="roster-meta">Hostel: <span>{m.hostelName} (Rm {m.roomNo})</span></p>
                  <p className="roster-meta">Warden: <span>{m.wardenName} ({m.wardenPhone})</span></p>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons: Download Receipt & Join WhatsApp Group */}
          <div className="success-actions-container">
            <button 
              type="button" 
              className="btn-download-receipt"
              onClick={handleDownloadReceipt}
            >
              <Download size={18} />
              <span>DOWNLOAD YOUR RECEIPT</span>
            </button>

            <p className="whatsapp-support-text">
              Download your receipt and join the official KHEPRIX 2K26 WhatsApp group.
            </p>

            <button 
              type="button" 
              className="btn-whatsapp-group"
              onClick={handleJoinWhatsApp}
            >
              <MessageCircle size={18} />
              <span>JOIN THE WHATSAPP GROUP</span>
            </button>
          </div>
        </div>
      </div>
    )
  }

  const currentMember = form.members[activeTab < 4 ? activeTab : 0]

  return (
    <div className="reg-papyrus-scroll">
      {/* Antique Scroll Roller Rod at Top */}
      <div className="papyrus-scroll-rod rod-top" aria-hidden="true">
        <div className="rod-finial left">𓆣</div>
        <div className="rod-cylinder" />
        <div className="rod-finial right">𓆣</div>
      </div>

      {/* Ancient Terracotta Wax Seal in top-right corner */}
      <div className="papyrus-corner-wax-seal" aria-hidden="true">
        <div className="wax-seal-inner">
          <span className="wax-scarab">𓆣</span>
          <span className="wax-text">OFFICIAL</span>
        </div>
        <div className="wax-ribbon-tail" />
      </div>

      {/* Decorative Hieroglyph Watermark in paper pulp */}
      <div className="papyrus-pulp-watermark" aria-hidden="true">
        <span>𓁹</span>
        <span>𓋹</span>
        <span>𓆣</span>
        <span>𓊹</span>
      </div>

      {/* ── Scroll Header ── */}
      <div className="reg-scroll-header">
        <div className="reg-cartouche-badge">
          <span>𓁹</span>
          <span>ROYAL PHARAOH REGISTRY</span>
          <span>𓆣</span>
        </div>
        <h2 className="reg-title">SEAL YOUR EXPEDITION</h2>
        <p className="reg-subtitle">
          Submit official details for all <strong>4 squad members</strong> and upload payment confirmation.
        </p>

        {/* Prominent Fee & Venue Card */}
        <div className="reg-fee-banner">
          <div className="fee-pill">
            <span className="fee-label">TOTAL SQUAD FEE:</span>
            <span className="fee-amount">{EVENT.fee}</span>
          </div>
          <span className="fee-note">(₹300 / MEMBER • 4-MEMBER SQUAD • TOTAL: ₹1,200)</span>
        </div>

        {/* Live Registration Availability & Capacity Banner */}
        {regSettings && (
          <div className={`reg-availability-banner ${regSettings.allowed ? 'avail-open' : 'avail-blocked'}`}>
            {regSettings.allowed ? (
              <>
                <CheckCircle2 size={16} className="avail-icon" />
                <span>EXPEDITION REGISTRY IS OPEN • {regSettings.remainingSlots} OF {regSettings.maxTeams} SLOTS REMAINING</span>
              </>
            ) : (
              <>
                <AlertCircle size={16} className="avail-icon" />
                <span>{regSettings.reason || 'REGISTRATIONS ARE CURRENTLY SEALED'}</span>
              </>
            )}
          </div>
        )}
      </div>

      <form className="reg-form" onSubmit={handleSubmit} noValidate>

        {/* Global Team Name Input */}
        <div className="reg-team-banner">
          <label htmlFor={`${id}-teamName`} className="reg-label team-name-label">
            <Shield size={16} />
            <span>Team / Squad Name *</span>
          </label>
          <input
            id={`${id}-teamName`}
            name="teamName"
            type="text"
            className={`reg-input team-input ${errors['teamName'] ? 'has-error' : ''}`}
            value={form.teamName}
            onChange={handleTeamNameChange}
            placeholder="e.g. Anubis Raiders / Desert Scarabs"
            autoComplete="off"
          />
          {errors['teamName'] && (
            <span className="reg-error-msg">
              <span className="error-glyph">𓀀</span> {errors['teamName']}
            </span>
          )}
        </div>

        {/* ── 4 Members & Payment Tab Bar ── */}
        <div className="reg-member-tabs-container">
          <div className="reg-member-tabs" role="tablist" aria-label="Squad Member Selector">
            {[0, 1, 2, 3].map((mIdx) => {
              const hasErr = Object.keys(errors).length > 0 && Object.keys(errors).some(k => k.startsWith(`m${mIdx}_`))
              const isDone = isMemberComplete(mIdx)
              return (
                <button
                  key={mIdx}
                  type="button"
                  role="tab"
                  aria-selected={activeTab === mIdx}
                  className={`member-tab-btn ${activeTab === mIdx ? 'active' : ''} ${hasErr ? 'tab-error' : ''} ${isDone ? 'tab-done' : ''}`}
                  onClick={() => setActiveTab(mIdx)}
                >
                  <span className="tab-glyph">{mIdx === 0 ? '𓁹' : `𓊹`}</span>
                  <span className="tab-text">
                    {mIdx === 0 ? 'Leader (M1)' : `Member ${mIdx + 1}`}
                  </span>
                  {isDone && <CheckCircle2 size={13} className="tab-check-icon" />}
                  {hasErr && <AlertCircle size={13} className="tab-alert-icon" />}
                </button>
              )
            })}

            {/* Payment Tab */}
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 4}
              className={`member-tab-btn payment-tab-btn ${activeTab === 4 ? 'active' : ''} ${errors['paymentScreenshot'] ? 'tab-error' : ''} ${form.paymentScreenshot ? 'tab-done' : ''}`}
              onClick={() => setActiveTab(4)}
            >
              <Upload size={13} />
              <span className="tab-text">Payment (₹1200)</span>
              {form.paymentScreenshot && <CheckCircle2 size={13} className="tab-check-icon" />}
              {errors['paymentScreenshot'] && <AlertCircle size={13} className="tab-alert-icon" />}
            </button>
          </div>
        </div>

        {/* ── Member 1 to 4 Input Section ── */}
        {activeTab < 4 && (
          <div className="member-details-pane">
            <div className="member-pane-heading">
              <span className="pane-number">
                {activeTab === 0 ? 'TEAM LEADER (MEMBER 1) DETAILS' : `MEMBER ${activeTab + 1} DETAILS`}
              </span>
              <span className="pane-count-badge">SQUAD MEMBER {activeTab + 1} OF 4</span>
            </div>

            {/* Row 1: Name & College Gmail */}
            <div className="reg-row">
              <div className="reg-field">
                <label htmlFor={`${id}-m${activeTab}-name`} className="reg-label">
                  <User size={14} />
                  <span>{activeTab === 0 ? 'Team Leader Name *' : `Member ${activeTab + 1} Full Name *`}</span>
                </label>
                <input
                  id={`${id}-m${activeTab}-name`}
                  type="text"
                  className={`reg-input ${errors[`m${activeTab}_name`] ? 'has-error' : ''}`}
                  value={currentMember.name}
                  onChange={(e) => handleMemberChange(activeTab, 'name', e.target.value)}
                  placeholder={activeTab === 0 ? 'e.g. Rahul Sharma (Leader)' : `e.g. Explorer Name`}
                  autoComplete="name"
                />
                {errors[`m${activeTab}_name`] && (
                  <span className="reg-error-msg">
                    <span className="error-glyph">𓀀</span> {errors[`m${activeTab}_name`]}
                  </span>
                )}
              </div>

              <div className="reg-field">
                <label htmlFor={`${id}-m${activeTab}-collegeGmail`} className="reg-label">
                  <Mail size={14} />
                  <span>College Gmail *</span>
                </label>
                <input
                  id={`${id}-m${activeTab}-collegeGmail`}
                  type="email"
                  className={`reg-input ${errors[`m${activeTab}_collegeGmail`] ? 'has-error' : ''}`}
                  value={currentMember.collegeGmail}
                  onChange={(e) => handleMemberChange(activeTab, 'collegeGmail', e.target.value)}
                  placeholder="Enter your college Gmail"
                  autoComplete="email"
                />
                {errors[`m${activeTab}_collegeGmail`] && (
                  <span className="reg-error-msg">
                    <span className="error-glyph">𓀀</span> {errors[`m${activeTab}_collegeGmail`]}
                  </span>
                )}
              </div>
            </div>

            {/* Row 2: Phone & Reg No */}
            <div className="reg-row">
              <div className="reg-field">
                <label htmlFor={`${id}-m${activeTab}-phone`} className="reg-label">
                  <Phone size={14} />
                  <span>Phone Number *</span>
                </label>
                <input
                  id={`${id}-m${activeTab}-phone`}
                  type="tel"
                  className={`reg-input ${errors[`m${activeTab}_phone`] ? 'has-error' : ''}`}
                  value={currentMember.phone}
                  onChange={(e) => handleMemberChange(activeTab, 'phone', e.target.value)}
                  placeholder="+91 98765 43210"
                  autoComplete="tel"
                />
                {errors[`m${activeTab}_phone`] && (
                  <span className="reg-error-msg">
                    <span className="error-glyph">𓀀</span> {errors[`m${activeTab}_phone`]}
                  </span>
                )}
              </div>

              <div className="reg-field">
                <label htmlFor={`${id}-m${activeTab}-regNo`} className="reg-label">
                  <Hash size={14} />
                  <span>Registration No *</span>
                </label>
                <input
                  id={`${id}-m${activeTab}-regNo`}
                  type="text"
                  className={`reg-input ${errors[`m${activeTab}_regNo`] ? 'has-error' : ''}`}
                  value={currentMember.regNo}
                  onChange={(e) => handleMemberChange(activeTab, 'regNo', e.target.value)}
                  placeholder="e.g. 9922004001"
                />
                {errors[`m${activeTab}_regNo`] && (
                  <span className="reg-error-msg">
                    <span className="error-glyph">𓀀</span> {errors[`m${activeTab}_regNo`]}
                  </span>
                )}
              </div>
            </div>

            {/* Row 3: Year & Department (Text Inputs) */}
            <div className="reg-row">
              <div className="reg-field">
                <label htmlFor={`${id}-m${activeTab}-year`} className="reg-label">
                  <GraduationCap size={14} />
                  <span>Year *</span>
                </label>
                <input
                  id={`${id}-m${activeTab}-year`}
                  type="text"
                  className={`reg-input ${errors[`m${activeTab}_year`] ? 'has-error' : ''}`}
                  value={currentMember.year}
                  onChange={(e) => handleMemberChange(activeTab, 'year', e.target.value)}
                  placeholder="Enter your year (e.g. 2nd Year)"
                />
                {errors[`m${activeTab}_year`] && (
                  <span className="reg-error-msg">
                    <span className="error-glyph">𓀀</span> {errors[`m${activeTab}_year`]}
                  </span>
                )}
              </div>

              <div className="reg-field">
                <label htmlFor={`${id}-m${activeTab}-department`} className="reg-label">
                  <BookOpen size={14} />
                  <span>Department *</span>
                </label>
                <input
                  id={`${id}-m${activeTab}-department`}
                  type="text"
                  className={`reg-input ${errors[`m${activeTab}_department`] ? 'has-error' : ''}`}
                  value={currentMember.department}
                  onChange={(e) => handleMemberChange(activeTab, 'department', e.target.value)}
                  placeholder="Enter your department (e.g. AIML)"
                />
                {errors[`m${activeTab}_department`] && (
                  <span className="reg-error-msg">
                    <span className="error-glyph">𓀀</span> {errors[`m${activeTab}_department`]}
                  </span>
                )}
              </div>
            </div>

            {/* Row 4: Hostel Name & Room No */}
            <div className="reg-row">
              <div className="reg-field">
                <label htmlFor={`${id}-m${activeTab}-hostelName`} className="reg-label">
                  <Home size={14} />
                  <span>Hostel Name *</span>
                </label>
                <input
                  id={`${id}-m${activeTab}-hostelName`}
                  type="text"
                  className={`reg-input ${errors[`m${activeTab}_hostelName`] ? 'has-error' : ''}`}
                  value={currentMember.hostelName}
                  onChange={(e) => handleMemberChange(activeTab, 'hostelName', e.target.value)}
                  placeholder="e.g. Agasthiya / Kaveri"
                />
                {errors[`m${activeTab}_hostelName`] && (
                  <span className="reg-error-msg">
                    <span className="error-glyph">𓀀</span> {errors[`m${activeTab}_hostelName`]}
                  </span>
                )}
              </div>

              <div className="reg-field">
                <label htmlFor={`${id}-m${activeTab}-roomNo`} className="reg-label">
                  <Hash size={14} />
                  <span>Room No *</span>
                </label>
                <input
                  id={`${id}-m${activeTab}-roomNo`}
                  type="text"
                  className={`reg-input ${errors[`m${activeTab}_roomNo`] ? 'has-error' : ''}`}
                  value={currentMember.roomNo}
                  onChange={(e) => handleMemberChange(activeTab, 'roomNo', e.target.value)}
                  placeholder="e.g. 412"
                />
                {errors[`m${activeTab}_roomNo`] && (
                  <span className="reg-error-msg">
                    <span className="error-glyph">𓀀</span> {errors[`m${activeTab}_roomNo`]}
                  </span>
                )}
              </div>
            </div>

            {/* Row 5: Warden Name & Warden Phone */}
            <div className="reg-row">
              <div className="reg-field">
                <label htmlFor={`${id}-m${activeTab}-wardenName`} className="reg-label">
                  <UserCheck size={14} />
                  <span>Warden Name *</span>
                </label>
                <input
                  id={`${id}-m${activeTab}-wardenName`}
                  type="text"
                  className={`reg-input ${errors[`m${activeTab}_wardenName`] ? 'has-error' : ''}`}
                  value={currentMember.wardenName}
                  onChange={(e) => handleMemberChange(activeTab, 'wardenName', e.target.value)}
                  placeholder="e.g. Dr. K. Murugan"
                />
                {errors[`m${activeTab}_wardenName`] && (
                  <span className="reg-error-msg">
                    <span className="error-glyph">𓀀</span> {errors[`m${activeTab}_wardenName`]}
                  </span>
                )}
              </div>

              <div className="reg-field">
                <label htmlFor={`${id}-m${activeTab}-wardenPhone`} className="reg-label">
                  <Phone size={14} />
                  <span>Warden Phone No *</span>
                </label>
                <input
                  id={`${id}-m${activeTab}-wardenPhone`}
                  type="tel"
                  className={`reg-input ${errors[`m${activeTab}_wardenPhone`] ? 'has-error' : ''}`}
                  value={currentMember.wardenPhone}
                  onChange={(e) => handleMemberChange(activeTab, 'wardenPhone', e.target.value)}
                  placeholder="+91 98421 XXXXX"
                />
                {errors[`m${activeTab}_wardenPhone`] && (
                  <span className="reg-error-msg">
                    <span className="error-glyph">𓀀</span> {errors[`m${activeTab}_wardenPhone`]}
                  </span>
                )}
              </div>
            </div>

            {/* Step Navigation Controls */}
            <div className="member-nav-row">
              {activeTab > 0 && (
                <button
                  type="button"
                  className="btn-member-nav prev"
                  onClick={() => setActiveTab(activeTab - 1)}
                >
                  <ChevronLeft size={16} />
                  <span>PREVIOUS MEMBER</span>
                </button>
              )}

              <button
                type="button"
                className="btn-member-nav next ml-auto"
                onClick={() => setActiveTab(activeTab + 1)}
              >
                <span>{activeTab === 3 ? 'PROCEED TO PAYMENT (₹1200) ➔' : `NEXT: MEMBER ${activeTab + 2} ➔`}</span>
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* ── Payment & Screenshot Upload Section (Tab 4) ── */}
        {activeTab === 4 && (
          <div className="payment-upload-pane">
            <div className="member-pane-heading">
              <span className="pane-number">PAYMENT VERIFICATION (FEE: ₹1200)</span>
              <span className="pane-count-badge">₹300 / MEMBER • 4-MEMBER SQUAD</span>
            </div>

            <div className="payment-instructions-box">
              <p className="pay-instruction-lead">
                Transfer the squad registration fee of <strong>₹1,200</strong> (₹300 per member × 4 members) using the official bank details below:
              </p>

              {/* Official Bank Account & IFSC Details Card */}
              <div className="pay-bank-ledger-card">
                <div className="bank-ledger-header">
                  <Building2 size={16} className="bank-ledger-icon" />
                  <span className="bank-ledger-title">OFFICIAL TREASURY BANK ACCOUNT</span>
                </div>

                <div className="bank-ledger-grid">
                  {/* Account Number */}
                  <div className="bank-ledger-field highlighted-field">
                    <div className="field-meta">
                      <span className="field-label">ACCOUNT NUMBER (ACC)</span>
                      <span className="field-val number-font">{EVENT.payment.accountNumber}</span>
                    </div>
                    <button
                      type="button"
                      className="btn-copy-ledger"
                      onClick={() => copyToClipboard(EVENT.payment.accountNumber, 'acc')}
                      title="Copy Account Number"
                    >
                      {copiedField === 'acc' ? (
                        <>
                          <Check size={14} className="copied-icon" />
                          <span>COPIED</span>
                        </>
                      ) : (
                        <>
                          <Copy size={14} />
                          <span>COPY ACC</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* IFSC Code */}
                  <div className="bank-ledger-field highlighted-field">
                    <div className="field-meta">
                      <span className="field-label">IFSC CODE</span>
                      <span className="field-val ifsc-font">{EVENT.payment.ifscCode}</span>
                    </div>
                    <button
                      type="button"
                      className="btn-copy-ledger"
                      onClick={() => copyToClipboard(EVENT.payment.ifscCode, 'ifsc')}
                      title="Copy IFSC Code"
                    >
                      {copiedField === 'ifsc' ? (
                        <>
                          <Check size={14} className="copied-icon" />
                          <span>COPIED</span>
                        </>
                      ) : (
                        <>
                          <Copy size={14} />
                          <span>COPY IFSC</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Beneficiary Name */}
                  <div className="bank-ledger-field">
                    <div className="field-meta">
                      <span className="field-label">BENEFICIARY NAME</span>
                      <span className="field-val">{EVENT.payment.accountName}</span>
                    </div>
                  </div>

                  {/* Total Fee Amount */}
                  <div className="bank-ledger-field">
                    <div className="field-meta">
                      <span className="field-label">TOTAL REGISTRATION FEE: ₹1,200</span>
                      <span className="field-val gold-accent">TOTAL: ₹1,200 (₹300 / MEMBER)</span>
                    </div>
                  </div>
                </div>

                <div className="bank-ledger-note">
                  <span>𓆣</span> Transfer ₹1200 via NetBanking, NEFT, or IMPS using the official Account Number and IFSC Code above. Then upload the payment screenshot receipt below.
                </div>
              </div>
            </div>

            {/* File Upload Area */}
            <div className="screenshot-upload-field">
              <label className="reg-label upload-label">
                <ImageIcon size={16} />
                <span>Upload Payment Screenshot (PNG / JPG) *</span>
              </label>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/png, image/jpeg, image/jpg, image/webp"
                className="file-hidden-input"
                id={`${id}-paymentScreenshot`}
                onChange={handleFileUpload}
              />

              {!form.paymentScreenshot ? (
                <div 
                  className={`upload-dropzone ${errors['paymentScreenshot'] ? 'has-error' : ''}`}
                  onClick={() => fileInputRef.current?.click()}
                  role="button"
                  tabIndex={0}
                  aria-label="Upload payment screenshot"
                >
                  <Upload size={32} className="dropzone-icon" />
                  <span className="dropzone-text">Click or Drag &amp; Drop Payment Screenshot</span>
                  <span className="dropzone-sub">PNG, JPG, or WEBP (Max 5MB)</span>
                  <button type="button" className="btn-browse-file">BROWSE PNG / JPG</button>
                </div>
              ) : (
                <div className="screenshot-preview-card">
                  <img 
                    src={form.paymentScreenshot} 
                    alt="Payment Screenshot Preview" 
                    className="preview-img-thumb"
                  />
                  <div className="preview-meta">
                    <span className="preview-status-pill">
                      <CheckCircle2 size={13} /> SCREENSHOT UPLOADED
                    </span>
                    <span className="preview-filename">{form.paymentScreenshotName}</span>
                    <button 
                      type="button" 
                      className="btn-replace-shot"
                      onClick={removeScreenshot}
                    >
                      Remove / Replace PNG
                    </button>
                  </div>
                </div>
              )}

              {errors['paymentScreenshot'] && (
                <span className="reg-error-msg mt-2">
                  <span className="error-glyph">𓀀</span> {errors['paymentScreenshot']}
                </span>
              )}
            </div>

            <div className="member-nav-row mt-4">
              <button
                type="button"
                className="btn-member-nav prev"
                onClick={() => setActiveTab(3)}
              >
                <ChevronLeft size={16} />
                <span>REVIEW MEMBER 4</span>
              </button>
            </div>
          </div>
        )}

        {/* Global Submit Button */}
        <div className="submit-action-cluster">
          <button
            type="submit"
            className={`btn-pharaoh reg-submit-btn ${regSettings && !regSettings.allowed ? 'btn-disabled-pharaoh' : ''}`}
            disabled={submitting || (Boolean(regSettings) && !regSettings?.allowed)}
          >
            <Sparkles size={18} />
            <span>
              {submitting
                ? 'SEALING SQUAD ENTRY...'
                : regSettings && !regSettings.allowed
                ? regSettings.calculatedStatus === 'FULL'
                  ? 'REGISTRATION CAPACITY REACHED (SEALED)'
                  : regSettings.calculatedStatus === 'PAUSED'
                  ? 'REGISTRATION TEMPORARILY PAUSED'
                  : 'REGISTRATIONS CLOSED'
                : 'UNSEAL ENTRY — SUBMIT 4-MEMBER SQUAD (₹1200)'}
            </span>
          </button>
        </div>

      </form>

      {/* Antique Scroll Roller Rod at Bottom */}
      <div className="papyrus-scroll-rod rod-bottom" aria-hidden="true">
        <div className="rod-finial left">𓁹</div>
        <div className="rod-cylinder" />
        <div className="rod-finial right">𓁹</div>
      </div>
    </div>
  )
}
