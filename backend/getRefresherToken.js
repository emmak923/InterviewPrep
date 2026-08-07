require("dotenv").config();
const { google } = require("googleapis");
const readline = require("readline");

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

const oauth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  "http://localhost",
);

const scopes = ["https://www.googleapis.com/auth/gmail.send"];

console.log(oauth2Client.redirectUri);
const authUrl = oauth2Client.generateAuthUrl({
  access_type: "offline",
  scope: scopes,
  prompt: "consent",
  include_granted_scopes: true,
});

console.log("Authorize this app by visiting this url:");
console.log(authUrl);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

rl.question("Enter the code here: ", async (code) => {
  try {
    const { tokens } = await oauth2Client.getToken(code);

    console.log("Refresh Token:");
    console.log(tokens.refresh_token);
  } catch (error) {
    console.log("ERROR:");
    console.log(error);
  } finally {
    rl.close();
  }
});
