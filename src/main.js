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

/**
 * Initialize a new SteamUser instance with specific settings.
 * - autoRelogin: Disable automatic re-login to allow custom handling.
 * - renewRefreshTokens: Automatically renew refresh tokens when needed.
 */
let client = new SteamUser({ autoRelogin: false, renewRefreshTokens: true });
let logOnOptions = {};
let reconnectAttempts = 0;

/**
 * Try to read the refresh token from the file system.
 * If a token is found, use it for login; otherwise, fallback to using account credentials.
 */
try {
  let refreshToken = readFileSync("refresh_token.txt").toString("utf8").trim();
  logOnOptions = { refreshToken };
} catch (ex) {
  console.log(
    `[${getUptime()}]`,
    "No refresh token saved. Logging on with account name and password."
  );
  logOnOptions = {
    accountName: "", // steam user
    password: "", // steam password
  };
}

/**
 * Log on to Steam using either a refresh token or account credentials.
 */
client.logOn(logOnOptions);

/**
 * Helper function to get the current date and time for logging purposes.
 * @returns {Date} - The current date and time.
 */
function getUptime() {
  let time = new Date();
  time = time.getHours + time.getMinutes + time.getSeconds
  return time;
}

/**
 * Event handler for successful Steam login.
 * Sets the user's status to 'Online' and starts idling in specific games.
 */
client.on("loggedOn", () => {
  console.log(
    `[${getUptime()}]`,
    "[APP]",
    `Logged on to Steam as`,
    client.steamID.getSteamID64()
  );
  client.setPersona(SteamUser.EPersonaState.Online);
  client.gamesPlayed([730]); // Game IDs to idle
  console.log(`[${getUptime()}]`, "[APP]", "Starting idling");
});

/**
 * Event handler for receiving a new refresh token.
 * The token is saved to 'refresh_token.txt' for future logins without credentials.
 */
client.on("refreshToken", (token) => {
  console.log(`[${getUptime()}]`, "Got new refresh token");
  writeFileSync("refresh_token.txt", token);
});

/**
 * Event handler for receiving a message from a Steam friend.
 * Logs the message sender's Steam ID and the message content.
 */
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

/**
 * Event handler for Steam disconnection.
 * Logs the disconnection, increments the reconnect attempt counter, and triggers a reconnection attempt.
 */
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
    }, 1000 * 120); // Retry after 2 minutes ( we multiply 120ms with 1000ms to calc 2min )
  });
}

/**
 * Event handler for Steam client errors.
 * Handles network errors or specific Steam result codes by attempting to reconnect.
 */
client.on("error", (err) => {
  console.error(`[${getUptime()}]`, "Client error:", err.message);
  if (err.message.includes("getaddrinfo ENOTFOUND") || err.eresult === 3) {
    retryConnection();
  }
});
