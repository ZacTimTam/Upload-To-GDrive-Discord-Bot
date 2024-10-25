const fs = require('node:fs');
const fsp = require('node:fs').promises; // For fs.promises-based async operations
const path = require('path');
const { authenticate } = require('@google-cloud/local-auth');
const { google } = require('googleapis');
const ServerAuth = require('../models/ServerAuth');

const SCOPES = ['https://www.googleapis.com/auth/drive'];
const TOKEN_PATH = path.join(process.cwd(), 'token.json');
const CREDENTIALS_PATH = path.join(process.cwd(), 'credentials.json');
require('dotenv').config();



/**
 * Loads saved credentials if they exist.
 * @returns {Promise<google.auth.OAuth2|null>} The OAuth2 client or null if no credentials are found.
 */
async function loadSavedCredentialsIfExist() {
    try {
        const content = await fsp.readFile(TOKEN_PATH, 'utf8');
        const credentials = JSON.parse(content);
        return google.auth.fromJSON(credentials);
    } catch (err) {
        return null;
    }
}

/**
 * Saves the given OAuth2 client credentials to the token file.
 * @param {google.auth.OAuth2} client The OAuth2 client with credentials to save.
 */
async function saveCredentials(client) {
    const content = await fsp.readFile(CREDENTIALS_PATH, 'utf8');
    const keys = JSON.parse(content);
    const key = keys.installed || keys.web;
    const payload = JSON.stringify({
        type: 'authorized_user',
        client_id: key.client_id,
        client_secret: key.client_secret,
        refresh_token: client.credentials.refresh_token,
    });
    await fsp.writeFile(TOKEN_PATH, payload);
}

/**
 * Authorizes the application with the Google API.
 * @returns {Promise<google.auth.OAuth2>} The authorized OAuth2 client.
 */
async function authorize() {
    let client = await loadSavedCredentialsIfExist();
    if (client) {
        return client;
    }
    client = await authenticate({
        scopes: SCOPES,
        keyfilePath: CREDENTIALS_PATH,
    });
    if (client.credentials) {
        await saveCredentials(client);
    }
    return client;
}

async function getAuthorizedClient(serverId) {
    const serverAuth = await ServerAuth.findOne({ serverId });

    if (!serverAuth) {
        throw new Error('Server not authenticated.');
    }

    // Initialize the OAuth2 client
    const oauth2Client = new google.auth.OAuth2(
        process.env.CLIENT_ID,        // Your Google OAuth Client ID
        process.env.CLIENT_SECRET,    // Your Google OAuth Client Secret
        process.env.REDIRECT_URI      // Your OAuth Redirect URI
    );

    // Set the credentials on the OAuth2 client
    oauth2Client.setCredentials({
        access_token: serverAuth.accessToken,
        refresh_token: serverAuth.refreshToken,
        expiry_date: serverAuth.expiryDate
    });

    // Refresh the token if it has expired
    if (new Date() > new Date(serverAuth.expiryDate)) {
        try {
            const { credentials } = await oauth2Client.refreshAccessToken();
            // Update the server's credentials in the database
            await ServerAuth.findOneAndUpdate(
                { serverId },
                {
                    accessToken: credentials.access_token,
                    refreshToken: credentials.refresh_token || serverAuth.refreshToken,
                    expiryDate: credentials.expiry_date
                }
            );
            oauth2Client.setCredentials(credentials);
        } catch (error) {
            console.error('Error refreshing access token:', error);
            throw new Error('Failed to refresh access token. Please re-authenticate.');
        }
    }

    return oauth2Client;
}

module.exports = {
    loadSavedCredentialsIfExist,
    saveCredentials,
    authorize,
    getAuthorizedClient,
};

