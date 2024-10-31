const { google } = require('googleapis');
const { ServerAuthLite } = require('../models/ServerAuthLite');
require('dotenv').config();


async function getAuthorizedClient(serverId) {
    // Find the server authorization record in SQLite
    const serverAuth = await ServerAuthLite.findOne({ where: { serverId } });

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
            await ServerAuthLite.update(
                {
                    accessToken: credentials.access_token,
                    refreshToken: credentials.refresh_token || serverAuth.refreshToken,
                    expiryDate: credentials.expiry_date
                },
                { where: { serverId } }
            );

            // Set the updated credentials on the OAuth2 client
            oauth2Client.setCredentials(credentials);

        } catch (error) {
            console.error('Error refreshing access token:', error);
            throw new Error('Failed to refresh access token. Please re-authenticate.');
        }
    }

    return oauth2Client;
}


module.exports = {
    getAuthorizedClient,
};

