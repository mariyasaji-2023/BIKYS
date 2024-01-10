const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
   code: {
      type: String,
      unique: true,
      required: true,
      uppercase: true
   },
   description: {
      type: String,

   },
   minimumAmount: {
      type: Number,
      required: true,
      default: 100
   },
   maximumAmount: {
      type: Number,
      required: true,
   },
   discountPercentage: {
      type: Number,
      required: true,
      min: 0, // Minimum value for percentage (0%)
      max: 100, // Maximum value for percentage (100%)
      // Convert from decimal to percentage when retrieving data
      // set: (v) => (v / 100),  // Convert from percentage to decimal when saving data
   },
   expirationDate: {
      type: Date,
      required: true,
   },
   isActive: {
      type: Boolean,
      required: true,
      default: true,
   },
   maxDiscountAmount: {
      type: Number,
      default: null, // Unlimited discount by default, set a number for a limit
   },
   usersUsed: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
   }, ],
   maxUsers: {
      type: Number,
      default: null, // Unlimited usage by default, set a number for a limit
   },

   // Add any other fields you need for your coupons
}, {
   timestamps: true
});

const couponModel = mongoose.model('coupon', couponSchema);


// Function to check and update coupon status
const updateCouponStatus = async () => {
   try {
      const currentDate = new Date();
      const activeCoupons = await couponModel.find({
         isActive: true,
         startDate: {
            $lte: currentDate
         }, // Check if the current date is after or equal to the start date
         expirationDate: {
            $lte: currentDate
         }, // Check if the current date is after or equal to the expiration date
      });

      const expiredCoupons = await couponModel.find({
         isActive: true,
         expirationDate: {
            $lte: currentDate
         }, // Check if the current date is after or equal to the expiration date
      });

      // Deactivate coupons that have expired
      await couponModel.updateMany({
         _id: {
            $in: expiredCoupons.map((coupon) => coupon._id)
         }
      }, {
         isActive: false
      });

      // Activate coupons that have reached their start date
      await couponModel.updateMany({
         _id: {
            $in: activeCoupons.map((coupon) => coupon._id)
         }
      }, {
         isActive: true
      });

      // You can also schedule this function to run periodically to update coupon statuses.
   } catch (error) {
      console.error('Error updating coupon statuses:', error);
   }
};

module.exports = {couponModel,updateCouponStatus,};

