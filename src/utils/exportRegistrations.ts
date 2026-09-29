/**
 * KHEPRIX 2K26 — Admin Portal Registration Export System
 * Provides professional Excel (.xlsx) and multi-page A4 Landscape PDF reports.
 * Single source of truth: Google Sheet1 data already loaded in Admin Portal.
 */

import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import type { AdminRegistration } from '../services/adminService'

// ── Date Parsing & Normalization ──

/**
 * Safely parses any date/timestamp format from Google Sheets or API:
 * - ISO string: "2026-09-29T10:00:00+05:30"
 * - Indian / UK format: "29/09/2026 14:30:00", "29-09-2026", "29/09/2026, 2:30:00 pm"
 * - US format: "9/29/2026 2:30:00 PM"
 * - Standard: "2026-09-29 14:30:00"
 */
export function parseRegistrationDate(raw: string | undefined | null): Date | null {
  if (!raw) return null
  const str = String(raw).trim()
  if (!str) return null

  // 1. Check for standard DD/MM/YYYY or DD-MM-YYYY format
  const ddmmyyyyMatch = str.match(
    /^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})(?:[,\s]+(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?(?:\s*(am|pm))?)?/i
  )
  if (ddmmyyyyMatch) {
    const p1 = parseInt(ddmmyyyyMatch[1], 10)
    const p2 = parseInt(ddmmyyyyMatch[2], 10)
    const year = parseInt(ddmmyyyyMatch[3], 10)

    // In India/UK, first is day, second is month. If p1 > 12, p1 is definitely day.
    let day = p1
    let month = p2 - 1
    if (p1 <= 12 && p2 > 12) {
      // US format MM/DD/YYYY
      day = p2
      month = p1 - 1
    }

    let hours = ddmmyyyyMatch[4] ? parseInt(ddmmyyyyMatch[4], 10) : 0
    const minutes = ddmmyyyyMatch[5] ? parseInt(ddmmyyyyMatch[5], 10) : 0
    const seconds = ddmmyyyyMatch[6] ? parseInt(ddmmyyyyMatch[6], 10) : 0
    const ampm = ddmmyyyyMatch[7]?.toLowerCase()

    if (ampm === 'pm' && hours < 12) hours += 12
    if (ampm === 'am' && hours === 12) hours = 0

    const d = new Date(year, month, day, hours, minutes, seconds)
    if (!isNaN(d.getTime())) return d
  }

  // 2. Check for YYYY-MM-DD or YYYY/MM/DD
  const yyyymmddMatch = str.match(
    /^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})(?:[T\s]+(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?(?:\s*(am|pm))?)?/i
  )
  if (yyyymmddMatch) {
    const year = parseInt(yyyymmddMatch[1], 10)
    const month = parseInt(yyyymmddMatch[2], 10) - 1
    const day = parseInt(yyyymmddMatch[3], 10)
    let hours = yyyymmddMatch[4] ? parseInt(yyyymmddMatch[4], 10) : 0
    const minutes = yyyymmddMatch[5] ? parseInt(yyyymmddMatch[5], 10) : 0
    const seconds = yyyymmddMatch[6] ? parseInt(yyyymmddMatch[6], 10) : 0
    const ampm = yyyymmddMatch[7]?.toLowerCase()

    if (ampm === 'pm' && hours < 12) hours += 12
    if (ampm === 'am' && hours === 12) hours = 0

    const d = new Date(year, month, day, hours, minutes, seconds)
    if (!isNaN(d.getTime())) return d
  }

  // 3. Fallback to native parser
  const fallback = new Date(str)
  if (!isNaN(fallback.getTime())) {
    return fallback
  }

  return null
}

/**
 * Formats a Date object to YYYY-MM-DD string using local calendar
 */
