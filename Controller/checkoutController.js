const mongoose = require("mongoose");
const UserModel = require("../models/User");
const { productModel } = require("../models/product");
const CategoryModel = require("../models/category");
const addressModel = require("../models/address");
const orderModel = require("../models/order");
const crypto = require("crypto");
const cartModel = require("../models/cart")
const WalletModel=require("../models/wallet")
 const { razorpayInstance } = require("../config/razorpay");
const {couponModel}=require('../models/coupon')


async function getRandomNumber(min, max) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

// Function to generate a unique order ID
async function generateUniqueOrderID() {
  // Generate a random 6-digit number
  const randomPart = await getRandomNumber(100000, 999999);

  // Get the current date
  const currentDate = new Date();

  // Format the date as YYYYMMDD
  const datePart = currentDate.toISOString().slice(0, 10).replace(/-/g, "");

  // Combine the date and random number with "ID"
  const orderID = `ID_${randomPart}${datePart}`;

  return orderID;
}

const orderCheckout = async (req, res) => {
  try {
    let UserExist = req.session.user._id ? true : false;
    console.log(req.session.user._id,"]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]");
    const addresses = await addressModel.findOne({ user: req.session.user._id });
    // const userDetail = await userModel.findOne({ _id: req.session.userId });
    const category = await CategoryModel.find();
    // const cartCheckout = await cartModel.findOne({ owner: req.session.userId });

    const cartCheckout = await cartModel.findOne({ owner: req.session.user._id});
    const userId = req.session.user._id; 

    // let userDetails = await UserModel.findOne({
    //   _id: req.session.user._id
    // })
    
    let userDetail = await UserModel.aggregate([
      {
        $match: {
          _id: new mongoose.Types.ObjectId(req.session.user._id),
        },
      },
      {
        $lookup: {
          from: 'wallets',
          localField: 'wallet',
          foreignField: '_id',
          as: 'WalletData',
        },
      },
      {
        $limit: 1,
      },
    ]);
    
    userDetail = userDetail[0] || {}; // Set userDetails to an empty object if undefined
    
    console.log(userDetail, 'ORDERPOST');
    
    // Check if WalletData is not an empty array
    // if (!userDetails.WalletData || userDetails.WalletData.length === 0) {
    //   userDetails.WalletData = null; // Set it to null or an empty object, depending on your preference
    // } else {
    //   // Unwind only if there are WalletData
    //   userDetails.WalletData = userDetails.WalletData[0];
    // }
    console.log(userDetail, 'After order');
    
if (!cartCheckout) {
  // Handle the case where cartCheckout is null
  console.error("Cart not found for user:", req.session.user._id);
  return res.status(400).send("Cart not found");
}



    const selectedItems = cartCheckout.items
    let selectedAddressTypes = []; // Initialize selectedAddressTypes as an empty array
    console.log(addresses);
    if (addresses) {
      selectedAddressTypes = addresses.addresses.map(
        (address) => address.addressType
      );
    }
    console.log(selectedItems,"=================selected items================");
    // Calculate the total amount for the order
    const billTotal = selectedItems.reduce((total, item) => total + item.price, 0);

    console.log(billTotal,"billtotal___________________=======");


    let discountPrice = null;
         let discountedTotal = null
         if(req.session.discountAmount && req.session.discountedTotal){
          discountPrice = req.session.discountAmount;
          discountedTotal = req.session.discountedTotal
         }


    // Get the count of selected items
    const itemCount = selectedItems.length;

    let flag = 0;
    Promise.all(
      selectedItems.map(async (item, index) => {
        let stock = await productModel.findById(item.productId);
        console.log("Quantity",item.quantity, "Stock",stock.countInStock);
        if (item.quantity > stock.countInStock) {
          flag = 1;
          selectedItems[index].quantity = stock.countInStock;
          //under database
          cartCheckout.items.map(async (prod, i) => {
            if (prod.productId + "" === selectedItems[index].productId + "") {
              cartCheckout.items[i].quantity = stock.countInStock;
              console.log("before saving    ==");
              await cartCheckout.save();
            }
          });
          //save
        }
      })
    ).then(() => {

      if (flag === 1) {
        flag = 0;

        res.render("checkout", {
          UserExist: UserExist,
          category,
          addresses,
          selectedItems,
          billTotal,
          itemCount,
          selectedAddressTypes,
          userDetail,
          error: true,
          discountPrice,
          discountedTotal,
        });
      } else {
        res.render("checkout", {
          UserExist: UserExist,
          category,
          addresses,
          selectedItems,
          billTotal,
          itemCount,
          selectedAddressTypes,
          userDetail,
          error: "",
          discountPrice,
          discountedTotal,
        });
      }
    });
  } catch (error) {
    console.log(error);
    // next(err);
  }
};

