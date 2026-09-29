import { useState, useEffect, useMemo, useCallback } from 'react'
import {
  Search,
  RefreshCw,
  ExternalLink,
  Eye,
  X,
  CheckCircle2,
  Clock,
  CreditCard,
  Trophy,
  ArrowLeft,
  Copy,
  Check,
  Mail,
  Phone,
  Calendar,
  Building2,
  AlertCircle,
  Hash,
  Home,
  UserCheck,
  Ban,
  PlusCircle,
  Settings,
  PauseCircle,
  PlayCircle,
  Key,
  FileDown,
  DollarSign,
  ShieldAlert,
  FileSpreadsheet,
  Layers,
  Filter,
} from 'lucide-react'
import {
  fetchAdminRegistrations,
  updateRegistrationSettings,
  blockRegistration,
  unblockRegistration,
  addTeamManually,
  updatePaymentStatus,
  getStoredAdminSecret,
  setStoredAdminSecret,
  type AdminRegistration,
  type AdminDashboardStats,
  type RegistrationSettings,
  type AdminMember,
  type AdminAddTeamPayload,
} from '../../services/adminService'
import { generateConfirmationDocument } from '../../utils/confirmationPdf'
import {
  formatDateToInputString,
  formatFriendlyDate,
  filterRegistrationsByDateRange,
  getPresetDateRange,
  computeExportSummaryStats,
  exportRegistrationsToExcel,
  exportRegistrationsToPdf,
} from '../../utils/exportRegistrations'
import './AdminDashboard.css'

interface AdminDashboardProps {
  onBackToSite?: () => void
}

