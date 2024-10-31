// Require the necessary discord.js classes
const fs = require('node:fs');
const path = require('node:path');
const { Client, Collection, Events, GatewayIntentBits } = require('discord.js');
const { token } = require('./config.json');
const { default: mongoose } = require("mongoose");
const express = require('express');
const ServerAuth = require('./models/ServerAuth');
const { google } = require('googleapis');
require('dotenv').config();
const { initializeDatabase, ServerAuthLite } = require('./models/ServerAuthLite');

initializeDatabase();

const mongoosePort = "mongodb://localhost:27018/gdrive-discord-bot";
const app = express();
const port = process.env.PORT || 3000;


const oauth2Client = new google.auth.OAuth2(
    process.env.CLIENT_ID,        // Your Google OAuth Client ID
    process.env.CLIENT_SECRET,    // Your Google OAuth Client Secret
    process.env.REDIRECT_URI      // Your OAuth Redirect URI, e.g., "http://localhost:3000/oauth2callback"
);

// Create a new client instance
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ],
});

client.commands = new Collection();

// When the client is ready, run this code (only once)
client.once(Events.ClientReady, readyClient => {
    console.log(`Ready! Logged in as ${readyClient.user.tag}`);
});

// Load commands from the commands folder
const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
    const commandsPath = path.join(foldersPath, folder);
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
    for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);
        const command = require(filePath);
        // Set a new item in the Collection with the key as the command name and the value as the exported module
        if ('data' in command && 'execute' in command) {
            client.commands.set(command.data.name, command);
        } else {
            console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
        }
    }
}

// Handle interaction events
client.on(Events.InteractionCreate, async interaction => {
    if (!interaction.isChatInputCommand()) return;

    const command = interaction.client.commands.get(interaction.commandName);

    if (!command) {
        console.error(`No command matching ${interaction.commandName} was found.`);
        return;
    }

    try {
        await command.execute(interaction);
    } catch (error) {
        console.error(`Error executing command: ${interaction.commandName}`, error);
        if (interaction.replied || interaction.deferred) {
            await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
        } else {
            await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
        }
    }
});

async function mongooseConenct(){
    await mongoose.connect(mongoosePort);
    console.log("Successfully connected to MongoDB");
}

// Log in to Discord with your client's token
client.login(token);


app.get('/oauth2callback', async (req, res) => {
    const code = req.query.code;
    const state = req.query.state ? JSON.parse(req.query.state) : null;

    if (!code || !state) {
        return res.status(400).send('Invalid request: missing code or state');
    }

    const { serverId, folderId } = state;

    try {
        // Exchange code for tokens
        const { tokens } = await oauth2Client.getToken(code);
        oauth2Client.setCredentials(tokens);

        // Find or create the ServerAuth record in SQLite
        const [serverAuthLite, created] = await ServerAuthLite.findOrCreate({
            where: { serverId },
            defaults: {
                accessToken: tokens.access_token,
                refreshToken: tokens.refresh_token,
                expiryDate: tokens.expiry_date,
                driveFolderId: null
            }
        });

        // If the record already exists, update it with new token information
        if (!created) {
            await serverAuthLite.update({
                accessToken: tokens.access_token,
                refreshToken: tokens.refresh_token || serverAuthLite.refreshToken,
                expiryDate: tokens.expiry_date,
                driveFolderId: null
            });
        }

        res.send('Google Drive folder linked successfully!');
    } catch (error) {
        console.error('Error handling OAuth callback:', error);
        res.status(500).send('Authentication failed. Please try again.');
    }
});

// Start the web server
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});