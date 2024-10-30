const fs = require('node:fs');
const path = require('path');
const { google } = require('googleapis');
const { getAuthorizedClient } = require('../components/googleAuth');
const ServerAuth = require('../models/ServerAuth');
const { ServerAuthLite } = require('../models/ServerAuthLite');

async function uploadFile(authClient, filePath, folderId) {
    const drive = google.drive({ version: 'v3', auth: authClient });
    const fileMetadata = {
        name: path.basename(filePath),
        parents: [folderId],
    };

    // Dynamically import mime
    const mime = (await import('mime')).default;
    const media = {
        mimeType: mime.getType(filePath),
        body: fs.createReadStream(filePath),
    };

    try {
        const response = await drive.files.create({
            resource: fileMetadata,
            media: media,
            fields: 'id',
        });
        console.log(`File ${filePath} uploaded to Google Drive with ID: ${response.data.id}`);
        return response.data.id;
    } catch (error) {
        console.error('Error uploading file to Google Drive:', error);
        throw error;
    }
}

async function uploadFile2(serverId, filePath) {
    try {
        // Get the authorized client for the server
        const authClient = await getAuthorizedClient(serverId);

        // Find the server authorization record in SQLite
        const serverAuth = await ServerAuthLite.findOne({ where: { serverId } });

        if (!serverAuth || !serverAuth.driveFolderId) {
            throw new Error('Google Drive folder not linked for this server.');
        }

        // Initialize the Google Drive API client
        const drive = google.drive({ version: 'v3', auth: authClient });

        const fileMetadata = {
            name: path.basename(filePath),
            parents: [serverAuth.driveFolderId],
        };

        // Dynamically import the mime package
        const mime = (await import('mime')).default;
        const media = {
            mimeType: mime.getType(filePath),
            body: fs.createReadStream(filePath),
        };

        // Upload the file to Google Drive
        const response = await drive.files.create({
            resource: fileMetadata,
            media: media,
            fields: 'id',
        });

        console.log(`File ${filePath} uploaded to Google Drive with ID: ${response.data.id}`);
        return response.data.id;
    } catch (error) {
        console.error('Error uploading file to Google Drive:', error);
        throw error;
    }
}

module.exports = {
    uploadFile,
    uploadFile2
}