// let orderCheckoutPost = async (req, res, next) => {
//    try {
//      // Validate the request body
//      console.log("======================");
//      console.log(req.body);
//      console.log("======================");
//      if (!req.body.paymentOption || !req.body.addressType) {
//        // Handle invalid or missing data in the request
//        return res.status(400).json({success:false, error: "Invalid data in the request" });
//      }

//      console.log(req.body.paymentOption,req.body.addressType)

//      const cart = await cartModel.findOne({ owner: req.session.userId });

//      if (!cart || cart.items.length === 0) {
//        // Handle the case where the user has no items in the cart
//        return res.status(400).json({success:false, error: "No items in the cart" });
//      }

//      let selectedItems = cart.items;

//       // Check if any selected items have already been ordered
//    const orderedItems = await orderModel.find({
//        user: req.session.userId,
//        items: { $elemMatch: { productId: { $in: selectedItems.map(item => item.productId) } } }
//      });

//      if(orderedItems.length>0){
//        selectedItems = selectedItems.filter(item => !orderedItems.some(orderedItem =>
//            orderedItem.items.some(orderedItemItem => orderedItemItem.productId === item.productId)
//          ));
//      }

//      const Address = await addressModel.findOne({ user: req.session.userId });

//      if (!Address) {
//        // Handle the case where the user has no address
//        return res.status(400).json({success:false, error: "User has no address" });
//      }
//      console.log('Address'+Address)
//      const deliveryAddress = Address.addresses.find(
//        (item) => item.addressType === req.body.addressType
//      );

//      if (!deliveryAddress) {
//        // Handle the case where the requested address type was not found
//        return res.status(400).json({success:false, error: "Address not found" });
//      }
//      const orderAddress = {
//        addressType: deliveryAddress.addressType,
//        HouseNo: deliveryAddress.HouseNo,
//        Street: deliveryAddress.Street,
//        Landmark: deliveryAddress.Landmark,
//        pincode: deliveryAddress.pincode,
//        city: deliveryAddress.city,
//        district: deliveryAddress.district,
//        State: deliveryAddress.State,
//        Country: deliveryAddress.Country,
//    };

//      const billTotal = selectedItems.reduce((total, item) => total + item.price, 0);
//      console.log(billTotal, selectedItems);

//      // Deduct purchased items from inventory
//      for (const item of selectedItems) {
//        const product = await productModel.findOne({ _id: item.productId });

//        if (product) {
//            // Ensure that the requested quantity is available in stock
//            if (product.countInStock >= item.quantity) {
//              // Decrease the countInStock by the purchased quantity
//              product.countInStock -= item.quantity;
//              console.log( product.countInStock)
//              await product.save();
//            } else {
//              // Handle the case where the requested quantity is not available
//              return res.status(400).json({ success: false, error: "Not enough stock for some items" });
//            }
//          } else {
//            // Handle the case where the product was not found
//            return res.status(400).json({ success: false, error: "Product not found" });
//          }

//      }

//      var order_id=await generateUniqueOrderID();
//      // Create a new order
//      const order = new orderModel({
//        user: req.session.userId,
//        cart: cart._id,
//        items: selectedItems,
//        billTotal,
//        oId:order_id,
//        paymentStatus:'Success',
//        paymentMethod: req.body.paymentOption,
//        deliveryAddress: orderAddress,
//        // Add more order details as needed
//      });
//      await order.save();

//      // Remove selected items from the cart
//      const selectedItemIds = selectedItems.map((item) => item.productId);

//      // Remove selected items from the cart using $pull
//      await cartModel.updateOne(
//        { _id: cart._id },
//        { $pull: { items: { productId: { $in: selectedItemIds } } } }
//      );
//      cart.billTotal = 0
//      await cart.save();

//       // Get the order ID after saving it
//       const orderId = order._id;

//       return res.status(201).json({success:true,message:'order placed successfully',orderId,order,key_id:process.env.RAZORPAY_KEYID}); // Redirect to a confirmation page

//    } catch (err) {
//      console.error(err);
//      next(err);
//    }
//  };

// let orderCheckoutPost = async (req, res, next) => {
//   try {
//     if (!req.body.paymentOption || !req.body.addressType) {
//       // Handle invalid or missing data in the request
//       return res
//         .status(400)
//         .json({ success: false, error: "Invalid data in the request" });
//     }

//     console.log(req.body.paymentOption, req.body.addressType);

//     const cart = await cartModel.findOne({ owner: req.session.userId });

//     if (!cart || cart.items.length === 0) {
//       // Handle the case where the user has no items in the cart
//       return res
//         .status(400)
//         .json({ success: false, error: "No items in the cart" });
//     }

//     let selectedItems = cart.items

//     // Check if any selected items have already been ordered
//     const orderedItems = await orderModel.find({
//       user: req.session.userId,
//       items: {
//         $elemMatch: {
//           productId: { $in: selectedItems.map((item) => item.productId) },
//         },
//       },
//     });

//     if (orderedItems.length > 0) {
//       selectedItems = selectedItems.filter(
//         (item) =>
//           !orderedItems.some((orderedItem) =>
//             orderedItem.items.some(
//               (orderedItemItem) => orderedItemItem.productId === item.productId
//             )
//           )
//       );
//     }

