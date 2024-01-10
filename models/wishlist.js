const mongoose = require('mongoose')
const ObjectID = mongoose.Schema.Types.ObjectId;

const whishlistSchema = new mongoose.Schema({
   user: {
      type: ObjectID,
      ref: 'User',
      required: true
   },
   product: [{
      type: ObjectID,
      ref: 'Product'
   }]
})


const whishlistModel = mongoose.model('Whishlist', whishlistSchema);
module.exports = whishlistModel;