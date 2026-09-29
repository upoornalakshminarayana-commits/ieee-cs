/**
 * ==============================================================================
 * KHEPRIX 2K26 — Expedition Registration & Payment Processor + Admin Control
 * Google Apps Script Web App Endpoint
 * ==============================================================================
 * 
 * Target Sheet Name:  "Sheet1" (Single Source of Truth)
 * Drive Folder Name:  "KHEPRIX 2K26 — Payment Screenshots"
 * Response format:    JSON { "success": true, ... }
 * 
 * ARCHITECTURE:
 * Admin Portal / Public Website
 *       ↓ (REST GET / POST via Web App)
 * Google Apps Script Web App
 *       ↓ (SpreadsheetApp bound to sheet)
 * Google Spreadsheet: "KHEPRIX 2K26 — Registrations" → Sheet1
 */

// Configuration Constants
var CONFIG = {
  SHEET_NAME: "Sheet1",
  DRIVE_FOLDER_NAME: "KHEPRIX 2K26 — Payment Screenshots",
  EVENT_ID: "kheprix-2k26",
  EVENT_NAME: "KHEPRIX 2K26",
  EVENT_DATE: "02 October 2026",
  EVENT_TIME: "9:00 AM - 5:00 PM",
  VENUE: "8 Block",
  TEAM_SIZE: 4,
  AMOUNT_PER_PERSON: 300,
  TOTAL_AMOUNT: 1200,
  PAYMENT_STATUS: "Pending Verification",
  TIMEZONE: "GMT+05:30",
  DEFAULT_ADMIN_SECRET: "kheprix2k26_overseer_key"
};

// 55 Core Column Headers (Initial mapping; dynamic column indexing used for safety)
var HEADERS = [
  "Registration ID",
  "Timestamp",
  "Event ID",
  "Event Name",
  "Event Date",
  "Event Time",
  "Venue",
  "Team Size",
  "Amount Per Person",
  "Total Amount",
  "Team Name",

  // Member 1 (Leader)
  "Member 1 Name",
  "Member 1 College Gmail",
  "Member 1 Phone",
  "Member 1 Registration No",
  "Member 1 Year",
  "Member 1 Department",
  "Member 1 Hostel",
  "Member 1 Room No",
  "Member 1 Warden",
  "Member 1 Warden Phone",

  // Member 2
  "Member 2 Name",
  "Member 2 College Gmail",
  "Member 2 Phone",
  "Member 2 Registration No",
  "Member 2 Year",
  "Member 2 Department",
  "Member 2 Hostel",
  "Member 2 Room No",
  "Member 2 Warden",
  "Member 2 Warden Phone",

  // Member 3
  "Member 3 Name",
  "Member 3 College Gmail",
  "Member 3 Phone",
  "Member 3 Registration No",
  "Member 3 Year",
  "Member 3 Department",
  "Member 3 Hostel",
  "Member 3 Room No",
  "Member 3 Warden",
  "Member 3 Warden Phone",

  // Member 4
  "Member 4 Name",
  "Member 4 College Gmail",
  "Member 4 Phone",
  "Member 4 Registration No",
  "Member 4 Year",
  "Member 4 Department",
  "Member 4 Hostel",
  "Member 4 Room No",
  "Member 4 Warden",
  "Member 4 Warden Phone",

  // Payment & Admin
  "Payment Screenshot Name",
  "Payment Screenshot URL",
  "Payment Status",
  "Admin Notes",

  // Extended Admin Control Columns
  "Status",
  "Blocked At",
  "Blocked By",
  "Block Reason",
  "Transaction ID",
  "Registration Source"
];

// ==============================================================================
// 1. ADMIN AUTHORIZATION & SETTINGS HELPERS
// ==============================================================================

/**
 * Validates the admin secret provided in request against PropertiesService
 */
function verifyAdminAuth(secret) {
  var props = PropertiesService.getScriptProperties();
  var storedSecret = props.getProperty("ADMIN_SECRET") || CONFIG.DEFAULT_ADMIN_SECRET;
  
  if (!secret || secret.toString().trim() !== storedSecret.toString().trim()) {
    throw new Error("Unauthorized: Invalid Admin Secret key.");
  }
  return true;
}

/**
 * Loads registration settings from PropertiesService with sensible defaults
 */
function getSettingsFromProperties() {
  var props = PropertiesService.getScriptProperties();
  var maxTeams = parseInt(props.getProperty("REG_MAX_TEAMS") || "100", 10);
  if (isNaN(maxTeams) || maxTeams <= 0) maxTeams = 100;

  var openingTime = props.getProperty("REG_OPENING_TIME") || "2026-09-29T10:00:00+05:30";
  var closingTime = props.getProperty("REG_CLOSING_TIME") || "2026-10-02T09:00:00+05:30";
  var statusOverride = (props.getProperty("REG_STATUS_OVERRIDE") || "AUTO").toUpperCase();

  return {
    maxTeams: maxTeams,
    openingTime: openingTime,
    closingTime: closingTime,
    statusOverride: statusOverride
  };
}

/**
 * Evaluates current registration availability and server-side limit rules
 */
