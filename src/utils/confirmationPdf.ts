/**
 * KHEPRIX 2K26 — Official Registration Confirmation Document Generator
 * Generates an Egyptian styled confirmation document / printable PDF voucher
 */

import type { AdminRegistration } from '../services/adminService'

export function generateConfirmationDocument(reg: AdminRegistration): void {
  const regId = reg.registrationId || 'KPX-CONFIRMED'
  const teamName = reg.teamName || 'Expedition Squad'
  const timestamp = reg.timestamp || new Date().toLocaleString('en-IN')
  const txnId = reg.transactionId || 'Not provided'

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>KHEPRIX 2K26 Confirmation - ${regId}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@600;700;800;900&family=Cinzel+Decorative:wght@700;900&family=Plus+Jakarta+Sans:wght@500;600;700;800&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Plus Jakarta Sans', sans-serif;
      background: #0d0703;
      color: #faeed4;
      padding: 30px 15px;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
    }
    .voucher-card {
      max-width: 800px;
      width: 100%;
      background: radial-gradient(circle at 50% 25%, #2a1507 0%, #150903 80%, #0d0502 100%);
      border: 3px solid #d49818;
      border-radius: 12px;
      padding: 36px 32px;
      box-shadow: 0 15px 50px rgba(0,0,0,0.9), inset 0 0 35px rgba(212, 152, 24, 0.15);
      position: relative;
    }
    .header-section {
      text-align: center;
      border-bottom: 2px solid rgba(212, 152, 24, 0.35);
      padding-bottom: 20px;
      margin-bottom: 22px;
      position: relative;
    }
    .badge-bar {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      font-family: 'Cinzel', serif;
      font-size: 11px;
      letter-spacing: 3px;
      color: #d49818;
      text-transform: uppercase;
      font-weight: 800;
      margin-bottom: 6px;
    }
    h1 {
      font-family: 'Cinzel Decorative', 'Cinzel', serif;
      font-size: 32px;
      color: #ffd875;
      letter-spacing: 3px;
      margin: 4px 0 8px;
      text-shadow: 0 2px 8px rgba(0,0,0,0.8);
    }
    .subtitle {
      font-family: 'Cinzel', serif;
      font-size: 13px;
      letter-spacing: 2px;
      color: #c7ad8d;
      text-transform: uppercase;
    }
    .id-banner {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: rgba(212, 152, 24, 0.08);
      border: 1px dashed #d49818;
      border-radius: 8px;
      padding: 12px 18px;
      margin-bottom: 20px;
    }
    .id-tag {
      font-size: 11px;
      letter-spacing: 1.5px;
      color: #a88d74;
      text-transform: uppercase;
      font-weight: 700;
    }
    .id-value {
      font-family: monospace;
      font-size: 18px;
      font-weight: 800;
      color: #ffd875;
      letter-spacing: 1.5px;
    }
    .fcfs-tag {
      background: #d49818;
      color: #120902;
      font-family: 'Cinzel', serif;
      font-size: 12px;
      font-weight: 900;
      padding: 3px 10px;
      border-radius: 20px;
      letter-spacing: 1px;
    }
    .meta-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 12px;
      margin-bottom: 24px;
      font-size: 12px;
    }
    .meta-cell {
      background: rgba(255, 255, 255, 0.03);
      border-left: 3px solid #d49818;
      border-radius: 6px;
      padding: 8px 12px;
    }
    .meta-cell .label {
      font-size: 10px;
      color: #a88d74;
      text-transform: uppercase;
      letter-spacing: 1px;
      font-weight: 700;
      margin-bottom: 3px;
    }
    .meta-cell .val {
      font-weight: 700;
      color: #f7e6c9;
      font-size: 13px;
    }
    .roster-heading {
      font-family: 'Cinzel', serif;
      font-size: 13px;
      letter-spacing: 2px;
      text-transform: uppercase;
      color: #ffd875;
      margin-bottom: 12px;
      padding-bottom: 6px;
      border-bottom: 1px solid rgba(212, 152, 24, 0.25);
    }
    .roster-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 12px;
      margin-bottom: 24px;
    }
    .roster-table th {
      background: #1c0e05;
      color: #ffd875;
      font-family: 'Cinzel', serif;
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 1px;
      padding: 8px 10px;
      text-align: left;
      border-bottom: 1px solid rgba(212, 152, 24, 0.3);
    }
    .roster-table td {
      padding: 8px 10px;
      border-bottom: 1px solid rgba(212, 152, 24, 0.1);
      color: #faeed4;
      font-size: 11.5px;
    }
    .role-badge {
      font-size: 9.5px;
      font-weight: 800;
      color: #d49818;
      text-transform: uppercase;
    }
    .footer-note {
      text-align: center;
      font-size: 11px;
      color: #8c735d;
      margin-top: 20px;
      border-top: 1px solid rgba(212, 152, 24, 0.2);
      padding-top: 14px;
      line-height: 1.5;
    }
    .action-row {
      display: flex;
      gap: 12px;
      margin-top: 22px;
    }
    .print-btn {
      flex: 1;
      padding: 12px 20px;
      background: linear-gradient(135deg, #fff6a8 0%, #f3be3a 50%, #946508 100%);
      color: #120902;
      border: none;
      border-radius: 6px;
      font-family: 'Cinzel', serif;
      font-size: 12px;
      font-weight: 900;
      letter-spacing: 2px;
      cursor: pointer;
      text-transform: uppercase;
      box-shadow: 0 4px 15px rgba(243, 190, 58, 0.4);
    }
    @media print {
      body { background: #fff !important; color: #000 !important; padding: 0 !important; }
      .voucher-card {
        border: 2px solid #222 !important;
        box-shadow: none !important;
        background: #fff !important;
        color: #000 !important;
        max-width: 100% !important;
        padding: 20px !important;
      }
      .meta-cell, .roster-table th, .roster-table td, .id-banner {
        background: #f9f9f9 !important;
        border-color: #999 !important;
        color: #000 !important;
      }
      .meta-cell .val, .id-value, h1, .roster-heading, .roster-table th { color: #000 !important; }
      .action-row { display: none !important; }
    }
  </style>
</head>
<body>
  <div class="voucher-card">
    <div class="header-section">
      <div class="badge-bar">𓆣 IEEE Computer Society KARE • Expedition Overseer 𓁹</div>
      <h1>KHEPRIX 2K26</h1>
      <p class="subtitle">Official Expedition Squad Confirmation Voucher</p>
    </div>

    <div class="id-banner">
      <div>
        <div class="id-tag">Registration Identifier</div>
        <div class="id-value">${regId}</div>
      </div>
      <div style="text-align: right;">
        <span class="fcfs-tag">${reg.fcfsDisplay || '#CONFIRMED'}</span>
        <div style="font-size: 10px; color: #a88d74; margin-top: 4px;">Registered: ${timestamp}</div>
      </div>
    </div>

    <div class="meta-grid">
      <div class="meta-cell">
        <div class="label">Team / Squad Name</div>
        <div class="val">${teamName}</div>
      </div>
      <div class="meta-cell">
        <div class="label">Squad Size</div>
        <div class="val">4 Explorers</div>
      </div>
      <div class="meta-cell">
        <div class="label">Payment Status</div>
        <div class="val" style="color: #4ade80;">${reg.paymentStatus || 'Verified'}</div>
      </div>
      <div class="meta-cell">
        <div class="label">Transaction ID / UTR</div>
        <div class="val" style="font-family: monospace;">${txnId}</div>
      </div>
      <div class="meta-cell">
        <div class="label">Date & Time</div>
        <div class="val">Oct 2, 2026 • 9:00 AM</div>
      </div>
      <div class="meta-cell">
        <div class="label">Venue Block</div>
        <div class="val">8 Block (8501 & 8601)</div>
      </div>
    </div>

    <div class="roster-heading">𓋹 Confirmed Squad Roster</div>
    <table class="roster-table">
      <thead>
        <tr>
          <th>Role</th>
          <th>Full Name</th>
          <th>College Gmail</th>
          <th>Phone</th>
          <th>Reg No</th>
          <th>Year & Dept</th>
        </tr>
      </thead>
      <tbody>
        ${reg.members.map((m, idx) => `
          <tr>
            <td><span class="role-badge">${idx === 0 ? 'Leader' : 'Explorer ' + (idx + 1)}</span></td>
            <td><strong>${m.name || '—'}</strong></td>
            <td>${m.collegeGmail || '—'}</td>
            <td>${m.phone || '—'}</td>
            <td><code>${m.regNo || '—'}</code></td>
            <td>${m.year || '—'} • ${m.department || '—'}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>

    <div class="footer-note">
      Please present this official voucher at the Expedition Reporting Desk on October 2nd, 2026 by 9:00 AM.<br>
      © 2026 KHEPRIX 2K26 • Kalasalingam Academy of Research and Education • IEEE Computer Society
    </div>

    <div class="action-row">
      <button class="print-btn" onclick="window.print()">PRINT / SAVE AS PDF</button>
    </div>
  </div>
</body>
</html>`

  const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `KHEPRIX_2K26_Confirmation_${regId}.html`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)

  // Also open in a new tab so user can immediately view and trigger browser Print to PDF
  const printWindow = window.open(url, '_blank')
  if (printWindow) {
    printWindow.addEventListener('load', () => {
      try {
        printWindow.print()
      } catch {}
    })
  }
}
