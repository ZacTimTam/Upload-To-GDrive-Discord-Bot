const { SlashCommandBuilder } = require('discord.js');
const { google } = require('googleapis');
const ServerAuth = require('../../models/ServerAuth');
const OAuth2 = google.auth.OAuth2;
require('dotenv').config();

// Create an OAuth2 client
const oauth2Client = new OAuth2(
    process.env.CLIENT_ID, // Your Google OAuth Client ID
    process.env.CLIENT_SECRET, // Your Google OAuth Client Secret
    process.env.REDIRECT_URI // Your OAuth Redirect URI
);

// Generate Google OAuth URL
function generateAuthUrl(serverId, folderId) {
    return oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: ['https://www.googleapis.com/auth/drive.file'],
        prompt: 'consent',
        state: JSON.stringify({ serverId, folderId }) // Pass the server ID and folder ID as state
    });
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setfolder')
        .setDescription('Link a Google Drive folder to this server.')
        .addStringOption(option =>
            option.setName('id')
                .setDescription('The Google Drive folder ID')
                .setRequired(true)
        ),

    async execute(interaction) {
        const folderId = interaction.options.getString('id');
        const serverId = interaction.guild.id;

        // Generate the OAuth URL with the serverId and folderId as state
        const authUrl = generateAuthUrl(serverId, folderId);

        // Send the authentication URL to the user
        await interaction.reply({
            content: `To link Google Drive, please authenticate by clicking [here]( ${authUrl} ).`,
            ephemeral: true
        });
    }
};