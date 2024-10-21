const { SlashCommandBuilder } = require('discord.js');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Import the activeUploadSessions map from startupload.js
const { activeUploadSessions } = require('./startupload');

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

        // Define the download directory in the root folder's downloads directory
        const downloadDir = path.join(__dirname, '..', 'downloads');

        // Ensure the download directory exists
        if (!fs.existsSync(downloadDir)) {
            fs.mkdirSync(downloadDir, { recursive: true });
        }

        // Download each collected file
        for (const file of files) {
            const filePath = path.join(downloadDir, file.name);

            try {
                // Download the file
                const response = await axios.get(file.url, { responseType: 'stream' });

                // Create a write stream to save the file locally
                const writer = fs.createWriteStream(filePath);

                response.data.pipe(writer);

                // Handle stream events to confirm the file writing success or errors
                writer.on('finish', () => {
                    console.log(`File ${file.name} has been successfully downloaded to ${downloadDir}!`);
                });

                writer.on('error', (error) => {
                    console.error('Error writing file:', error);
                });
            } catch (error) {
                console.error('Failed to download the file:', error);
            }
        }

        // Clean up the session
        activeUploadSessions.delete(userId);

        // Send a follow-up message after processing is complete
        await interaction.followUp({ content: 'File upload session ended and files processed.' });
    },
};