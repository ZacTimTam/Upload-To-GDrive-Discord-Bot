const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Provides information about the bot and its commands.'),

    async execute(interaction) {
        const helpMessage = `
**Bot Help Guide**

This bot helps manage Google Drive folders and upload files directly from Discord.

**Commands:**

**/authenticate** - Link your Google Drive account.
  - **Usage:** \`/authenticate\`
  - Allows the bot to access Google Drive. If linked to a different account, re-authenticate with this command.

**/setfolder** - Set or update the Google Drive folder for this server.
  - **Usage:** \`/setfolder drive_link:<drive_link>\`
  - Find the folder ID by copying it from the Google Drive folder URL. 

**/multi-upload** - Start an image upload session.
  - **Usage:** \`/multi-upload\`
  - Starts a session to upload images, which will be stored in the specified folder. Use **Upload** or **Cancel** to end.

**/help** - Displays this help message.
  - **Usage:** \`/help\`

**Notes:**
- Use **/authenticate** and **/setfolder** before uploading.
- Only one active upload session is allowed at a time.

For further assistance, contact the server admins.
        `;
        await interaction.reply({ content: helpMessage, ephemeral: true });
    }
};