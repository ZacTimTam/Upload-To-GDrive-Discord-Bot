// models/ServerAuth.js
const { Sequelize, DataTypes } = require('sequelize');
const path = require('path');

// Initialize Sequelize with SQLite
const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: path.join(__dirname, '../database.sqlite'), // Path to SQLite database file
    logging: false // Disable logging for cleaner output
});

// Define the ServerAuth model
const ServerAuthLite = sequelize.define('ServerAuthLite', {
    serverId: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true // Ensure each server has a unique record
    },
    accessToken: {
        type: DataTypes.STRING,
        allowNull: false
    },
    refreshToken: {
        type: DataTypes.STRING,
        allowNull: false
    },
    expiryDate: {
        type: DataTypes.DATE,
        allowNull: false
    },
    driveFolderId: {
        type: DataTypes.STRING,
        allowNull: false
    }
});

// Sync model with the database, creating the table if it doesn’t exist
async function initializeDatabase() {
    try {
        await sequelize.authenticate();
        console.log('Connected to SQLite database successfully.');

        await sequelize.sync();
        console.log('Database synced and ServerAuth table created if it did not exist.');

    } catch (error) {
        console.error('Failed to connect or sync with the SQLite database:', error);
    }
}


module.exports = { sequelize, ServerAuthLite, initializeDatabase };