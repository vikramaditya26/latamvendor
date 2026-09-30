/**
 * Awign vendor applications -> Google Sheet.
 *
 * Setup (once):
 *   1. Create a Google Sheet. Extensions > Apps Script. Paste this file.
 *   2. Deploy > New deployment > type "Web app".
 *        Execute as: Me        Who has access: Anyone
 *   3. Copy the web-app URL (ends in /exec) into CONFIG.APPLY_ENDPOINT in i18n.js.
 *
 * After changing this script, use Deploy > Manage deployments > Edit > New version,
 * otherwise the live URL keeps running the old code.
 */

var COLUMNS = ["submittedAt", "company", "country", "taxId", "contact", "whatsapp",
               "email", "city", "workers", "phones", "message", "lang"];

// Optional: an address to notify for every new application. Leave "" to skip.
var NOTIFY_EMAIL = "";

function doPost(e) {
  var data = JSON.parse(e.postData.contents);
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];

  if (sheet.getLastRow() === 0) sheet.appendRow(COLUMNS);

  sheet.appendRow(COLUMNS.map(function (key) {
    var value = data[key] == null ? "" : String(data[key]);
    // Stop a value like "=IMPORTXML(...)" from running as a formula.
    return /^[=+\-@]/.test(value) ? "'" + value : value;
  }));

  if (NOTIFY_EMAIL) {
    MailApp.sendEmail(NOTIFY_EMAIL, "New vendor application: " + (data.company || ""),
      COLUMNS.map(function (key) { return key + ": " + (data[key] || ""); }).join("\n"));
  }

  return ContentService.createTextOutput("ok");
}