function checkRegistrationAvailability() {
  var settings = getSettingsFromProperties();
  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = spreadsheet.getSheetByName(CONFIG.SHEET_NAME) || spreadsheet.getSheets()[0];
  
  var activeTeams = 0;
  var totalRows = sheet.getLastRow();

  if (totalRows >= 2) {
    var range = sheet.getRange(1, 1, totalRows, sheet.getLastColumn()).getValues();
    var headers = range[0];
    var statusColIdx = -1;

    for (var c = 0; c < headers.length; c++) {
      if (headers[c].toString().trim().toLowerCase() === "status") {
        statusColIdx = c;
        break;
      }
    }

    for (var r = 1; r < range.length; r++) {
      var row = range[r];
      var hasData = row.some(function(cell) { return cell !== "" && cell !== null && cell !== undefined; });
      if (!hasData) continue;

      var statusVal = statusColIdx >= 0 ? (row[statusColIdx] || "").toString().trim().toUpperCase() : "ACTIVE";
      if (statusVal !== "BLOCKED") {
        activeTeams++;
      }
    }
  }

  var now = new Date();
  var openDate = new Date(settings.openingTime);
  var closeDate = new Date(settings.closingTime);

  var calculatedStatus = "OPEN";
  var allowed = true;
  var reason = "";

  if (settings.statusOverride === "PAUSED") {
    calculatedStatus = "PAUSED";
    allowed = false;
    reason = "Registrations are temporarily paused by administration.";
  } else if (settings.statusOverride === "CLOSED") {
    calculatedStatus = "CLOSED";
    allowed = false;
    reason = "Registrations are currently closed.";
  } else if (!isNaN(openDate.getTime()) && now < openDate) {
    calculatedStatus = "NOT_OPEN";
    allowed = false;
    reason = "Registration has not opened yet. Opening on: " + Utilities.formatDate(openDate, CONFIG.TIMEZONE, "dd MMM yyyy, hh:mm a");
  } else if (!isNaN(closeDate.getTime()) && now > closeDate) {
    calculatedStatus = "CLOSED";
    allowed = false;
    reason = "Registrations are closed (Event deadline passed).";
  } else if (activeTeams >= settings.maxTeams) {
    calculatedStatus = "FULL";
    allowed = false;
    reason = "Registration capacity has been reached (" + settings.maxTeams + " teams limit).";
  }

  var remainingSlots = Math.max(0, settings.maxTeams - activeTeams);

  return {
    allowed: allowed,
    calculatedStatus: calculatedStatus,
    statusOverride: settings.statusOverride,
    activeTeams: activeTeams,
    maxTeams: settings.maxTeams,
    remainingSlots: remainingSlots,
    openingTime: settings.openingTime,
    closingTime: settings.closingTime,
    reason: reason
  };
}

// ==============================================================================
// 2. HTTP GET ROUTER
// ==============================================================================

/**
 * HTTP GET Handler
 * Actions supported:
 * - ?action=ping
 * - ?action=getSettings
 * - ?action=getRegistrations (default)
 */
function doGet(e) {
  try {
    var action = (e && e.parameter && e.parameter.action) ? e.parameter.action.toString().trim() : "getRegistrations";

    if (action === "ping") {
      return createJsonResponse({
        success: true,
        message: "KHEPRIX 2K26 Registration & Overseer API is live"
      });
    }

    if (action === "getSettings" || action === "getRegistrationAvailability") {
      var availability = checkRegistrationAvailability();
      return createJsonResponse({
        success: true,
        maxTeams: availability.maxTeams,
        registeredTeams: availability.activeTeams,
        remainingSlots: availability.remainingSlots,
        status: availability.calculatedStatus,
        openingTime: availability.openingTime,
        closingTime: availability.closingTime,
        allowed: availability.allowed,
        reason: availability.reason,
        settings: availability
      });
    }

    // Default action: Return registrations with calculated FCFS + current settings
    return handleGetRegistrations();
  } catch (err) {
    Logger.log("doGet error: " + err.toString());
    return createJsonResponse({
      success: false,
      error: err.message || err.toString()
    });
  }
}

/**
 * Reads registrations directly from the existing "Sheet1" worksheet tab.
 * Dynamically maps headers and preserves all columns.
 */