//     const Address = await addressModel.findOne({ user: req.session.userId });

//     if (!Address) {
//       // Handle the case where the user has no address
//       return res
//         .status(400)
//         .json({ success: false, error: "User has no address" });
//     }
//     console.log("Address" + Address);
//     const deliveryAddress = Address.addresses.find(
//       (item) => item.addressType === req.body.addressType
//     );

//     if (!deliveryAddress) {
//       // Handle the case where the requested address type was not found
//       return res
//         .status(400)
//         .json({ success: false, error: "Address not found" });
//     }
//     const orderAddress = {
//       addressType: deliveryAddress.addressType,
//       HouseNo: deliveryAddress.HouseNo,
//       Street: deliveryAddress.Street,
//       Landmark: deliveryAddress.Landmark,
//       pincode: deliveryAddress.pincode,
//       city: deliveryAddress.city,
//       district: deliveryAddress.district,
//       State: deliveryAddress.State,
//       Country: deliveryAddress.Country,
//     };

//     let billTotal = selectedItems.reduce(
//       (total, item) => total + item.price,
//       0
//     );
//     console.log(billTotal, selectedItems);

//     // Deduct purchased items from inventory

//     if (req.body.paymentOption === "cashOnDelivery") {

//       console.log('billTotal'+billTotal)
//             if(req.session && req.session.discountedTotal && req.session.discountAmount && req.session.discountAmount!=null &&  req.session.discountedTotal!=null){
//               console.log(req.session.discountedTotal,req.session.couponCode,req.session.userId)
//               billTotal = req.session.discountedTotal
//               // req.session.discountedTotal =null;
//               // req.session.discountAmount = null

//               const coupon = await couponModel.findOne({ code: req.session.couponCode });
//               coupon.usersUsed.push(req.session.userId);
//               await coupon.save();
//               req.session.couponCode= coupon._id
//             }
//             console.log('billTotal'+billTotal)

//       var order_id = await generateUniqueOrderID();
//       // Create a new order
//       const orderData = new orderModel({
//         user: req.session.userId,
//         cart: cart._id,
//         items: selectedItems,
//         billTotal,
//         oId: order_id,
//         // paymentStatus: "Success",
//         paymentStatus: "Pending",
//         paymentMethod: req.body.paymentOption,
//         deliveryAddress: orderAddress,
//         discounts : req.session.discountedTotal ? [
//           {
//             code:req.session.couponCode,
//            amount:req.session.discountAmount,
//            discountType:'Coupon',
//            coupon:req.session.couponId?req.session.couponId: null,
//           }
//          ]:[]
//         // Add more order details as needed
//       });
//       for (const item of selectedItems) {
//         const product = await productModel.findOne({ _id: item.productId });

//         if (product) {
//           // Ensure that the requested quantity is available in stock
//           if (product.countInStock >= item.quantity) {
//             // Decrease the countInStock by the purchased quantity
//             product.countInStock -= item.quantity;
//             console.log(product.countInStock);
//             await product.save();
//           } else {
//             // Handle the case where the requested quantity is not available
//             return res
//               .status(400)
//               .json({
//                 success: false,
//                 error: "Not enough stock for some items",
//               });
//           }
//         } else {
//           // Handle the case where the product was not found
//           return res
//             .status(400)
//             .json({ success: false, error: "Product not found" });
//         }
//       }
//       const order = new orderModel(orderData)
//       await order.save();
//       req.session.couponCode= null
//       req.session.discountAmount = null
//       req.session.discountedTotal =null
//       req.session.couponId=null

//       // Update payment status based on order status
//     if (order.status === 'Delivered') {
//       order.paymentStatus = 'Success';
//       await order.save();
      
//   }


//       //  // Remove selected items from the cart
//       //  const selectedItemIds = selectedItems.map((item) => item.productId);

//       //  // Remove selected items from the cart using $pull
//       //  await cartModel.updateOne(
//       //    { _id: cart._id },
//       //    { $pull: { items: { productId: { $in: selectedItemIds } } } }
//       //  );
//       //  cart.billTotal = 0
//       //  await cart.save();

//       // Remove selected items from the cart
//       cart.items = cart.items.filter((item) => !item.selected);
//       cart.billTotal = 0;
//       await cart.save();

//       // Get the order ID after saving it
//       const orderId = order._id;

//       return res
//         .status(201)
//         .json({
//           success: true,
//           message: "order placed successfully",
//           orderId,
//           order,
//           key_id: process.env.RAZORPAY_KEYID,
//         }); // Redirect to a confirmation page



//     } else if (req.body.paymentOption === "Razorpay") {
//       // Handle Razorpay


