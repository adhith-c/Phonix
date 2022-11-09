const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const passportLocalMongoose = require('passport-local-mongoose');

const UserSchema = new Schema({
    // local: {
    //     username: {
    //         type: String,
    //         required: true
    //     },
    //     // email: {
    //     //     type: String,
    //     //     require: true,
    //     //     index: true,
    //     //     unique: true,
    //     //     sparse: true
    //     // },
    //     password: {
    //         type: String,
    //         require: true
    //     },
    // },
    firstname: {
        type: String,
        required: true
    },
    lastname: {
        type: String,
        required: true
    },
    username: {
        type: String,
        required: true,
        unique: true
    },
    addressDetails: [{
        address: {
            type: String,

        },
        city: {
            type: String,

        },
        country: {
            type: String,

        },
        pinCode: {
            type: String,

        },
        mobileNumber: {
            type: String,

        }
    }],
    verified: {
        type: Boolean,
        default: false
    },
    status: {
        type: String,
        enum: ["active", "blocked"],
        default: "active",
        required: true
    },
    isBlocked: {
        type: Boolean,
        default: false
    }

}, {
    timestamps: true
});
UserSchema.plugin(passportLocalMongoose);
module.exports = mongoose.model('User', UserSchema);