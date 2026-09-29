/**
 * ==============================================================================
 * KHEPRIX 2K26 — Expedition Registration & Payment Processor
 * Google Apps Script Web App Endpoint
 * ==============================================================================
 * 
 * Target Sheet Name:  "Sheet1" (The existing active worksheet tab)
 * Drive Folder Name:  "KHEPRIX 2K26 — Payment Screenshots"
 * Response format:    { "success": true, "registrationId": "KPX-..." }
 * Total Columns:      51 Columns
 * 
 * IMPORTANT:
 * - Writes directly to the existing "Sheet1" tab.
 * - Does NOT create or rename worksheets.
 * - Decodes Base64 screenshots and saves them directly to Google Drive.
 * - ONLY the permanent Google Drive URL is stored in Google Sheets.
 * - Base64 strings are NEVER stored in Google Sheets.
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
  TIMEZONE: "GMT+05:30"
};

// 51 Exact Column Headers (Must match appendRow order exactly)
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
  "Admin Notes"
];

/**
 * HTTP GET Handler — Health check endpoint
 */
function doGet(e) {
  var response = {
    success: true,
    message: "KHEPRIX 2K26 Registration API is live"
  };
  return ContentService.createTextOutput(JSON.stringify(response))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * HTTP POST Handler — Process squad registration & payment screenshot
 */
function doPost(e) {
  var lock = LockService.getScriptLock();
  // Wait up to 30 seconds for concurrent write operations to avoid race conditions
  try {
    lock.waitLock(30000);
  } catch (lockError) {
    Logger.log("Lock acquisition failed: " + lockError.toString());
    return createJsonResponse({
      success: false,
      error: "Server busy processing other registrations. Please retry in a few moments."
    });
  }

  try {
    // 1. Verify and parse request body
    if (!e || !e.postData || !e.postData.contents) {
      throw new Error("No payload received. Request body was empty.");
    }

    var data;
    try {
      data = JSON.parse(e.postData.contents);
    } catch (parseError) {
      throw new Error("Invalid JSON payload: " + parseError.message);
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

    // 3. Generate Unique Registration ID (KPX-yyyyMMdd-HHmmss)
    var now = new Date();
    var timestampStr = Utilities.formatDate(now, CONFIG.TIMEZONE, "yyyyMMdd-HHmmss");
    var registrationId = "KPX-" + timestampStr;

    Logger.log("Processing Registration ID: " + registrationId + " for Team: " + data.teamName);

    // 4. Save Payment Screenshot to Dedicated Google Drive Folder
    var driveFileUrl = saveScreenshotToDrive(
      data.paymentScreenshotUrl,
      data.paymentScreenshotName,
      registrationId,
      now
    );
    Logger.log("Drive screenshot uploaded successfully: " + driveFileUrl);

    // 5. Open the existing "Sheet1" worksheet tab
    const SHEET_NAME = CONFIG.SHEET_NAME; // "Sheet1"
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    if (!spreadsheet) {
      throw new Error("Active spreadsheet not found. Ensure script is bound to the target Google Sheet.");
    }

    // Get the existing "Sheet1" tab directly (with fallback to first sheet if tab was renamed)
    const sheet = spreadsheet.getSheetByName(SHEET_NAME) || spreadsheet.getSheets()[0];
    if (!sheet) {
      throw new Error("Could not access worksheet tab '" + SHEET_NAME + "' in spreadsheet.");
    }

    Logger.log("Target spreadsheet: '" + spreadsheet.getName() + "' | Target tab: '" + sheet.getName() + "'");

    // Write header row if sheet is newly initialized or empty
    if (sheet.getLastRow() === 0) {
      Logger.log("Sheet is empty. Writing 51 column header row...");
      sheet.appendRow(HEADERS);
      formatHeaderRow(sheet);
      SpreadsheetApp.flush();
    } else {
      // Auto-verify that the first row contains headers
      var existingFirstRow = sheet.getRange(1, 1, 1, Math.max(sheet.getLastColumn(), HEADERS.length)).getValues()[0];
      if (existingFirstRow.length < HEADERS.length || existingFirstRow[0] !== "Registration ID") {
        Logger.log("Updating header row with 51 columns...");
        sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
        formatHeaderRow(sheet);
        SpreadsheetApp.flush();
      }
    }

    // 6. Registration Fee & Squad Members Data
    const amountPerPerson = 300;
    const totalAmount = 1200;

    var m1 = data.members[0] || {};
    var m2 = data.members[1] || {};
    var m3 = data.members[2] || {};
    var m4 = data.members[3] || {};

    var formattedTimestamp = Utilities.formatDate(now, CONFIG.TIMEZONE, "yyyy-MM-dd HH:mm:ss");

    // 7. Assemble 51-column row (order matches HEADERS exactly)
    var rowData = [
      registrationId,                         // 1 Registration ID
      formattedTimestamp,                     // 2 Timestamp
      CONFIG.EVENT_ID,                        // 3 Event ID
      CONFIG.EVENT_NAME,                      // 4 Event Name
      CONFIG.EVENT_DATE,                      // 5 Event Date
      CONFIG.EVENT_TIME,                      // 6 Event Time
      CONFIG.VENUE,                           // 7 Venue
      CONFIG.TEAM_SIZE,                       // 8 Team Size
      amountPerPerson,                        // 9 Amount Per Person (300)
      totalAmount,                            // 10 Total Amount (1200)
      data.teamName.toString().trim(),        // 11 Team Name

      // Member 1 (Leader)
      (m1.name || "").toString().trim(),        // 12 Member 1 Name
      (m1.phone || "").toString().trim(),       // 13 Member 1 Phone
      (m1.regNo || "").toString().trim(),       // 14 Member 1 Registration No
      (m1.year || "").toString().trim(),        // 15 Member 1 Year
      (m1.department || "").toString().trim(),  // 16 Member 1 Department
      (m1.hostelName || "").toString().trim(),  // 17 Member 1 Hostel
      (m1.roomNo || "").toString().trim(),      // 18 Member 1 Room No
      (m1.wardenName || "").toString().trim(),  // 19 Member 1 Warden
      (m1.wardenPhone || "").toString().trim(), // 20 Member 1 Warden Phone

      // Member 2
      (m2.name || "").toString().trim(),        // 21 Member 2 Name
      (m2.phone || "").toString().trim(),       // 22 Member 2 Phone
      (m2.regNo || "").toString().trim(),       // 23 Member 2 Registration No
      (m2.year || "").toString().trim(),        // 24 Member 2 Year
      (m2.department || "").toString().trim(),  // 25 Member 2 Department
      (m2.hostelName || "").toString().trim(),  // 26 Member 2 Hostel
      (m2.roomNo || "").toString().trim(),      // 27 Member 2 Room No
      (m2.wardenName || "").toString().trim(),  // 28 Member 2 Warden
      (m2.wardenPhone || "").toString().trim(), // 29 Member 2 Warden Phone

      // Member 3
      (m3.name || "").toString().trim(),        // 30 Member 3 Name
      (m3.phone || "").toString().trim(),       // 31 Member 3 Phone
      (m3.regNo || "").toString().trim(),       // 32 Member 3 Registration No
      (m3.year || "").toString().trim(),        // 33 Member 3 Year
      (m3.department || "").toString().trim(),  // 34 Member 3 Department
      (m3.hostelName || "").toString().trim(),  // 35 Member 3 Hostel
      (m3.roomNo || "").toString().trim(),      // 36 Member 3 Room No
      (m3.wardenName || "").toString().trim(),  // 37 Member 3 Warden
      (m3.wardenPhone || "").toString().trim(), // 38 Member 3 Warden Phone

      // Member 4
      (m4.name || "").toString().trim(),        // 39 Member 4 Name
      (m4.phone || "").toString().trim(),       // 40 Member 4 Phone
      (m4.regNo || "").toString().trim(),       // 41 Member 4 Registration No
      (m4.year || "").toString().trim(),        // 42 Member 4 Year
      (m4.department || "").toString().trim(),  // 43 Member 4 Department
      (m4.hostelName || "").toString().trim(),  // 44 Member 4 Hostel
      (m4.roomNo || "").toString().trim(),      // 45 Member 4 Room No
      (m4.wardenName || "").toString().trim(),  // 46 Member 4 Warden
      (m4.wardenPhone || "").toString().trim(), // 47 Member 4 Warden Phone

      // Payment & Admin
      (data.paymentScreenshotName || "").toString().trim(), // 48 Payment Screenshot Name
      driveFileUrl,                                         // 49 Payment Screenshot URL
      CONFIG.PAYMENT_STATUS,                                // 50 Payment Status
      ""                                                    // 51 Admin Notes
    ];

    // 8. Append the row to "Sheet1"
    Logger.log("Executing sheet.appendRow() for " + registrationId + " with " + rowData.length + " columns...");
    sheet.appendRow(rowData);

    // Force commit changes to Google Sheets immediately
    SpreadsheetApp.flush();
    Logger.log("SUCCESS: sheet.appendRow() completed. New total rows in '" + sheet.getName() + "': " + sheet.getLastRow());

    // 9. Return JSON success with registrationId
    return createJsonResponse({
      success: true,
      registrationId: registrationId
    });

  } catch (error) {
    Logger.log("FATAL Registration error: " + error.toString());
    return createJsonResponse({
      success: false,
      error: error.message || error.toString()
    });
  } finally {
    lock.releaseLock();
  }
}

/**
 * Helper to style the header row
 */
function formatHeaderRow(sheet) {
  var headerRange = sheet.getRange(1, 1, 1, HEADERS.length);
  headerRange.setFontWeight("bold");
  headerRange.setBackground("#3D311A");
  headerRange.setFontColor("#FCE49E");
  sheet.setFrozenRows(1);
}

/**
 * Saves a base64-encoded screenshot into a dedicated Google Drive folder
 * and returns the viewable URL.
 */
function saveScreenshotToDrive(base64DataUrl, originalName, registrationId, dateObj) {
  var folder = getOrCreateDriveFolder(CONFIG.DRIVE_FOLDER_NAME);

  var mimeType = "image/png";
  var ext = "png";
  var rawBase64 = base64DataUrl;

  // Extract MIME type and pure base64 payload from data URL
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

  // Set viewing permission so organizers can click and view the proof
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