//       if(req.session.discountedTotal && req.session.discountAmount && req.session.discountAmount!=null &&  req.session.discountedTotal!=null){
//         console.log(req.session.discountedTotal,req.session.couponCode,req.session.userId)
//         billTotal = req.session.discountedTotal
        
        
//         const coupon = await couponModel.findOne({ code: req.session.couponCode });
//                 coupon.usersUsed.push(req.session.userId);
//                 await coupon.save();
//                 req.session.couponId = coupon._id;
  
//       }

//       const amount = billTotal * 100; // Convert to paise or cents
//       console.log('billTotal'+billTotal)

//       const orderData = new orderModel({
//         user: req.session.userId,
//         cart: cart._id,
//         items: selectedItems,
//         billTotal,
//         paymentStatus: "Pending",
//         oId: null,
//         paymentId: null,
//         paymentMethod: req.body.paymentOption,
//         deliveryAddress: orderAddress,
//         discounts : req.session.discountedTotal ? [
//           {
//            code:req.session.couponCode,
//            amount:req.session.discountAmount,
//            discountType:'Coupon',
//            coupon:req.session.couponId?req.session.couponId: null,
//           }
//          ]:[]
//         // Add more order details as needed
//       });

//       // Create a new order
//       const order = new orderModel(orderData);

//       // const orderId = order._id;

//       // Create a Razorpay order and send the order details to the client
//       const options = {
//         amount,
//         currency: "INR",
//         receipt: "sudev@gmail.com", // Replace with your email
//       };

//       razorpayInstance.orders.create(options, async (err, razorpayOrder) => {
//         if (!err) {
//           order.oId = razorpayOrder.id;

//           try {
//             console.log("razorpay order ethi")
//             await order.save(); // Save the order to the database
            

//             req.session.couponCode= null
//             req.session.discountAmount = null
//             req.session.discountedTotal =null
//             req.session.couponId=null
//             console.log(order);

//             // Update payment status based on Razorpay response
//             if (razorpayOrder.status === 'paid') {
//               order.paymentStatus = 'Success';
//               await order.save();
//           } else{
//             order.paymentStatus = 'Failed';
//               await order.save();
//           }

//             return res.status(201).json({
//               success: true,
//               msg: "Order Created",
//               order,
//               oId: razorpayOrder.id,
//               amount,
//               key_id: process.env.RAZORPAY_KEYID,
//               // contact: req.session.user.phone, // Replace with user's mobile number
//               // name: req.session.user.fullname ,
//               // email: req.session.email,
//               address: `${orderAddress.addressType}\n${orderAddress.HouseNo} ${orderAddress.Street}\n${orderAddress.pincode} ${orderAddress.city} ${orderAddress.district}\n${orderAddress.State}`,
//             });
//           } catch (saveError) {
//             console.error("Error saving order to the database:", saveError);
//             return res
//               .status(400)
//               .json({ success: false, msg: "Failed to save order" });
//           }
//         } else {
//           console.error("Error creating Razorpay order:", err);
//           return res
//             .status(400)
//             .json({ success: false, msg: "Something went wrong!" });
//         }
//       });


//     } else if(req.body.paymentOption === "Wallet"){

//       const wallet = await WalletModel.findOne({ user:  req.session.userId });

//       if (!wallet) {
//         return res.status(404).json({ success: false, msg: 'Wallet not found for the user' });
//       }


//       if(req.session.discountedTotal && req.session.discountAmount && req.session.discountAmount!=null &&  req.session.discountedTotal!=null){
//         billTotal = req.session.discountedTotal
      
//         const coupon = await couponModel.findOne({ code: req.session.couponCode });
//         coupon.usersUsed.push(req.session.userId);
//         await coupon.save();
//         req.session.couponId = coupon._id;
       
//       }

//       // Check if the wallet balance is sufficient
//       if (wallet.balance < billTotal) {
//         return res.status(400).json({ success: false, msg: 'Insufficient funds in the wallet' });
//       }
//       // Deduct the billTotal from the wallet balance
//       wallet.balance -= billTotal;

      
//         // Create a transaction entry for the order
//         wallet.transactions.push({
//           amount: -billTotal,
//           type: 'debit',
//         });

//         // Deduct purchased items from inventory
//         for (const item of selectedItems) {
//           const product = await productModel.findOne({ _id: item.productId });
//           if (product) {
//             // Ensure that the requested quantity is available in stock
//             if (product.countInStock >= item.quantity) {
//               // Decrease the countInStock by the purchased quantity
//               product.countInStock -= item.quantity;
//               await product.save();
//             } else {
//               // Handle the case where the requested quantity is not available
//               return res
//                 .status(400)
//                 .json({ success: false, error: "Not enough stock for some items" });
//             }
//           } else {
//             // Handle the case where the product was not found
//             return res
//               .status(400)
//               .json({ success: false, error: "Product not found" });
//           }
//         }
//         // Save the wallet changes
//         await wallet.save();

