'use strict';
var mongoose = require('mongoose');
//var uuidv4 = require('uuidv4');
var bcrypt = require('bcrypt');
var Schema = mongoose.Schema;
// UUID type creation to add ID to each user
//require('mongoose-uuid')(mongoose);
//var UUID = mongoose.Types.UUID;
// Schema that defines the user register to validate login and signin
var UserSchema = new Schema({
    /*_id: {
      type: UUID,
      default: uuidv4
    },*/
    name: {
        type: String,
        trim: true,
        required: true
    },
    surname: {
        type: String,
        trim: true,
        required: true
    },
    email: {
        type: String,
        unique: true,
        lowercase: true,
        trim: true,
        required: true
    },
    hash_password: {
        type: String
    },
    // These are the non-required values
    birth_date: {
        type: Date,
        required: false
    },
    occupation: {
        type: String,
        required: false
    },
    score_test: {
        type: Number,
        required: false
    },
    score_game: {
        type: Number,
        required: false
    },
    gender: {
        type: String,
        required: false
    }
});
UserSchema.methods.comparePassword = function (password) {
    return bcrypt.compareSync(password, this.hash_password);
};
mongoose.model('User', UserSchema);
