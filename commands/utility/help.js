const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Provides information about the bot and its commands.'),

    async execute(interaction) {
        const helpMessage = `
**Welcome to the Bot Help Guide!**

This bot helps you manage Google Drive folder locations and upload files directly from Discord. Here are the available commands:

**/setfolder** - Set or update the Google Drive folder location for this server.
  - **Usage:** \`/setfolder id:<folder_id>\`
  - **Example:** \`/setfolder id:1aBcD3FgH4IjK5LmN6OpQ7R8S9T0U1VwX\`
  - This command allows you to specify the Google Drive folder where files will be uploaded.

**/multi-upload** - Start an upload session to collect multiple image files.
  - **Usage:** \`/multi-upload \`
  - This command will start a session where you can upload images, which will then be stored in the specified Google Drive folder. Click the **Upload** or **Cancel** command to finish.

**/help** - Provides information about the bot and its commands.
  - **Usage:** \`/help\`
  - Displays this help message.

**Notes:**
- Make sure to set the folder location using **/setfolder** before starting an upload session.
- You can only have one active upload session at a time. Use **/endupload** to finish an active session before starting a new one.

If you have any questions or need further assistance, feel free to contact the server admins.
`;

        await interaction.reply({ content: helpMessage, ephemeral: true });
    }
};