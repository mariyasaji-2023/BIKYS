const express = require('express')
const adminModel = require('../models/Admin')
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const bodyParser = require('body-parser');
const admin = require('../routes/admin')
const router = express.Router()
const UserModel = require('../models/User')

const adminhome = (req, res) => {
  res.render("adminHome", { admiN });
};



const adminlogin = (req, res) => {
  if (req.session.isAdmin) {
    return res.redirect("/admin");
  } else {
    res.render("adminLogin");
  }
};

const loginpost = async (req, res) => {
  const { email, password } = req.body;


  try {
    console.log(adminModel);

    const admin = await adminModel.findOne({ email, password });

    console.log(admin);

    if (admin) {
      admiN = admin.name;
      req.session.isAdmin = true;
      console.log(admin);
      res.status(200);
      res.redirect("/admin");
    } else {
      res.render("adminLogin", {
        errorMessage: "Invalid admin credentials",
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
};

const adminusers = async (req, res) => {
  const users = await UserModel.find();
  console.log(users);
  res.render("usersList", { users });
  console.log(users);
};

let userblock = async (req, res) => {
  let { id } = req.body;
  let users = await UserModel.findById(id);
  if (users) {
    if (users.isBlocked === true) {
      users.isBlocked = false;
      users.save();
      res.status(200).json({
        status: true
      });
    } else if (users.isBlocked === false) {
      users.isBlocked = true;
      users.save();
      res.status(201).json({
        status: true
      });
    }
  } else {
    res.status(402).json({
      status: true
    });
  }
};

const admindelete = async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await UserModel.findByIdAndDelete(userId);

    if (!user) {
      res.status(404).send("User not found");
    } else {
      req.session.user = false;
      res.send("User deleted successfully");
    }
  } catch (err) {
    console.error(err);
    res.status(500).send("An error occurred while deleting the user");
  }
};



const adminlogout = (req, res) => {
  console.log("hello logout ");

  req.session.isAdmin = false;
  res.redirect('/admin/login')

};

const adduser = (req, res) => {
  res.render("adminAdduser");
};

const adduserpost = (req, res) => {
  const { username, email, password } = req.body;

  // Check if the user already exists in the database
  UserModel.findOne({ email: email })
    .then((foundUser) => {
      if (foundUser) {
        res.render("adminAdduser", {
          errorMessage: "User already exists. Please See in your list.",
        });
      } else {
        const newUser = new UserModel({
          name: username,
          email: email,
          password: password,
        });

        newUser
          .save()
          .then(() => {
            res.send(
              '<script> window.location.href = "/admin/users"; alert("New User are added successfully."); </script>'
            );
            return;
          })
          .catch((err) => {
            console.error(err);
            res.send(
              '<script>alert("Error occurred while registering the user."); window.location.href = "/users";</script>'
            );

          });
      }
    })
    .catch((err) => {
      console.error(err);
      res.send(
        '<script>alert("Error occurred while checking user existence."); window.location.href = "/signup";</script>'
      );
    });
};

const userupdate = async (req, res) => {
  try {
    const userId = req.params.userId;
    const user = await UserModel.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    // Render the EJS template for editing user details
    res.render("adminEdituser", { user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const userupdatepost = async (req, res) => {
  try {
    const userId = req.params.userId;

    const updatedUserDetails = req.body;
    console.log("herer updated");

    const user = await UserModel.findByIdAndUpdate(userId, updatedUserDetails, {
      new: true,
    });
    if (!user) {
      res.send(
        '<script> window.location.href = "/admin/users"; alert("User is Not Found or something error occurs."); </script>'
      );
      return;
    }

    res.send(
      '<script> window.location.href = "/admin/users"; alert("User Details are updated successfully."); </script>'
    );
    return;
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const searchuser = async (req, res) => {
  try {
    const { searchTerm } = req.body;
    console.log(searchTerm, "........................................................");
    // Perform the user search based on the searchTerm
    const users = await UserModel.find({
      $or: [
        { name: { $regex: searchTerm, $options: "i" } }, // Case-insensitive name search
        { email: { $regex: searchTerm, $options: "i" } }, // Case-insensitive email search
      ],
    });

    // Render a page with the search results
    res.render("usersList", { users });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

//   const searchuser = async (req, res) => {
//     try {
//       const { query } = req.body;

//       // Use a regular expression for case-insensitive search
//       const users = await UserModel.find({
//         $or: [
//           { name: { $regex: query, $options: 'i' } },
//           { email: { $regex: query, $options: 'i' } },
//           // Add other fields you want to search here
//         ],
//       });

//       res.render("usersList", { users }); // Adjust the rendering logic and path accordingly

//     } catch (error) {
//       console.error(error);
//       res.status(500).send('Internal Server Error');
//     }
//   }


async function salesReport(date) {
  const currentDate = new Date();
  let orders = [];

  for (let i = 0; i < date; i++) {
    const startDate = new Date(currentDate);
    startDate.setDate(currentDate.getDate() - i);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(currentDate);
    endDate.setDate(currentDate.getDate() - i);
    endDate.setHours(23, 59, 59, 999);  

    const dailyOrders = await orderModel.find({
      status: "Delivered",
      orderDate: {
        $gte: startDate,
        $lt: endDate,
      },
    });

    orders = [...orders, ...dailyOrders];
  }

  let users = await UserModel.countDocuments();
  // console.log(orders, "orders function inside");

  let totalRevenue = 0;
  orders.forEach((order) => {
    totalRevenue += order.billTotal;
  });

  let totalOrderCount = await orderModel.find({
    status: "Delivered",
  });

  let Revenue = 0;
  totalOrderCount.forEach((order) => {
    Revenue += order.billTotal;
  });

  let stock = await ProductModel.find();
  let totalCountInStock = 0;
  stock.forEach((product) => {
    totalCountInStock += product.countInStock;
  });

  let averageSales = orders.length / date; // Fix the average calculation
  let averageRevenue = totalRevenue / date; // Fix the average calculation

  return {
    users,
    totalOrders: orders.length,
    totalRevenue,
    totalOrderCount: totalOrderCount.length,
    totalCountInStock,
    averageSales,
    averageRevenue,
    Revenue,
  };
}


let dashboard = async (req, res) => {
  if (req.session.admin) {
    req.session.admn = true;

    let orders = await orderModel.find().sort({ createdAt: -1 }).limit(10).populate('user', 'fullname')

    let daily = await salesReport(1)
    let weekly = await salesReport(7);
    let monthly = await salesReport(30);
    let yearly = await salesReport(365)

    console.log("D:",daily,"W:",weekly,"M:",monthly,"Y:",yearly)
    let allProductsCount = await ProductModel.countDocuments();

    res.render("admin-dashboard",{daily,weekly,monthly,yearly,orders,allProductsCount});
  } else {
    res.redirect("/admin/login");
  }
};



module.exports = {
  adminlogin,
  loginpost, adminhome, adminlogout, adminusers, admindelete, adduser, adduserpost, userupdate, userupdatepost, userblock, searchuser,dashboard
}