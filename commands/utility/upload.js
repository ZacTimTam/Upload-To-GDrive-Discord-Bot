const { SlashCommandBuilder } = require('discord.js');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('upload')
        .setDescription('Upload a file for processing')
        .addAttachmentOption(option => 
            option.setName('file')
                .setDescription('The file to upload')
                .setRequired(true)),
    async execute(interaction) {
        const file = interaction.options.getAttachment('file');

        if (!file) {
            await interaction.reply({ content: 'No file was provided!', ephemeral: true });
            return;
        }

        // Define the custom download directory
        const downloadDir = path.join(__dirname, '..', 'downloads');

        // Ensure the download directory exists
        if (!fs.existsSync(downloadDir)) {
            fs.mkdirSync(downloadDir, { recursive: true });
        }

        // Set the file path to the custom download directory
        const filePath = path.join(downloadDir, file.name);

        try {
            // Download the file
            const response = await axios.get(file.url, { responseType: 'stream' });

            // Create a write stream to save the file locally
            const writer = fs.createWriteStream(filePath);

            response.data.pipe(writer);

            // Listen for the finish event to confirm the file has been written
            writer.on('finish', async () => {
                await interaction.reply(`File ${file.name} has been successfully downloaded to ${downloadDir}!`);
            });

            writer.on('error', async (error) => {
                console.error(error);
                await interaction.reply({ content: 'There was an error downloading the file.', ephemeral: true });
            });
        } catch (error) {
            console.error(error);
            await interaction.reply({ content: 'Failed to download the file.', ephemeral: true });
        }
    },
};