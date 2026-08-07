const { google } = require("googleapis");
const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REFRESH_TOKEN = process.env.GOOGLE_REFRESH_TOKEN;
const SENDER_EMAIL = process.env.GOOGLE_SENDER_EMAIL;
const oAuth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET);
oAuth2Client.setCredentials({ refresh_token: REFRESH_TOKEN });
console.log("CLIENT_ID:", CLIENT_ID);
console.log("CLIENT_SECRET:", CLIENT_SECRET ? "OK" : "undefined");
console.log("REFRESH_TOKEN:", REFRESH_TOKEN ? "OK" : "undefined");
console.log("SENDER_EMAIL:", SENDER_EMAIL);
const gmail = google.gmail({ version: "v1", auth: oAuth2Client });
async function sendEmail(to, subject, message) {
  try {
    const rawEmail = [
      `From: InterviewPrep App <${SENDER_EMAIL}>`,
      `To: ${to}`,
      `Subject: ${subject}`,
      "Content-Type: text/html; charset=UTF-8",
      "",
      `<p>${message}</p>`,
    ];
    const composedEmail = rawEmail.join("\n");
    const encodedEmail = Buffer.from(composedEmail)
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
    await gmail.users.messages.send({
      userId: "me",
      requestBody: {
        raw: encodedEmail,
      },
    });
    return true;
  } catch (error) {
    console.log(`Error sending email: `, error);
    return false;
  }
}
module.exports = sendEmail;
