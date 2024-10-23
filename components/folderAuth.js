const { google } = require('googleapis');

// Function to validate the Google Drive folder ID
async function validateGoogleDriveFolder(auth, folderId) {
    const drive = google.drive({ version: 'v3', auth });

    try {
        // Get the file metadata
        const response = await drive.files.get({
            fileId: folderId,
            fields: 'id, mimeType',
        });

        const file = response.data;

        // Check if the file is a folder
        if (file.mimeType === 'application/vnd.google-apps.folder') {
            console.log(`Folder ID ${folderId} is valid.`);
            return true;
        } else {
            console.log(`The provided ID ${folderId} is not a folder.`);
            return false;
        }
    } catch (error) {
        if (error.response && error.response.status === 404) {
            console.log(`Folder ID ${folderId} does not exist.`);
        } else {
            console.log(`Error validating folder ID ${folderId}:`, error.message);
        }
        return false;
    }
}

module.exports = {
    validateGoogleDriveFolder
}