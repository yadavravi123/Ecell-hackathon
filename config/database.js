const mongoose = require('mongoose');

require('dotenv').config();



const conn = process.env.DB_STRING;

const connection = mongoose.createConnection(conn, {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

const ObjectId=mongoose.Schema.ObjectId;
const UserSchema = new mongoose.Schema({
    username: {
        type:String,
        unique:true
    },
    hash: String,
    salt: String,
    admin:Boolean,
    teacher:Boolean,
});

const User = connection.model('User', UserSchema);

// Expose the connection
module.exports = connection