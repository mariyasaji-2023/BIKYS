const express = require('express');
const router = express.Router();
const session = require('express-session');
const UserModel = require('../models/User');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const bodyParser = require('body-parser');
const usersController = require('../Controller/usersController');
const cartController = require("../Controller/cartController");
const cartModel = require('../models/cart');
const checkoutController = require("../Controller/checkoutController");
const orderModel = require('../models/order')
const couponController = require('../Controller/couponController')
const walletcontroller = require("../Controller/walletController")
const wallet =require('../models/wallet')


let userName, userEmail;

router.get('/', usersController.home)

router.get('/signup', usersController.getSignup)

router.post('/signup', usersController.signuppost)

router.get('/logins', usersController.getlogin)

router.post('/login', usersController.loginpost)

router.get('/forgot-password', usersController.getpassword)

router.post('/forgot-password', usersController.passwordpost)

router.get('/reset-password', usersController.getreset)

router.post('/reset-password', usersController.resetpost)

// profile routes
router.get('/profile',isAuthenticated, usersController.userprofile)

router.post('/profile/addAddress', usersController.userAddAddress)

router.post('/profile/editAddress', usersController.userEditAddress)

router.delete('/profile/deleteAddress', usersController.userdeleteAddress)

router.post('/cancel-order/:orderId',isAuthenticated, usersController.cancelOrder)

router.get('/order-details/:orderId',isAuthenticated, usersController.userOrderDetails)

router.get('/profile/change-password',usersController.changePassword)

router.get('/resetpassword/:tokenId',usersController.resetPasswordGet)

router.post('/resetpassword',usersController.resetPasswordPost);

//product routers
router.get('/shop', isAuthenticated,usersController.userShop)

router.get('/productdetails/:productId',isAuthenticated, usersController.productDetails)

// OTP
router.get("/otp", usersController.loadOTP);

router.post('/postotp', usersController.postVerifyOtp);

router.post('/resend-otp', usersController.resendOtp)

router.get('/logout', usersController.logout)

//cart
router.get('/cart', isAuthenticated,cartController.userCart)

router.post('/addtocart',isAuthenticated, cartController.addToCart)

router.post('/update-cart-quantity',isAuthenticated, cartController.cartPut)

router.post('/remove-product',isAuthenticated, cartController.cartRemove)




//checkout
router.get('/checkout',isAuthenticated, checkoutController.orderCheckout);

router.post('/checkout',isAuthenticated, checkoutController.orderCheckoutPost);

router.get('/order-confirmation/:orderId', checkoutController.orderConfirmation);

router.post('/order-payment-online',checkoutController.razorpayVerify)

router.get('/payment-failed',checkoutController.razorpayFailed)

router.post('/return-order',checkoutController.returnOrder)

// router.post('/profile/addAddress',checkoutController.userAddAddress)

//  router.post('/profile/editAddress',checkoutController.userEditAddress)

// router.delete('/profile/deleteAddress',checkoutController.userdeleteAddress)


//wishlist

router.get('/wishlist',isAuthenticated,usersController.wishlistGet);

router.post('/wishlist/:productId',isAuthenticated,usersController.wishlistAdd)

router.post('/wishlist/remove/:productId',usersController.wishlistItemDelete)

//coupon Management

router.get('/getCoupons',isAuthenticated,checkoutController.getCoupons);

router.get('/applyCoupon',isAuthenticated,checkoutController.applyCoupon)






//Wallet Route
router.post('/create-razorpay-order',walletcontroller.WalletRazorpayCreation)

router.post('/confirm-payment',walletcontroller.WalletConfirmPayment)

router.post('/withdraw',walletcontroller.withdrawMoney)


router.get('/order-details/downloadInvoice/:orderId',usersController.downloadInvoice)
// router.get('/order-details/downloadInvoice/:orderId',usersController.downloadInvoice)


router.get('/refer',usersController.createuserReferral)

function isAuthenticated(req, res, next) {
  if (req.session && req.session.user) {
    next();
  } else {
    res.redirect('/login');
  }
}

router.get('/referal',usersController.ref)


module.exports = router