const emptyMember = (num: number, role: string): AdminMember => ({
  memberNumber: num,
  role,
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

export default function AdminDashboard({ onBackToSite }: AdminDashboardProps) {
  const [registrations, setRegistrations] = useState<AdminRegistration[]>([])
  const [stats, setStats] = useState<AdminDashboardStats>({
    totalRegistrations: 0,
    totalTeams: 0,
    activeTeamsCount: 0,
    blockedTeamsCount: 0,
    totalAmountCollected: 0,
    pendingCount: 0,
    confirmedCount: 0,
    totalMembers: 0,
    capacityMax: 100,
    remainingSlots: 100,
    calculatedStatus: 'OPEN',
  })
  const [settings, setSettings] = useState<RegistrationSettings>({
    allowed: true,
    calculatedStatus: 'OPEN',
    statusOverride: 'AUTO',
    activeTeams: 0,
    maxTeams: 100,
    remainingSlots: 100,
    openingTime: '2026-09-29T10:00:00+05:30',
    closingTime: '2026-10-02T09:00:00+05:30',
  })

  const [loading, setLoading] = useState<boolean>(true)
  const [refreshing, setRefreshing] = useState<boolean>(false)
  const [actionInProgress, setActionInProgress] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [lastFetched, setLastFetched] = useState<Date | null>(null)

  // Admin Key Management
  const [adminKey, setAdminKey] = useState<string>(getStoredAdminSecret())
  const [showKeyInput, setShowKeyInput] = useState<boolean>(false)

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [paymentFilter, setPaymentFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all') // all, active, blocked
  const [deptFilter, setDeptFilter] = useState<string>('all')
  const [yearFilter, setYearFilter] = useState<string>('all')
  const [sourceFilter, setSourceFilter] = useState<string>('all') // all, PUBLIC, ADMIN
  const [datePreset, setDatePreset] = useState<string>('all') // all, today, custom
  const [dateFilter, setDateFilter] = useState<string>('')
  const [sortOrder, setSortOrder] = useState<'oldest' | 'newest'>('oldest') // oldest, newest

  // Modals
  const [selectedReg, setSelectedReg] = useState<AdminRegistration | null>(null)
  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false)
  const [showAddTeamModal, setShowAddTeamModal] = useState<boolean>(false)
  const [blockTarget, setBlockTarget] = useState<AdminRegistration | null>(null)
  const [blockReason, setBlockReason] = useState<string>('Administrative Disqualification')
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [showRawFields, setShowRawFields] = useState<boolean>(false)

  // Export Modal State
  const [showExportModal, setShowExportModal] = useState<boolean>(false)
  const [exportMode, setExportMode] = useState<'date-range' | 'current-filtered'>('date-range')
  const [exportFromDate, setExportFromDate] = useState<string>(() => formatDateToInputString(new Date()))
  const [exportToDate, setExportToDate] = useState<string>(() => formatDateToInputString(new Date()))
  const [exportPreset, setExportPreset] = useState<'today' | 'yesterday' | 'last7days' | 'thismonth' | 'all' | 'custom'>('today')
  const [exportInProgress, setExportInProgress] = useState<boolean>(false)
  const [exportProgressText, setExportProgressText] = useState<string>('')

  // Settings form state
  const [formMaxTeams, setFormMaxTeams] = useState<number>(100)
  const [formOpeningTime, setFormOpeningTime] = useState<string>('')
  const [formClosingTime, setFormClosingTime] = useState<string>('')
  const [formStatusOverride, setFormStatusOverride] = useState<'AUTO' | 'OPEN' | 'CLOSED' | 'PAUSED'>('AUTO')

  // Manual Add Team Form state
  const [manualForm, setManualForm] = useState<AdminAddTeamPayload>({
    teamName: '',
    teamSize: 4,
    transactionId: '',
    paymentAmount: 1200,
    paymentStatus: 'Verified',
    paymentScreenshotUrl: '',
    paymentScreenshotName: '',
    adminNotes: '',
    members: [
      emptyMember(1, 'Team Leader'),
      emptyMember(2, 'Explorer 2'),
      emptyMember(3, 'Explorer 3'),
      emptyMember(4, 'Explorer 4'),
    ],
  })

  // Direct download link helper for Google Drive files
  const getDirectDriveDownloadUrl = (url: string): string => {
    if (!url) return ''
    const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/) || url.match(/id=([a-zA-Z0-9_-]+)/)
    if (match && match[1]) {
      return `https://drive.google.com/uc?export=download&id=${match[1]}`
    }
    return url
  }

  // Complete team details dossier generator
  const downloadTeamDetails = (reg: AdminRegistration) => {
    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>KHEPRIX 2K26 - Team Dossier - ${reg.teamName} (${reg.registrationId})</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0c0602; color: #faeed4; padding: 28px; margin: 0; }
    .dossier { max-width: 820px; margin: 0 auto; border: 2px solid #d49818; border-radius: 12px; padding: 28px; background: #160c04; box-shadow: 0 10px 40px rgba(0,0,0,0.8); }
    h1 { color: #ffd875; margin: 6px 0 10px; font-size: 26px; }
    .badge { color: #d49818; font-weight: bold; font-size: 11px; text-transform: uppercase; letter-spacing: 2px; }
    .meta-box { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; background: rgba(0,0,0,0.45); padding: 16px; border-radius: 8px; margin: 18px 0; border: 1px solid rgba(212,152,24,0.3); font-size: 13px; }
    .member-card { background: rgba(255,255,255,0.03); border-left: 3px solid #d49818; padding: 12px 16px; margin-bottom: 12px; border-radius: 4px; }
    .role { color: #d49818; font-size: 11px; font-weight: bold; text-transform: uppercase; }
    .name { font-size: 16px; font-weight: bold; margin: 4px 0 8px; color: #fff; }
    .info { font-size: 12px; margin: 3px 0; color: #c9b49e; }
    .info strong { color: #ffd875; }
    .print-btn { background: linear-gradient(135deg, #fff6a8 0%, #f3be3a 50%, #946508 100%); color: #120902; border: none; padding: 12px 24px; font-weight: bold; cursor: pointer; border-radius: 6px; margin-top: 18px; font-size: 12px; letter-spacing: 1px; }
    @media print { .print-btn { display: none; } body { background: #fff; color: #000; padding: 0; } .dossier { border: 1px solid #333; background: #fff; color: #000; box-shadow: none; } .member-card { border-left-color: #333; background: #f9f9f9; } .name, h1, .info strong { color: #000; } }
  </style>
</head>
<body>
  <div class="dossier">
    <div class="badge">𓆣 KHEPRIX 2K26 • OFFICIAL EXPEDITION SQUAD DOSSIER 𓁹</div>
    <h1>${reg.teamName}</h1>
    <p>Registration ID: <code>${reg.registrationId}</code> • FCFS Position: <strong>${reg.fcfsDisplay}</strong> • Timestamp: ${reg.timestamp}</p>
    <div class="meta-box">
      <div><strong>Status:</strong> ${reg.status}</div>
      <div><strong>Payment Status:</strong> ${reg.paymentStatus || 'Pending Verification'}</div>
      <div><strong>Total Amount:</strong> ₹${reg.totalAmount} (₹300 × 4)</div>
      <div><strong>Transaction ID:</strong> ${reg.transactionId || 'Not provided'}</div>
      <div><strong>Event / Venue:</strong> KHEPRIX 2K26 • 8 Block (Oct 2, 2026)</div>
      <div><strong>Registration Source:</strong> ${reg.registrationSource || 'PUBLIC'}</div>
    </div>
    <h3 style="color: #ffd875; border-bottom: 1px solid rgba(212,152,24,0.3); padding-bottom: 6px; margin-top: 20px;">Confirmed Squad Roster (4 Explorers)</h3>
    ${reg.members.map((m, idx) => `
      <div class="member-card">
        <div class="role">${idx === 0 ? 'Team Leader (Member 1)' : 'Explorer ' + (idx + 1)}</div>
        <div class="name">${m.name || '—'}</div>
        <div class="info"><strong>College Gmail:</strong> ${m.collegeGmail || '—'}</div>
        <div class="info"><strong>Phone:</strong> ${m.phone || '—'} | <strong>Reg No:</strong> ${m.regNo || '—'}</div>
        <div class="info"><strong>Year:</strong> ${m.year || '—'} | <strong>Department:</strong> ${m.department || '—'}</div>
        <div class="info"><strong>Hostel:</strong> ${m.hostelName || '—'} (Room ${m.roomNo || '—'})</div>
        <div class="info"><strong>Warden:</strong> ${m.wardenName || '—'} (${m.wardenPhone || '—'})</div>
      </div>
    `).join('')}
    <button class="print-btn" onclick="window.print()">PRINT / SAVE AS PDF</button>
  </div>
</body>
</html>`
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `KHEPRIX_2K26_Dossier_${reg.registrationId}.html`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const showToast = useCallback((type: 'success' | 'error', message: string) => {
    setNotification({ type, message })
    setTimeout(() => setNotification(null), 4000)
  }, [])

  // Load Data
  const loadData = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true)
    } else {
      setLoading(true)
    }
    setError(null)

    try {
      const result = await fetchAdminRegistrations()
      setRegistrations(result.registrations)
      setStats(result.stats)
      setSettings(result.settings)
      setLastFetched(result.lastFetchedAt)

      // Sync settings form
      setFormMaxTeams(result.settings.maxTeams)
      setFormOpeningTime(result.settings.openingTime.slice(0, 16))
      setFormClosingTime(result.settings.closingTime.slice(0, 16))
      setFormStatusOverride(result.settings.statusOverride)
    } catch (err) {
      console.error('Failed to load admin registrations:', err)
      const msg = err instanceof Error ? err.message : 'Failed to connect to Google Sheet API'
      setError(msg)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Save updated Admin Key
  const handleSaveAdminKey = (newKey: string) => {
    setAdminKey(newKey)
    setStoredAdminSecret(newKey)
    setShowKeyInput(false)
    showToast('success', 'Admin Secret Key updated for write operations.')
  }

  // Extract distinct departments and years
  const { departments, years } = useMemo(() => {
    const deptSet = new Set<string>()
    const yearSet = new Set<string>()

    registrations.forEach((r) => {
      r.members.forEach((m) => {
        if (m.department && m.department.trim()) deptSet.add(m.department.trim())
        if (m.year && m.year.trim()) yearSet.add(m.year.trim())
      })
    })

    return {
      departments: Array.from(deptSet).sort(),
      years: Array.from(yearSet).sort(),
    }
  }, [registrations])

  // Filtered registrations (client-side in-memory filter, no network calls on keystroke)
  const filteredRegistrations = useMemo(() => {
    const q = searchQuery.toLowerCase().trim()
    const todayStr = new Date().toISOString().slice(0, 10)

    const list = registrations.filter((reg) => {
      // 1. Text Search: ID, Team Name, Member Names, Phones, Emails, Reg No, Txn ID
      if (q) {
        const matchesId = reg.registrationId.toLowerCase().includes(q)
        const matchesTeam = reg.teamName.toLowerCase().includes(q)
        const matchesTxn = (reg.transactionId || '').toLowerCase().includes(q)
        const matchesMember = reg.members.some(
          (m) =>
            m.name.toLowerCase().includes(q) ||
            m.collegeGmail.toLowerCase().includes(q) ||
            m.phone.toLowerCase().includes(q) ||
            m.regNo.toLowerCase().includes(q)
        )
        if (!matchesId && !matchesTeam && !matchesTxn && !matchesMember) {
          return false
        }
      }

      // 2. Status Filter (Active vs Blocked)
      if (statusFilter !== 'all') {
        if (statusFilter === 'active' && reg.status === 'BLOCKED') return false
        if (statusFilter === 'blocked' && reg.status !== 'BLOCKED') return false
      }

      // 3. Payment Status Filter (Verified vs Pending)
      if (paymentFilter !== 'all') {
        const statusLower = (reg.paymentStatus || '').toLowerCase()
        const isVerified = statusLower.includes('confirm') || statusLower.includes('verified') || statusLower.includes('success')
        if (paymentFilter === 'confirmed' || paymentFilter === 'verified') {
          if (!isVerified) return false
        } else if (paymentFilter === 'pending') {
          if (isVerified) return false
        }
      }

      // 4. Department Filter
      if (deptFilter !== 'all') {
        const hasDept = reg.members.some((m) => m.department.trim().toLowerCase() === deptFilter.toLowerCase())
        if (!hasDept) return false
      }

      // 5. Year Filter
      if (yearFilter !== 'all') {
        const hasYear = reg.members.some((m) => m.year.trim().toLowerCase() === yearFilter.toLowerCase())
        if (!hasYear) return false
      }

      // 6. Registration Source Filter (PUBLIC vs ADMIN)
      if (sourceFilter !== 'all') {
        const src = (reg.registrationSource || 'PUBLIC').toUpperCase()
        if (src !== sourceFilter.toUpperCase()) return false
      }

      // 7. Date Filter (All, Today, or Custom Date)
      if (datePreset === 'today') {
        const regDateStr = reg.timestamp ? reg.timestamp.slice(0, 10) : ''
        if (!regDateStr.includes(todayStr)) return false
      } else if (datePreset === 'custom' && dateFilter) {
        const regDateStr = reg.timestamp ? reg.timestamp.slice(0, 10) : ''
        if (!regDateStr.includes(dateFilter)) return false
      } else if (dateFilter) {
        const regDateStr = reg.timestamp ? reg.timestamp.slice(0, 10) : ''
        if (!regDateStr.includes(dateFilter)) return false
      }

      return true
    })

    // 8. FCFS Sorting (Oldest first #1, #2... vs Newest first)
    return list.sort((a, b) => {
      const timeA = new Date(a.timestamp).getTime()
      const timeB = new Date(b.timestamp).getTime()
      if (isNaN(timeA)) return 1
      if (isNaN(timeB)) return -1
      return sortOrder === 'newest' ? timeB - timeA : timeA - timeB
    })
  }, [registrations, searchQuery, statusFilter, paymentFilter, deptFilter, yearFilter, sourceFilter, datePreset, dateFilter, sortOrder])

  // Copy helper
  const handleCopy = (text: string, id: string) => {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        setCopiedId(id)
        setTimeout(() => setCopiedId(null), 2000)
      })
      .catch(() => {})
  }

  // Clear filters
  const handleClearFilters = () => {
    setSearchQuery('')
    setStatusFilter('all')
    setPaymentFilter('all')
    setDeptFilter('all')
    setYearFilter('all')
    setSourceFilter('all')
    setDatePreset('all')
    setDateFilter('')
    setSortOrder('oldest')
  }

  const hasActiveFilters = Boolean(
    searchQuery ||
    statusFilter !== 'all' ||
    paymentFilter !== 'all' ||
    deptFilter !== 'all' ||
    yearFilter !== 'all' ||
    sourceFilter !== 'all' ||
    datePreset !== 'all' ||
    dateFilter ||
    sortOrder !== 'oldest'
  )

  // ── Actions ──

  // Save Registration Settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault()
    setActionInProgress(true)
    try {
      const updated = await updateRegistrationSettings(
        {
          maxTeams: Number(formMaxTeams),
          openingTime: formOpeningTime,
          closingTime: formClosingTime,
          statusOverride: formStatusOverride,
        },
        adminKey
      )
      setSettings(updated)
      showToast('success', 'Registration settings saved and enforced on Google Sheet!')
      setShowSettingsModal(false)
      loadData(true)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to update settings'
      showToast('error', msg)
    } finally {
      setActionInProgress(false)
    }
  }

  // Quick Pause / Unpause
  const handleTogglePause = async () => {
    const nextOverride = settings.statusOverride === 'PAUSED' ? 'AUTO' : 'PAUSED'
    setActionInProgress(true)
    try {
      const updated = await updateRegistrationSettings({ statusOverride: nextOverride }, adminKey)
      setSettings(updated)
      showToast('success', nextOverride === 'PAUSED' ? 'Registration PAUSED.' : 'Registration UNPAUSED (Auto).')
      loadData(true)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to toggle pause status'
      showToast('error', msg)
    } finally {
      setActionInProgress(false)
    }
  }

  // Execute Block Registration
  const handleConfirmBlock = async () => {
    if (!blockTarget) return
    setActionInProgress(true)
    try {
      await blockRegistration(blockTarget.registrationId, blockReason, 'Overseer Admin', adminKey)
      showToast('success', `Registration ${blockTarget.registrationId} blocked.`)
      setBlockTarget(null)
      loadData(true)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to block registration'
      showToast('error', msg)
    } finally {
      setActionInProgress(false)
    }
  }

  // Execute Unblock Registration
  const handleUnblock = async (regId: string) => {
    setActionInProgress(true)
    try {
      await unblockRegistration(regId, adminKey)
      showToast('success', `Registration ${regId} has been restored to ACTIVE.`)
      loadData(true)
      if (selectedReg && selectedReg.registrationId === regId) {
        setSelectedReg((prev) => (prev ? { ...prev, status: 'ACTIVE' } : null))
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to unblock registration'
      showToast('error', msg)
    } finally {
      setActionInProgress(false)
    }
  }

  // Quick Payment Status Toggle (Verified vs Pending)
  const handleTogglePayment = async (reg: AdminRegistration) => {
    const currentConfirmed =
      (reg.paymentStatus || '').toLowerCase().includes('confirm') ||
      (reg.paymentStatus || '').toLowerCase().includes('verified')
    const newStatus = currentConfirmed ? 'Pending Verification' : 'Verified'

    setActionInProgress(true)
    try {
      await updatePaymentStatus(reg.registrationId, newStatus, reg.transactionId, undefined, adminKey)
      showToast('success', `Payment status for ${reg.teamName} updated to '${newStatus}'.`)
      loadData(true)
      if (selectedReg && selectedReg.registrationId === reg.registrationId) {
        setSelectedReg((prev) => (prev ? { ...prev, paymentStatus: newStatus } : null))
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to update payment status'
      showToast('error', msg)
    } finally {
      setActionInProgress(false)
    }
  }

  // Submit Manual Team Addition
  const handleManualAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!manualForm.teamName.trim()) {
      showToast('error', 'Team Name is required.')
      return
    }

    setActionInProgress(true)
    try {
      const result = await addTeamManually(manualForm, adminKey)
      showToast('success', `Team "${manualForm.teamName}" added successfully with ID ${result.registrationId}!`)
      setShowAddTeamModal(false)
      loadData(true)
      // Reset form
      setManualForm({
        teamName: '',
        teamSize: 4,
        transactionId: '',
        paymentAmount: 1200,
        paymentStatus: 'Verified',
        paymentScreenshotUrl: '',
        paymentScreenshotName: '',
        adminNotes: '',
        members: [
          emptyMember(1, 'Team Leader'),
          emptyMember(2, 'Explorer 2'),
          emptyMember(3, 'Explorer 3'),
          emptyMember(4, 'Explorer 4'),
        ],
      })
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to add manual squad'
      showToast('error', msg)
    } finally {
      setActionInProgress(false)
    }
  }

  // Member field update for manual form
  const handleManualMemberChange = (idx: number, field: keyof AdminMember, value: string) => {
    setManualForm((prev) => {
      const updatedMembers = [...prev.members] as [AdminMember, AdminMember, AdminMember, AdminMember]
      updatedMembers[idx] = {
        ...updatedMembers[idx],
        [field]: value,
      }
      return { ...prev, members: updatedMembers }
    })
  }

  // Open Export Modal with default today preset
  const openExportModal = () => {
    const range = getPresetDateRange('today', registrations)
    setExportFromDate(range.fromDate)
    setExportToDate(range.toDate)
    setExportPreset('today')
    setShowExportModal(true)
  }

  // Handle Quick Date Presets
  const handleSelectExportPreset = (preset: 'today' | 'yesterday' | 'last7days' | 'thismonth' | 'all') => {
    const range = getPresetDateRange(preset, registrations)
    setExportFromDate(range.fromDate)
    setExportToDate(range.toDate)
    setExportPreset(preset)
  }

  // Target registrations based on Export Mode
  const targetExportRegistrations = useMemo(() => {
    if (exportMode === 'current-filtered') {
      return filteredRegistrations
    }
    return filterRegistrationsByDateRange(registrations, exportFromDate, exportToDate)
  }, [exportMode, filteredRegistrations, registrations, exportFromDate, exportToDate])

  // Summary Metrics for target export registrations
  const exportSummary = useMemo(() => {
    return computeExportSummaryStats(targetExportRegistrations)
  }, [targetExportRegistrations])

  // Excel (.xlsx) Download Handler
  const handleExportExcel = async () => {
    if (targetExportRegistrations.length === 0 || exportInProgress) return

    setExportInProgress(true)
    setExportProgressText(`Preparing ${targetExportRegistrations.length} registrations...`)

    try {
      await new Promise((r) => setTimeout(r, 120))
      const success = await exportRegistrationsToExcel(
        targetExportRegistrations,
        exportMode === 'date-range' ? exportFromDate : 'Filtered',
        exportMode === 'date-range' ? exportToDate : 'Export'
      )

      if (success) {
        showToast('success', `✓ EXPORT COMPLETE: ${targetExportRegistrations.length} registrations exported successfully.`)
        setShowExportModal(false)
      } else {
        showToast('error', 'Export failed: No valid registration data.')
      }
    } catch (err) {
      console.error('Excel export error:', err)
      showToast('error', 'Failed to generate Excel spreadsheet.')
    } finally {
      setExportInProgress(false)
      setExportProgressText('')
    }
  }

  // PDF Report Download Handler
  const handleExportPdf = async () => {
    if (targetExportRegistrations.length === 0 || exportInProgress) return

    setExportInProgress(true)
    setExportProgressText(`Preparing ${targetExportRegistrations.length} registrations...`)

    try {
      await new Promise((r) => setTimeout(r, 120))
      const success = await exportRegistrationsToPdf(
        targetExportRegistrations,
        exportMode === 'date-range' ? exportFromDate : 'Filtered',
        exportMode === 'date-range' ? exportToDate : 'Export'
      )

      if (success) {
        showToast('success', `✓ EXPORT COMPLETE: ${targetExportRegistrations.length} registrations exported successfully.`)
        setShowExportModal(false)
      } else {
        showToast('error', 'Failed to generate PDF report.')
      }
    } catch (err) {
      console.error('PDF export error:', err)
      showToast('error', 'Failed to generate PDF report.')
    } finally {
      setExportInProgress(false)
      setExportProgressText('')
    }
  }

  return (
    <div className="admin-portal-root">
      {/* Toast Notification Banner */}
      {notification && (
        <div className={`admin-toast-banner ${notification.type === 'success' ? 'toast-success' : 'toast-error'}`}>
          {notification.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          <span>{notification.message}</span>
        </div>
      )}

      {/* ── Top Navigation Bar ── */}
      <header className="admin-topbar">
        <div className="admin-topbar-brand">
          <div className="admin-scarab-badge">𓆣</div>
          <div className="admin-brand-info">
            <h1 className="admin-brand-title">KHEPRIX 2K26</h1>
            <span className="admin-brand-tagline">OVERSEER REGISTRY &amp; CONTROL SYSTEM</span>
          </div>
        </div>

        <div className="admin-topbar-actions">
          {lastFetched && (
            <span className="last-sync-badge">
              <Clock size={12} />
              <span>Synced {lastFetched.toLocaleTimeString()}</span>
            </span>
          )}

          {/* Admin Secret Key Trigger */}
          <div className="admin-key-pill-container">
            <button
              type="button"
              className="btn-admin-action btn-key-pill"
              onClick={() => setShowKeyInput((prev) => !prev)}
              title="Configure Admin Authorization Secret"
            >
              <Key size={13} />
              <span>{adminKey ? 'Key Configured' : 'Set Admin Key'}</span>
            </button>
            {showKeyInput && (
              <div className="key-input-popover">
                <span className="key-popover-title">Admin API Secret:</span>
                <input
                  type="password"
                  className="key-secret-input"
                  defaultValue={adminKey}
                  placeholder="Enter script secret..."
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleSaveAdminKey((e.target as HTMLInputElement).value)
                    }
                  }}
                  id="admin-secret-field"
                />
                <button
                  type="button"
                  className="btn-save-key"
                  onClick={() => {
                    const el = document.getElementById('admin-secret-field') as HTMLInputElement
                    if (el) handleSaveAdminKey(el.value)
                  }}
                >
                  Save
                </button>
              </div>
            )}
          </div>

          {/* Settings Control Button */}
          <button
            type="button"
            className="btn-admin-action btn-settings"
            onClick={() => setShowSettingsModal(true)}
            title="Configure Registration Limits & Status"
          >
            <Settings size={14} />
            <span>Limits &amp; Rules</span>
          </button>

          {/* Export Data Button */}
          <button
            type="button"
            className="btn-admin-action btn-export-topbar"
            onClick={openExportModal}
            title="Export Registrations to Excel (.xlsx) or PDF Report"
            id="btn-admin-export-data"
          >
            <FileSpreadsheet size={15} />
            <span>EXPORT DATA</span>
          </button>

          {/* Manual Add Team Button */}
          <button
            type="button"
            className="btn-admin-action btn-add-team"
            onClick={() => setShowAddTeamModal(true)}
            title="Add a squad manually to Sheet1"
          >
            <PlusCircle size={14} />
            <span>Add Team Manually</span>
          </button>

          {/* Refresh Sheet */}
          <button
            type="button"
            className="btn-admin-action btn-refresh"
            onClick={() => loadData(true)}
            disabled={loading || refreshing || actionInProgress}
            title="Fetch fresh data from Google Sheet1"
          >
            <RefreshCw size={14} className={refreshing ? 'spinning' : ''} />
            <span>{refreshing ? 'Refreshing...' : 'Refresh Sheet'}</span>
          </button>

          {/* Last Synced Indicator */}
          {lastFetched && (
            <span className="last-sync-badge" title="Timestamp of last Google Sheet sync">
              <Clock size={12} />
              <span>Last synced: {lastFetched.toLocaleTimeString('en-IN', { hour12: false })}</span>
            </span>
          )}

          {/* Exit to Site */}
          {onBackToSite && (
            <button type="button" className="btn-admin-action btn-exit" onClick={onBackToSite} title="Return to Public Website">
              <ArrowLeft size={14} />
              <span>Expedition Site</span>
            </button>
          )}
        </div>
      </header>

      {/* ── Main Container ── */}
      <main className="admin-main-container">
        {/* ── Live Registration Control & Capacity Banner ── */}
        <section className="reg-control-hero-card" aria-label="Registration Control Center">
          <div className="control-hero-left">
            <div className="status-indicator-cluster">
              <span className={`status-badge-lg status-${settings.calculatedStatus.toLowerCase()}`}>
                {settings.calculatedStatus === 'OPEN' && <CheckCircle2 size={15} />}
                {settings.calculatedStatus === 'PAUSED' && <PauseCircle size={15} />}
                {settings.calculatedStatus === 'CLOSED' && <X size={15} />}
                {settings.calculatedStatus === 'FULL' && <AlertCircle size={15} />}
                <span>REGISTRATION {settings.calculatedStatus}</span>
              </span>
              <span className="override-tag">Mode: {settings.statusOverride}</span>
            </div>

            <div className="capacity-bar-container">
              <div className="capacity-text-row">
                <span>
                  Capacity: <strong>{settings.activeTeams}</strong> / <strong>{settings.maxTeams} Teams</strong> Registered
                </span>
                <span className="slots-remaining-badge">
                  {settings.remainingSlots > 0 ? `${settings.remainingSlots} SLOTS REMAINING` : 'FULL CAPACITY'}
                </span>
              </div>
              <div className="capacity-progress-track">
                <div
                  className="capacity-progress-fill"
                  style={{ width: `${Math.min(100, (settings.activeTeams / Math.max(1, settings.maxTeams)) * 100)}%` }}
                />
              </div>
            </div>
          </div>

          <div className="control-hero-right">
            <div className="timing-summary">
              <span className="timing-lbl">CLOSES:</span>
              <span className="timing-val">{new Date(settings.closingTime).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</span>
            </div>

            <div className="hero-action-btns">
              <button
                type="button"
                className={`btn-pause-toggle ${settings.statusOverride === 'PAUSED' ? 'btn-unpause' : ''}`}
                onClick={handleTogglePause}
                disabled={actionInProgress}
              >
                {settings.statusOverride === 'PAUSED' ? <PlayCircle size={15} /> : <PauseCircle size={15} />}
                <span>{settings.statusOverride === 'PAUSED' ? 'Resume Registration' : 'Pause Registration'}</span>
              </button>

              <button
                type="button"
                className="btn-edit-limits"
                onClick={() => setShowSettingsModal(true)}
              >
                <Settings size={15} />
                <span>Adjust Limits</span>
              </button>
            </div>
          </div>
        </section>

        {/* ── KPI Statistics Cards ── */}
        <section className="admin-stats-grid" aria-label="Dashboard Key Statistics">
          <div className="stat-card">
            <div className="stat-icon-wrapper gold-tint">
              <Trophy size={20} />
            </div>
            <div className="stat-content">
              <span className="stat-label">TOTAL TEAMS</span>
              <strong className="stat-val">{stats.totalTeams}</strong>
              <span className="stat-sub">{stats.activeTeamsCount} Active • {stats.blockedTeamsCount} Blocked</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon-wrapper emerald-tint">
              <CheckCircle2 size={20} />
            </div>
            <div className="stat-content">
              <span className="stat-label">CONFIRMED SQUADS</span>
              <strong className="stat-val">{stats.confirmedCount}</strong>
              <span className="stat-sub">Payment Verified</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon-wrapper orange-tint">
              <Clock size={20} />
            </div>
            <div className="stat-content">
              <span className="stat-label">PENDING AUDIT</span>
              <strong className="stat-val">{stats.pendingCount}</strong>
              <span className="stat-sub">Awaiting Proof Check</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon-wrapper green-tint">
              <CreditCard size={20} />
            </div>
            <div className="stat-content">
              <span className="stat-label">TOTAL REVENUE</span>
              <strong className="stat-val">₹{stats.totalAmountCollected.toLocaleString('en-IN')}</strong>
              <span className="stat-sub">From Active Squads</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon-wrapper red-tint">
              <Ban size={20} />
            </div>
            <div className="stat-content">
              <span className="stat-label">BLOCKED TEAMS</span>
              <strong className="stat-val">{stats.blockedTeamsCount}</strong>
              <span className="stat-sub">Disqualified</span>
            </div>
          </div>
        </section>

        {/* ── Controls: Search, Filters & Counters ── */}
        <section className="admin-filter-bar">
          <div className="admin-search-box">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              className="admin-search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by ID, Team Name, Member, Phone, College Gmail, or Txn ID..."
            />
            {searchQuery && (
              <button
                type="button"
                className="clear-search-btn"
                onClick={() => setSearchQuery('')}
                title="Clear Search"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <div className="admin-dropdown-filters">
            {/* Status Filter (Active / Blocked) */}
            <div className="filter-select-wrapper">
              <select
                className="admin-select"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Statuses (Active &amp; Blocked)</option>
                <option value="active">Active Only</option>
                <option value="blocked">Blocked Only</option>
              </select>
            </div>

            {/* Payment Status Dropdown */}
            <div className="filter-select-wrapper">
              <select
                className="admin-select"
                value={paymentFilter}
                onChange={(e) => setPaymentFilter(e.target.value)}
              >
                <option value="all">All Payment Statuses</option>
                <option value="pending">Pending Verification</option>
                <option value="confirmed">Confirmed / Verified</option>
              </select>
            </div>

            {/* Registration Source Dropdown */}
            <div className="filter-select-wrapper">
              <select
                className="admin-select"
                value={sourceFilter}
                onChange={(e) => setSourceFilter(e.target.value)}
                title="Filter by registration source"
              >
                <option value="all">All Sources (Public &amp; Admin)</option>
                <option value="PUBLIC">Public Website Only</option>
                <option value="ADMIN">Admin Overseer Only</option>
              </select>
            </div>

            {/* Department Dropdown */}
            <div className="filter-select-wrapper">
              <select
                className="admin-select"
                value={deptFilter}
                onChange={(e) => setDeptFilter(e.target.value)}
                title="Filter by department"
              >
                <option value="all">All Departments</option>
                {departments.map((dept) => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>

            {/* Year Dropdown */}
            <div className="filter-select-wrapper">
              <select
                className="admin-select"
                value={yearFilter}
                onChange={(e) => setYearFilter(e.target.value)}
                title="Filter by year of study"
              >
                <option value="all">All Years</option>
                {years.map((yr) => (
                  <option key={yr} value={yr}>{yr}</option>
                ))}
              </select>
            </div>

            {/* Date Preset Filter */}
            <div className="filter-select-wrapper">
              <select
                className="admin-select"
                value={datePreset}
                onChange={(e) => {
                  setDatePreset(e.target.value)
                  if (e.target.value !== 'custom') setDateFilter('')
                }}
                title="Filter by registration timeframe"
              >
                <option value="all">All Dates</option>
                <option value="today">Registered Today</option>
                <option value="custom">Specific Date...</option>
              </select>
            </div>

            {/* Specific Date Input (if custom or date set) */}
            {(datePreset === 'custom' || dateFilter) && (
              <div className="filter-date-wrapper">
                <input
                  type="date"
                  className="admin-date-input"
                  value={dateFilter}
                  onChange={(e) => {
                    setDateFilter(e.target.value)
                    setDatePreset('custom')
                  }}
                  title="Choose specific date"
                />
              </div>
            )}

            {/* FCFS Chronological Sort */}
            <div className="filter-select-wrapper">
              <select
                className="admin-select"
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as 'oldest' | 'newest')}
                title="Sort order for FCFS queue"
              >
                <option value="oldest">FCFS: Oldest First (#1, #2...)</option>
                <option value="newest">FCFS: Newest First</option>
              </select>
            </div>

            {/* Clear All Filters Button */}
            {hasActiveFilters && (
              <button type="button" className="btn-clear-filters" onClick={handleClearFilters} title="Reset all filters">
                <X size={13} />
                <span>Reset Filters</span>
              </button>
            )}
          </div>
        </section>

        {/* ── Table Header / Results Summary ── */}
        <div className="admin-results-meta">
          <div className="results-count">
            Showing <strong>{filteredRegistrations.length}</strong> of <strong>{registrations.length}</strong> registrations
            {hasActiveFilters && <span className="filtered-tag"> (Filtered)</span>}
          </div>
          <div className="fcfs-badge-hint">
            <span className="fcfs-dot" />
            <span>FCFS ordered chronologically • Blocked teams are distinguished</span>
          </div>
        </div>

        {/* ── Content View States ── */}
        {loading ? (
          <div className="admin-status-state" role="status">
            <div className="state-spinner" />
            <h3 className="state-title">Retrieving Registrations from Google Sheet1...</h3>
            <p className="state-desc">Fetching live data via Google Apps Script Web App API.</p>
          </div>
        ) : error ? (
          <div className="admin-status-state state-error" role="alert">
            <AlertCircle size={36} className="state-error-icon" />
            <h3 className="state-title">Failed to Load Registrations</h3>
            <p className="state-desc">{error}</p>
            <button type="button" className="btn-admin-retry" onClick={() => loadData(false)}>
              <RefreshCw size={14} />
              <span>Retry Fetching</span>
            </button>
          </div>
        ) : filteredRegistrations.length === 0 ? (
          <div className="admin-status-state state-empty">
            <div className="empty-glyph">𓋹</div>
            <h3 className="state-title">No Registrations Found</h3>
            <p className="state-desc">
              {hasActiveFilters
                ? 'No squad matches your current search or filter criteria. Try resetting filters.'
                : 'No registrations recorded in Sheet1 yet.'}
            </p>
            {hasActiveFilters && (
              <button type="button" className="btn-admin-retry" onClick={handleClearFilters}>
                Clear All Filters
              </button>
            )}
          </div>
        ) : (
          /* ── Main Data Table ── */
          <div className="admin-table-wrapper">
            <table className="admin-table" aria-label="Expedition Registrations Table">
              <thead>
                <tr>
                  <th scope="col" className="th-fcfs">FCFS</th>
                  <th scope="col">REGISTRATION ID</th>
                  <th scope="col">TIMESTAMP</th>
                  <th scope="col">SQUAD NAME</th>
                  <th scope="col">STATUS</th>
                  <th scope="col">TEAM LEADER (M1)</th>
                  <th scope="col">TRANSACTION ID</th>
                  <th scope="col">AMOUNT</th>
                  <th scope="col">PAYMENT</th>
                  <th scope="col">PROOF</th>
                  <th scope="col" className="th-actions">ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {filteredRegistrations.map((reg) => {
                  const m1 = reg.members[0] || { name: '—', collegeGmail: '—', phone: '—' }
                  const isConfirmed =
                    (reg.paymentStatus || '').toLowerCase().includes('confirm') ||
                    (reg.paymentStatus || '').toLowerCase().includes('verified')
                  const isBlocked = reg.status === 'BLOCKED'

                  return (
                    <tr key={reg.registrationId} className={`admin-table-row ${isBlocked ? 'row-blocked' : ''}`}>
                      {/* FCFS Column */}
                      <td className="td-fcfs">
                        {isBlocked ? (
                          <span className="fcfs-pill-blocked" title="Blocked from FCFS queue">
                            BLOCKED
                          </span>
                        ) : (
                          <span className="fcfs-pill" title={`Active First-Come-First-Served Position: ${reg.fcfsDisplay}`}>
                            {reg.fcfsDisplay}
                          </span>
                        )}
                      </td>

                      {/* Registration ID with Copy */}
                      <td className="td-regid">
                        <div className="regid-cell">
                          <code>{reg.registrationId}</code>
                          <button
                            type="button"
                            className="btn-inline-copy"
                            onClick={() => handleCopy(reg.registrationId, reg.registrationId)}
                            title="Copy Registration ID"
                          >
                            {copiedId === reg.registrationId ? <Check size={12} className="copy-done" /> : <Copy size={12} />}
                          </button>
                        </div>
                        {reg.registrationSource === 'ADMIN' && <span className="source-admin-tag">ADMIN ENTRY</span>}
                      </td>

                      {/* Timestamp */}
                      <td className="td-time">
                        <span className="timestamp-text">{reg.timestamp || '—'}</span>
                      </td>

                      {/* Team Name */}
                      <td className="td-team">
                        <strong className="team-name-text">{reg.teamName || '—'}</strong>
                      </td>

                      {/* Active / Blocked Status */}
                      <td className="td-status-active">
                        <span className={`badge-active-status ${isBlocked ? 'tag-blocked' : 'tag-active'}`}>
                          {isBlocked ? <Ban size={11} /> : <CheckCircle2 size={11} />}
                          <span>{reg.status}</span>
                        </span>
                      </td>

                      {/* Team Leader */}
                      <td className="td-leader">
                        <div className="leader-cell">
                          <strong className="leader-name">{m1.name}</strong>
                          <span className="leader-meta">
                            <Mail size={11} /> {m1.collegeGmail || '—'}
                          </span>
                          <span className="leader-meta">
                            <Phone size={11} /> {m1.phone || '—'}
                          </span>
                        </div>
                      </td>

                      {/* Transaction ID */}
                      <td className="td-txn">
                        {reg.transactionId ? (
                          <div className="txn-cell">
                            <code>{reg.transactionId}</code>
                            <button
                              type="button"
                              className="btn-inline-copy"
                              onClick={() => handleCopy(reg.transactionId || '', `txn-${reg.registrationId}`)}
                              title="Copy Transaction ID"
                            >
                              {copiedId === `txn-${reg.registrationId}` ? <Check size={12} className="copy-done" /> : <Copy size={12} />}
                            </button>
                          </div>
                        ) : (
                          <span className="no-txn-label">Not provided</span>
                        )}
                      </td>

                      {/* Fee Amount */}
                      <td className="td-amount">
                        <span className="fee-pill">₹{reg.totalAmount}</span>
                      </td>

                      {/* Payment Status Badge */}
                      <td className="td-status">
                        <button
                          type="button"
                          className={`status-pill status-toggle-btn ${isConfirmed ? 'status-confirmed' : 'status-pending'}`}
                          onClick={() => handleTogglePayment(reg)}
                          title="Click to toggle Verified / Pending"
                        >
                          {isConfirmed ? <CheckCircle2 size={12} /> : <Clock size={12} />}
                          <span>{reg.paymentStatus || 'Pending'}</span>
                        </button>
                      </td>

                      {/* Payment Screenshot */}
                      <td className="td-proof">
                        {reg.paymentScreenshotUrl ? (
                          <a
                            href={reg.paymentScreenshotUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn-view-proof"
                            title="Open Google Drive payment screenshot in new tab"
                          >
                            <ExternalLink size={13} />
                            <span>Proof</span>
                          </a>
                        ) : (
                          <span className="no-proof-label">No Proof</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="td-actions">
                        <div className="action-button-group">
                          {/* Details Button */}
                          <button
                            type="button"
                            className="btn-view-details"
                            onClick={() => setSelectedReg(reg)}
                            title="Open full squad details"
                          >
                            <Eye size={13} />
                            <span>Details</span>
                          </button>

                          {/* Block / Unblock Toggle */}
                          {isBlocked ? (
                            <button
                              type="button"
                              className="btn-row-action btn-unblock"
                              onClick={() => handleUnblock(reg.registrationId)}
                              title="Restore squad to Active"
                            >
                              <Check size={13} />
                              <span>Unblock</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              className="btn-row-action btn-block"
                              onClick={() => {
                                setBlockTarget(reg)
                                setBlockReason('Administrative Disqualification')
                              }}
                              title="Block this squad"
                            >
                              <Ban size={13} />
                              <span>Block</span>
                            </button>
                          )}

                          {/* Confirmation Voucher PDF */}
                          {isConfirmed && (
                            <button
                              type="button"
                              className="btn-row-action btn-voucher"
                              onClick={() => generateConfirmationDocument(reg)}
                              title="Download official confirmation PDF voucher"
                            >
                              <FileDown size={13} />
                              <span>Voucher</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {/* ── Registration Details Modal ── */}
      {selectedReg && (
        <div className="admin-modal-backdrop" onClick={() => setSelectedReg(null)}>
          <div
            className="admin-modal-card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-team-title"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="modal-header">
              <div className="modal-title-group">
                <div className="modal-tags-row">
                  <span className={`modal-fcfs-tag ${selectedReg.status === 'BLOCKED' ? 'tag-blocked-bg' : ''}`}>
                    {selectedReg.status === 'BLOCKED' ? 'BLOCKED REGISTRATION' : `FCFS ${selectedReg.fcfsDisplay}`}
                  </span>
                  <span className={`badge-active-status ${selectedReg.status === 'BLOCKED' ? 'tag-blocked' : 'tag-active'}`}>
                    {selectedReg.status}
                  </span>
                </div>
                <h2 id="modal-team-title" className="modal-title">{selectedReg.teamName}</h2>
                <div className="modal-id-row">
                  <span>ID:</span>
                  <code>{selectedReg.registrationId}</code>
                  <button
                    type="button"
                    className="btn-inline-copy"
                    onClick={() => handleCopy(selectedReg.registrationId, 'modal-id')}
                    title="Copy ID"
                  >
                    {copiedId === 'modal-id' ? <Check size={12} className="copy-done" /> : <Copy size={12} />}
                  </button>
                  <span className="modal-time-sep">•</span>
                  <span>{selectedReg.timestamp}</span>
                </div>
              </div>

              <button
                type="button"
                className="btn-modal-close"
                onClick={() => setSelectedReg(null)}
                title="Close Details"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="modal-body">
              {/* Blocked Info Notice if Blocked */}
              {selectedReg.status === 'BLOCKED' && (
                <div className="blocked-info-banner">
                  <ShieldAlert size={20} className="blocked-icon" />
                  <div>
                    <strong>THIS REGISTRATION IS CURRENTLY BLOCKED</strong>
                    <p>Reason: {selectedReg.blockReason || 'Administrative Block'}</p>
                    {selectedReg.blockedAt && <span>Blocked At: {selectedReg.blockedAt} by {selectedReg.blockedBy || 'Admin'}</span>}
                  </div>
                  <button
                    type="button"
                    className="btn-unblock-modal"
                    onClick={() => handleUnblock(selectedReg.registrationId)}
                  >
                    Restore Registration
                  </button>
                </div>
              )}

              {/* Payment Summary Box */}
              <div className="modal-payment-banner">
                <div className="payment-stat-item">
                  <span className="meta-lbl">Total Fee</span>
                  <strong className="meta-val fee-accent">₹{selectedReg.totalAmount} (₹300 × 4)</strong>
                </div>
                <div className="payment-stat-item">
                  <span className="meta-lbl">Payment Status</span>
                  <span className={`status-pill ${selectedReg.paymentStatus === 'Verified' ? 'status-confirmed' : 'status-pending'}`}>
                    {selectedReg.paymentStatus}
                  </span>
                </div>
                <div className="payment-stat-item">
                  <span className="meta-lbl">TRANSACTION ID</span>
                  <div className="txn-modal-val-row">
                    <span className="meta-val monospace-val">{selectedReg.transactionId || 'Not provided'}</span>
                    {selectedReg.transactionId && (
                      <button
                        type="button"
                        className="btn-inline-copy"
                        onClick={() => handleCopy(selectedReg.transactionId || '', 'modal-txn')}
                        title="Copy Transaction ID"
                      >
                        {copiedId === 'modal-txn' ? <Check size={12} className="copy-done" /> : <Copy size={12} />}
                      </button>
                    )}
                  </div>
                </div>
                <div className="payment-stat-item">
                  <span className="meta-lbl">Payment Screenshot Proof</span>
                  {selectedReg.paymentScreenshotUrl ? (
                    <div className="screenshot-btn-cluster">
                      <a
                        href={selectedReg.paymentScreenshotUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-view-proof"
                        title="View original payment screenshot on Google Drive"
                      >
                        <ExternalLink size={13} />
                        <span>VIEW PAYMENT PROOF</span>
                      </a>
                      <a
                        href={getDirectDriveDownloadUrl(selectedReg.paymentScreenshotUrl)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-download-proof"
                        title="Download payment screenshot directly"
                      >
                        <FileDown size={13} />
                        <span>DOWNLOAD PAYMENT PROOF</span>
                      </a>
                    </div>
                  ) : (
                    <span className="no-proof-label">Payment proof unavailable</span>
                  )}
                </div>
              </div>

              {/* 4-Member Roster Breakdown */}
              <h3 className="section-heading">
                <span>𓋹</span> SQUAD MEMBERS ROSTER (ALL 4 EXPLORERS)
              </h3>

              <div className="modal-members-grid">
                {selectedReg.members.map((m, idx) => (
                  <div key={idx} className={`member-card ${idx === 0 ? 'leader-card' : ''}`}>
                    <div className="member-card-header">
                      <span className="member-role-badge">
                        {idx === 0 ? '𓁹 TEAM LEADER (MEMBER 1)' : `𓊹 EXPLORER ${idx + 1}`}
                      </span>
                    </div>

                    <div className="member-card-body">
                      <strong className="member-full-name">{m.name || `Member ${idx + 1}`}</strong>

                      <div className="member-info-row">
                        <Mail size={13} />
                        <span className="info-key">College Gmail:</span>
                        <span className="info-val gmail-val">{m.collegeGmail || '—'}</span>
                      </div>

                      <div className="member-info-row">
                        <Phone size={13} />
                        <span className="info-key">Phone:</span>
                        <span className="info-val">{m.phone || '—'}</span>
                      </div>

                      <div className="member-info-row">
                        <Hash size={13} />
                        <span className="info-key">Reg No:</span>
                        <span className="info-val number-font">{m.regNo || '—'}</span>
                      </div>

                      <div className="member-info-row">
                        <Calendar size={13} />
                        <span className="info-key">Year:</span>
                        <span className="info-val">{m.year || '—'}</span>
                      </div>

                      <div className="member-info-row">
                        <Building2 size={13} />
                        <span className="info-key">Department:</span>
                        <span className="info-val">{m.department || '—'}</span>
                      </div>

                      <div className="member-info-row">
                        <Home size={13} />
                        <span className="info-key">Hostel:</span>
                        <span className="info-val">{m.hostelName || '—'} (Rm {m.roomNo || '—'})</span>
                      </div>

                      <div className="member-info-row">
                        <UserCheck size={13} />
                        <span className="info-key">Warden:</span>
                        <span className="info-val">{m.wardenName || '—'} ({m.wardenPhone || '—'})</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Raw Google Sheet1 Data Toggle */}
              <div className="modal-raw-section">
                <button
                  type="button"
                  className="btn-toggle-raw"
                  onClick={() => setShowRawFields((prev) => !prev)}
                >
                  <span>{showRawFields ? 'Hide' : 'Inspect'} Raw Google Sheet1 Headers &amp; Values</span>
                </button>

                {showRawFields && (
                  <div className="raw-fields-table-wrapper">
                    <table className="raw-table">
                      <thead>
                        <tr>
                          <th>Sheet1 Header</th>
                          <th>Recorded Value</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(selectedReg.rawRecord).map(([key, val]) => (
                          <tr key={key}>
                            <td className="raw-header-cell">{key}</td>
                            <td className="raw-val-cell">{val || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div className="modal-footer">
              <div className="modal-footer-left">
                <button
                  type="button"
                  className="btn-admin-action btn-pdf-action"
                  onClick={() => generateConfirmationDocument(selectedReg)}
                  title="Download official KHEPRIX 2K26 confirmation voucher"
                >
                  <FileDown size={14} />
                  <span>Download Confirmation</span>
                </button>

                <button
                  type="button"
                  className="btn-admin-action btn-dossier-action"
                  onClick={() => downloadTeamDetails(selectedReg)}
                  title="Download complete printable squad details dossier"
                >
                  <FileDown size={14} />
                  <span>Download Team Details</span>
                </button>

                <button
                  type="button"
                  className="btn-admin-action btn-pay-toggle"
                  onClick={() => handleTogglePayment(selectedReg)}
                >
                  <DollarSign size={14} />
                  <span>Toggle Payment Status</span>
                </button>
              </div>

              <button
                type="button"
                className="btn-admin-close-modal"
                onClick={() => setSelectedReg(null)}
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Block Confirmation Dialog ── */}
      {blockTarget && (
        <div className="admin-modal-backdrop" onClick={() => setBlockTarget(null)}>
          <div className="dialog-card" onClick={(e) => e.stopPropagation()}>
            <div className="dialog-header">
              <Ban size={22} className="dialog-icon-ban" />
              <h3>Block Squad Registration?</h3>
            </div>
            <p className="dialog-lead">
              Are you sure you want to block squad <strong>"{blockTarget.teamName}"</strong> (ID: {blockTarget.registrationId})?
            </p>
            <p className="dialog-sub">
              Blocked squads are disqualified from active FCFS rank slots and marked in Sheet1 without deleting their data.
            </p>

            <div className="dialog-field">
              <label htmlFor="block-reason-input">Block Reason:</label>
              <input
                id="block-reason-input"
                type="text"
                className="dialog-input"
                value={blockReason}
                onChange={(e) => setBlockReason(e.target.value)}
                placeholder="e.g. Duplicate submission / Payment discrepancy"
              />
            </div>

            <div className="dialog-actions">
              <button type="button" className="btn-dialog-cancel" onClick={() => setBlockTarget(null)}>
                Cancel
              </button>
              <button
                type="button"
                className="btn-dialog-confirm"
                onClick={handleConfirmBlock}
                disabled={actionInProgress}
              >
                {actionInProgress ? 'Blocking...' : 'Confirm Block Squad'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Settings Control Modal ── */}
      {showSettingsModal && (
        <div className="admin-modal-backdrop" onClick={() => setShowSettingsModal(false)}>
          <div className="settings-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-group">
                <h2 className="modal-title">REGISTRATION LIMITS &amp; TIMINGS</h2>
                <span className="modal-subtitle">Enforced server-side in Google Apps Script and public form</span>
              </div>
              <button type="button" className="btn-modal-close" onClick={() => setShowSettingsModal(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveSettings} className="settings-form">
              <div className="settings-field">
                <label htmlFor="cfg-max-teams">Maximum Allowed Teams:</label>
                <input
                  id="cfg-max-teams"
                  type="number"
                  min="1"
                  max="1000"
                  className="dialog-input"
                  value={formMaxTeams}
                  onChange={(e) => setFormMaxTeams(parseInt(e.target.value, 10) || 1)}
                  required
                />
                <span className="field-hint">Public registrations will automatically stop once this capacity is reached.</span>
              </div>

              <div className="settings-field">
                <label htmlFor="cfg-status-override">Registration Mode Override:</label>
                <select
                  id="cfg-status-override"
                  className="dialog-select"
                  value={formStatusOverride}
                  onChange={(e) => setFormStatusOverride(e.target.value as 'AUTO' | 'OPEN' | 'CLOSED' | 'PAUSED')}
                >
                  <option value="AUTO">AUTO (Calculated based on dates &amp; capacity)</option>
                  <option value="OPEN">FORCE OPEN (Override date limits)</option>
                  <option value="PAUSED">PAUSED (Temporarily freeze registrations)</option>
                  <option value="CLOSED">FORCE CLOSED (Halt all registrations)</option>
                </select>
              </div>

              <div className="settings-field">
                <label htmlFor="cfg-opening-time">Registration Opening Date &amp; Time:</label>
                <input
                  id="cfg-opening-time"
                  type="datetime-local"
                  className="dialog-input"
                  value={formOpeningTime}
                  onChange={(e) => setFormOpeningTime(e.target.value)}
                  required
                />
              </div>

              <div className="settings-field">
                <label htmlFor="cfg-closing-time">Registration Closing Date &amp; Time:</label>
                <input
                  id="cfg-closing-time"
                  type="datetime-local"
                  className="dialog-input"
                  value={formClosingTime}
                  onChange={(e) => setFormClosingTime(e.target.value)}
                  required
                />
              </div>

              <div className="settings-actions">
                <button type="button" className="btn-dialog-cancel" onClick={() => setShowSettingsModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-pharaoh-submit" disabled={actionInProgress}>
                  {actionInProgress ? 'Saving...' : 'Save & Enforce Settings'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Manual Add Team Modal ── */}
      {showAddTeamModal && (
        <div className="admin-modal-backdrop" onClick={() => setShowAddTeamModal(false)}>
          <div className="add-team-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-group">
                <h2 className="modal-title">ADD SQUAD MANUALLY (ADMIN ENTRY)</h2>
                <span className="modal-subtitle">Directly appends to Google Sheet1 with "Registration Source = ADMIN"</span>
              </div>
              <button type="button" className="btn-modal-close" onClick={() => setShowAddTeamModal(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleManualAddSubmit} className="manual-team-form">
              {/* Team Level Info */}
              <div className="manual-section-card">
                <h4 className="card-section-title">1. Team &amp; Payment Details</h4>
                <div className="form-grid-3">
                  <div className="dialog-field">
                    <label>Team Name *</label>
                    <input
                      type="text"
                      className="dialog-input"
                      value={manualForm.teamName}
                      onChange={(e) => setManualForm((p) => ({ ...p, teamName: e.target.value }))}
                      placeholder="e.g. Desert Titans"
                      required
                    />
                  </div>

                  <div className="dialog-field">
                    <label>Transaction ID / UTR</label>
                    <input
                      type="text"
                      className="dialog-input"
                      value={manualForm.transactionId}
                      onChange={(e) => setManualForm((p) => ({ ...p, transactionId: e.target.value }))}
                      placeholder="e.g. 20260929112233"
                    />
                  </div>

                  <div className="dialog-field">
                    <label>Payment Status</label>
                    <select
                      className="dialog-select"
                      value={manualForm.paymentStatus}
                      onChange={(e) => setManualForm((p) => ({ ...p, paymentStatus: e.target.value }))}
                    >
                      <option value="Verified">Verified / Confirmed</option>
                      <option value="Pending Verification">Pending Verification</option>
                    </select>
                  </div>
                </div>

                <div className="form-grid-2 mt-2">
                  <div className="dialog-field">
                    <label>Payment Amount (₹)</label>
                    <input
                      type="number"
                      className="dialog-input"
                      value={manualForm.paymentAmount}
                      onChange={(e) => setManualForm((p) => ({ ...p, paymentAmount: Number(e.target.value) || 1200 }))}
                    />
                  </div>

                  <div className="dialog-field">
                    <label>Payment Proof URL (Optional)</label>
                    <input
                      type="url"
                      className="dialog-input"
                      value={manualForm.paymentScreenshotUrl}
                      onChange={(e) => setManualForm((p) => ({ ...p, paymentScreenshotUrl: e.target.value }))}
                      placeholder="https://drive.google.com/..."
                    />
                  </div>
                </div>
              </div>

              {/* Members 1 to 4 */}
              <div className="manual-section-card">
                <h4 className="card-section-title">2. Squad Members (4 Required)</h4>
                <div className="manual-members-accordion">
                  {manualForm.members.map((m, idx) => (
                    <div key={idx} className="manual-member-box">
                      <div className="member-box-tag">
                        {idx === 0 ? 'TEAM LEADER (MEMBER 1)' : `EXPLORER ${idx + 1}`}
                      </div>
                      <div className="form-grid-3">
                        <div className="dialog-field">
                          <label>Full Name *</label>
                          <input
                            type="text"
                            className="dialog-input"
                            value={m.name}
                            onChange={(e) => handleManualMemberChange(idx, 'name', e.target.value)}
                            required
                          />
                        </div>
                        <div className="dialog-field">
                          <label>College Gmail *</label>
                          <input
                            type="email"
                            className="dialog-input"
                            value={m.collegeGmail}
                            onChange={(e) => handleManualMemberChange(idx, 'collegeGmail', e.target.value)}
                            placeholder="student@klu.ac.in"
                            required
                          />
                        </div>
                        <div className="dialog-field">
                          <label>Phone Number *</label>
                          <input
                            type="tel"
                            className="dialog-input"
                            value={m.phone}
                            onChange={(e) => handleManualMemberChange(idx, 'phone', e.target.value)}
                            required
                          />
                        </div>
                      </div>

                      <div className="form-grid-3 mt-2">
                        <div className="dialog-field">
                          <label>Reg Number *</label>
                          <input
                            type="text"
                            className="dialog-input"
                            value={m.regNo}
                            onChange={(e) => handleManualMemberChange(idx, 'regNo', e.target.value)}
                            required
                          />
                        </div>
                        <div className="dialog-field">
                          <label>Year *</label>
                          <input
                            type="text"
                            className="dialog-input"
                            value={m.year}
                            onChange={(e) => handleManualMemberChange(idx, 'year', e.target.value)}
                            placeholder="e.g. 2nd Year"
                            required
                          />
                        </div>
                        <div className="dialog-field">
                          <label>Department *</label>
                          <input
                            type="text"
                            className="dialog-input"
                            value={m.department}
                            onChange={(e) => handleManualMemberChange(idx, 'department', e.target.value)}
                            placeholder="e.g. AIML"
                            required
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="settings-actions">
                <button type="button" className="btn-dialog-cancel" onClick={() => setShowAddTeamModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-pharaoh-submit" disabled={actionInProgress}>
                  {actionInProgress ? 'Saving Squad...' : 'Add Team to Google Sheet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── KHEPRIX 2K26 REGISTRATION EXPORT MODAL ── */}
      {showExportModal && (
        <div
          className="admin-modal-backdrop"
          onClick={(e) => {
            if (e.target === e.currentTarget && !exportInProgress) {
              setShowExportModal(false)
            }
          }}
        >
          <div className="export-modal-card" role="dialog" aria-modal="true" aria-labelledby="export-modal-title">
            {/* Header */}
            <div className="modal-header export-modal-header">
              <div className="export-header-left">
                <div className="export-badge-row">
                  <span className="export-scarab-badge">𓆣</span>
                  <span className="export-badge-text">KHEPRIX 2K26 ARCHIVE SYSTEM</span>
                </div>
                <h3 className="modal-title export-modal-title" id="export-modal-title">
                  REGISTRATION EXPORT
                </h3>
                <p className="modal-subtitle">
                  Generate official spreadsheets and administrative multi-page PDF reports
                </p>
              </div>
              <button
                type="button"
                className="btn-modal-close"
                onClick={() => !exportInProgress && setShowExportModal(false)}
                disabled={exportInProgress}
                title="Close Export Dialog"
                aria-label="Close export dialog"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="modal-body export-modal-body">
              {/* 1. Export Mode Selection */}
              <div className="export-section">
                <div className="export-section-heading">
                  <Layers size={14} className="text-gold" />
                  <span>1. SELECT EXPORT MODE</span>
                </div>

                <div className="export-modes-grid">
                  {/* Mode A: EXPORT DATE RANGE */}
                  <button
                    type="button"
                    className={`export-mode-card ${exportMode === 'date-range' ? 'active' : ''}`}
                    onClick={() => setExportMode('date-range')}
                    disabled={exportInProgress}
                  >
                    <div className="mode-card-header">
                      <span className={`mode-radio ${exportMode === 'date-range' ? 'selected' : ''}`} />
                      <span className="mode-card-title">EXPORT DATE RANGE</span>
                    </div>
                    <p className="mode-card-desc">
                      Exports all registrations from the selected date range from Google Sheet1, ignoring current dashboard filters.
                    </p>
                  </button>

                  {/* Mode B: EXPORT CURRENT FILTERED RESULTS */}
                  <button
                    type="button"
                    className={`export-mode-card ${exportMode === 'current-filtered' ? 'active' : ''}`}
                    onClick={() => setExportMode('current-filtered')}
                    disabled={exportInProgress}
                  >
                    <div className="mode-card-header">
                      <span className={`mode-radio ${exportMode === 'current-filtered' ? 'selected' : ''}`} />
                      <span className="mode-card-title">EXPORT CURRENT FILTERED RESULTS</span>
                    </div>
                    <p className="mode-card-desc">
                      Exports only the {filteredRegistrations.length} registrations currently visible matching your active dashboard search and filters.
                    </p>
                  </button>
                </div>
              </div>

              {/* 2. Date Range Configuration (Active when Mode A is selected) */}
              {exportMode === 'date-range' && (
                <div className="export-section">
                  <div className="export-section-heading">
                    <Calendar size={14} className="text-gold" />
                    <span>2. CHOOSE DATE RANGE</span>
                  </div>

                  {/* Quick Preset Buttons */}
                  <div className="export-quick-presets">
                    <button
                      type="button"
                      className={`btn-export-preset ${exportPreset === 'today' ? 'active' : ''}`}
                      onClick={() => handleSelectExportPreset('today')}
                      disabled={exportInProgress}
                    >
                      TODAY
                    </button>
                    <button
                      type="button"
                      className={`btn-export-preset ${exportPreset === 'yesterday' ? 'active' : ''}`}
                      onClick={() => handleSelectExportPreset('yesterday')}
                      disabled={exportInProgress}
                    >
                      YESTERDAY
                    </button>
                    <button
                      type="button"
                      className={`btn-export-preset ${exportPreset === 'last7days' ? 'active' : ''}`}
                      onClick={() => handleSelectExportPreset('last7days')}
                      disabled={exportInProgress}
                    >
                      LAST 7 DAYS
                    </button>
                    <button
                      type="button"
                      className={`btn-export-preset ${exportPreset === 'thismonth' ? 'active' : ''}`}
                      onClick={() => handleSelectExportPreset('thismonth')}
                      disabled={exportInProgress}
                    >
                      THIS MONTH
                    </button>
                    <button
                      type="button"
                      className={`btn-export-preset ${exportPreset === 'all' ? 'active' : ''}`}
                      onClick={() => handleSelectExportPreset('all')}
                      disabled={exportInProgress}
                    >
                      ALL REGISTRATIONS
                    </button>
                  </div>

                  {/* Date Pickers */}
                  <div className="export-date-grid">
                    <div className="export-date-field">
                      <label htmlFor="export-from-date">FROM DATE</label>
                      <input
                        type="date"
                        id="export-from-date"
                        className="export-date-input"
                        value={exportFromDate}
                        onChange={(e) => {
                          setExportFromDate(e.target.value)
                          setExportPreset('custom')
                        }}
                        disabled={exportInProgress}
                      />
                    </div>

                    <div className="export-date-field">
                      <label htmlFor="export-to-date">TO DATE</label>
                      <input
                        type="date"
                        id="export-to-date"
                        className="export-date-input"
                        value={exportToDate}
                        onChange={(e) => {
                          setExportToDate(e.target.value)
                          setExportPreset('custom')
                        }}
                        disabled={exportInProgress}
                      />
                    </div>
                  </div>

                  {/* Selected Range Display */}
                  <div className="export-range-banner">
                    <span className="export-range-label">EXPORT RANGE</span>
                    <span className="export-range-value">
                      {formatFriendlyDate(exportFromDate)} → {formatFriendlyDate(exportToDate)}
                    </span>
                  </div>
                </div>
              )}

              {/* 2b. Filtered Summary Box (Active when Mode B is selected) */}
              {exportMode === 'current-filtered' && (
                <div className="export-section">
                  <div className="export-section-heading">
                    <Filter size={14} className="text-gold" />
                    <span>2. ACTIVE DASHBOARD FILTERS APPLIED</span>
                  </div>

                  <div className="export-active-filters-box">
                    <div className="active-filter-chips">
                      <span className="filter-chip">
                        <strong>Source:</strong> {sourceFilter.toUpperCase()}
                      </span>
                      <span className="filter-chip">
                        <strong>Status:</strong> {statusFilter.toUpperCase()}
                      </span>
                      <span className="filter-chip">
                        <strong>Payment:</strong> {paymentFilter.toUpperCase()}
                      </span>
                      {deptFilter !== 'all' && (
                        <span className="filter-chip">
                          <strong>Dept:</strong> {deptFilter}
                        </span>
                      )}
                      {yearFilter !== 'all' && (
                        <span className="filter-chip">
                          <strong>Year:</strong> {yearFilter}
                        </span>
                      )}
                      {searchQuery && (
                        <span className="filter-chip highlight">
                          <strong>Search:</strong> &quot;{searchQuery}&quot;
                        </span>
                      )}
                      {datePreset !== 'all' && (
                        <span className="filter-chip">
                          <strong>Date:</strong> {datePreset} {dateFilter ? `(${dateFilter})` : ''}
                        </span>
                      )}
                      <span className="filter-chip">
                        <strong>Sort:</strong> {sortOrder === 'newest' ? 'Newest First' : 'FCFS (Oldest First)'}
                      </span>
                    </div>

                    <p className="active-filters-note">
                      The export will faithfully output exactly the <strong>{filteredRegistrations.length} records</strong> matching your dashboard criteria above.
                    </p>
                  </div>
                </div>
              )}

              {/* 3. Export Preview & Summary */}
              <div className="export-section">
                <div className="export-section-heading">
                  <CheckCircle2 size={14} className="text-gold" />
                  <span>3. MATCHING DATASET PREVIEW</span>
                </div>

                {targetExportRegistrations.length > 0 ? (
                  <div className="export-summary-cards-grid">
                    <div className="export-summary-card">
                      <span className="summary-card-lbl">REGISTRATIONS</span>
                      <span className="summary-card-num text-gold">{targetExportRegistrations.length}</span>
                    </div>
                    <div className="export-summary-card">
                      <span className="summary-card-lbl">PARTICIPANTS</span>
                      <span className="summary-card-num text-white">{exportSummary.totalParticipants}</span>
                    </div>
                    <div className="export-summary-card">
                      <span className="summary-card-lbl">AMOUNT</span>
                      <span className="summary-card-num text-gold">₹{exportSummary.totalAmount}</span>
                    </div>
                    <div className="export-summary-card">
                      <span className="summary-card-lbl">CONFIRMED</span>
                      <span className="summary-card-num text-green">{exportSummary.confirmedCount}</span>
                    </div>
                    <div className="export-summary-card">
                      <span className="summary-card-lbl">PENDING</span>
                      <span className="summary-card-num text-yellow">{exportSummary.pendingCount}</span>
                    </div>
                    <div className="export-summary-card">
                      <span className="summary-card-lbl">BLOCKED</span>
                      <span className="summary-card-num text-red">{exportSummary.blockedCount}</span>
                    </div>
                  </div>
                ) : (
                  <div className="export-empty-state">
                    <AlertCircle size={28} className="export-empty-icon" />
                    <div className="export-empty-title">NO REGISTRATIONS FOUND</div>
                    <div className="export-empty-desc">FOR THE SELECTED DATE RANGE</div>
                    <p className="export-empty-tip">
                      {exportMode === 'date-range'
                        ? 'No registrations were recorded between the chosen From and To dates. Select a different date range or choose ALL REGISTRATIONS.'
                        : 'No registrations currently match your active dashboard search & filters. Clear or adjust your filters to view and export records.'}
                    </p>
                  </div>
                )}
              </div>

              {/* Progress State Banner */}
              {exportInProgress && (
                <div className="export-progress-banner">
                  <RefreshCw size={18} className="spinning text-gold" />
                  <div className="export-progress-info">
                    <strong className="export-progress-title">EXPORTING...</strong>
                    <span className="export-progress-subtitle">
                      {exportProgressText || `Preparing ${targetExportRegistrations.length} registrations`}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="modal-footer export-modal-footer">
              <button
                type="button"
                className="btn-dialog-cancel"
                onClick={() => setShowExportModal(false)}
                disabled={exportInProgress}
              >
                Close
              </button>

              <div className="export-download-actions">
                {/* Download Excel */}
                <button
                  type="button"
                  className="btn-export-download btn-export-excel"
                  onClick={handleExportExcel}
                  disabled={targetExportRegistrations.length === 0 || exportInProgress}
                  title={
                    targetExportRegistrations.length === 0
                      ? 'No registrations found to export'
                      : 'Download full 51-column Excel (.xlsx) file'
                  }
                  id="btn-download-excel"
                >
                  <FileSpreadsheet size={16} />
                  <span>DOWNLOAD EXCEL</span>
                </button>

                {/* Download PDF */}
                <button
                  type="button"
                  className="btn-export-download btn-export-pdf"
                  onClick={handleExportPdf}
                  disabled={targetExportRegistrations.length === 0 || exportInProgress}
                  title={
                    targetExportRegistrations.length === 0
                      ? 'No registrations found to export'
                      : 'Download official multi-page A4 Landscape PDF report'
                  }
                  id="btn-download-pdf"
                >
                  <FileDown size={16} />
                  <span>DOWNLOAD PDF</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
