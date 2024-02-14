const mongoose = require('mongoose')
require('dotenv').config()


const databaseURI = process.env.MONGODB_URI || 'mongodb+srv://mariyasajichiramel:s2I9BY5key9yNSGT@cluster0.1xfwidu.mongodb.net/';

async function connectToDatabase() {
   try {
      await mongoose.connect(databaseURI, {
         useNewUrlParser: true,
         useUnifiedTopology: true,
      });
      console.log('MongoDB Connectedddd');
   } catch (err) {
      console.error('Error connecting to MongoDB: ' + err);
   }
}

module.exports = connectToDatabase;