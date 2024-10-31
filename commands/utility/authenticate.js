const { SlashCommandBuilder } = require('discord.js');
const { google } = require('googleapis');
const OAuth2 = google.auth.OAuth2;
require('dotenv').config();

// Create an OAuth2 client
const oauth2Client = new OAuth2(
    process.env.CLIENT_ID, // Your Google OAuth Client ID
    process.env.CLIENT_SECRET, // Your Google OAuth Client Secret
    process.env.REDIRECT_URI // Your OAuth Redirect URI
);

// Generate Google OAuth URL
function generateAuthUrl(serverId) {
    return oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: ['https://www.googleapis.com/auth/drive.file'],
        prompt: 'consent',
        state: JSON.stringify({ serverId }) // Pass the server ID and folder ID as state
    });
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('authenticate')
        .setDescription('Authenticate Google account to server to link Google Drive folder'),
    
    async execute(interaction) {
        const serverId = interaction.guild.id;

        const authUrl = generateAuthUrl(serverId);

        await interaction.reply({
            content: `To link Google Drive, please authenticate by clicking [here]( ${authUrl} ).`,
            ephemeral: true,
        });
    }
}