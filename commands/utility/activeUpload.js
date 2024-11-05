const { ButtonBuilder, ButtonStyle, SlashCommandBuilder, ActionRowBuilder } = require('discord.js');
const ServerActiveFolder = require('../../models/ServerActiveFolder');
const { ServerAuthLite } = require('../../models/ServerAuthLite');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('active-upload')
        .setDescription('The bot will actively upload any images posted to this channel to the Google Drive folder'),

    async execute(interaction) {
        const serverId = interaction.guild.id;
        const channelId = interaction.channel.id;

        const disable = new ButtonBuilder()
            .setCustomId('disable')
            .setLabel('Disable')
            .setStyle(ButtonStyle.Danger);

        const enable = new ButtonBuilder()
            .setCustomId('enable')
            .setLabel('Enable')
            .setStyle(ButtonStyle.Success);

        const cancel = new ButtonBuilder()
            .setCustomId('cancel')
            .setLabel('Cancel')
            .setStyle(ButtonStyle.Secondary);

        const disableRow = new ActionRowBuilder().addComponents(disable, cancel);
        const enableRow = new ActionRowBuilder().addComponents(enable, cancel);

        const folder = await ServerActiveFolder.findOne({ where: { serverId, channelId } });

        // Define the filter for the collector
        const collectorFilter = i => i.user.id === interaction.user.id;

        if (folder) {
            const response = await interaction.reply({
                content: 'The bot is already actively uploading. Would you like to disable the active upload?',
                components: [disableRow],
                ephemeral: true,
            });

            try {
                const confirmation = await response.awaitMessageComponent({ filter: collectorFilter, time: 30_000 });

                if (confirmation.customId === 'disable') {
                    await ServerActiveFolder.destroy({ where: { serverId, channelId } });
                    await confirmation.update({ content: 'Active upload has been disabled on this channel.', components: [], ephemeral: true });
                } else if (confirmation.customId === 'cancel') {
                    await confirmation.update({ content: 'Interaction cancelled.', components: [], ephemeral: true });
                }
            } catch (error) {
                console.error('Error during the confirmation handling:', error);
                await interaction.followUp({ content: 'There was an error processing your request.', ephemeral: true });
            }
        } else {
            const response = await interaction.reply({
                content: 'The bot is not actively listening on this channel. Would you like to enable the active upload?',
                components: [enableRow],
                ephemeral: true,
            });

            try {
                const confirmation = await response.awaitMessageComponent({ filter: collectorFilter, time: 30_000 });

                if (confirmation.customId === 'enable') {
                    const result = await ServerAuthLite.findOne({ where: { serverId } });
                    
                    if (result && result.driveFolderId) {
                        console.log(`Folder ID exists for server ID ${serverId}: ${result.driveFolderId}`);
                        await ServerActiveFolder.findOrCreate({
                            where: { serverId, channelId },
                            defaults: { serverId, channelId }
                        });
                        await confirmation.update({ content: 'Active upload has been enabled on this channel.', components: [], ephemeral: true });
                    } else {
                        console.log(`No Folder ID found for server ID ${serverId}`);
                        await confirmation.update({ content: 'Interaction cancelled. Please link a Google Drive Folder to this server.', components: [], ephemeral: true });
                    }
                } else if (confirmation.customId === 'cancel') {
                    await confirmation.update({ content: 'Interaction cancelled.', components: [], ephemeral: true });
                }
            } catch (error) {
                console.error('Error during the confirmation handling:', error);
                await interaction.followUp({ content: 'There was an error processing your request.', ephemeral: true });
            }
        }
    }
};