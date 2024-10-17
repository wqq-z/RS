# Steam Hour Boost (Self-Hosted) with Node.js

### Overview

This project is a simple self-hosted solution that allows you to boost your Steam hours by automatically logging into your account and idling in specified games. The script handles logging in with a stored refresh token or Steam credentials and automatically reconnects in case of disconnections or network issues.

### Motivation

The motivation behind this project is that i was bored and decided to waste my time into this isntead of studying for my math exam for 10/19/24. This script will log into your Steam account and idle in games for you, allowing you to farm hours effortlessly when hosted in a secure location.

## Features

- **Automatic Steam login**: Supports logging in via stored refresh tokens or Steam credentials.
- **Game idling**: Idles in the specified games to accumulate hours.
- **Automatic reconnection**: Handles disconnections and network errors gracefully, retrying login attempts as needed.
- **Token storage**: Refresh tokens are saved for future logins, reducing the need to enter credentials frequently.

## Installation

1. **Clone the repository:**

   ```bash
   git clone https://github.com/yourusername/steam-hour-boost.git
   cd steam-hour-boost
   ```

2. **Install dependencies:**

   Ensure you have Node.js installed, then run:

   ```bash
   npm install
   ```

3. **Configuration:**

   - Edit the script to input your Steam account credentials in case no refresh token is available.
   - Alternatively, log in once and allow the script to save a refresh token for future use.

## Usage

1. **Run the script:**

   ```bash
   node src/main.js
   ```

2. **What it does:**

   - If a refresh token is saved, the script will use it to log in.
   - If no token is found, it will use your account credentials.
   - After logging in, the script will set your Steam status to online and idle in specified games.
   - It will automatically handle reconnecting in case of disconnections.

## Code Overview

### Initialization

The script starts by importing the necessary modules and initializing a `SteamUser` client. It reads from a saved refresh token if available, or falls back to using your account credentials.

```javascript
const SteamUser = require("steam-user");
const { readFileSync, writeFileSync } = require("fs");

let client = new SteamUser({ autoRelogin: false, renewRefreshTokens: true });
```

### Log in and Token Management

It attempts to log in using either a refresh token or credentials:

```javascript
try {
  let refreshToken = readFileSync("refresh_token.txt").toString("utf8").trim();
  logOnOptions = { refreshToken };
} catch (ex) {
  logOnOptions = {
    accountName: "your-steam-username",
    password: "your-steam-password",
  };
}
client.logOn(logOnOptions);
```

### Game Idling

After successful login, the script sets your Steam status to online and idles in a specified game (default: CS2, App ID 730).

```javascript
client.on("loggedOn", () => {
  client.setPersona(SteamUser.EPersonaState.Online);
  client.gamesPlayed([730]); // You can modify the game IDs here
});
```

### Reconnection Logic

The script handles disconnections and attempts to reconnect every 2 minutes:

```javascript
client.on("disconnected", () => {
  reconnectAttempts++;
  retryConnection();
});

async function retryConnection() {
  return new Promise((resolve) => {
    setTimeout(() => {
      client.logOn(logOnOptions);
      resolve();
    }, 1000 * 120); // Retry after 2 minutes
  });
}
```

## Customization

You can customize the games you want to idle in by replacing the game IDs in the script:

```javascript
client.gamesPlayed([730]); // Replace 730 with other game IDs
```

For example, you can idle in multiple games by adding more game IDs:

```javascript
client.gamesPlayed([730, 440, 570]); // CS2, Team Fortress 2, Dota 2
```

## Dependencies

- [steam-user](https://www.npmjs.com/package/steam-user) - A Node.js library for interacting with Steam's API.

## Contributing

Feel free to fork this repository and make your own changes. Contributions are always welcome!

## License

This project is not under a licence yet. :)
