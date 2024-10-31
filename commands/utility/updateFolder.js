const { SlashCommandBuilder } = require('discord.js');
const { google } = require('googleapis');
const OAuth2 = google.auth.OAuth2;
require('dotenv').config();
const { getAuthorizedClient } = require('../../components/googleAuth');
const { ServerAuthLite } = require('../../models/ServerAuthLite');
const { validateGoogleDriveFolder } = require('../../components/folderAuth');


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

        try {
            // Get an authorized Google API client
            const authClient = await getAuthorizedClient(serverId);

            // Validate the folder ID
            const isValidFolder = await validateGoogleDriveFolder(authClient, folderId);
            
            if (!isValidFolder) {
                // If folder ID is invalid, inform the user and exit
                await interaction.reply({
                    content: 'The folder ID provided is either invalid or inaccessible. Please verify and try again. If the folder is linked to a different Google account, please re-authenticate using /authenticate.',
                    ephemeral: true
                });
                return;
            }

            // Folder ID is valid, proceed to update the database
            const [serverAuth, created] = await ServerAuthLite.findOrCreate({
                where: { serverId },
                defaults: {
                    driveFolderId: folderId
                }
            });

            if (!created) {
                // If the server entry already exists, update it with the new folder ID
                await serverAuth.update({ driveFolderId: folderId });
            }

            // Confirm successful linking to the user
            await interaction.reply({
                content: `The Google Drive folder has been successfully linked to this server! Folder ID: ${folderId}`,
                ephemeral: true
            });

        } catch (error) {
            console.error('Error linking Google Drive folder:', error);
            await interaction.reply({
                content: 'An error occurred while linking the Google Drive folder. Please try again.',
                ephemeral: true
            });
        }
    }
};