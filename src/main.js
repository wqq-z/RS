/**
 * STEAM HOUR BOOST (SELF-HOST) with Node.js
 *
 * The motivation of this project is that i was bored. Nothing more...
 * So i create this piece of code that literaly login into your account and
 * farm hours for you just host them in a safe place.
 *
 * This script manages logging in either with a stored refresh token or via credentials and
 * handles reconnections in the event of network errors or disconnections.
 *
 * All Code use steam-user so you can go to https://www.npmjs.com/package/steam-user for docs.
 */
const SteamUser = require("steam-user");
const { readFileSync, writeFileSync } = require("fs");
const config = require('./config')

let client = new SteamUser({ autoRelogin: false, renewRefreshTokens: true });
let logOnOptions = {};
let reconnectAttempts = 0;

try {
  let refreshToken = readFileSync("refresh_token.txt").toString("utf8").trim();
  logOnOptions = { refreshToken };
} catch (ex) {
  console.log(
    `[${getUptime()}]`,
    "No refresh token saved. Logging on with account name and password."
  );
  logOnOptions = {
    accountName: config.accountName,
    password: config.accountPasswd
  };
}

client.logOn(logOnOptions);

function getUptime() {
  const date = new Date();

  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  
  let time = `${hours}:${minutes}:${seconds}`;
  
  return time
}

client.on("loggedOn", () => {
  console.log(
    `[${getUptime()}]`,
    "[APP]",
    `Logged on to Steam as`,
    client.steamID.getSteamID64()
  );
  client.setPersona(SteamUser.EPersonaState.Online);
  client.gamesPlayed(config.gamesToIdle); // Game IDs to idle
  console.log(`[${getUptime()}]`, "[APP]", "Starting idling");
});

client.on("refreshToken", (token) => {
  console.log(`[${getUptime()}]`, "Got new refresh token");
  writeFileSync("refresh_token.txt", token);
});


client.on("friendMessage", (steamID, message) => {
  console.log(
    `[${getUptime()}]`,
    "Friend message from " + steamID.getSteam3RenderedID() + ": " + message
  );
  /*
   * You can handle message reply using
   *   client.chatMessage(steamID, "your message")
   */
});

client.on("disconnected", (eresult, message) => {
  console.log(`[${getUptime()}]`, "Client Disconnected:", eresult, message);
  reconnectAttempts++;
  console.log(
    `[${getUptime()}]`,
    `Attempting to reconnect... (Attempt ${reconnectAttempts})`
  );
  retryConnection();
});

/**
 * Function to handle reconnecting to Steam after a disconnection.
 * Waits for 2 minutes before attempting to log in again. If the user is already logged on, it triggers a relog.
 * @returns {Promise<void>} - Resolves when the reconnection attempt is complete.
 */
async function retryConnection() {
  return new Promise((resolve) => {
    setTimeout(() => {
      try {
        if (!client.loggedOn) {
          // Only log in if not already logged on
          client.logOn(logOnOptions);
          console.log(`[${getUptime()}]`, "Reconnecting...");
        } else {
          client.relog();
          console.log(`[${getUptime()}]`, "Already logged on, relog.");
        }
        resolve();
      } catch (err) {
        console.error(
          `[${getUptime()}] Error during reconnection:`,
          err.message
        );
      }
    }, 300000);
  });
}

/**
 * Handle connection errors, such as getaddrinfo EAI_AGAIN or any similar temporary network issues.
 * EAI_AGAIN means a temporary DNS resolution issue, so we implement a retry mechanism.
 */
client.on("error", (err) => {
  console.error(`[${getUptime()}]`, "Client error:", err.message);
  
  // If the error is EAI_AGAIN, retry after a short delay (10 seconds)
  if (err.message.includes("getaddrinfo EAI_AGAIN")) {
    console.log(`[${getUptime()}]`, "Temporary DNS resolution issue. Retrying in 10 seconds...");
    
    // Retry the connection after 10 seconds
    setTimeout(() => {
      retryConnection();
    }, 10000);  // 10 seconds delay
  } else if (err.message.includes("getaddrinfo ENOTFOUND") || err.eresult === 3) {
    retryConnection();
  }
});