//             const orderIds = await generateUniqueOrderID(6); 
//             const orderData  = {
//               user: req.session.userId,
//               cart: cart._id,
//               items: selectedItems,
//               billTotal,
//               paymentStatus: "Success",
//               oId: orderIds,
//               paymentId: null,
//               paymentMethod: req.body.paymentOption,
//               deliveryAddress: orderAddress,
//               discounts : req.session.discountedTotal ? [
//                 {
//                  code:req.session.couponCode,
//                  amount:req.session.discountAmount,
//                  discountType:'Coupon',
//                  coupon:req.session.couponId?req.session.couponId: null,
//                 }
//                ]:[]
//               // Add more order details as needed
//               };

//               const order = new orderModel(orderData)
//               await order.save();
//               req.session.couponCode= null
//               req.session.discountAmount = null
//               req.session.discountedTotal =null
//               req.session.couponId=null


//               // Remove selected items from the cart
//               cart.items = cart.items.filter((item) => !item.selected);
//               cart.billTotal = 0;
//               await cart.save();

//               const orderId = order._id;

              
//         return res.status(201).json({success:true,message:'Cash on Delivery Sucess',orderId})

//     }  else {
//       // Handle other payment methods (e.g., Paypal)
//       // You can add the implementation for other payment methods here
//       return res
//         .status(400)
//         .json({ success: false, error: "Invalid payment option" });
//     }
//   } catch (err) {
//     console.error(err);
//     next(err);
//   }
// 


