const { SlashCommandBuilder } = require('discord.js');
const axios = require('axios');
const fs = require('node:fs');
const path = require('path');
const { google } = require('googleapis');
const { authorize } = require('../../components/googleAuth'); // Import the authorize function from googleAuth.js
const { uploadFile } = require('../../components/gdriveUpload');

// Import the activeUploadSessions map from startupload.js
const { activeUploadSessions } = require('./startupload');

const GOOGLE_DRIVE_FOLDER_ID = '1bdUfktk6-84iorby0fJlnbaYis9xIk1z'; // Replace with your Google Drive folder ID


// The endupload command implementation
module.exports = {
    data: new SlashCommandBuilder()
        .setName('endupload')
        .setDescription('End the file upload session and process the uploaded files.'),
    async execute(interaction) {
        const userId = interaction.user.id;

        if (!activeUploadSessions.has(userId)) {
            await interaction.reply({ content: 'You do not have an active upload session.', ephemeral: true });
            return;
        }

        // Defer the reply to allow more time for processing
        await interaction.deferReply({ ephemeral: true });

        // Get the session data and stop the collector
        const { collector, files } = activeUploadSessions.get(userId);
        collector.stop();

        if (files.length === 0) {
            await interaction.followUp({ content: 'No files were uploaded during the session.' });
            activeUploadSessions.delete(userId);
            return;
        }

        // Define the download directory
        const downloadDir = path.join(__dirname, '..', 'downloads');

        // Ensure the download directory exists
        if (!fs.existsSync(downloadDir)) {
            fs.mkdirSync(downloadDir, { recursive: true });
        }

        // Authorize the Google Drive API
        let authClient;
        try {
            authClient = await authorize();
        } catch (err) {
            console.error('Failed to authorize Google Drive:', err);
            await interaction.followUp({ content: 'Failed to authorize Google Drive.' });
            return;
        }

        // Download and upload each collected file
        for (const file of files) {
            const filePath = path.join(downloadDir, file.name);

            try {
                // Download the file
                const response = await axios.get(file.url, { responseType: 'stream' });
                const writer = fs.createWriteStream(filePath);
                response.data.pipe(writer);

                await new Promise((resolve, reject) => {
                    writer.on('finish', resolve);
                    writer.on('error', reject);
                });

                console.log(`File ${file.name} has been successfully downloaded to ${downloadDir}!`);

                // Upload the file to Google Drive
                await uploadFile(authClient, filePath, GOOGLE_DRIVE_FOLDER_ID);

                // Delete the local file after upload
                fs.unlinkSync(filePath);
                console.log(`File ${file.name} deleted from local storage.`);
            } catch (error) {
                console.error('Failed to download or upload the file:', error);
            }
        }

        // Clean up the session
        activeUploadSessions.delete(userId);

        // Send a follow-up message after processing is complete
        await interaction.followUp({ content: 'File upload session ended and files processed.' });
    },
};