const fs = require('node:fs');
const fsp = require('node:fs').promises; // For fs.promises-based async operations
const path = require('path');
const { authenticate } = require('@google-cloud/local-auth');
const { google } = require('googleapis');

const SCOPES = ['https://www.googleapis.com/auth/drive'];
const TOKEN_PATH = path.join(process.cwd(), 'token.json');
const CREDENTIALS_PATH = path.join(process.cwd(), 'credentials.json');

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

module.exports = {
    loadSavedCredentialsIfExist,
    saveCredentials,
    authorize,
};