let orderCheckoutPost = async (req, res, next) => {
  try {
    if (!req.body.paymentOption || !req.body.addressType) {
      // Handle invalid or missing data in the request
      return res
        .status(400)
        .json({ success: false, error: "Invalid data in the request" });
    }

    console.log(req.body.paymentOption, req.body.addressType);

    const cart = await cartModel.findOne({ owner: req.session.user._id });

    if (!cart || cart.items.length === 0) {
      // Handle the case where the user has no items in the cart
      return res
        .status(400)
        .json({ success: false, error: "No items in the cart" });
    }

    let selectedItems = cart.items

    // Check if any selected items have already been ordered
    const orderedItems = await orderModel.find({
      user: req.session.user._id,
      items: {
        $elemMatch: {
          productId: { $in: selectedItems.map((item) => item.productId) },
        },
      },
    });

    if (orderedItems.length > 0) {
      selectedItems = selectedItems.filter(
        (item) =>
          !orderedItems.some((orderedItem) =>
            orderedItem.items.some(
              (orderedItemItem) => orderedItemItem.productId === item.productId
            )
          )
      );
    }

    const Address = await addressModel.findOne({ user: req.session.user._id });

    if (!Address) {
      // Handle the case where the user has no address
      return res
        .status(400)
        .json({ success: false, error: "User has no address" });
    }
    console.log("Address" + Address);
    const deliveryAddress = Address.addresses.find(
      (item) => item.addressType === req.body.addressType
    );

    if (!deliveryAddress) {
      // Handle the case where the requested address type was not found
      return res
        .status(400)
        .json({ success: false, error: "Address not found" });
    }
    const orderAddress = {
      addressType: deliveryAddress.addressType,
      HouseNo: deliveryAddress.HouseNo,
      Street: deliveryAddress.Street,
      Landmark: deliveryAddress.Landmark,
      pincode: deliveryAddress.pincode,
      city: deliveryAddress.city,
      district: deliveryAddress.district,
      State: deliveryAddress.State,
      Country: deliveryAddress.Country,
    };

    let billTotal = selectedItems.reduce(
      (total, item) => total + item.price,
      0
    );
    console.log(billTotal, selectedItems);

    // Deduct purchased items from inventory

    if (req.body.paymentOption === "cashOnDelivery") {

      console.log('billTotal'+billTotal)
            if(req.session && req.session.discountedTotal && req.session.discountAmount && req.session.discountAmount!=null &&  req.session.discountedTotal!=null){
              console.log(req.session.discountedTotal,req.session.couponCode,req.session.user._id)
              billTotal = req.session.discountedTotal
              // req.session.discountedTotal =null;
              // req.session.discountAmount = null

              const coupon = await couponModel.findOne({ code: req.session.couponCode });
              coupon.usersUsed.push(req.session.user._id);
              await coupon.save();
              req.session.couponCode= coupon._id
            }
            console.log('billTotal'+billTotal)

      var order_id = await generateUniqueOrderID();
      // Create a new order
      const orderData = new orderModel({
        user: req.session.user._id,
        cart: cart._id,
        items: selectedItems,
        billTotal,
        oId: order_id,
        // paymentStatus: "Success",
        paymentStatus: "Pending",
        paymentMethod: req.body.paymentOption,
        deliveryAddress: orderAddress,
        discounts : req.session.discountedTotal ? [
          {
            code:req.session.couponCode,
           amount:req.session.discountAmount,
           discountType:'Coupon',
           coupon:req.session.couponId?req.session.couponId: null,
          }
         ]:[]
        // Add more order details as needed
      });
      for (const item of selectedItems) {
        const product = await productModel.findOne({ _id: item.productId });

        if (product) {
          // Ensure that the requested quantity is available in stock
          if (product.countInStock >= item.quantity) {
            // Decrease the countInStock by the purchased quantity
            product.countInStock -= item.quantity;
            console.log(product.countInStock);
            await product.save();
          } else {
            // Handle the case where the requested quantity is not available
            return res
              .status(400)
              .json({
                success: false,
                error: "Not enough stock for some items",
              });
          }
        } else {
          // Handle the case where the product was not found
          return res
            .status(400)
            .json({ success: false, error: "Product not found" });
        }
      }
      const order = new orderModel(orderData)
      await order.save();
      req.session.couponCode= null
      req.session.discountAmount = null
      req.session.discountedTotal =null
      req.session.couponId=null

      // Update payment status based on order status
    if (order.status === 'Delivered') {
      order.paymentStatus = 'Success';
      await order.save();
      
  }


      //  // Remove selected items from the cart
      //  const selectedItemIds = selectedItems.map((item) => item.productId);

      //  // Remove selected items from the cart using $pull
      //  await cartModel.updateOne(
      //    { _id: cart._id },
      //    { $pull: { items: { productId: { $in: selectedItemIds } } } }
      //  );
      //  cart.billTotal = 0
      //  await cart.save();

      // Remove selected items from the cart
      cart.items = cart.items.filter((item) => !item.selected);
      cart.billTotal = 0;
      await cart.save();

      // Get the order ID after saving it
      const orderId = order._id;

      return res
        .status(201)
        .json({
          success: true,
          message: "order placed successfully",
          orderId,
          order,
          key_id: process.env.RAZORPAY_KEYID,
        }); // Redirect to a confirmation page



    } else if (req.body.paymentOption === "Razorpay") {
      // Handle Razorpay


      if(req.session.discountedTotal && req.session.discountAmount && req.session.discountAmount!=null &&  req.session.discountedTotal!=null){
        console.log(req.session.discountedTotal,req.session.couponCode,req.session.userId)
        billTotal = req.session.discountedTotal
        
        
        const coupon = await couponModel.findOne({ code: req.session.couponCode });
                coupon.usersUsed.push(req.session.userId);
                await coupon.save();
                req.session.couponId = coupon._id;
  
      }

      const amount = billTotal * 100; // Convert to paise or cents
      console.log('billTotal'+billTotal)

      const orderData = new orderModel({
        user: req.session.user._id,
        cart: cart._id,
        items: selectedItems,
        billTotal,
        paymentStatus: "Pending",
        oId: null,
        paymentId: null,
        paymentMethod: req.body.paymentOption,
        deliveryAddress: orderAddress,
        discounts : req.session.discountedTotal ? [
          {
           code:req.session.couponCode,
           amount:req.session.discountAmount,
           discountType:'Coupon',
           coupon:req.session.couponId?req.session.couponId: null,
          }
         ]:[]
        // Add more order details as needed
      });

      // Create a new order
      const order = new orderModel(orderData);

      // const orderId = order._id;

      // Create a Razorpay order and send the order details to the client
      const options = {
        amount,
        currency: "INR",
        receipt: process.env.EMAIL, // Replace with your email
      };

      razorpayInstance.orders.create(options, async (error, razorpayOrder) => {
        if (!error) {
          order.oId = razorpayOrder.id;

          try {
            console.log("razorpay order ethi")
            await order.save(); // Save the order to the database
            

            req.session.couponCode= null
            req.session.discountAmount = null
            req.session.discountedTotal =null
            req.session.couponId=null
            console.log(order);

            // Update payment status based on Razorpay response
            if (razorpayOrder.status === 'paid') {
              order.paymentStatus = 'Success';
              await order.save();
          } else{
            order.paymentStatus = 'Failed';
              await order.save();
          }

            return res.status(201).json({
              success: true,
              msg: "Order Created",
              order,
              oId: razorpayOrder.id,
              amount,
              key_id: process.env.RAZORPAY_KEYID,
              // contact: req.session.user.phone, // Replace with user's mobile number
              // name: req.session.user.fullname ,
              // email: req.session.email,
              address: `${orderAddress.addressType}\n${orderAddress.HouseNo} ${orderAddress.Street}\n${orderAddress.pincode} ${orderAddress.city} ${orderAddress.district}\n${orderAddress.State}`,
            });
          } catch (saveError) {
            console.error("Error saving order to the database:", saveError);
            return res
              .status(400)
              .json({ success: false, msg: "Failed to save order" });
          }
        } else {
          console.error("Error creating Razorpay order:", error);
          return res
            .status(400)
            .json({ success: false, msg: "Something went wrong!" });
        }
      });


    } else if(req.body.paymentOption === "Wallet"){

      const wallet = await WalletModel.findOne({ user:  req.session.user._id });

      if (!wallet) {
        return res.status(404).json({ success: false, msg: 'Wallet not found for the user' });
      }


      if(req.session.discountedTotal && req.session.discountAmount && req.session.discountAmount!=null &&  req.session.discountedTotal!=null){
        billTotal = req.session.discountedTotal
      
        const coupon = await couponModel.findOne({ code: req.session.couponCode });
        coupon.usersUsed.push(req.session.user._id);
        await coupon.save();
        req.session.couponId = coupon._id;
       
      }

      // Check if the wallet balance is sufficient
      if (wallet.balance < billTotal) {
        return res.status(400).json({ success: false, msg: 'Insufficient funds in the wallet' });
      }
      // Deduct the billTotal from the wallet balance
      wallet.balance -= billTotal;

      
        // Create a transaction entry for the order
        wallet.transactions.push({
          amount: -billTotal,
          type: 'debit',
        });

        // Deduct purchased items from inventory
        for (const item of selectedItems) {
          const product = await productModel.findOne({ _id: item.productId });
          if (product) {
            // Ensure that the requested quantity is available in stock
            if (product.countInStock >= item.quantity) {
              // Decrease the countInStock by the purchased quantity
              product.countInStock -= item.quantity;
              await product.save();
            } else {
              // Handle the case where the requested quantity is not available
              return res
                .status(400)
                .json({ success: false, error: "Not enough stock for some items" });
            }
          } else {
            // Handle the case where the product was not found
            return res
              .status(400)
              .json({ success: false, error: "Product not found" });
          }
        }
        // Save the wallet changes
        await wallet.save();

            const orderIds = await generateUniqueOrderID(6); 
            const orderData  = {
              user: req.session.user._id,
              cart: cart._id,
              items: selectedItems,
              billTotal,
              paymentStatus: "Success",
              oId: orderIds,
              paymentId: null,
              paymentMethod: req.body.paymentOption,
              deliveryAddress: orderAddress,
              discounts : req.session.discountedTotal ? [
                {
                 code:req.session.couponCode,
                 amount:req.session.discountAmount,
                 discountType:'Coupon',
                 coupon:req.session.couponId?req.session.couponId: null,
                }
               ]:[]
              // Add more order details as needed
              };

              const order = new orderModel(orderData)
              await order.save();
              req.session.couponCode= null
              req.session.discountAmount = null
              req.session.discountedTotal =null
              req.session.couponId=null


              // Remove selected items from the cart
              cart.items = cart.items.filter((item) => !item.selected);
              cart.billTotal = 0;
              await cart.save();

              const orderId = order._id;

              
        return res.status(201).json({success:true,message:'Cash on Delivery Sucess',orderId})

    }  else {
      // Handle other payment methods (e.g., Paypal)
      // You can add the implementation for other payment methods here
      return res
        .status(400)
        .json({ success: false, error: "Invalid payment option" });
    }
  } catch (error) {
    console.error("Error in order checkout:", error,"...........................");
    next(error);
}

};



