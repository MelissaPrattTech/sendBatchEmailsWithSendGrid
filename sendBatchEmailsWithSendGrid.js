// MAIN FUNCTION
function sendBatchEmailsWithSendGrid() {
  Logger.log("⏱️ Trigger started at " + new Date());

  const now = new Date();
const timeZone = SpreadsheetApp.getActive().getSpreadsheetTimeZone();
const currentHour = parseInt(Utilities.formatDate(now, timeZone, 'H'), 10);
const currentMinute = parseInt(Utilities.formatDate(now, timeZone, 'm'), 10);
const currentMinutes = currentHour * 60 + currentMinute;

  const bestTimeBlocks = [
    [480, 700],   // 8:00 AM – 11:40 AM
    [720, 900],   // 12:00 PM – 3:00 PM
    [960, 1110],  // 4:00 PM – 6:30 PM
  ];
  const inBestTime = bestTimeBlocks.some(([start, end]) => currentMinutes >= start && currentMinutes <= end);
  if (!inBestTime) {
    Logger.log("⏱️ Outside best sending hours. Skipping.");
    return;
  }

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("recofauto500");
  const settings = ss.getSheetByName("Settings");

  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return;
  const bgColors = sheet.getRange(2, 1, lastRow - 1, 1).getBackgrounds();

  const docIds = {
    "Template 1": "1SCLFX17i_MmI41XCqqVWhbm6vF3l8ztxxsEC8BVgcq8",
    "Template 2": "1ls7ZF9ySF-FAhWaWwVXyS6p9bvjnrSYD85OSkJebnl8",
    "Template 3": "1yWCS8pd07Hv03liengFkbNfi0ssXZ0apXSHrL-d9leY",
    "Template 4": "1AUcGxjsO8xBGXOcV84-joqK3Ek4iO9DO9zgXURspwKY",
    "Template 5": "1y-ELRlaHdlmQ6biJbHpaVDHkoe-GFWIdsX4d7z-Yzkc"
  };

  const headerImages = {
    "Template 1": "https://i.imgur.com/L9ebqgP.png",
    "Template 2": "https://i.imgur.com/3snPbcw.png",
    "Template 3": "https://i.imgur.com/WoIG3Qo.png",
    "Template 4": "https://i.imgur.com/TyzMbtj.png",
    "Template 5": "https://i.imgur.com/tXyRxV8.png",
    "Template 6": "https://i.imgur.com/wilpOAH.png"
  };

  const footerUrl = "https://i.imgur.com/ztrqm9a.png";
  const subjectLines = {
    "Template 1": "Your Real Estate Career Starts Here 🏡",
    "Template 2": "Need Help Starting in Real Estate? We’ve Got You",
    "Template 3": "Take the First Step—Become a Florida Real Estate Agent",
    "Template 4": "Make Your Move in Real Estate Today",
    "Template 5": "Step Into a Career That Changes Lives"
  };

  const templateBodies = {};
  for (const key in docIds) {
    const html = UrlFetchApp.fetch(`https://docs.google.com/document/d/${docIds[key]}/export?format=html`).getContentText();
    templateBodies[key] = html;
  }

  const currentTemplateIndex = parseInt(settings.getRange("B2").getValue(), 10) || 1;
  const template = "Template " + currentTemplateIndex;
  const headerImg = headerImages[template];

  const startRow = parseInt(settings.getRange("B7").getValue(), 10) || 2;
  const maxPerRun = 200;
  const dailySent = parseInt(settings.getRange("B3").getValue(), 10) || 0;

  const batchColumn = sheet.getRange(2, 5, lastRow - 1).getValues().flat();
  const statusColumn = sheet.getRange(2, 6, lastRow - 1).getValues().flat();
  const skipFollowUpColumn = sheet.getRange(2, 14, lastRow - 1).getValues().flat();

  const rows = [];
  for (let i = startRow - 2; i < batchColumn.length && rows.length < maxPerRun; i++) {
    if (statusColumn[i] !== "✅ Sent" && statusColumn[i] !== "undeliverable" && skipFollowUpColumn[i] !== "Yes") {
      rows.push(i + 2);
    }
  }

let emailsSent = 0;

if (rows.length === 0) {
  Logger.log("📭 No rows to send. Checking if full reset is needed...");

  const allStatuses = sheet.getRange(2, 6, lastRow - 1).getValues().flat();   // Column F
  const allSkips    = sheet.getRange(2, 14, lastRow - 1).getValues().flat();  // Column N

  const allProcessed = allStatuses.every((status, i) => {
    const skip = allSkips[i];
    const clean = (status || "").toString().trim().toLowerCase();
    return clean === "✅ sent".toLowerCase() || clean === "undeliverable" || skip === "Yes";
  });

  if (allProcessed) {
    const nextTemplateIndex = currentTemplateIndex >= 5 ? 1 : currentTemplateIndex + 1;
    settings.getRange("B2").setValue(nextTemplateIndex);
    settings.getRange("B3").setValue(0);
    settings.getRange("B7").setValue(2);
    sheet.getRange(2, 4, lastRow - 1).clearContent();  // Last Sent
    sheet.getRange(2, 6, lastRow - 1).clearContent();  // Status
    sheet.getRange(2, 7, lastRow - 1).clearContent();  // Template Used
    Logger.log("🔁 Auto-reset complete: statuses cleared, template rotated, and counter reset.");
  } else {
    Logger.log("⏹️ No eligible rows, but not all have been processed. No reset.");
  }

  return;
}

// Continue sending if rows were found
for (const row of rows) {
  const name = sheet.getRange(row, 1).getValue();
  const email = sheet.getRange(row, 2).getValue();

  const isBlue = bgColors[row - 2][0] === "#cfe2f3";
  if (!isValidEmail(email) || isBlue) continue;

  const firstName = name && typeof name === "string" && name.trim() !== "" ? name.trim() : "";
  const subjectFinal = subjectLines[template].replace("{{First Name}}", firstName || "there");

  const greeting = now.getHours() < 12
      ? "Good morning"
      : now.getHours() < 18
      ? "Good afternoon"
      : "Good evening";

  const bodyHtmlRaw = templateBodies[template];
  const personalizedBody = bodyHtmlRaw
    .replace(/{{\s*First Name\s*}}/gi, firstName ? " " + firstName : "")
    .replace(/{{\s*GREETING\s*}}/gi, greeting);

  const htmlBody = `
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
          body {
            margin: 0;
            padding: 0;
            font-family: Arial, sans-serif;
            background-color: #ffffff;
          }
          .content {
            width: 100%;
            max-width: 100%;
            margin: 0 auto;
            padding: 20px;
            font-size: 16px;
            line-height: 1.6;
            color: #333333;
          }
          .button {
            background-color: #11056d;
            color: #ffffff !important;
            text-decoration: none;
            padding: 14px 28px;
            border-radius: 6px;
            font-size: 16px;
            display: inline-block;
            margin-top: 20px;
          }
          img {
            display: block;
            max-width: 100%;
            height: auto;
          }
        </style>
      </head>
      <body>
        <table width="100%" border="0" cellspacing="0" cellpadding="0">
          <tr><td><img src="${headerImg}" width="100%" alt="Header" /></td></tr>
          <tr>
            <td>
              <div class="content">
                ${personalizedBody}
                <div style="text-align: center;">
                  <a href="https://www.myrealestatecampus.com/pages/home" class="button">Explore Courses</a>
                </div>
              </div>
            </td>
          </tr>
          <tr><td><img src="${footerUrl}" width="100%" alt="Footer" /></td></tr>
          <tr>
            <td style="font-size:12px; text-align:center; color:#999999; padding: 15px;">
              Real Estate Campus of Florida<br>
              295 NW Peacock Blvd #881013<br>
              Port St. Lucie, FL 34986<br><br>
              If you no longer wish to receive emails from us, simply ignore this message.
            </td>
          </tr>
        </table>
      </body>
    </html>`;

  try {
    sendViaSendGrid(email, subjectFinal, personalizedBody, htmlBody);
    sheet.getRange(row, 6).setValue("✅ Sent");
    sheet.getRange(row, 7).setValue(template);
    sheet.getRange(row, 4).setValue(new Date());
    sheet.getRange(row, 17).setValue(subjectFinal);
    settings.getRange("B7").setValue(row + 1);
    settings.getRange("B6").setValue(new Date());
    SpreadsheetApp.flush();
    emailsSent++;
    Logger.log(`✅ Sent to: ${email} | Subject: ${subjectFinal}`);
  } catch (err) {
    sheet.getRange(row, 6).setValue("undeliverable");
    sheet.getRange(row, 12).setValue("❌ SendGrid error: " + err.message);
  }
}

}
function isValidEmail(email) {
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email);
}

function sendViaSendGrid(to, subject, plainText, htmlBody) {
  const apiKey = '';
  const senderEmail = 'info@myrealestatecampus.com';

  const payload = {
    personalizations: [{ to: [{ email: to }], subject: subject }],
    from: { email: senderEmail, name: 'Real Estate Campus of Florida' },
    content: [
      { type: 'text/plain', value: plainText || '' },
      { type: 'text/html', value: htmlBody || plainText }
    ]
  };

  const options = {
    method: 'post',
    contentType: 'application/json',
    headers: { Authorization: 'Bearer ' + apiKey },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };

  return UrlFetchApp.fetch('https://api.sendgrid.com/v3/mail/send', options);
}

