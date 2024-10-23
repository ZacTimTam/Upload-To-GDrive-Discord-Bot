const mongoose = require("mongoose");

let folderLocationSchema = mongoose.Schema({
    serverId: {
        type: String,
        require: true
    },
    locationId: {
        type: String,
        require: true
    }
});

module.exports = mongoose.model('FolderLocation', folderLocationSchema);

