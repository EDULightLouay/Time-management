// يستقبل صورة الوصل بدون أي قيد على نوعها أو تاريخها:
// يحفظها في Drive، ويضيف سطراً في Google Sheet، ويرسل إشعاراً إلى Gmail الخاص بحسابك
const SHEET_ID = "1uiw2fdKD0ckJjbr5nLXq6lqz9FSiWkzycxbaW61HY60";
const FOLDER_NAME = "EDU LIGHT - الوصولات";

// لتجربة الرابط من المتصفح: يجب أن تظهر كلمة OK
function doGet() {
  return ContentService.createTextOutput("OK");
}

function doPost(e) {
  try {
    const d = JSON.parse(e.postData.contents);
    const blob = Utilities.newBlob(Utilities.base64Decode(d.data), d.mimeType, d.fileName);

    const folders = DriveApp.getFoldersByName(FOLDER_NAME);
    const folder = folders.hasNext() ? folders.next() : DriveApp.createFolder(FOLDER_NAME);
    const file = folder.createFile(blob);

    const sheet = SpreadsheetApp.openById(SHEET_ID).getSheets()[0];
    if (sheet.getLastRow() === 0) sheet.appendRow(["التاريخ", "الاسم", "الهاتف", "رابط الوصل"]);
    sheet.appendRow([new Date(), d.name, d.phone, file.getUrl()]);

    // فشل الإشعار لا يمنع حفظ الوصل
    try {
      MailApp.sendEmail(
        Session.getEffectiveUser().getEmail(),
        "وصل جديد - EDU LIGHT: " + d.name,
        "الاسم: " + d.name + "\nالهاتف: " + d.phone + "\nالوصل: " + file.getUrl() +
          "\nالشيت: https://docs.google.com/spreadsheets/d/" + SHEET_ID,
        { attachments: [blob] }
      );
    } catch (mailErr) {}

    return jsonOut({ ok: true });
  } catch (err) {
    return jsonOut({ ok: false, reason: "server_error", detail: String(err) });
  }
}

function jsonOut(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON
  );
}
