const mongoose = require('mongoose')
require('dotenv').config()

const databaseURI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/CRUD';

async function connectToDatabase() {
   try {
      await mongoose.connect(databaseURI, {
         useNewUrlParser: true,
         useUnifiedTopology: true,
      });
      console.log('MongoDB Connected');
   } catch (err) {
      console.error('Error connecting to MongoDB: ' + err);
   }
}

module.exports = connectToDatabase;