const orderConfirmation = async (req, res) => {
  const orderId = req.params.orderId;
  // Validate if orderId is a valid ObjectId
  if (!mongoose.Types.ObjectId.isValid(orderId)) {
    return res.status(404).render("errorHandler");
  }

  try {
    req.session.checkout = false;
    let orderDetails = await orderModel.findById(orderId);
    if (!orderDetails) {
      return res.status(404).render("errorHandler");
    }

    await cartModel.findOneAndUpdate({owner:req.session.user._id},{
      $set:{
        items:[]
      }
    })

    res.render("order-confirmation", { orderId });
  } catch (err) {
    console.log(err);
  }
};

const razorpayVerify = async (req, res) => {
  try {
    console.log("VERIFY EYE/////////////////////////////");
    const body =
      req.body.razorpay_order_id + "|" + req.body.razorpay_payment_id;
    console.log(body,"22222222222222222222222222222222222");

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_SECRET)
      .update(body.toString())
      .digest("hex");

    if (expectedSignature === req.body.razorpay_signature) {
      console.log("Corrected Verify");

      // Find the previously stored record using orderId
      const updatedOrder = await orderModel.findOneAndUpdate(
        { oId: req.body.razorpay_order_id },
        {
          // paymentId: req.body.razorpay_payment_id,
          // signature: req.body.razorpay_signature,
          paymentStatus: "Success",
        },
        { new: true }
      );
      console.log(updatedOrder);
      if (updatedOrder) {
        const cart = await cartModel.findOne({ owner: req.session.user._id });
        // Remove selected items from the cart
        cart.items = [];
        cart.billTotal = 0;
        await cart.save();
        // Render the payment success page
        return res.json({
          success: true,
          message: "Order Sucessfully",
          updatedOrder,
        });
      } else {
        // Handle the case where the order couldn't be updated
        return res.json({
          success: false,
          message: "Order Failed Please try Again",
        });
      }
    } else {
      // Handle the case where the signature does not match
      return res.json({
        success: false,
        message: "Order Failed Please try Again",
      });
    }
  } catch (err) {
    console.log(err);
    // Handle errors
    return res.render("paymentFailed", {
      title: "Error",
      error: "An error occurred during payment verification",
    });
  }
};