function handleGetRegistrations() {
  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  if (!spreadsheet) {
    throw new Error("Active spreadsheet not found. Ensure script is bound to the target Google Sheet.");
  }

  var sheet = spreadsheet.getSheetByName(CONFIG.SHEET_NAME) || spreadsheet.getSheets()[0];
  if (!sheet) {
    throw new Error("Worksheet tab '" + CONFIG.SHEET_NAME + "' not found.");
  }

  var lastRow = sheet.getLastRow();
  var lastColumn = sheet.getLastColumn();

  var availability = checkRegistrationAvailability();

  if (lastRow < 2) {
    return createJsonResponse({
      success: true,
      sheetName: sheet.getName(),
      count: 0,
      headers: HEADERS,
      registrations: [],
      settings: availability
    });
  }

  var rangeValues = sheet.getRange(1, 1, lastRow, lastColumn).getValues();
  var headers = rangeValues[0];
  var records = [];

  for (var r = 1; r < rangeValues.length; r++) {
    var row = rangeValues[r];
    var hasData = row.some(function(cell) {
      return cell !== "" && cell !== null && cell !== undefined;
    });
    if (!hasData) continue;

    var rawRecord = {};
    for (var c = 0; c < headers.length; c++) {
      var headerName = headers[c] ? headers[c].toString().trim() : ("Column_" + (c + 1));
      var cellVal = row[c];
      if (cellVal instanceof Date) {
        cellVal = Utilities.formatDate(cellVal, CONFIG.TIMEZONE, "yyyy-MM-dd HH:mm:ss");
      } else if (cellVal === undefined || cellVal === null) {
        cellVal = "";
      } else {
        cellVal = cellVal.toString().trim();
      }
      rawRecord[headerName] = cellVal;
    }

    function getFieldVal(aliases) {
      for (var a = 0; a < aliases.length; a++) {
        var key = aliases[a];
        if (rawRecord[key] !== undefined && rawRecord[key] !== "") {
          return rawRecord[key];
        }
        var lowerKey = key.toLowerCase();
        for (var prop in rawRecord) {
          if (prop.toLowerCase() === lowerKey && rawRecord[prop] !== "") {
            return rawRecord[prop];
          }
        }
      }
      return "";
    }

    var regId = getFieldVal(["Registration ID", "RegistrationID", "ID"]) || ("KPX-ROW-" + r);
    var timestamp = getFieldVal(["Timestamp", "Date", "Submitted At"]);
    var teamName = getFieldVal(["Team Name", "TeamName"]);
    var totalAmount = getFieldVal(["Total Amount", "TotalAmount", "Amount"]) || "1200";
    var teamSize = getFieldVal(["Team Size", "TeamSize"]) || "4";
    var paymentStatus = getFieldVal(["Payment Status", "PaymentStatus"]) || "Pending Verification";
    var paymentScreenshotUrl = getFieldVal(["Payment Screenshot URL", "Payment Screenshot", "Screenshot URL", "Payment Proof"]);
    var paymentScreenshotName = getFieldVal(["Payment Screenshot Name", "Screenshot Name"]);
    var adminNotes = getFieldVal(["Admin Notes", "Notes"]);
    var eventName = getFieldVal(["Event Name"]) || CONFIG.EVENT_NAME;
    var eventDate = getFieldVal(["Event Date"]) || CONFIG.EVENT_DATE;
    var eventTime = getFieldVal(["Event Time"]) || CONFIG.EVENT_TIME;
    var venue = getFieldVal(["Venue"]) || CONFIG.VENUE;

    // Admin Control Columns
    var status = getFieldVal(["Status", "Registration Status"]) || "ACTIVE";
    var blockedAt = getFieldVal(["Blocked At"]);
    var blockedBy = getFieldVal(["Blocked By"]);
    var blockReason = getFieldVal(["Block Reason", "Reason"]);
    var transactionId = getFieldVal(["Transaction ID", "Txn ID", "Transaction Number", "UTR"]);
    var registrationSource = getFieldVal(["Registration Source", "Source"]) || "PUBLIC";

    // Extract all 4 squad members
    var members = [];
    for (var m = 1; m <= 4; m++) {
      var p = "Member " + m + " ";
      var pNoSpace = "Member" + m;

      var mName = getFieldVal([p + "Name", pNoSpace + "Name"]);
      var mCollegeGmail = getFieldVal([
        p + "College Gmail", 
        p + "College Email", 
        p + "Gmail", 
        p + "Email", 
        pNoSpace + "CollegeGmail", 
        pNoSpace + "Email"
      ]);
      var mPhone = getFieldVal([p + "Phone", p + "Mobile", pNoSpace + "Phone"]);
      var mRegNo = getFieldVal([p + "Registration No", p + "Reg No", pNoSpace + "RegNo"]);
      var mYear = getFieldVal([p + "Year", pNoSpace + "Year"]);
      var mDepartment = getFieldVal([p + "Department", p + "Dept", pNoSpace + "Department"]);
      var mHostel = getFieldVal([p + "Hostel", p + "Hostel Name", pNoSpace + "Hostel"]);
      var mRoom = getFieldVal([p + "Room No", p + "Room", pNoSpace + "RoomNo"]);
      var mWarden = getFieldVal([p + "Warden", p + "Warden Name", pNoSpace + "Warden"]);
      var mWardenPhone = getFieldVal([p + "Warden Phone", pNoSpace + "WardenPhone"]);

      members.push({
        memberNumber: m,
        role: m === 1 ? "Team Leader" : ("Explorer " + m),
        name: mName,
        collegeGmail: mCollegeGmail,
        phone: mPhone,
        regNo: mRegNo,
        year: mYear,
        department: mDepartment,
        hostelName: mHostel,
        roomNo: mRoom,
        wardenName: mWarden,
        wardenPhone: mWardenPhone
      });
    }

    records.push({
      rowIndex: r + 1,
      registrationId: regId,
      timestamp: timestamp,
      teamName: teamName,
      teamSize: teamSize,
      totalAmount: totalAmount,
      paymentStatus: paymentStatus,
      paymentScreenshotUrl: paymentScreenshotUrl,
      paymentScreenshotName: paymentScreenshotName,
      adminNotes: adminNotes,
      eventName: eventName,
      eventDate: eventDate,
      eventTime: eventTime,
      venue: venue,
      status: status.toUpperCase(),
      blockedAt: blockedAt,
      blockedBy: blockedBy,
      blockReason: blockReason,
      transactionId: transactionId,
      registrationSource: registrationSource,
      members: members,
      rawRecord: rawRecord
    });
  }

  // Sort chronologically by timestamp for FCFS ordering
  records.sort(function(a, b) {
    var timeA = new Date(a.timestamp).getTime();
    var timeB = new Date(b.timestamp).getTime();
    if (isNaN(timeA)) return 1;
    if (isNaN(timeB)) return -1;
    return timeA - timeB;
  });

  // Assign FCFS Position Rank (Active teams get progressive #1, #2; blocked teams are tagged)
  var activeRank = 1;
  for (var i = 0; i < records.length; i++) {
    if (records[i].status !== "BLOCKED") {
      records[i].fcfsRank = activeRank;
      records[i].fcfsDisplay = "#" + activeRank;
      activeRank++;
    } else {
      records[i].fcfsRank = 999999;
      records[i].fcfsDisplay = "BLOCKED";
    }
  }

  return createJsonResponse({
    success: true,
    sheetName: sheet.getName(),
    totalRows: lastRow,
    count: records.length,
    headers: headers,
    registrations: records,
    settings: availability
  });
}

