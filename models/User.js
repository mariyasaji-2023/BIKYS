const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const Schema = mongoose.Schema;

const userSchema = new Schema({
  name: String,
  password: String,
  email: String,
  phone: String,
  status: Boolean,
  isBlocked: {
    type: Boolean,
    default: false,
  },
  address: {
    street: String,
    city: String,
    state: String,
    postalCode: String,
    country: String,
  },
  wallet: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Wallet', // Reference to the 'Wallet' model
},
  stateOrCity: String,
  pincodeOrZip: Number,
});

// userSchema.pre('save', async function (next) {
//   const user = this;
//   if (!user.isModified('password')) return next();

//   try {
//     const hashedPassword = await bcrypt.hash(user.password, 10);
//     user.password = hashedPassword;
//     next();
//   } catch (error) {
//     return next(error);
//   }
// });

let model = mongoose.model('User', userSchema);

module.exports=model;