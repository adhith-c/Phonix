const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const BannerSchema = new Schema({
    highlight: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true
    },
    image: [{
        url: String,
        filename: String
    }]
}, {
    timestamps: true
});

module.exports = mongoose.model('Banner', BannerSchema);