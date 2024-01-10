const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({

    productName: {
       type: String,
       required: true,
    },
 
    description: {
       type: String,
       required: true
    },
 
    image: {
       type: String,
       default:''
       
    },
 
    images:[{
       type:String
    }],
 
    brand:{
       type:String
    },
 
    countInStock: {
       type: Number,
       required: true,
       min: 0,
       max: 300
    },
 
    rating: {
       type: Number,
       default: 0,
    },
 
    isFeatured: {
       type: Boolean,
       default: true
    },
    
    category: {
       type: mongoose.Schema.Types.ObjectId,
       ref: 'Category',
       required: true
    },
 
    price: {
       type: Number,
       required: true,
       default: 0,
 
    },
    discountPrice:{
      type: Number,
      default: 0,
    
 }, 
 afterDiscount:Number,
},{
    timestamps: true
 })
const productModel = mongoose.model('Product', productSchema);
module.exports = {productModel}
