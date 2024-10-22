const fs = require('node:fs');
const path = require('path');
const { google } = require('googleapis');

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

module.exports = {
    uploadFile,
}