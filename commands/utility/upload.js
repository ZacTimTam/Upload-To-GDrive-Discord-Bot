const { SlashCommandBuilder } = require('discord.js');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { authorize } = require('../../components/googleAuth');
const { uploadFile } = require('../../components/gdriveUpload');
const FolderLocation = require("../../models/folderLocation");
const { validateGoogleDriveFolder } = require('../../components/folderAuth');

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

        const folderLocation = await FolderLocation.findOne({ serverId: interaction.guild.id });
        const GOOGLE_DRIVE_FOLDER_ID = folderLocation ? folderLocation.locationId : null;

        if (!GOOGLE_DRIVE_FOLDER_ID) {
            // Handle the case where the folder location is not set
            await interaction.reply({ content: 'Folder location is not set for this server. Please set it using the /setfolder command.', ephemeral: true });
            return;
        }

        if (!file) {
            await interaction.reply({ content: 'No file was provided!', ephemeral: true });
            return;
        }

        const downloadDir = path.join(__dirname, '..', 'downloads');

        if (!fs.existsSync(downloadDir)) {
            fs.mkdirSync(downloadDir, { recursive: true });
        }

        const filePath = path.join(downloadDir, file.name);

        let authClient;
        try {
            authClient = await authorize();
        } catch (err) {
            console.log('Failed to authorize Google Drive', err);
            await interaction.reply({ content: 'Failed to authorize Google Drive.', ephemeral: true });
            return;
        }

        try {
            const response = await axios.get(file.url, { responseType: 'stream' });

            await new Promise((resolve, reject) => {
                const writer = fs.createWriteStream(filePath);
                response.data.pipe(writer);
                writer.on('finish', resolve);
                writer.on('error', reject);
            });

            await interaction.reply(`File ${file.name} has been successfully downloaded to ${downloadDir}!`);
            await uploadFile(authClient, filePath, GOOGLE_DRIVE_FOLDER_ID);

            await fs.promises.unlink(filePath);
            console.log(`File ${file.name} deleted from local storage.`);
        } catch (error) {
            console.error(error);
            await interaction.reply({ content: 'Failed to process the file.', ephemeral: true });
        }
    },
};