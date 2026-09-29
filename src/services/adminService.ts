/**
 * KHEPRIX 2K26 — Admin Service
 * Reads registrations directly from Google Sheet via Google Apps Script Web App API
 * Single Source of Truth: Google Spreadsheet "KHEPRIX 2K26 — Registrations" -> Sheet1
 */

const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwzBchO29z8hOOhDExK8Od8voS3YVUZBO4HKKImvuO_5jOHFwcThmDLtFzfCuWHeuYA/exec';

export interface AdminMember {
  memberNumber: number;
  role: string;
  name: string;
  collegeGmail: string;
  phone: string;
  regNo: string;
  year: string;
  department: string;
  hostelName: string;
  roomNo: string;
  wardenName: string;
  wardenPhone: string;
}

export interface AdminRegistration {
  rowIndex: number;
  registrationId: string;
  timestamp: string;
  teamName: string;
  teamSize: string | number;
  totalAmount: string | number;
  paymentStatus: string;
  paymentScreenshotUrl: string;
  paymentScreenshotName: string;
  adminNotes: string;
  eventName: string;
  eventDate: string;
  eventTime: string;
  venue: string;
  status: 'ACTIVE' | 'BLOCKED';
  blockedAt?: string;
  blockedBy?: string;
  blockReason?: string;
  transactionId?: string;
  registrationSource?: 'PUBLIC' | 'ADMIN';
  members: AdminMember[];
  rawRecord: Record<string, string>;
  fcfsRank: number;
  fcfsDisplay: string;
}

export interface RegistrationSettings {
  allowed: boolean;
  calculatedStatus: 'OPEN' | 'CLOSED' | 'FULL' | 'NOT_OPEN' | 'PAUSED';
  statusOverride: 'AUTO' | 'OPEN' | 'CLOSED' | 'PAUSED';
  activeTeams: number;
  maxTeams: number;
  remainingSlots: number;
  openingTime: string;
  closingTime: string;
  reason?: string;
}

export interface AdminDashboardStats {
  totalRegistrations: number;
  totalTeams: number;
  activeTeamsCount: number;
  blockedTeamsCount: number;
  totalAmountCollected: number;
  pendingCount: number;
  confirmedCount: number;
  totalMembers: number;
  capacityMax: number;
  remainingSlots: number;
  calculatedStatus: string;
}

export interface FetchRegistrationsResult {
  registrations: AdminRegistration[];
  stats: AdminDashboardStats;
  settings: RegistrationSettings;
  headers: string[];
  lastFetchedAt: Date;
}

export interface AdminAddTeamPayload {
  teamName: string;
  teamSize?: number;
  transactionId?: string;
  paymentAmount?: number;
  paymentStatus?: string;
  paymentScreenshotUrl?: string;
  paymentScreenshotName?: string;
  adminNotes?: string;
  members: [
    AdminMember,
    AdminMember,
    AdminMember,
    AdminMember
  ];
}

/**
 * Retrieves the stored or environment admin secret key
 */
export const getStoredAdminSecret = (): string => {
  return (
    sessionStorage.getItem('kheprix_admin_secret') ||
    localStorage.getItem('kheprix_admin_secret') ||
    (import.meta.env.VITE_ADMIN_SECRET as string) ||
    'kheprix2k26_overseer_key'
  );
};

/**
 * Saves an admin secret key to browser storage for authenticated write actions
 */
export const setStoredAdminSecret = (secret: string): void => {
  sessionStorage.setItem('kheprix_admin_secret', secret);
  localStorage.setItem('kheprix_admin_secret', secret);
};

/**
 * Fetch registrations and live settings from Google Apps Script Web App
 */
