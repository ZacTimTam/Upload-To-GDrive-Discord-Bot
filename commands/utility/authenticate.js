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
        .setDescription('Authenticate with Google Drive to link a folder to this server.'),

    async execute(interaction) {
        const serverId = interaction.guild.id;

        try {
            // Defer reply to avoid the 3-second timeout error.
            await interaction.deferReply({ ephemeral: true });

            // Generate the authentication URL for the user to click.
            const authUrl = generateAuthUrl(serverId);

            // Send the authentication link to the user.
            await interaction.editReply({
                content: `Please authenticate with Google Drive by clicking [here]( ${authUrl} ).`,
                ephemeral: true
            });
        } catch (error) {
            console.error('Error executing /authenticate:', error);

            // Ensure we only edit the reply, as the interaction is deferred.
            await interaction.editReply({
                content: 'An error occurred during authentication. Please try again.',
                ephemeral: true
            });
        }
    }
};