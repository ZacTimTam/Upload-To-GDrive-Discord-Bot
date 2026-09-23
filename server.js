// Helper: accepts images (except gif) and any video type
function isAcceptedMedia(contentType) {
    if (!contentType) return false;
    if (contentType === 'image/gif') return false;
    return contentType.startsWith('image/') || contentType.startsWith('video/');
}

client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    try {
        // Check if the bot should be actively uploading in this channel
        const channelEntry = await ServerActiveFolder.findOne({
            where: {
                serverId: message.guild.id,
                channelId: message.channel.id
            }
        });

        // Only proceed if the channel is registered for active uploads and there are eligible attachments
        if (channelEntry && message.attachments.size > 0) {
            const mediaAttachments = message.attachments.filter(attachment => isAcceptedMedia(attachment.contentType));

            if (mediaAttachments.size === 0) return;

            // Directory to temporarily store downloaded files
            const downloadDir = path.join(__dirname, 'downloads');
            if (!fs.existsSync(downloadDir)) {
                fs.mkdirSync(downloadDir, { recursive: true });
            }

            // Process each attachment
            for (const attachment of mediaAttachments.values()) {
                const filePath = path.join(downloadDir, attachment.name);

                try {
                    // Download the file
                    const response = await axios.get(attachment.url, { responseType: 'stream' });
                    const writer = fs.createWriteStream(filePath);
                    response.data.pipe(writer);

                    await new Promise((resolve, reject) => {
                        writer.on('finish', resolve);
                        writer.on('error', reject);
                    });

                    console.log(`File ${attachment.name} has been successfully downloaded to ${downloadDir}!`);

                    // Upload the file to Google Drive
                    await uploadFile2(message.guild.id, filePath);
                    console.log(`Uploaded file from ${message.channel.id} to Google Drive.`);

                    // Delete the local file after upload
                    await fs.promises.unlink(filePath);
                    console.log(`File ${attachment.name} deleted from local storage.`);
                } catch (error) {
                    console.error(`Failed to process file ${attachment.name}:`, error);
                }
            }
        }
    } catch (error) {
        console.error('Error processing file upload:', error);
    }
});