export function formatDateToInputString(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/**
 * Formats a date string to friendly display: "29 Sep 2026"
 */
export function formatFriendlyDate(dateInput: string | Date | null | undefined): string {
  if (!dateInput) return '—'
  const d = typeof dateInput === 'string' ? parseRegistrationDate(dateInput) : dateInput
  if (!d || isNaN(d.getTime())) return String(dateInput)

  return d.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

/**
 * Formats date and time for document headers: "29 September 2026, 14:30"
 */
export function formatHeaderDateTime(date: Date): string {
  const datePart = date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
  const timePart = date.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
  return `${datePart}, ${timePart}`
}

/**
 * Filter registrations within an inclusive date range [fromDate 00:00:00, toDate 23:59:59]
 */
export function filterRegistrationsByDateRange(
  registrations: AdminRegistration[],
  fromDateStr: string,
  toDateStr: string
): AdminRegistration[] {
  if (!fromDateStr && !toDateStr) return [...registrations]

  let fromTime = -Infinity
  let toTime = Infinity

  if (fromDateStr) {
    const parts = fromDateStr.split('-').map(Number)
    if (parts.length === 3) {
      fromTime = new Date(parts[0], parts[1] - 1, parts[2], 0, 0, 0, 0).getTime()
    }
  }

  if (toDateStr) {
    const parts = toDateStr.split('-').map(Number)
    if (parts.length === 3) {
      toTime = new Date(parts[0], parts[1] - 1, parts[2], 23, 59, 59, 999).getTime()
    }
  }

  return registrations.filter((reg) => {
    const d = parseRegistrationDate(reg.timestamp)
    if (!d) return false
    const time = d.getTime()
    return time >= fromTime && time <= toTime
  })
}

/**
 * Computes quick preset date bounds
 */
export function getPresetDateRange(
  preset: 'today' | 'yesterday' | 'last7days' | 'thismonth' | 'all',
  registrations?: AdminRegistration[]
): { fromDate: string; toDate: string } {
  const now = new Date()
  const todayStr = formatDateToInputString(now)

  switch (preset) {
    case 'today':
      return { fromDate: todayStr, toDate: todayStr }

    case 'yesterday': {
      const yesterday = new Date(now)
      yesterday.setDate(yesterday.getDate() - 1)
      const yStr = formatDateToInputString(yesterday)
      return { fromDate: yStr, toDate: yStr }
    }

    case 'last7days': {
      const past7 = new Date(now)
      past7.setDate(past7.getDate() - 6)
      return { fromDate: formatDateToInputString(past7), toDate: todayStr }
    }

    case 'thismonth': {
      const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      return { fromDate: formatDateToInputString(firstOfMonth), toDate: todayStr }
    }

    case 'all': {
      if (registrations && registrations.length > 0) {
        let minTime = Infinity
        let maxTime = -Infinity
        for (const reg of registrations) {
          const d = parseRegistrationDate(reg.timestamp)
          if (d && !isNaN(d.getTime())) {
            const t = d.getTime()
            if (t < minTime) minTime = t
            if (t > maxTime) maxTime = t
          }
        }
        if (minTime !== Infinity && maxTime !== -Infinity) {
          return {
            fromDate: formatDateToInputString(new Date(minTime)),
            toDate: formatDateToInputString(new Date(maxTime)),
          }
        }
      }
      return { fromDate: '2026-09-01', toDate: todayStr }
    }
  }
}

/**
 * Resolves safe YYYY-MM-DD bounds for filenames and headers
 */
export function resolveDateRangeForFilename(
  registrations: AdminRegistration[],
  fromDateStr: string,
  toDateStr: string
): { from: string; to: string } {
  let from = fromDateStr
  let to = toDateStr
  const nowStr = formatDateToInputString(new Date())

  if (!from || from === 'Start' || from === 'Filtered') {
    let minTime = Infinity
    for (const r of registrations) {
      const d = parseRegistrationDate(r.timestamp)
      if (d && d.getTime() < minTime) minTime = d.getTime()
    }
    from = minTime !== Infinity ? formatDateToInputString(new Date(minTime)) : nowStr
  }

  if (!to || to === 'End' || to === 'Export') {
    let maxTime = -Infinity
    for (const r of registrations) {
      const d = parseRegistrationDate(r.timestamp)
      if (d && d.getTime() > maxTime) maxTime = d.getTime()
    }
    to = maxTime !== -Infinity ? formatDateToInputString(new Date(maxTime)) : nowStr
  }

  return { from, to }
}

// ── Summary Metrics Computation ──

export interface ExportSummaryStats {
  totalRegistrations: number
  totalParticipants: number
  totalAmount: number
  confirmedCount: number
  pendingCount: number
  blockedCount: number
  publicRegistrations: number
  adminRegistrations: number
}

export function computeExportSummaryStats(registrations: AdminRegistration[]): ExportSummaryStats {
  let totalParticipants = 0
  let totalAmount = 0
  let confirmedCount = 0
  let pendingCount = 0
  let blockedCount = 0
  let publicRegistrations = 0
  let adminRegistrations = 0

  for (const reg of registrations) {
    const isBlocked = reg.status === 'BLOCKED'
    if (isBlocked) {
      blockedCount++
    }

    // Participants count (squad size)
    const membersLen = reg.members && reg.members.length ? reg.members.length : 4
    totalParticipants += membersLen

    // Amount collected
    const numAmount =
      typeof reg.totalAmount === 'number'
        ? reg.totalAmount
        : parseInt(String(reg.totalAmount || '0').replace(/[^0-9]/g, ''), 10) || 0
    totalAmount += numAmount

    // Payment status
    const statusLower = (reg.paymentStatus || '').toLowerCase()
    if (
      statusLower.includes('confirm') ||
      statusLower.includes('verified') ||
      statusLower.includes('success')
    ) {
      confirmedCount++
    } else {
      pendingCount++
    }

    // Source
    const src = (reg.registrationSource || 'PUBLIC').toUpperCase()
    if (src === 'ADMIN') {
      adminRegistrations++
    } else {
      publicRegistrations++
    }
  }

  return {
    totalRegistrations: registrations.length,
    totalParticipants,
    totalAmount,
    confirmedCount,
    pendingCount,
    blockedCount,
    publicRegistrations,
    adminRegistrations,
  }
}

// ── Excel Export (.xlsx) ──

/**
 * Generates and downloads a clean, professional .xlsx spreadsheet matching all 51 requested columns
 */
export async function exportRegistrationsToExcel(
  registrations: AdminRegistration[],
  fromDateStr: string,
  toDateStr: string
): Promise<boolean> {
  if (!registrations || registrations.length === 0) {
    return false
  }

  // Exact 51 headers as required by specification
  const headers = [
    'FCFS Position',
    'Registration ID',
    'Timestamp',
    'Team Name',
    'Team Size',
    'Total Amount',
    'Payment Status',
    'Transaction ID',
    'Registration Source',
    'Status',
    'Payment Screenshot URL',

    'Member 1 Name',
    'Member 1 College Gmail',
    'Member 1 Phone',
    'Member 1 Registration Number',
    'Member 1 Year',
    'Member 1 Department',
    'Member 1 Hostel',
    'Member 1 Room Number',
    'Member 1 Warden',
    'Member 1 Warden Phone',

    'Member 2 Name',
    'Member 2 College Gmail',
    'Member 2 Phone',
    'Member 2 Registration Number',
    'Member 2 Year',
    'Member 2 Department',
    'Member 2 Hostel',
    'Member 2 Room Number',
    'Member 2 Warden',
    'Member 2 Warden Phone',

    'Member 3 Name',
    'Member 3 College Gmail',
    'Member 3 Phone',
    'Member 3 Registration Number',
    'Member 3 Year',
    'Member 3 Department',
    'Member 3 Hostel',
    'Member 3 Room Number',
    'Member 3 Warden',
    'Member 3 Warden Phone',

    'Member 4 Name',
    'Member 4 College Gmail',
    'Member 4 Phone',
    'Member 4 Registration Number',
    'Member 4 Year',
    'Member 4 Department',
    'Member 4 Hostel',
    'Member 4 Room Number',
    'Member 4 Warden',
    'Member 4 Warden Phone',
  ]

  const rows: (string | number)[][] = [headers]

  for (const reg of registrations) {
    const m1 = reg.members?.[0]
    const m2 = reg.members?.[1]
    const m3 = reg.members?.[2]
    const m4 = reg.members?.[3]

    const numAmount =
      typeof reg.totalAmount === 'number'
        ? reg.totalAmount
        : parseInt(String(reg.totalAmount || '0').replace(/[^0-9]/g, ''), 10) || 1200

    const teamSize =
      typeof reg.teamSize === 'number'
        ? reg.teamSize
        : parseInt(String(reg.teamSize || '4').replace(/[^0-9]/g, ''), 10) || 4

    const row: (string | number)[] = [
      reg.fcfsDisplay || (reg.fcfsRank ? `#${reg.fcfsRank}` : '#—'),
      reg.registrationId || '',
      reg.timestamp || '',
      reg.teamName || '',
      teamSize,
      numAmount,
      reg.paymentStatus || 'Pending Verification',
      reg.transactionId || 'None',
      reg.registrationSource || 'PUBLIC',
      reg.status || 'ACTIVE',
      reg.paymentScreenshotUrl || '',

      // Member 1
      m1?.name || '',
      m1?.collegeGmail || '',
      m1?.phone || '',
      m1?.regNo || '',
      m1?.year || '',
      m1?.department || '',
      m1?.hostelName || '',
      m1?.roomNo || '',
      m1?.wardenName || '',
      m1?.wardenPhone || '',

      // Member 2
      m2?.name || '',
      m2?.collegeGmail || '',
      m2?.phone || '',
      m2?.regNo || '',
      m2?.year || '',
      m2?.department || '',
      m2?.hostelName || '',
      m2?.roomNo || '',
      m2?.wardenName || '',
      m2?.wardenPhone || '',

      // Member 3
      m3?.name || '',
      m3?.collegeGmail || '',
      m3?.phone || '',
      m3?.regNo || '',
      m3?.year || '',
      m3?.department || '',
      m3?.hostelName || '',
      m3?.roomNo || '',
      m3?.wardenName || '',
      m3?.wardenPhone || '',

      // Member 4
      m4?.name || '',
      m4?.collegeGmail || '',
      m4?.phone || '',
      m4?.regNo || '',
      m4?.year || '',
      m4?.department || '',
      m4?.hostelName || '',
      m4?.roomNo || '',
      m4?.wardenName || '',
      m4?.wardenPhone || '',
    ]

    rows.push(row)
  }

  // Create Workbook and Sheet
  const wb = XLSX.utils.book_new()
  const ws = XLSX.utils.aoa_to_sheet(rows)

  // Configure column widths for readability
  const colWidths = [
    { wch: 14 }, // FCFS Position
    { wch: 22 }, // Registration ID
    { wch: 22 }, // Timestamp
    { wch: 26 }, // Team Name
    { wch: 11 }, // Team Size
    { wch: 14 }, // Total Amount
    { wch: 18 }, // Payment Status
    { wch: 24 }, // Transaction ID
    { wch: 18 }, // Registration Source
    { wch: 12 }, // Status
    { wch: 34 }, // Screenshot URL

    // Member 1
    { wch: 22 }, { wch: 30 }, { wch: 15 }, { wch: 16 }, { wch: 10 }, { wch: 16 }, { wch: 16 }, { wch: 12 }, { wch: 20 }, { wch: 16 },
    // Member 2
    { wch: 22 }, { wch: 30 }, { wch: 15 }, { wch: 16 }, { wch: 10 }, { wch: 16 }, { wch: 16 }, { wch: 12 }, { wch: 20 }, { wch: 16 },
    // Member 3
    { wch: 22 }, { wch: 30 }, { wch: 15 }, { wch: 16 }, { wch: 10 }, { wch: 16 }, { wch: 16 }, { wch: 12 }, { wch: 20 }, { wch: 16 },
    // Member 4
    { wch: 22 }, { wch: 30 }, { wch: 15 }, { wch: 16 }, { wch: 10 }, { wch: 16 }, { wch: 16 }, { wch: 12 }, { wch: 20 }, { wch: 16 },
  ]
  ws['!cols'] = colWidths

  // Freeze top header row so scrolling keeps headers visible
  ws['!views'] = [{ state: 'frozen', ySplit: 1 }]

  // Enable AutoFilter on header row
  const endColLetters = 'AY' // 51st column (A=1 ... AY=51)
  ws['!autofilter'] = { ref: `A1:${endColLetters}${rows.length}` }

  // Append sheet
  XLSX.utils.book_append_sheet(wb, ws, 'Registrations')

  // Generate filename format: KHEPRIX_2K26_Registrations_YYYY-MM-DD_to_YYYY-MM-DD.xlsx
  const { from: resolvedFrom, to: resolvedTo } = resolveDateRangeForFilename(
    registrations,
    fromDateStr,
    toDateStr
  )
  const fileName = `KHEPRIX_2K26_Registrations_${resolvedFrom}_to_${resolvedTo}.xlsx`

  // Trigger file download
  XLSX.writeFile(wb, fileName)
  return true
}

// ── Multi-Page PDF Export Report (A4 Landscape) ──

/**
 * Generates an Egyptian themed, multi-page administrative PDF report
 */
export async function exportRegistrationsToPdf(
  registrations: AdminRegistration[],
  fromDateStr: string,
  toDateStr: string
): Promise<boolean> {
  if (!registrations || registrations.length === 0) {
    return false
  }

  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  })

  const pageWidth = doc.internal.pageSize.getWidth() // 297 mm
  const pageHeight = doc.internal.pageSize.getHeight() // 210 mm
  const marginX = 14
  const contentWidth = pageWidth - marginX * 2 // 269 mm

  // Summary Metrics
  const summary = computeExportSummaryStats(registrations)

  // Report Period and Generation Timestamps
  const { from: resolvedFrom, to: resolvedTo } = resolveDateRangeForFilename(
    registrations,
    fromDateStr,
    toDateStr
  )
  const fromLabel = formatFriendlyDate(resolvedFrom)
  const toLabel = formatFriendlyDate(resolvedTo)
  const periodText = `${fromLabel} → ${toLabel}`
  const generatedText = formatHeaderDateTime(new Date())

  // Egyptian Theme Colors
  const darkObsidian = [14, 8, 4] as [number, number, number]
  const cardBg = [22, 13, 7] as [number, number, number]
  const goldPrimary = [212, 152, 24] as [number, number, number]
  const goldBright = [255, 216, 117] as [number, number, number]
  const textMuted = [190, 165, 140] as [number, number, number]
  const textWhite = [255, 255, 255] as [number, number, number]

  // 1. Draw Page 1 Top Header
  doc.setFillColor(...darkObsidian)
  doc.roundedRect(marginX, 10, contentWidth, 24, 2, 2, 'F')

  // Gold border around header banner
  doc.setDrawColor(...goldPrimary)
  doc.setLineWidth(0.6)
  doc.roundedRect(marginX, 10, contentWidth, 24, 2, 2, 'S')

  // Top scarab & title
  doc.setTextColor(...goldBright)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(15)
  doc.text('KHEPRIX 2K26', marginX + 6, 19)

  doc.setFontSize(9)
  doc.setTextColor(...textWhite)
  doc.text('ADMINISTRATION REGISTRATION REPORT', marginX + 6, 26)

  // Right side of Header: Period & Generated Time
  doc.setFontSize(8)
  doc.setTextColor(...goldPrimary)
  doc.text('REPORT PERIOD', pageWidth - marginX - 6, 17, { align: 'right' })

  doc.setTextColor(...textWhite)
  doc.setFont('helvetica', 'normal')
  doc.text(periodText, pageWidth - marginX - 6, 22, { align: 'right' })

  doc.setFontSize(7.5)
  doc.setTextColor(...textMuted)
  doc.text(`GENERATED: ${generatedText}`, pageWidth - marginX - 6, 28, { align: 'right' })

  // 2. Summary Cards (8 cards in 1 row across 269mm content width)
  const cardY = 38
  const cardHeight = 16
  const numCards = 8
  const cardGap = 3
  const cardWidth = (contentWidth - cardGap * (numCards - 1)) / numCards

  const cardsData = [
    { label: 'TOTAL REGISTRATIONS', val: String(summary.totalRegistrations), color: goldBright },
    { label: 'TOTAL PARTICIPANTS', val: String(summary.totalParticipants), color: textWhite },
    { label: 'TOTAL AMOUNT', val: `Rs. ${summary.totalAmount}`, color: goldBright },
    { label: 'CONFIRMED', val: String(summary.confirmedCount), color: [74, 222, 128] as [number, number, number] },
    { label: 'PENDING', val: String(summary.pendingCount), color: [251, 191, 36] as [number, number, number] },
    { label: 'BLOCKED', val: String(summary.blockedCount), color: [248, 113, 113] as [number, number, number] },
    { label: 'PUBLIC REG.', val: String(summary.publicRegistrations), color: textWhite },
    { label: 'ADMIN REG.', val: String(summary.adminRegistrations), color: goldBright },
  ]

  cardsData.forEach((c, idx) => {
    const x = marginX + idx * (cardWidth + cardGap)

    // Card background
    doc.setFillColor(...cardBg)
    doc.roundedRect(x, cardY, cardWidth, cardHeight, 1.5, 1.5, 'F')

    // Card border
    doc.setDrawColor(...goldPrimary)
    doc.setLineWidth(0.25)
    doc.roundedRect(x, cardY, cardWidth, cardHeight, 1.5, 1.5, 'S')

    // Card label
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(5.5)
    doc.setTextColor(...textMuted)
    doc.text(c.label, x + cardWidth / 2, cardY + 5.5, { align: 'center' })

    // Card value
    doc.setFontSize(8.5)
    doc.setTextColor(...c.color)
    doc.text(c.val, x + cardWidth / 2, cardY + 12.5, { align: 'center' })
  })

  // 3. Registration Table
  // Columns: #, FCFS, REGISTRATION ID, TIMESTAMP, TEAM, LEADER, TEAM SIZE, AMOUNT, PAYMENT, TRANSACTION ID, SOURCE, STATUS
  const tableHeaders = [
    '#',
    'FCFS',
    'REGISTRATION ID',
    'TIMESTAMP',
    'TEAM',
    'LEADER',
    'SIZE',
    'AMOUNT',
    'PAYMENT',
    'TRANSACTION ID',
    'SOURCE',
    'STATUS',
  ]

  const tableRows = registrations.map((reg, idx) => {
    const leader = reg.members?.[0]?.name || '—'
    const leaderPhone = reg.members?.[0]?.phone ? `\n${reg.members[0].phone}` : ''
    const amountVal =
      typeof reg.totalAmount === 'number'
        ? `Rs.${reg.totalAmount}`
        : String(reg.totalAmount || 'Rs.1200')

    const shortTime = reg.timestamp ? reg.timestamp.replace('T', ' ').slice(0, 19) : '—'

    return [
      String(idx + 1),
      reg.fcfsDisplay || (reg.fcfsRank ? `#${reg.fcfsRank}` : '#—'),
      reg.registrationId || '—',
      shortTime,
      reg.teamName || '—',
      `${leader}${leaderPhone}`,
      String(reg.teamSize || 4),
      amountVal,
      reg.paymentStatus || 'Pending',
      reg.transactionId || 'None',
      reg.registrationSource || 'PUBLIC',
      reg.status || 'ACTIVE',
    ]
  })

  autoTable(doc, {
    startY: cardY + cardHeight + 5,
    margin: { left: marginX, right: marginX, bottom: 15 },
    head: [tableHeaders],
    body: tableRows,
    theme: 'grid',
    styles: {
      font: 'helvetica',
      fontSize: 7.2,
      cellPadding: 2,
      textColor: [30, 20, 10],
      lineColor: [212, 175, 120],
      lineWidth: 0.15,
      valign: 'middle',
    },
    headStyles: {
      fillColor: [18, 10, 5],
      textColor: [255, 216, 117],
      fontStyle: 'bold',
      fontSize: 7,
      lineWidth: 0.3,
      lineColor: [212, 152, 24],
      halign: 'center',
    },
    alternateRowStyles: {
      fillColor: [252, 248, 240],
    },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' }, // #
      1: { cellWidth: 15, halign: 'center', fontStyle: 'bold' }, // FCFS
      2: { cellWidth: 26, fontStyle: 'bold' }, // REG ID
      3: { cellWidth: 30, fontSize: 6.8 }, // TIMESTAMP
      4: { cellWidth: 34, fontStyle: 'bold' }, // TEAM
      5: { cellWidth: 32 }, // LEADER
      6: { cellWidth: 12, halign: 'center' }, // SIZE
      7: { cellWidth: 17, halign: 'right' }, // AMOUNT
      8: { cellWidth: 22, halign: 'center' }, // PAYMENT
      9: { cellWidth: 31, fontSize: 6.5 }, // TXN ID
      10: { cellWidth: 17, halign: 'center' }, // SOURCE
      11: { cellWidth: 25, halign: 'center', fontStyle: 'bold' }, // STATUS
    },
    didParseCell: (data) => {
      // Color-code payment and status cells
      if (data.section === 'body') {
        const rowData = data.row.raw as string[]
        const paymentVal = (rowData[8] || '').toLowerCase()
        const statusVal = (rowData[11] || '').toUpperCase()

        // Payment column
        if (data.column.index === 8) {
          if (
            paymentVal.includes('confirm') ||
            paymentVal.includes('verified') ||
            paymentVal.includes('success')
          ) {
            data.cell.styles.textColor = [16, 140, 60]
            data.cell.styles.fontStyle = 'bold'
          } else {
            data.cell.styles.textColor = [190, 110, 10]
          }
        }

        // Status column
        if (data.column.index === 11) {
          if (statusVal === 'BLOCKED') {
            data.cell.styles.textColor = [220, 38, 38]
          } else {
            data.cell.styles.textColor = [16, 120, 50]
          }
        }
      }
    },
  })

  // 4. Add Page Numbers & Footer to Every Page
  const totalPages = typeof doc.getNumberOfPages === 'function' ? doc.getNumberOfPages() : (doc.internal.pages.length - 1)

  for (let page = 1; page <= totalPages; page++) {
    doc.setPage(page)

    // Subtle gold divider above footer
    doc.setDrawColor(...goldPrimary)
    doc.setLineWidth(0.2)
    doc.line(marginX, pageHeight - 10, pageWidth - marginX, pageHeight - 10)

    // Footer text
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7.5)
    doc.setTextColor(...darkObsidian)
    doc.text(
      'KHEPRIX 2K26 • Official Administrative Report',
      marginX,
      pageHeight - 6
    )

    doc.setFont('helvetica', 'bold')
    doc.text(
      `Page ${page} of ${totalPages}`,
      pageWidth - marginX,
      pageHeight - 6,
      { align: 'right' }
    )
  }

  // Generate filename: KHEPRIX_2K26_Registrations_YYYY-MM-DD_to_YYYY-MM-DD.pdf
  const fileName = `KHEPRIX_2K26_Registrations_${resolvedFrom}_to_${resolvedTo}.pdf`

  doc.save(fileName)
  return true
}
