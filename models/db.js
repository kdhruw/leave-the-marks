var chalk = require('chalk');
var mongoose = require('mongoose');

//import { Error } from 'mongoose';
// var bcrypt = require('bcrypt');

var crypto = require('crypto');
var SALT_WORK_FACTOR = 10;


//var dbURI = 'mongodb://localhost/test';


var dbURI = 'mongodb://drulabs:drulabs@ds153577.mlab.com:53577/leavethemarks';


mongoose.connect(dbURI);


mongoose.connection.on('connected', function() {
    console.log(chalk.yellow('Mongoose connected to ' + dbURI));
});

mongoose.connection.on('error', function(err) {
    console.log(chalk.red('Mongoose connection error: ' + err));
});

mongoose.connection.on('disconnected', function() {
    console.log(chalk.red('Mongoose disconnected'));
});



var userSchema = new mongoose.Schema({
    username: { type: String, unique: true },
    email: { type: String, unique: true },
    password: String
});

// Pre save HOOK

userSchema.pre('save', function(next) {
    var user = this;

    // generate salt
    var salt = crypto.randomBytes(32).toString('base64');
    console.log("Before Registering the user");



    // only hash the password if it has been modified (or is new)
    if (!user.isModified('password')) return next();

    const key = crypto.pbkdf2Sync(user.password, salt, SALT_WORK_FACTOR, 512, 'sha512');
    console.log('*********************************', key.toString('hex'));

    user.password = '$2a$' + SALT_WORK_FACTOR + '$' + salt + '$' + key.toString('hex');
    next();

    // Commenting bcrypt related crap, using crypto insead
    // generate a salt
    // bcrypt.genSalt(SALT_WORK_FACTOR, function(err, salt) {
    //     if (err) return next(err);

    //     // hash the password using our new salt
    //     console.log("Salt");
    //     bcrypt.hash(user.password, salt, function(err, hash) {
    //         if (err) return next(err);

    //         // override the cleartext password with the hashed one
    //         user.password = hash;
    //         console.log("Hash : " + hash);
    //         next();
    //     });
    // });
});

userSchema.methods.comparePassword = function(candidatePassword, cb) {

    var salt = this.password.split("$")[3];
    const key = crypto.pbkdf2Sync(candidatePassword, salt, SALT_WORK_FACTOR, 512, 'sha512');

    if ('$2a$' + SALT_WORK_FACTOR + '$' + salt + '$' + key.toString('hex') === this.password) {
        return cb(null, true);
    } else {
        return cb(new mongoose.Error("Invalid password"));
    }

    // bcrypt.compare(candidatePassword, this.password, function(err, isMatch) {
    //     if (err) return cb(err);
    //     cb(null, isMatch);
    // });
};



// Build the User model
mongoose.model('User', userSchema);

// Stories Schema

var storiesSchema = new mongoose.Schema({
    author: String,
    title: { type: String, unique: true },
    created_at: { type: Date, default: Date.now },
    summary: String,
    content: { type: String },
    imageLink: String,
    comments: [{ body: String, commented_by: String, date: Date }],
    slug: String
});

// Build the User model

mongoose.model('Story', storiesSchema, 'stories');