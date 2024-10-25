// models/ServerAuth.js
const mongoose = require('mongoose');

const ServerAuthSchema = new mongoose.Schema({
    serverId: { type: String, required: true, unique: true }, // Discord server ID
    accessToken: { type: String, required: true },
    refreshToken: { type: String, required: true },
    expiryDate: { type: Date, required: true }, // Token expiry time
    driveFolderId: { type: String, required: true } // The linked Google Drive folder ID
});

module.exports = mongoose.model('ServerAuth', ServerAuthSchema);