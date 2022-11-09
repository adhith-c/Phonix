const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const otpVerification = new Schema({
    userId:String,
    otp:String,
    createdAt:Date,
    expiresAt:Date
})

module.exports = mongoose.model('Otp',otpVerification);