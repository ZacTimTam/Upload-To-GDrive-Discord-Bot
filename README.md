# Google Drive Discord Bot

A Discord bot that allows users to link Google Drive folders, upload images directly from Discord, and manage folder settings. Ideal for sharing images within a server and storing them in a specific Google Drive folder. This bot leverages OAuth 2.0 for secure Google Drive access and is built using Node.js and Discord.js.

## Features

- **Google Drive Authentication**: Link a Google Drive account for bot access to a specified folder.
- **Folder Linking**: Set and update the Google Drive folder location for each server.
- **Multi-Image Uploads**: Start an upload session to gather multiple images, which are then stored in the linked Google Drive folder.
- **Session Management**: Track and manage upload sessions for each user.
- **Command Help**: In-bot help with `/help` command to provide guidance on using the bot commands.

## Commands

| Command            | Description                                                                                 |
|--------------------|---------------------------------------------------------------------------------------------|
| **/authenticate**  | Link your Google Drive account for bot access.                                              |
| **/setfolder**     | Set or update the Google Drive folder location for file uploads.                            |
| **/multi-upload**  | Start a session to upload multiple images to Google Drive.                                  |
| **/endupload**     | End an active upload session.                                                               |
| **/help**          | Display help information on using the bot’s commands.                                       |

## Setup

### Requirements

- **Node.js** v16 or higher
- **Discord.js** v14 or higher
- **PM2** for process management (optional)
- **Google Cloud Console** account for Google Drive API credentials
- **Cloudflare Tunnel** for local development (optional)

### Step 1: Google Cloud Setup

1. Go to the [Google Cloud Console](https://console.cloud.google.com/) and create a new project.
2. Enable the Google Drive API.
3. Create OAuth 2.0 credentials. Set the authorized redirect URI to your server’s address or `http://localhost:3000/oauth2callback` if testing locally.
4. Save the `client_id`, `client_secret`, and `redirect_uri`.

### Step 2: Project Setup

1. **Clone the Repository**:
   ```bash
   git clone <repository_url>
   cd <repository_directory>
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Create a `.env` file in the root directory and add the following variables:
   ```env
   CLIENT_ID=your_google_client_id
   CLIENT_SECRET=your_google_client_secret
   REDIRECT_URI=your_redirect_uri
   DISCORD_TOKEN=your_discord_bot_token
   ```

4. **Add Bot Client ID and Token**:
   Edit `config.json` to include your bot’s `clientId` and `token`:
   ```json
   {
       "clientId": "YOUR_BOT_CLIENT_ID",
       "token": "YOUR_BOT_TOKEN"
   }
   ```

### Step 3: Deploy Commands

To make the bot's commands available to all servers or specific servers where the bot is added, use the `deploy-commands-globally.js` script.

1. **Ensure your Bot is Active**  
   Start your bot on your local server or hosted environment to confirm it's running without errors.

2. **Deploy Commands Globally**

   Run the following command in your terminal to deploy the bot commands globally. This may take up to an hour for commands to become available on all servers:

   ```bash
   node deploy-commands-globally.js
    ```

> **Note**: Global commands can take up to an hour to propagate across Discord.

For specific server for testing, use the `deploy-commands.js` script.

### Step 4: Start the Bot

You can start the bot using either Node.js.

#### Using Node
```bash
node server.js
```

## Usage

1. **Authenticate with Google Drive**: Run `/authenticate` to link your Google Drive account to the bot.
2. **Set Google Drive Folder**: Use `/setfolder` with the folder ID where files will be uploaded.
3. **Upload Images**: Start an upload session using `/multi-upload`.
4. **End Upload Session**: Conclude the session using `/endupload`.

## Troubleshooting

- **Error 400: redirect_uri_mismatch**: Ensure the redirect URI in Google Cloud Console matches the `REDIRECT_URI` in your `.env` file.
- **Unknown Interaction Errors**: Verify command deployment and allow some time for Discord propagation.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for more details.