// ==============================================================================
// 3. HTTP POST ROUTER
// ==============================================================================

/**
 * HTTP POST Handler — Routes public registrations and authenticated admin actions
 */
function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(30000);
  } catch (lockError) {
    Logger.log("Lock acquisition failed: " + lockError.toString());
    return createJsonResponse({
      success: false,
      error: "Server busy processing other requests. Please retry in a few moments."
    });
  }

  try {
    if (!e || !e.postData || !e.postData.contents) {
      throw new Error("No payload received. Request body was empty.");
    }

    var data;
    try {
      data = JSON.parse(e.postData.contents);
    } catch (parseError) {
      throw new Error("Invalid JSON payload: " + parseError.message);
    }

    var action = data.action || (e.parameter && e.parameter.action) || "";

    // Route Actions
    if (action === "getSettings" || action === "getRegistrationAvailability") {
      var availability = checkRegistrationAvailability();
      return createJsonResponse({
        success: true,
        maxTeams: availability.maxTeams,
        registeredTeams: availability.activeTeams,
        remainingSlots: availability.remainingSlots,
        status: availability.calculatedStatus,
        openingTime: availability.openingTime,
        closingTime: availability.closingTime,
        allowed: availability.allowed,
        reason: availability.reason,
        settings: availability
      });
    } else if (action === "updateSettings") {
      return handleUpdateSettings(data);
    } else if (action === "blockRegistration") {
      return handleBlockRegistration(data);
    } else if (action === "unblockRegistration") {
      return handleUnblockRegistration(data);
    } else if (action === "addTeam") {
      return handleAdminAddTeam(data);
    } else if (action === "updatePaymentStatus") {
      return handleUpdatePaymentStatus(data);
    }

    // Default: Public Squad Registration
    return handlePublicRegistration(data);

  } catch (error) {
    Logger.log("FATAL POST error: " + error.toString());
    return createJsonResponse({
      success: false,
      error: error.message || error.toString()
    });
  } finally {
    lock.releaseLock();
  }
}

// ==============================================================================
// 4. PUBLIC REGISTRATION HANDLER
// ==============================================================================

