const { DataTypes } = require('sequelize');
const { sequelize } = require('./ServerAuthLite');

const ServerActiveFolder = sequelize.define('ServerActiveFolder', {
    serverId: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    channelId: {
        type: DataTypes.STRING,
        allowNull: true,
    }
});


module.exports = ServerActiveFolder;