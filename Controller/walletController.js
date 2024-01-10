
const mongoose = require('mongoose')
// const Razorpay = require('razorpay');
const { razorpayInstance } = require('../config/razorpay');
require('dotenv').config();
const Wallet  = require('../models/wallet')
const UserModel =require("../models/User")
// const OrderModel = require('../models/OrderModel');

const WalletRazorpayCreation  = async(req,res)=>{
try{
    const userId = req.session.user._id;
    const amount  = req.body.amount;
    console.log("userId",userId);
   console.log("amount",amount)

    if (!userId || !amount) {
        return res.status(400).json({ success: false, msg: 'UserId and amount are required' });
      }
      
  
       // Fetch user and wallet information
    const user = await UserModel.findById(userId);
    console.log('///////////////////////////'+user)
    let wallet = await Wallet.findOne({ user: userId });


    console.log(userId,"??????????????????????????????????");

    if (!user) {
        return res.status(404).json({ success: false, msg: 'User or Wallet not found' });
      }
      
      if (!wallet) {
        wallet = new Wallet({ user: req.session.user._id });
        await wallet.save();
        console.log(userId,"}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}");
          // Update the user's wallet reference
      user.wallet = wallet._id;
     
      
              try {
            await user.save();
         } catch (err) {
            console.error('Error saving user:', err);
            return res.status(500).json({ success: false, msg: 'Internal Server Error' });
            }
    }
      // Create a Razorpay order
    const options = {
        amount: amount * 100, // Razorpay expects amount in paise
        currency: 'INR',
        receipt: `razor${user.email}`, // Replace with a unique identifier for the user
      };

      razorpayInstance.orders.create(options, async (err, razorpayOrder) => {
        if (!err) {
          // Update the user's wallet with the order details
          wallet.pendingOrder = {
            orderId: razorpayOrder.id,
            amount: amount,
            currency: 'INR',
          };
  
          await wallet.save();
        
        return res.status(200).json({
            success: true,
            orderId: razorpayOrder.id,
            amount,
            key_id: process.env.RAZORPAY_KEYID,
            contact: user.phone,
            name: `${user.firstname}`,
            email: user.email,
            address: 'Your Address Here', // You might want to replace this with the user's actual address
          });
        } else {
          console.error('Error creating Razorpay order:', err);
          return res.status(400).json({ success: false, msg: 'Something went wrong!' });
        }
    });
}catch(err){
    console.log("Error in creating wallet", err);
    return res.status(500).json({ success: false, msg: 'Internal Server Error' });
}
}


const WalletConfirmPayment = async (req, res) => {
    try {
        const {amount, paymentId } = req.body;
         const userId = req.session.user._id;
        const user = await UserModel.findById(userId);

        // Validate that the required fields are present
        if (!userId || !amount || !paymentId) {
            return res.status(400).json({ success: false, msg: 'UserId, amount, and paymentId are required' });
        }

        // Fetch the user's wallet
        const wallet = await Wallet.findOne({ user: userId });

        if (!wallet) {
            return res.status(404).json({ success: false, msg: 'Wallet not found for the user' });
        }

         // If the user doesn't have a pending order, create one (this can happen if the user never initiated an order)
         if (!wallet.pendingOrder) {
            const options = {
                amount: amount * 100,
                currency: 'INR',
                receipt: `razor${user.email}`,
            };

            razorpayInstance.orders.create(options, async (err, razorpayOrder) => {
                if (!err) {
                    wallet.pendingOrder = {
                        orderId: razorpayOrder.id,
                        amount: amount,
                        currency: 'INR',
                    };

                    await wallet.save();
                }
            });
        }
        // Check if the payment was already confirmed (prevent duplicate confirmations)
        if (wallet.transactions.some(transaction => transaction.paymentId === paymentId)) {
            return res.status(400).json({ success: false, msg: 'Payment already confirmed' });
        }

        // Perform the actual wallet update
        wallet.balance += parseFloat(amount);
        wallet.transactions.push({
            amount: parseFloat(amount),
            type: 'credit',
            paymentId: paymentId,
        });

        // Clear the pending order
        wallet.pendingOrder = null;

        // Save the updated wallet
        await wallet.save();

        // Send back a success response
        return res.status(200).json({ success: true, msg: 'Payment confirmed and wallet updated successfully', wallet });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, msg: 'Internal Server Error' });
    }
}


const withdrawMoney = async (req, res) => {
    try {
      const userId = req.session.user._id; // Assuming you're using authentication middleware to get the user ID
      const { amount } = req.body;
        console.log(amount,userId)
      // Validate amount (client-side validation is recommended)
      if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
        return res.status(400).json({ success: false, msg: 'Invalid withdrawal amount' });
      }
  
      // Fetch the user's wallet
      const wallet = await Wallet.findOne({ user: userId });
  
      if (!wallet) {
        return res.status(404).json({ success: false, msg: 'Wallet not found for the user' });
      }
  
  
      // Example: Withdrawal of the specified amount
      const withdrawalAmount = parseFloat(amount);
  
      if (wallet.balance < withdrawalAmount) {
        return res.status(400).json({ success: false, msg: 'Insufficient funds for withdrawal' });
      }
  
      // Update wallet balance
      wallet.balance -= withdrawalAmount;
  
      // Create a new transaction entry
      wallet.transactions.push({
        amount: -withdrawalAmount,
        type: 'debit',
      });
  
      await wallet.save();
  
      return res.status(200).json({ success: true, msg: 'Withdrawal successful', wallet });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ success: false, msg: 'Internal Server Error' });
    }
  };

  module.exports = {
   WalletRazorpayCreation,
   withdrawMoney,
   WalletConfirmPayment

  }