export async function fetchAdminRegistrations(): Promise<FetchRegistrationsResult> {
  const url = `${APPS_SCRIPT_URL}?action=getRegistrations&t=${Date.now()}`;

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`API responded with HTTP status ${response.status} (${response.statusText})`);
    }

    const text = await response.text();
    let data: {
      success?: boolean;
      registrations?: AdminRegistration[];
      headers?: string[];
      settings?: RegistrationSettings;
      error?: string;
    };

    try {
      data = JSON.parse(text);
    } catch {
      throw new Error(`Failed to parse response JSON from Apps Script Web App: ${text.slice(0, 150)}`);
    }

    if (data.success === false) {
      throw new Error(data.error || 'Unknown error returned by Google Apps Script');
    }

    const rawList = Array.isArray(data.registrations) ? data.registrations : [];

    // Calculate FCFS ranking strictly based on Timestamp
    const sorted = [...rawList].sort((a, b) => {
      const timeA = new Date(a.timestamp).getTime();
      const timeB = new Date(b.timestamp).getTime();
      if (isNaN(timeA)) return 1;
      if (isNaN(timeB)) return -1;
      return timeA - timeB;
    });

    let activeRank = 1;
    const registrations: AdminRegistration[] = sorted.map((reg) => {
      const isBlocked = (reg.status || '').toUpperCase() === 'BLOCKED';
      return {
        ...reg,
        status: isBlocked ? 'BLOCKED' : 'ACTIVE',
        fcfsRank: isBlocked ? 999999 : activeRank,
        fcfsDisplay: isBlocked ? 'BLOCKED' : `#${activeRank++}`,
      };
    });

    // Calculate Stats
    let totalAmount = 0;
    let pendingCount = 0;
    let confirmedCount = 0;
    let totalMembers = 0;
    let activeTeamsCount = 0;
    let blockedTeamsCount = 0;

    for (const reg of registrations) {
      if (reg.status === 'BLOCKED') {
        blockedTeamsCount++;
      } else {
        activeTeamsCount++;
        const numAmount = typeof reg.totalAmount === 'number' 
          ? reg.totalAmount 
          : parseInt(String(reg.totalAmount).replace(/[^0-9]/g, ''), 10) || 1200;
        totalAmount += numAmount;

        const statusLower = (reg.paymentStatus || '').toLowerCase();
        if (statusLower.includes('confirm') || statusLower.includes('verified') || statusLower.includes('success')) {
          confirmedCount++;
        } else {
          pendingCount++;
        }

        totalMembers += (reg.members && reg.members.length) || 4;
      }
    }

    const defaultSettings: RegistrationSettings = {
      allowed: true,
      calculatedStatus: 'OPEN',
      statusOverride: 'AUTO',
      activeTeams: activeTeamsCount,
      maxTeams: 100,
      remainingSlots: Math.max(0, 100 - activeTeamsCount),
      openingTime: '2026-09-29T10:00:00+05:30',
      closingTime: '2026-10-02T09:00:00+05:30',
    };

    const settings: RegistrationSettings = data.settings || defaultSettings;

    const stats: AdminDashboardStats = {
      totalRegistrations: registrations.length,
      totalTeams: registrations.length,
      activeTeamsCount,
      blockedTeamsCount,
      totalAmountCollected: totalAmount,
      pendingCount,
      confirmedCount,
      totalMembers,
      capacityMax: settings.maxTeams,
      remainingSlots: settings.remainingSlots,
      calculatedStatus: settings.calculatedStatus,
    };

    return {
      registrations,
      stats,
      settings,
      headers: data.headers || [],
      lastFetchedAt: new Date(),
    };
  } catch (err) {
    console.error('Error fetching admin registrations from Apps Script:', err);
    throw err instanceof Error ? err : new Error(String(err));
  }
}

/**
 * Fetch registration settings for public page or admin panel
 */
