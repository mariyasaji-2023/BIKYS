const Razorpay = require('razorpay');
require('dotenv').config();

const razorpayInstance = new Razorpay({
   key_id: process.env.RAZORPAY_KEYID,
   key_secret: process.env.RAZORPAY_SECRET,
});

function generateOrderPayment(billTotal) {
   return new Promise((resolve, reject) => {
      var options = {
         amount: billTotal,
         currency: "INR",
         receipt: "order_rcptid_11"
      };
      razorpayInstance.orders.create(options, function (err, order) {
         if (err) {
            console.error('Error creating Razorpay order:', err);
            // reject(err);
         } else {
            console.log(order);
            resolve(order);
         }
      });
   });
}
module.exports = {
   generateOrderPayment,
   razorpayInstance
}


// (async()=>{
//   console.log("working");
//   console.log(await bcrypt.hash("dev123",10))
// })()