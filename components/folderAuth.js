const { google } = require('googleapis');

// Function to validate the Google Drive folder ID
async function validateGoogleDriveFolder(auth, folderId) {
    const drive = google.drive({ version: 'v3', auth });

    try {
        // Attempt to create a temporary file in the folder
        const tempFile = await drive.files.create({
            resource: {
                name: 'temp_file_for_validation',
                parents: [folderId]
            },
            media: {
                mimeType: 'text/plain',
                body: 'This is a temporary file for validation purposes'
            },
            fields: 'id'
        });

        // Clean up by deleting the temporary file
        await drive.files.delete({ fileId: tempFile.data.id });

        return true;
    } catch (error) {
        console.error(`Error validating Google Drive folder ID ${folderId}:`, error.message);
        return false;
    }
}
module.exports = {
    validateGoogleDriveFolder
}