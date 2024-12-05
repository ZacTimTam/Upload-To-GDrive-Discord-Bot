const { ButtonBuilder, ButtonStyle, SlashCommandBuilder, ActionRowBuilder } = require('discord.js');
const axios = require('axios');
const fs = require('node:fs');
const path = require('path');
const { uploadFile2 } = require('../../components/gdriveUpload');

const activeUploadSessions = new Map();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('multi-upload')
        .setDescription('Start uploading multiple image files. Click "Upload Images" or "Cancel" when finished'),
    async execute(interaction) {
        const userId = interaction.user.id;
        const serverId = interaction.guild.id;

        const upload = new ButtonBuilder()
            .setCustomId('upload')
            .setLabel('Upload Images')
            .setStyle(ButtonStyle.Primary);

        const cancel = new ButtonBuilder()
            .setCustomId('cancel')
            .setLabel('Cancel')
            .setStyle(ButtonStyle.Secondary);

        const row = new ActionRowBuilder().addComponents(upload, cancel);

        if (activeUploadSessions.has(userId)) {
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({
                    content: 'You already have an active upload session. Click "Upload Images" or "Cancel" to finish.',
                    components: [row],
                    ephemeral: true,
                });
            }
            return;
        }

        const sessionFiles = [];
        const collectedFileNames = new Set();

        const collector = interaction.channel.createMessageCollector({
            filter: (message) => message.author.id === userId && message.attachments.some(attachment => attachment.contentType && attachment.contentType.startsWith('image/')),
            time: 300000, // 5 minutes max for the session
        });

        collector.on('collect', (message) => {
            message.attachments.forEach(attachment => {
                if (attachment.contentType.startsWith('image/') && !collectedFileNames.has(attachment.name)) {
                    collectedFileNames.add(attachment.name);
                    sessionFiles.push(attachment);
                }
            });
        });

        activeUploadSessions.set(userId, { collector, files: sessionFiles });

        await interaction.reply({
            content: `Select an action when you have uploaded all the photos:`,
            components: [row],
            ephemeral: true,
        });

        const collectorFilter = i => i.user.id === interaction.user.id;

        try {
            const confirmation = await interaction.channel.awaitMessageComponent({ filter: collectorFilter, time: 300_000 });

            if (confirmation.customId === 'upload') {
                await confirmation.deferReply({ ephemeral: true });

                const { collector, files } = activeUploadSessions.get(userId);
                collector.stop();

                if (files.length === 0) {
                    await confirmation.followUp({ content: 'No files were uploaded during the session.', ephemeral: true });
                    activeUploadSessions.delete(userId);
                    return;
                }

                const downloadDir = path.join(__dirname, '..', 'downloads');
                if (!fs.existsSync(downloadDir)) {
                    fs.mkdirSync(downloadDir, { recursive: true });
                }

                const uploadPromises = files.map(async (file) => {
                    const filePath = path.join(downloadDir, file.name);
                    try {
                        const response = await axios.get(file.url, { responseType: 'stream' });
                        const writer = fs.createWriteStream(filePath);
                        response.data.pipe(writer);

                        await new Promise((resolve, reject) => {
                            writer.on('finish', resolve);
                            writer.on('error', reject);
                        });

                        await uploadFile2(serverId, filePath);
                        await fs.promises.unlink(filePath);
                    } catch (error) {
                        console.error(`Failed to process file ${file.name}:`, error);
                    }
                });

                await Promise.all(uploadPromises);

                activeUploadSessions.delete(userId);
                await confirmation.followUp({ content: 'Photo upload session ended. Photos have been successfully uploaded to Google Drive!', ephemeral: true });
            } else if (confirmation.customId === 'cancel') {
                const { collector } = activeUploadSessions.get(userId) || {};
                if (collector) collector.stop();

                activeUploadSessions.delete(userId);
                await confirmation.update({ content: 'File upload session has been cancelled.', components: [], ephemeral: true });
            }

        } catch (error) {
            console.error('Error during the confirmation handling:', error);

            if (!interaction.replied && !interaction.deferred) {
                await interaction.editReply({ content: 'Upload session timeout after 5 minutes.', components: [] });
            }

            const { collector } = activeUploadSessions.get(userId) || {};
            if (collector) collector.stop();
            activeUploadSessions.delete(userId);
        }
    },
};