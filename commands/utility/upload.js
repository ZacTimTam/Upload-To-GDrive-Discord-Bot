const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('upload')
        .setDescription('Upload a file for processing')
        .addAttachmentOption(option => 
            option.setName('file')
                .setDescription('The file to upload')
                .setRequired(true)),
    async execute(interaction) {
        // Get the uploaded file
        const file = interaction.options.getAttachment('file');

        if (!file) {
            await interaction.reply({ content: 'No file was provided!', ephemeral: true });
            return;
        }

        // Handle the file here (e.g., download it, process it)
        await interaction.reply(`File received: ${file.name} (${file.url})`);
        
        // Example: Log the file URL for further processing
        console.log(`File URL: ${file.url}`);
        
        // You can add additional processing, such as downloading the file using axios or another library
    },
};