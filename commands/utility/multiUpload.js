const { ButtonBuilder, ButtonStyle, SlashCommandBuilder, ActionRowBuilder } = require('discord.js');
const axios = require('axios');
const fs = require('node:fs');
const path = require('path');
const { google } = require('googleapis');
const { authorize } = require('../../components/googleAuth');
const { uploadFile } = require('../../components/gdriveUpload');
const FolderLocation = require("../../models/folderLocation");

const activeUploadSessions = new Map();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('multi-upload')
        .setDescription('Start uploading multiple image files. Click "Upload Images" or "Cancel" when finished'),
    async execute(interaction) {
        const userId = interaction.user.id;

        const folderLocation = await FolderLocation.findOne({ serverId: interaction.guild.id });
        const GOOGLE_DRIVE_FOLDER_ID = folderLocation ? folderLocation.locationId : null;

        if (!GOOGLE_DRIVE_FOLDER_ID) {
            // Handle the case where the folder location is not set
            await interaction.reply({ content: 'Folder location is not set for this server. Please set it using the /setfolder command.', ephemeral: true });
            return;
        }

        if (activeUploadSessions.has(userId)) {
            await interaction.reply({ content: 'You already have an active upload session. Click "Upload Images" or "Cancel" to finish.', ephemeral: true });
            return;
        }

        const upload = new ButtonBuilder()
            .setCustomId('upload')
            .setLabel('Upload Images')
            .setStyle(ButtonStyle.Primary);

        const cancel = new ButtonBuilder()
            .setCustomId('cancel')
            .setLabel('Cancel')
            .setStyle(ButtonStyle.Secondary);

        const row = new ActionRowBuilder().addComponents(upload, cancel);

        const sessionFiles = [];
        const collectedFileNames = new Set(); // Track collected file names to prevent duplicates
        console.log(`Starting upload session for user: ${userId}`);

        const collector = interaction.channel.createMessageCollector({
            filter: (message) => message.author.id === userId && message.attachments.some(attachment => attachment.contentType && attachment.contentType.startsWith('image/')),
            time: 300000, // 5 minutes max for the session
        });

        collector.on('collect', (message) => {
            message.attachments.forEach(attachment => {
                if (attachment.contentType.startsWith('image/') && !collectedFileNames.has(attachment.name)) {
                    // Add the file name to the set to avoid duplicates
                    collectedFileNames.add(attachment.name);
                    sessionFiles.push(attachment);
                    console.log(`Collected image file: ${attachment.name}`);
                } else {
                    console.log(`Duplicate image file skipped: ${attachment.name}`);
                }
            });
        });

        activeUploadSessions.set(userId, { collector, files: sessionFiles });

        const response = await interaction.reply({
            content: `Select an action when you have uploaded all the photos:`,
            components: [row],
            ephemeral: true,
        });

        const collectorFilter = i => i.user.id === interaction.user.id;

        try {
            const confirmation = await response.awaitMessageComponent({ filter: collectorFilter, time: 300_000 });

            if (confirmation.customId === 'upload') {
                await confirmation.deferReply({ ephemeral: true });

                const { collector, files } = activeUploadSessions.get(userId);
                collector.stop();

                if (files.length === 0) {
                    await confirmation.followUp({ content: 'No files were uploaded during the session.', ephemeral: true });
                    activeUploadSessions.delete(userId);
                    return;
                }

                // Authorize Google Drive once and reuse the client
                let authClient;
                try {
                    authClient = await authorize();
                } catch (err) {
                    console.error('Failed to authorize Google Drive:', err);
                    await confirmation.followUp({ content: 'Failed to authorize Google Drive.', ephemeral: true });
                    activeUploadSessions.delete(userId);
                    return;
                }

                // Download and upload files in parallel
                const downloadDir = path.join(__dirname, '..', 'downloads');
                if (!fs.existsSync(downloadDir)) {
                    fs.mkdirSync(downloadDir, { recursive: true });
                }

                const uploadPromises = files.map(async (file) => {
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
                        await fs.promises.unlink(filePath);
                        console.log(`File ${file.name} deleted from local storage.`);
                    } catch (error) {
                        console.error(`Failed to process file ${file.name}:`, error);
                    }
                });

                // Wait for all uploads to complete
                await Promise.all(uploadPromises);

                activeUploadSessions.delete(userId);
                await confirmation.followUp({ content: 'Photo upload session ended. Photos have been successfully uploaded to Google Drive!', ephemeral: true });
            } else if (confirmation.customId === 'cancel') {
                await confirmation.update({ content: 'File upload session has been cancelled.', components: [], ephemeral: true });
                activeUploadSessions.delete(userId);
            }

        } catch (error) {
            console.error('Error during the confirmation handling:', error);
            await interaction.editReply({ content: 'Upload session timeout after 5 minutes.', components: [] });
        }
    },
};