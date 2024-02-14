const mongoose = require('mongoose');
const UserModel = require('../models/User');
const { productModel } = require("../models/product");
const CategoryModel = require("../models/category");
const cartModel = require('../models/cart')
const { log } = require("console");





const userCart = async (req, res) => {
  try {
    console.log(";;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;")
    console.log(req.session)
    const userId = req.session.user._id;
    console.log(userId);
    const category = await CategoryModel.find();
    const cart = await cartModel.findOne({ owner: userId });
    console.log(cart, "........................................?????????????????????");

    if (cart) {
      for (const item of cart.items) {
        let data = await productModel.findById(item.productId);
        item.data = data;
      }
    }

    const user = await UserModel.findOne({
      _id: new mongoose.Types.ObjectId(userId)
    });



    let price = 0;
    if (cart) {
      price = cart.items.reduce((total, item) => total + item.quantity * item.price, 0);
    }

    const cartItemCount = cart ? cart.items.length : 0;

    return res.render("user-cart", {
      category,
      cart: cart,
      user,
      cartItemCount: cartItemCount,
      totalPrice: price,
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: err });
  }
};




const addToCart = async (req, res) => {
  try {
    const { productId } = req.body;

    let product = await productModel.findOne({ _id: productId });

    // Check if the product is available
    if (!product || product.countInStock === 0) {
      return res.status(400).json({ success: false, message: "Product is out of stock" });
    }

    const userId = req.session.user._id;
    const user = await UserModel.findById({ _id: userId });

    // Check if the user exists
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    let cart = await cartModel.findOne({ owner: userId });

    // Create a new cart if it doesn't exist
    if (!cart) {
      cart = new cartModel({
        owner: userId,
        items: [],
        billTotal: 0,
      });
    }

    // Find the cart item by productId
    const cartItem = cart.items.find((item) => item.productId.toString() === productId);

    let outOfStock = false;
    const stock = product.countInStock;

    if (cartItem) {
      // Update existing cart item
      if (cartItem.quantity < stock) {
        cartItem.quantity += 1;
        cartItem.productPrice = product.afterDiscount;
        cartItem.price = cartItem.quantity * product.afterDiscount;
      } else {
        outOfStock = true;
      }
    } else {
      // Add new cart item
      cart.items.push({
        productId: productId,
        name: product.productName,
        image: product.image,
        productPrice: product.afterDiscount,
        quantity: 1,
        price: product.afterDiscount,
      });
    }

    // Calculate the bill total
    const calculatedBillTotal = cart.items.reduce((total, item) => {
      const itemPrice = item.price || 0; // Default to 0 if item.price is NaN
      return total + itemPrice;
    }, 0);

    // Update the cart's billTotal
    cart.billTotal = calculatedBillTotal;

    // Save the updated cart
    await cart.save();

    if (outOfStock) {
      res.status(205).json({ status: false, message: "Product is out of stock in the cart" });
    } else {
      res.status(200).json({ status: true, message: "Product added to cart successfully" });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};




const cartPut = async (req, res) => {
  try {
    console.log(req.body);
    const productId = req.body.productId;
    const userId = req.body.userId;
    console.log(userId);
    const cart = await cartModel.findOne({ owner: userId });

    if (!cart) {
      return res
        .status(404)
        .json({ success: false, message: "Cart not found" });
    }

    const cartItem = cart.items.find(
      (item) => item.productId.toString() === productId
    );

    if (!cartItem) {
      return res
        .status(404)
        .json({ success: false, message: "Cart item not found" });
    }
    const product = await productModel.findById(productId);
    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }

    // Ensure that the quantity doesn't go below 1
    if (req.body.need === "sub" && cartItem.quantity <= 1) {
      return res.status(200).json({
        success: true,
        quantity: cartItem.quantity,
        updatedPrice: cartItem.price,
        totalamt: cart.billTotal,
      });
    }

    cartItem.quantity =
      req.body.need === "sub" ? Math.max(1, cartItem.quantity - 1) : cartItem.quantity + 1;
    cartItem.price = cartItem.quantity * cartItem.productPrice || 0;

    cart.billTotal = req.body.need === "sub"
      ? Math.max(0, cart.billTotal - product.afterDiscount) // Ensure non-negative billTotal
      : cart.billTotal + product.afterDiscount;

    const quantity = cartItem.quantity;

    await cart.save();
    console.log(cart.billTotal);
    let totalamt = cart.billTotal;
    return res.status(200).json({ success: true, quantity, updatedPrice: cartItem.price, totalamt });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Internal server error" });
}
};


const cartRemove = async (req, res) => {
  try {
    console.log(req.body);
    const productId = req.body.productId;
    const userId = req.body.userId;

    const cart = await cartModel.findOne({ owner: userId });

    if (!cart) {
      return res
        .status(404)
        .json({ success: false, message: "Cart Not Found" });
    }

    //  const productIndex = cart.items.findIndex((item) => item.productId.toString() === productId);

    //  if(productIndex === -1){
    //      return res.status(404).json({success:false,message:'Product not found'})
    //  }

    // / Check if the removed item was selected and adjust the billTotal
    //  if (cart.items[productIndex].selected) {
    //      cart.billTotal -= cart.items[productIndex].price;
    //  }

    //  cart.items.splice(productIndex,1);

    cart.items.find((item) => {
      if (item.productId + "" === productId + "") {
        console.log(item);
        cart.billTotal = (cart.billTotal - item.price < 0) ? 0 : cart.billTotal - item.price

        console.log(cart.billTotal);
        return true;
      } else {
        return false;
      }
    });

    await cartModel.findByIdAndUpdate(cart._id, {
      $set: { billTotal: cart.billTotal },
      $pull: { items: { productId: productId } },
    });

    return res
      .status(200)
      .json({ success: true, message: "Product removed from the cart" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

const cartbillTotalUpdate = async (req, res) => {
  try {
    const selectedProductIds = req.body.selectedProductIds;

    // Find the user's cart
    const userId = req.session.email._id;
    const cart = await cartModel.findOne({ owner: userId });

    if (!cart) {
      return res
        .status(404)
        .json({ success: false, message: "Cart is not found based on user" });
    }

    // if(!selectedProducts){
    //     return res.status(404).json({success:false,message:'Selected products not found'})
    // }

    // Set 'selected' to true for all selected products
    cart.items.forEach((item) => {
      if (selectedProductIds.includes(item.productId.toString())) {
        item.selected = true;
      } else {
        item.selected = false; // Unselect other products
      }
    });

    let total = 0;
    cart.items.forEach((item) => {
      if (item.selected) {
        total += item.productPrice * item.quantity;
      }
    });
    // Update the cart's billTotal
    cart.billTotal = total;
    await cart.save();

    res.status(200).json({
      success: true,
      message: "Successfully billtotal updated",
      billTotal: cart.billTotal,
    });
  } catch (err) {
    console.log(err);
    next(err);
  }
};

module.exports = {
  userCart,
  addToCart,
  cartPut,
  cartRemove,
  cartbillTotalUpdate,
};