function handlePublicRegistration(data) {
  // 1. Enforce Server-Side Registration Limits & Timing
  var availability = checkRegistrationAvailability();
  if (!availability.allowed) {
    return createJsonResponse({
      success: false,
      error: availability.reason || "Registrations are currently closed."
    });
  }

  // 2. Validate essential fields
  if (!data.teamName || !data.teamName.toString().trim()) {
    throw new Error("Missing required field: teamName");
  }

  if (!data.members || !Array.isArray(data.members) || data.members.length < 4) {
    throw new Error("Registration requires exactly 4 squad members.");
  }

  if (!data.paymentScreenshotUrl) {
    throw new Error("Payment screenshot data is required.");
  }

  // 3. Generate Registration ID
  var now = new Date();
  var timestampStr = Utilities.formatDate(now, CONFIG.TIMEZONE, "yyyyMMdd-HHmmss");
  var registrationId = "KPX-" + timestampStr;

  // 4. Save Payment Screenshot to Dedicated Google Drive Folder
  var driveFileUrl = saveScreenshotToDrive(
    data.paymentScreenshotUrl,
    data.paymentScreenshotName,
    registrationId,
    now
  );

  // 5. Open Sheet1
  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = spreadsheet.getSheetByName(CONFIG.SHEET_NAME) || spreadsheet.getSheets()[0];

  // Ensure header row exists
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
    formatHeaderRow(sheet);
  }

  var colMap = getSheetColumnMap(sheet);
  var formattedTimestamp = Utilities.formatDate(now, CONFIG.TIMEZONE, "yyyy-MM-dd HH:mm:ss");

  var m1 = data.members[0] || {};
  var m2 = data.members[1] || {};
  var m3 = data.members[2] || {};
  var m4 = data.members[3] || {};

  var rowObject = {
    "Registration ID": registrationId,
    "Timestamp": formattedTimestamp,
    "Event ID": CONFIG.EVENT_ID,
    "Event Name": CONFIG.EVENT_NAME,
    "Event Date": CONFIG.EVENT_DATE,
    "Event Time": CONFIG.EVENT_TIME,
    "Venue": CONFIG.VENUE,
    "Team Size": CONFIG.TEAM_SIZE,
    "Amount Per Person": CONFIG.AMOUNT_PER_PERSON,
    "Total Amount": CONFIG.TOTAL_AMOUNT,
    "Team Name": data.teamName.toString().trim(),

    // Member 1
    "Member 1 Name": (m1.name || "").toString().trim(),
    "Member 1 College Gmail": (m1.collegeGmail || m1.collegeEmail || "").toString().trim(),
    "Member 1 Phone": (m1.phone || "").toString().trim(),
    "Member 1 Registration No": (m1.regNo || "").toString().trim(),
    "Member 1 Year": (m1.year || "").toString().trim(),
    "Member 1 Department": (m1.department || "").toString().trim(),
    "Member 1 Hostel": (m1.hostelName || "").toString().trim(),
    "Member 1 Room No": (m1.roomNo || "").toString().trim(),
    "Member 1 Warden": (m1.wardenName || "").toString().trim(),
    "Member 1 Warden Phone": (m1.wardenPhone || "").toString().trim(),

    // Member 2
    "Member 2 Name": (m2.name || "").toString().trim(),
    "Member 2 College Gmail": (m2.collegeGmail || m2.collegeEmail || "").toString().trim(),
    "Member 2 Phone": (m2.phone || "").toString().trim(),
    "Member 2 Registration No": (m2.regNo || "").toString().trim(),
    "Member 2 Year": (m2.year || "").toString().trim(),
    "Member 2 Department": (m2.department || "").toString().trim(),
    "Member 2 Hostel": (m2.hostelName || "").toString().trim(),
    "Member 2 Room No": (m2.roomNo || "").toString().trim(),
    "Member 2 Warden": (m2.wardenName || "").toString().trim(),
    "Member 2 Warden Phone": (m2.wardenPhone || "").toString().trim(),

    // Member 3
    "Member 3 Name": (m3.name || "").toString().trim(),
    "Member 3 College Gmail": (m3.collegeGmail || m3.collegeEmail || "").toString().trim(),
    "Member 3 Phone": (m3.phone || "").toString().trim(),
    "Member 3 Registration No": (m3.regNo || "").toString().trim(),
    "Member 3 Year": (m3.year || "").toString().trim(),
    "Member 3 Department": (m3.department || "").toString().trim(),
    "Member 3 Hostel": (m3.hostelName || "").toString().trim(),
    "Member 3 Room No": (m3.roomNo || "").toString().trim(),
    "Member 3 Warden": (m3.wardenName || "").toString().trim(),
    "Member 3 Warden Phone": (m3.wardenPhone || "").toString().trim(),

    // Member 4
    "Member 4 Name": (m4.name || "").toString().trim(),
    "Member 4 College Gmail": (m4.collegeGmail || m4.collegeEmail || "").toString().trim(),
    "Member 4 Phone": (m4.phone || "").toString().trim(),
    "Member 4 Registration No": (m4.regNo || "").toString().trim(),
    "Member 4 Year": (m4.year || "").toString().trim(),
    "Member 4 Department": (m4.department || "").toString().trim(),
    "Member 4 Hostel": (m4.hostelName || "").toString().trim(),
    "Member 4 Room No": (m4.roomNo || "").toString().trim(),
    "Member 4 Warden": (m4.wardenName || "").toString().trim(),
    "Member 4 Warden Phone": (m4.wardenPhone || "").toString().trim(),

    // Payment & Admin
    "Payment Screenshot Name": (data.paymentScreenshotName || "").toString().trim(),
    "Payment Screenshot URL": driveFileUrl,
    "Payment Status": CONFIG.PAYMENT_STATUS,
    "Admin Notes": "",
    "Status": "ACTIVE",
    "Blocked At": "",
    "Blocked By": "",
    "Block Reason": "",
    "Transaction ID": (data.transactionId || "").toString().trim(),
    "Registration Source": "PUBLIC"
  };

  appendRowFromObject(sheet, colMap, rowObject);
  SpreadsheetApp.flush();

  return createJsonResponse({
    success: true,
    registrationId: registrationId,
    regId: registrationId,
    id: registrationId,
    teamName: data.teamName,
    timestamp: formattedTimestamp,
    fcfsPosition: availability.activeTeams + 1,
    message: "Registration successfully recorded in Sheet1"
  });
}

// ==============================================================================
// 5. ADMIN ACTION HANDLERS
// ==============================================================================

/**
 * Admin Action: Update Registration Settings (Limit, Timings, Status Override)
 */
function handleUpdateSettings(data) {
  verifyAdminAuth(data.adminSecret);

  var props = PropertiesService.getScriptProperties();

  if (data.maxTeams !== undefined) {
    var maxVal = parseInt(data.maxTeams, 10);
    if (!isNaN(maxVal) && maxVal > 0) {
      props.setProperty("REG_MAX_TEAMS", maxVal.toString());
    }
  }

  if (data.openingTime !== undefined && data.openingTime.toString().trim()) {
    props.setProperty("REG_OPENING_TIME", data.openingTime.toString().trim());
  }

  if (data.closingTime !== undefined && data.closingTime.toString().trim()) {
    props.setProperty("REG_CLOSING_TIME", data.closingTime.toString().trim());
  }

  if (data.statusOverride !== undefined) {
    var validOverrides = ["AUTO", "OPEN", "CLOSED", "PAUSED"];
    var upper = data.statusOverride.toString().trim().toUpperCase();
    if (validOverrides.indexOf(upper) !== -1) {
      props.setProperty("REG_STATUS_OVERRIDE", upper);
    }
  }

  var updatedAvailability = checkRegistrationAvailability();

  return createJsonResponse({
    success: true,
    message: "Registration settings updated successfully",
    settings: updatedAvailability
  });
}

