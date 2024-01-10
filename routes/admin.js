const express = require("express");
const router = express.Router();
const session = require("express-session");
const adminModel = require("../models/Admin");
const UserModel = require("../models/User");
const mongoose = require("mongoose");
const nocache = require('nocache')
const adminController = require('../Controller/adminController')
const productController = require("../Controller/productController")
const categoryController = require("../Controller/categoryController")
const { storage, upload } = require("../middleware/multer");
const orderController = require('../Controller/orderController')
const couponController = require('../Controller/couponController')

router.get("/", isAdmin, adminController.adminhome)

router.get("/login", adminController.adminlogin)

router.post("/login", adminController.loginpost)

router.get("/logout", isAdmin, adminController.adminlogout)

router.get("/users", isAdmin, adminController.adminusers)

router.delete("/users/delete/:id", isAdmin, adminController.admindelete)

router.get("/users/add", isAdmin, adminController.adduser)

router.post("/users/add", isAdmin, adminController.adduserpost)

router.get("/users/edit/:userId", isAdmin, adminController.userupdate)

router.post("/users/edit/:userId", isAdmin, adminController.userupdatepost)

router.post("/user-search", isAdmin, adminController.searchuser)

router.get('/usermanagement', isAdmin, adminController.adminusers);

router.post('/blockUser', isAdmin, adminController.userblock);

router.get('/product-management', isAdmin, productController.productManagementGet);

router.post('/product-management/newProduct', isAdmin, upload.fields([{ name: 'image', maxCount: 1 }, { name: 'images' }]), productController.productManagementCreate)

router.get('/product-management/getCategories', isAdmin, productController.productCategories);

router.post('/product-management/editProduct/:Id', isAdmin, upload.fields([{ name: 'image', maxCount: 1 }, { name: 'images' }]), productController.productManagementEdit);

router.delete('/product-management/delete-product/:productId', isAdmin, productController.productManagementDelete);

router.post('/product-management/featuredProduct', isAdmin, productController.productManagementPublish);

router.get('/product-management/removeimg', isAdmin, productController.removeProductImg)

router.get('/product-search', isAdmin, productController.productSearch)

router.get('/category-management', isAdmin, categoryController.categoryManagementGet);

router.post('/category-management/newCategory', isAdmin, upload.single('image'), categoryController.categoryManagementCreate)

router.post('/category-management/edit-category/:categoryId', isAdmin, upload.single('editImage'), categoryController.categoryManagementEdit)

// router.delete('/category-management/delete-category/:categoryId',category.categoryManagementDelete);
router.post('/category-management/isFeatured', isAdmin, categoryController.categoryManagementFeatured)


//order
router.get('/order-management', isAdmin, orderController.OrderManagementPageGet);

router.delete('/order-management/deleteOrder/:orderId', isAdmin, orderController.OrderDelete)

router.get('/order-management/orderDetailedView/:orderId', isAdmin, orderController.orderDetailedView);

router.post('/order-management/update-order-status/:orderId', isAdmin, orderController.updateOrderStatus);

router.post('/refund-amount',orderController.refundAmount)

// admin dashboard

router.get('/',adminController.dashboard)



//Coupon Management

router.get('/coupon-management',isAdmin,couponController.couponManagementGet);
router.post('/createCoupon',isAdmin,couponController.couponCreate);
router.post('/coupon/update-status/:Id',isAdmin,couponController.couponUpdate);
router.post('/EditCoupon/:Id',isAdmin,couponController.couponEdit)




let admiN;

function isAdmin(req, res, next) {
  if (req.session && req.session.isAdmin) {
    next();
  } else {
    res.render('adminLogin');

  }
}

function checkUserSession(req, res, next) {
  if (req.session && req.session.user) {
    res.locals.isUserActive = true;
  } else {
    res.locals.isUserActive = false;
  }
  next();
}

// Apply the checkUserSession middleware to all admin routes
router.use(checkUserSession);




module.exports = router;

