const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const Schema = mongoose.Schema;

const userSchema = new Schema({
  // _id: mongoose.Schema.Types.ObjectId,
  name: String,
  password: String,
  confirmPassword:String,
  email: String,
  phone:String,
  status: Boolean,

  isBlocked:{
    type:Boolean,
    default:false
 }

})

userSchema.pre('save', async function (next) {
  const user = this;
  if (!user.isModified('password')) return next();

  try {
    const hashedPassword = await bcrypt.hash(user.password, 10);
    user.password = hashedPassword;
    next();
  } catch (error) {
    return next(error);
  }
});  

let model=mongoose.model('User',userSchema);

module.exports =model;