/**
 * Admin Action: Block a registration
 */
function handleBlockRegistration(data) {
  verifyAdminAuth(data.adminSecret);

  if (!data.registrationId) {
    throw new Error("Missing registrationId for block action.");
  }

  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = spreadsheet.getSheetByName(CONFIG.SHEET_NAME) || spreadsheet.getSheets()[0];
  var colMap = getSheetColumnMap(sheet);

  var rowIndex = findRowIndexByRegistrationId(sheet, colMap, data.registrationId);
  if (rowIndex < 2) {
    throw new Error("Registration ID '" + data.registrationId + "' not found in Sheet1.");
  }

  var statusCol = ensureSheetColumn(sheet, colMap, "Status");
  var blockedAtCol = ensureSheetColumn(sheet, colMap, "Blocked At");
  var blockedByCol = ensureSheetColumn(sheet, colMap, "Blocked By");
  var blockReasonCol = ensureSheetColumn(sheet, colMap, "Block Reason");

  var nowStr = Utilities.formatDate(new Date(), CONFIG.TIMEZONE, "yyyy-MM-dd HH:mm:ss");

  sheet.getRange(rowIndex, statusCol).setValue("BLOCKED");
  sheet.getRange(rowIndex, blockedAtCol).setValue(nowStr);
  sheet.getRange(rowIndex, blockedByCol).setValue(data.blockedBy || "Admin");
  sheet.getRange(rowIndex, blockReasonCol).setValue(data.reason || "Blocked by Administrator");

  SpreadsheetApp.flush();

  return createJsonResponse({
    success: true,
    message: "Registration " + data.registrationId + " has been blocked.",
    registrationId: data.registrationId,
    status: "BLOCKED"
  });
}

/**
 * Admin Action: Unblock a registration
 */
function handleUnblockRegistration(data) {
  verifyAdminAuth(data.adminSecret);

  if (!data.registrationId) {
    throw new Error("Missing registrationId for unblock action.");
  }

  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = spreadsheet.getSheetByName(CONFIG.SHEET_NAME) || spreadsheet.getSheets()[0];
  var colMap = getSheetColumnMap(sheet);

  var rowIndex = findRowIndexByRegistrationId(sheet, colMap, data.registrationId);
  if (rowIndex < 2) {
    throw new Error("Registration ID '" + data.registrationId + "' not found in Sheet1.");
  }

  var statusCol = ensureSheetColumn(sheet, colMap, "Status");
  var blockReasonCol = ensureSheetColumn(sheet, colMap, "Block Reason");

  sheet.getRange(rowIndex, statusCol).setValue("ACTIVE");
  sheet.getRange(rowIndex, blockReasonCol).setValue("");

  SpreadsheetApp.flush();

  return createJsonResponse({
    success: true,
    message: "Registration " + data.registrationId + " has been unblocked.",
    registrationId: data.registrationId,
    status: "ACTIVE"
  });
}

/**
 * Admin Action: Manually Add a Team to Sheet1
 */
