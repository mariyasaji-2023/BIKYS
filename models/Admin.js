const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const adminSchema = new Schema({
    name:String,
    email:String,
    password:String
})

const AdminModel = mongoose.model('Admin',adminSchema) 

module.exports= AdminModel;