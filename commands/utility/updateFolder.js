const FolderLocation = require("../../models/folderLocation");
const { SlashCommandBuilder } = require('discord.js');
const { authorize } = require('../../components/googleAuth');
const { validateGoogleDriveFolder } = require('../../components/folderAuth');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setfolder')
        .setDescription('Set or update the Google Drive folder location for this server.')
        .addStringOption(option =>
            option.setName('id')
                .setDescription('The Google Drive folder location ID')
                .setRequired(true)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        const folderPathId = interaction.options.getString('id');
        const selectedServerId = interaction.guild.id;

        try {
            // Authorize the Google API
            const auth = await authorize();

            const isValidFolder = await validateGoogleDriveFolder(auth, folderPathId);
            if(!isValidFolder){
                await interaction.reply({ content: 'The provided folder ID is not valid or is not accessible.', ephemeral: true });
                return;
            }

            // Upsert the folder location for the server
            await FolderLocation.findOneAndUpdate(
                { serverId: selectedServerId }, 
                { $set: { locationId: folderPathId } },
                { upsert: true, new: true }
            );

            // Send a confirmation message
            await interaction.reply({ content: `Folder location updated to ID: ${folderPathId}`, ephemeral: true });
            console.log(`Folder location for server ${selectedServerId} set to: ${folderPathId}`);
        } catch (error) {
            console.error('Error setting/updating folder location:', error);
            // Inform the user about the error
            await interaction.reply({ content: 'There was an error updating the folder location. Please try again later.', ephemeral: true });
        }
    }
};