function handleAdminAddTeam(data) {
  verifyAdminAuth(data.adminSecret);

  if (!data.teamName || !data.teamName.toString().trim()) {
    throw new Error("Team Name is required.");
  }

  var members = Array.isArray(data.members) ? data.members : [];
  if (members.length < 4) {
    throw new Error("Manual team addition requires 4 members.");
  }

  var now = new Date();
  var timestampStr = Utilities.formatDate(now, CONFIG.TIMEZONE, "yyyyMMdd-HHmmss");
  var registrationId = "KPX-ADMIN-" + timestampStr;

  // Handle optional screenshot upload
  var driveFileUrl = "";
  if (data.paymentScreenshotUrl && data.paymentScreenshotUrl.indexOf("data:") === 0) {
    driveFileUrl = saveScreenshotToDrive(
      data.paymentScreenshotUrl,
      data.paymentScreenshotName || "admin_manual_proof.png",
      registrationId,
      now
    );
  } else if (data.paymentScreenshotUrl) {
    driveFileUrl = data.paymentScreenshotUrl;
  }

  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = spreadsheet.getSheetByName(CONFIG.SHEET_NAME) || spreadsheet.getSheets()[0];
  var colMap = getSheetColumnMap(sheet);

  var formattedTimestamp = Utilities.formatDate(now, CONFIG.TIMEZONE, "yyyy-MM-dd HH:mm:ss");

  var m1 = members[0] || {};
  var m2 = members[1] || {};
  var m3 = members[2] || {};
  var m4 = members[3] || {};

  var rowObject = {
    "Registration ID": registrationId,
    "Timestamp": formattedTimestamp,
    "Event ID": CONFIG.EVENT_ID,
    "Event Name": CONFIG.EVENT_NAME,
    "Event Date": CONFIG.EVENT_DATE,
    "Event Time": CONFIG.EVENT_TIME,
    "Venue": CONFIG.VENUE,
    "Team Size": 4,
    "Amount Per Person": CONFIG.AMOUNT_PER_PERSON,
    "Total Amount": data.paymentAmount || CONFIG.TOTAL_AMOUNT,
    "Team Name": data.teamName.toString().trim(),

    // Member 1
    "Member 1 Name": (m1.name || "").toString().trim(),
    "Member 1 College Gmail": (m1.collegeGmail || m1.collegeEmail || "").toString().trim(),
    "Member 1 Phone": (m1.phone || "").toString().trim(),
    "Member 1 Registration No": (m1.regNo || "").toString().trim(),
    "Member 1 Year": (m1.year || "").toString().trim(),
    "Member 1 Department": (m1.department || "").toString().trim(),
    "Member 1 Hostel": (m1.hostelName || "").toString().trim(),
    "Member 1 Room No": (m1.roomNo || "").toString().trim(),
    "Member 1 Warden": (m1.wardenName || "").toString().trim(),
    "Member 1 Warden Phone": (m1.wardenPhone || "").toString().trim(),

    // Member 2
    "Member 2 Name": (m2.name || "").toString().trim(),
    "Member 2 College Gmail": (m2.collegeGmail || m2.collegeEmail || "").toString().trim(),
    "Member 2 Phone": (m2.phone || "").toString().trim(),
    "Member 2 Registration No": (m2.regNo || "").toString().trim(),
    "Member 2 Year": (m2.year || "").toString().trim(),
    "Member 2 Department": (m2.department || "").toString().trim(),
    "Member 2 Hostel": (m2.hostelName || "").toString().trim(),
    "Member 2 Room No": (m2.roomNo || "").toString().trim(),
    "Member 2 Warden": (m2.wardenName || "").toString().trim(),
    "Member 2 Warden Phone": (m2.wardenPhone || "").toString().trim(),

    // Member 3
    "Member 3 Name": (m3.name || "").toString().trim(),
    "Member 3 College Gmail": (m3.collegeGmail || m3.collegeEmail || "").toString().trim(),
    "Member 3 Phone": (m3.phone || "").toString().trim(),
    "Member 3 Registration No": (m3.regNo || "").toString().trim(),
    "Member 3 Year": (m3.year || "").toString().trim(),
    "Member 3 Department": (m3.department || "").toString().trim(),
    "Member 3 Hostel": (m3.hostelName || "").toString().trim(),
    "Member 3 Room No": (m3.roomNo || "").toString().trim(),
    "Member 3 Warden": (m3.wardenName || "").toString().trim(),
    "Member 3 Warden Phone": (m3.wardenPhone || "").toString().trim(),

    // Member 4
    "Member 4 Name": (m4.name || "").toString().trim(),
    "Member 4 College Gmail": (m4.collegeGmail || m4.collegeEmail || "").toString().trim(),
    "Member 4 Phone": (m4.phone || "").toString().trim(),
    "Member 4 Registration No": (m4.regNo || "").toString().trim(),
    "Member 4 Year": (m4.year || "").toString().trim(),
    "Member 4 Department": (m4.department || "").toString().trim(),
    "Member 4 Hostel": (m4.hostelName || "").toString().trim(),
    "Member 4 Room No": (m4.roomNo || "").toString().trim(),
    "Member 4 Warden": (m4.wardenName || "").toString().trim(),
    "Member 4 Warden Phone": (m4.wardenPhone || "").toString().trim(),

    // Payment & Admin
    "Payment Screenshot Name": data.paymentScreenshotName || "Manual Entry Proof",
    "Payment Screenshot URL": driveFileUrl,
    "Payment Status": data.paymentStatus || "Verified",
    "Admin Notes": data.adminNotes || "Manually added by Administrator",
    "Status": "ACTIVE",
    "Blocked At": "",
    "Blocked By": "",
    "Block Reason": "",
    "Transaction ID": (data.transactionId || "").toString().trim(),
    "Registration Source": "ADMIN"
  };

  appendRowFromObject(sheet, colMap, rowObject);
  SpreadsheetApp.flush();

  return createJsonResponse({
    success: true,
    registrationId: registrationId,
    message: "Squad registered successfully by Admin."
  });
}

/**
 * Admin Action: Update Payment Status & Transaction ID
 */
function handleUpdatePaymentStatus(data) {
  verifyAdminAuth(data.adminSecret);

  if (!data.registrationId) {
    throw new Error("Missing registrationId for payment update.");
  }

  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = spreadsheet.getSheetByName(CONFIG.SHEET_NAME) || spreadsheet.getSheets()[0];
  var colMap = getSheetColumnMap(sheet);

  var rowIndex = findRowIndexByRegistrationId(sheet, colMap, data.registrationId);
  if (rowIndex < 2) {
    throw new Error("Registration ID '" + data.registrationId + "' not found in Sheet1.");
  }

  if (data.paymentStatus) {
    var payCol = ensureSheetColumn(sheet, colMap, "Payment Status");
    sheet.getRange(rowIndex, payCol).setValue(data.paymentStatus);
  }

  if (data.transactionId !== undefined) {
    var txnCol = ensureSheetColumn(sheet, colMap, "Transaction ID");
    sheet.getRange(rowIndex, txnCol).setValue(data.transactionId);
  }

  if (data.adminNotes !== undefined) {
    var noteCol = ensureSheetColumn(sheet, colMap, "Admin Notes");
    sheet.getRange(rowIndex, noteCol).setValue(data.adminNotes);
  }

  SpreadsheetApp.flush();

  return createJsonResponse({
    success: true,
    message: "Payment details updated successfully for " + data.registrationId,
    registrationId: data.registrationId
  });
}