export async function fetchRegistrationSettings(): Promise<RegistrationSettings> {
  const url = `${APPS_SCRIPT_URL}?action=getRegistrationAvailability&t=${Date.now()}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: { 'Accept': 'application/json' },
  });

  if (!response.ok) {
    throw new Error(`Failed to load registration settings: status ${response.status}`);
  }

  const data = await response.json();
  if (data.success === false) {
    throw new Error(data.error || 'Failed to retrieve settings');
  }

  if (data.settings) {
    return data.settings;
  }

  const maxTeams = data.maxTeams !== undefined ? Number(data.maxTeams) : 100;
  const activeTeams = data.registeredTeams !== undefined ? Number(data.registeredTeams) : 0;
  const remainingSlots = data.remainingSlots !== undefined ? Number(data.remainingSlots) : Math.max(0, maxTeams - activeTeams);

  return {
    allowed: data.allowed !== undefined ? Boolean(data.allowed) : true,
    calculatedStatus: data.status || 'OPEN',
    statusOverride: data.statusOverride || 'AUTO',
    activeTeams,
    maxTeams,
    remainingSlots,
    openingTime: data.openingTime || '2026-09-29T10:00:00+05:30',
    closingTime: data.closingTime || '2026-10-02T09:00:00+05:30',
    reason: data.reason,
  };
}

/**
 * Admin Action: Update Registration Settings (Limits, Timings, Status Override)
 */
export async function updateRegistrationSettings(
  settings: {
    maxTeams?: number;
    openingTime?: string;
    closingTime?: string;
    statusOverride?: 'AUTO' | 'OPEN' | 'CLOSED' | 'PAUSED';
  },
  adminSecret: string = getStoredAdminSecret()
): Promise<RegistrationSettings> {
  const payload = {
    action: 'updateSettings',
    adminSecret,
    ...settings,
  };

  const response = await fetch(APPS_SCRIPT_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(payload),
  });

  const data = await response.json();
  if (!data.success) {
    throw new Error(data.error || 'Failed to update registration settings');
  }

  return data.settings;
}

/**
 * Admin Action: Block a registration
 */
export async function blockRegistration(
  registrationId: string,
  reason: string,
  blockedBy = 'Overseer Admin',
  adminSecret: string = getStoredAdminSecret()
): Promise<void> {
  const payload = {
    action: 'blockRegistration',
    adminSecret,
    registrationId,
    reason,
    blockedBy,
  };

  const response = await fetch(APPS_SCRIPT_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(payload),
  });

  const data = await response.json();
  if (!data.success) {
    throw new Error(data.error || 'Failed to block registration');
  }
}

/**
 * Admin Action: Unblock a registration
 */
export async function unblockRegistration(
  registrationId: string,
  adminSecret: string = getStoredAdminSecret()
): Promise<void> {
  const payload = {
    action: 'unblockRegistration',
    adminSecret,
    registrationId,
  };

  const response = await fetch(APPS_SCRIPT_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(payload),
  });

  const data = await response.json();
  if (!data.success) {
    throw new Error(data.error || 'Failed to unblock registration');
  }
}

/**
 * Admin Action: Manually Add a Team to Sheet1
 */
export async function addTeamManually(
  payloadData: AdminAddTeamPayload,
  adminSecret: string = getStoredAdminSecret()
): Promise<{ registrationId: string }> {
  const payload = {
    action: 'addTeam',
    adminSecret,
    ...payloadData,
  };

  const response = await fetch(APPS_SCRIPT_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(payload),
  });

  const data = await response.json();
  if (!data.success) {
    throw new Error(data.error || 'Failed to add squad manually');
  }

  return { registrationId: data.registrationId };
}

/**
 * Admin Action: Update Payment Status & Transaction ID
 */
export async function updatePaymentStatus(
  registrationId: string,
  paymentStatus: string,
  transactionId?: string,
  adminNotes?: string,
  adminSecret: string = getStoredAdminSecret()
): Promise<void> {
  const payload = {
    action: 'updatePaymentStatus',
    adminSecret,
    registrationId,
    paymentStatus,
    transactionId,
    adminNotes,
  };

  const response = await fetch(APPS_SCRIPT_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(payload),
  });

  const data = await response.json();
  if (!data.success) {
    throw new Error(data.error || 'Failed to update payment status');
  }
}