let razorpayFailed = async (req, res) => {
  try {
    res.status(200).render("paymentFailed");
  } catch (err) {
    console.log(err);
  }
};


const returnOrder = async(req,res)=>{
  try{
    const {oId,returnReason }= req.body;
    console.log(req.body.oId,"order id in the session ")
    const userId = req.session.user._id;
    const order = await orderModel.findOne({oId:oId});

    console.log(userId,order,returnReason)

    if(!order){
      return res.status(404).json({success:false,message:'order Not found in Database'})
    }
     // Check if the user making the request is the owner of the order
     if (order.user.toString() !== userId.toString()) {
      return res.status(403).json({ success: false, message: 'You are not authorized to return this order' });
    }
      // Check if the order status allows a return
      if (order.status !== 'Delivered') {
        return res.status(400).json({ success: false, message: 'Order must be Delivered to initiate a return' });
    }
    
       // Update the order status to 'Returned'
    order.status = 'Returned';

    // Update the return request in the order
    order.requests.push({
      type: 'Return',
      status: 'Pending', // You can set it to 'Pending' initially
      reason: returnReason,
    }); 

    // Save the updated order
    await order.save();
    res.status(200).json({ success: true, message: 'Return request submitted successfully' });
}catch(err){
  console.log(err)
  res.status(500).json({ success: false, message: 'Internal Server Error' });
}
}






// Function to retrieve and filter coupons based on the bill total
const getCouponsForBill = async (billTotal) => {
  try {
    const currentDate = new Date();
    console.log(billTotal+'/,/,/,/,/.,.,/cxxxxxxxxxxxxxxxxxxxxxxxx,')
    // Find active coupons that match the bill total criteria
    const availableCoupons = await couponModel.find({
      isActive: true,
      minimumAmount: { $lte: billTotal }, // Check if the bill total is greater than or equal to the minimumAmount
      expirationDate: { $gte: currentDate },
    });
    console.log(availableCoupons)
    return availableCoupons;
  } catch (error) {
    console.error('Error fetching coupons:', error);
    return [];
  }
};

const getCoupons = async(req,res)=>{
  try{
    const billTotal = parseFloat(req.query.billTotal); // Get bill total from the request query
    const coupons = await getCouponsForBill(billTotal);
    res.json(coupons);
  }catch(err){
    console.log(err);
    return res.status(500).json({message:"Internal server error"});
  }
}

// Define a function to check if a coupon is valid
function isValidCoupon(coupon) {
  const currentDate = new Date();

  // Check if the coupon is active
  if (!coupon.isActive) {
    return false;
  }

  // Check if the coupon has not expired
  if (coupon.expirationDate < currentDate) {
    return false;
  }

  // You can add more criteria here based on your requirements

  return true;
}

const applyCoupon = async (req, res) => {
  try {
    const couponCode = req.query.code; // Get the coupon code from the request
    const billTotal = parseFloat(req.query.billTotal); // Get the bill total from the request
    const userId = req.session.userId;
    // Fetch the coupon from the database based on the coupon code
    const coupon = await couponModel.findOne({ code: couponCode });
    
    if (!coupon) {
      req.session.couponCode= null
      req.session.discountAmount = null
      req.session.discountedTotal =null
      // If the coupon is not found, return an error response
      return res.status(400).json({ success: false, message: 'Invalid coupon code' });
    }

    // Check if the coupon is valid (isActive, not expired, etc.)
    if (!isValidCoupon(coupon)) {
      req.session.couponCode=null
      req.session.discountAmount = null
      req.session.discountedTotal = null;
      return res.status(400).json({ success: false, message: 'Coupon is not valid' });
    }
    if (coupon.usersUsed.includes(userId)) {
      req.session.couponCode=null
      req.session.discountAmount = null
      req.session.discountedTotal = null;
      return res.status(400).json({ success: false, message: 'Coupon has already been used by this user' });
    }
    // Calculate the discount amount based on the discount percentage
    let discountAmount = parseInt((coupon.discountPercentage / 100) * billTotal);
    
    if(coupon.maxDiscountAmount !== null){
      discountAmount = Math.min(discountAmount,coupon.maxDiscountAmount)
    }
    console.log(discountAmount+'discountAmount')
    // Calculate the discounted total
    const discountedTotal = billTotal - discountAmount;

    // Store the discounted total in the session
    req.session.couponCode = couponCode;
    req.session.discountAmount =discountAmount;
    req.session.discountedTotal = discountedTotal;
    console.log(req.session.discountedTotal)
    // Return the result to the frontend
    return res.json({ success: true, discountedPrice:discountAmount,newTotalPrice:discountedTotal });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};


module.exports = {
  orderCheckout,
  orderCheckoutPost,
  orderConfirmation,
  razorpayVerify,
  razorpayFailed,
  returnOrder,



  getCouponsForBill,
  getCoupons,
  applyCoupon,
  isValidCoupon

};