// ==============================================================================
// 6. SAFE SPREADSHEET UTILITIES
// ==============================================================================

/**
 * Builds a column index map from row 1 headers: { "Header Name": 1-based index }
 */
function getSheetColumnMap(sheet) {
  var colMap = {};
  var lastCol = sheet.getLastColumn();
  if (lastCol < 1) return colMap;

  var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  for (var c = 0; c < headers.length; c++) {
    var name = headers[c] ? headers[c].toString().trim() : "";
    if (name) {
      colMap[name] = c + 1;
      colMap[name.toLowerCase()] = c + 1;
    }
  }
  return colMap;
}

/**
 * Ensures a column exists by header name; appends to row 1 if missing
 */
function ensureSheetColumn(sheet, colMap, headerName) {
  var trimmed = headerName.toString().trim();
  if (colMap[trimmed]) return colMap[trimmed];
  if (colMap[trimmed.toLowerCase()]) return colMap[trimmed.toLowerCase()];

  var nextCol = sheet.getLastColumn() + 1;
  sheet.getRange(1, nextCol).setValue(trimmed);
  colMap[trimmed] = nextCol;
  colMap[trimmed.toLowerCase()] = nextCol;
  return nextCol;
}

/**
 * Locates the 1-based row index for a given Registration ID
 */
function findRowIndexByRegistrationId(sheet, colMap, regId) {
  var idCol = colMap["Registration ID"] || colMap["registration id"] || 1;
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return -1;

  var values = sheet.getRange(1, idCol, lastRow, 1).getValues();
  var target = regId.toString().trim().toLowerCase();

  for (var r = 1; r < values.length; r++) {
    var cell = values[r][0] ? values[r][0].toString().trim().toLowerCase() : "";
    if (cell === target) {
      return r + 1; // 1-based index
    }
  }
  return -1;
}

/**
 * Appends a row by mapping fields to their exact header columns dynamically
 */
function appendRowFromObject(sheet, colMap, rowObject) {
  // Ensure all keys in rowObject exist as columns
  for (var key in rowObject) {
    ensureSheetColumn(sheet, colMap, key);
  }

  var totalCols = sheet.getLastColumn();
  var rowData = new Array(totalCols);
  for (var i = 0; i < totalCols; i++) {
    rowData[i] = "";
  }

  for (var k in rowObject) {
    var colIdx = colMap[k] || colMap[k.toLowerCase()];
    if (colIdx && colIdx <= totalCols) {
      rowData[colIdx - 1] = rowObject[k];
    }
  }

  sheet.appendRow(rowData);
}

/**
 * Helper to style the header row
 */
function formatHeaderRow(sheet) {
  var lastCol = sheet.getLastColumn();
  if (lastCol < 1) return;
  var headerRange = sheet.getRange(1, 1, 1, lastCol);
  headerRange.setFontWeight("bold");
  headerRange.setBackground("#3D311A");
  headerRange.setFontColor("#FCE49E");
  sheet.setFrozenRows(1);
}

/**
 * Saves a base64-encoded screenshot into a dedicated Google Drive folder
 */
function saveScreenshotToDrive(base64DataUrl, originalName, registrationId, dateObj) {
  var folder = getOrCreateDriveFolder(CONFIG.DRIVE_FOLDER_NAME);

  var mimeType = "image/png";
  var ext = "png";
  var rawBase64 = base64DataUrl;

  var matches = base64DataUrl.match(/^data:([a-zA-Z0-9\/\-+.]+);base64,(.+)$/);
  if (matches) {
    mimeType = matches[1];
    rawBase64 = matches[2];

    if (mimeType.indexOf("jpeg") !== -1 || mimeType.indexOf("jpg") !== -1) {
      ext = "jpg";
    } else if (mimeType.indexOf("webp") !== -1) {
      ext = "webp";
    } else if (mimeType.indexOf("png") !== -1) {
      ext = "png";
    }
  }

  var decodedBytes = Utilities.base64Decode(rawBase64);
  var timeSuffix = Utilities.formatDate(dateObj, CONFIG.TIMEZONE, "yyyyMMdd_HHmmss");
  var filename = registrationId + "_" + timeSuffix + "." + ext;

  if (originalName) {
    var safeOriginal = originalName.replace(/[^a-zA-Z0-9._-]/g, "_");
    filename = registrationId + "_" + safeOriginal;
  }

  var blob = Utilities.newBlob(decodedBytes, mimeType, filename);
  var file = folder.createFile(blob);

  try {
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  } catch (permError) {
    Logger.log("Permission warning: " + permError.toString());
  }

  return file.getUrl();
}

/**
 * Helper to retrieve an existing folder or create it if missing
 */
function getOrCreateDriveFolder(folderName) {
  var folders = DriveApp.getFoldersByName(folderName);
  if (folders.hasNext()) {
    return folders.next();
  }
  return DriveApp.createFolder(folderName);
}

/**
 * Helper to build JSON ContentService output
 */
function createJsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
