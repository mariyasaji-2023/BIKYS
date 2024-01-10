const mongoose = require('mongoose');
const ObjectID = mongoose.Schema.Types.ObjectId;

const cartSchema = new mongoose.Schema({
    owner : {
  type: ObjectID,
   required: true,
   ref: 'User'
 },

 items: [{
    productId: {
      type: ObjectID,
      ref: 'products',
      required: true
    },
    image:{
    type: String,
   
    },

    name: {
      type:String,
      
    },
    productPrice:{
      type:Number,
      
    },
    quantity: {
      type: Number,
     
      min:[1, 'Quantity can not be less then 1.'],
      default: 1
      },
    price: {
      type:Number
    },
    selected: {
      type: Boolean, // Add a selected field to mark whether the item is selected
      default: false, // Initialize as not selected
  },
  ordered: {
    type: Boolean,
    default: false,
  },
    }],
 
billTotal: {
    type: Number,
   
   default: 0
  }
})

const cartModel = mongoose.model('Cart',cartSchema);

module.exports=cartModel;