const { SlashCommandBuilder } = require('discord.js');

// Store active upload sessions
const activeUploadSessions = new Map();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('startupload')
        .setDescription('Start uploading multiple image files. Use /endupload to finish.'),
    async execute(interaction) {
        const userId = interaction.user.id;

        if (activeUploadSessions.has(userId)) {
            await interaction.reply({ content: 'You already have an active upload session. Use /endupload to finish.', ephemeral: true });
            return;
        }

        // Start a new upload session
        const sessionFiles = [];
        const collectedFileNames = new Set(); // Track collected file names to prevent duplicates
        console.log(`Starting upload session for user: ${userId}`);

        // Create a message collector that collects messages with image attachments from the user
        const collector = interaction.channel.createMessageCollector({
            filter: (message) => {
                return message.author.id === userId && message.attachments.some(attachment => {
                    // Check if the attachment is an image by looking at the MIME type
                    return attachment.contentType && attachment.contentType.startsWith('image/');
                });
            },
            time: 300000, // 5 minutes max for the session
        });

        // Store the session details
        activeUploadSessions.set(userId, { collector, files: sessionFiles });

        await interaction.reply({ content: 'Upload session started. Please upload your images now and use /endupload when done.', ephemeral: true });

        // Log that the collector has started
        console.log('Message collector has started.');

        // Collect messages with image attachments from the user
        collector.on('collect', (message) => {
            // Process each image attachment in the message
            message.attachments.forEach((attachment) => {
                if (attachment.contentType && attachment.contentType.startsWith('image/')) {
                    // Check for duplicate file names
                    if (!collectedFileNames.has(attachment.name)) {
                        collectedFileNames.add(attachment.name);
                        sessionFiles.push({ name: attachment.name, url: attachment.url });
                        console.log(`Collected image file: ${attachment.name}`);

                        // Provide feedback to the user
                        interaction.followUp({ content: `Collected image: ${attachment.name}`, ephemeral: true });
                    } else {
                        console.log(`Duplicate image file skipped: ${attachment.name}`);
                    }
                }
            });
        });

        // Handle when the collector ends (time limit reached)
        collector.on('end', (collected) => {
            console.log(`Collector ended. Total messages collected: ${collected.size}`);
            if (activeUploadSessions.has(userId)) {
                activeUploadSessions.delete(userId);
                console.log(`Upload session for ${userId} has ended.`);
            }
        });
    },
};

// Export the activeUploadSessions map to be shared with the endupload command
module.exports.activeUploadSessions = activeUploadSessions;