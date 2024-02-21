const express = require('express')
const adminModel = require('../models/Admin')
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const bodyParser = require('body-parser');
const admin = require('../routes/admin')
const router = express.Router()
const UserModel = require('../models/User')
const orderModel=require("../models/order")
const {productModel}=require("../models/product")
const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');
const CategoryModel = require('../models/category');



// const adminhome = (req, res) => {
//   res.render("adminHome", { admiN });
// };



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

  let stock = await productModel.find();
  let totalCountInStock = 0;
  stock.forEach((product) => {
    totalCountInStock += product.countInStock;
  });

  let averageSales = orders.length / date; // Fix the average calculation
  let averageRevenue = totalRevenue / date; // Fix the average calculation
// console.log(totalRevenue,totalOrderCount,totalCountInStock,
//   averageSales,
//   averageRevenue,
//   Revenue,"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaa");
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

let adminhome = async (req, res) => {
  if (req.session.isAdmin) {
    req.session.isAdmin = true;

    try {
      let product = await productModel.find();
      let orders = await orderModel.find().sort({ createdAt: -1 }).limit(10).populate('user', 'name');

      const daily = await salesReport(1); // Assuming you want daily data
      const weekly = await salesReport(7);
      const monthly = await salesReport(30);
      const yearly = await salesReport(365);

      let fullSalesData = await salesReport(365); // Assuming you want data for the past 365 days

      // Extract data from the full sales report
      let totalOrders = monthly.totalOrders;
      let averageSales = monthly.averageSales;
      let averageRevenue = monthly.averageRevenue;

      const salesReportData = [];

      for (const order of orders) {
        for (const item of order.items) {
          const product = await productModel.findById(item.productId);
          if (order.user) { // Check if order.user exists
            salesReportData.push({
              productName: product.productName,
              totalStock: product.countInStock,
              customerName: order.user.name,
              totalRevenue: order.billTotal,
              paymentMethod: order.paymentMethod // assuming paymentMethod is available in order
            });
          }
        }
      }

      console.log(monthly.totalOrders, "////////////////////////////");
      console.log(monthly.Revenue, "////////////////////////////");
      console.log("Full Sales Data:", fullSalesData);
      let allProductsCount = await productModel.countDocuments();

      res.render("adminHome", { daily, weekly, monthly, yearly, fullSalesData, orders, product, allProductsCount, totalOrders, averageSales, averageRevenue ,salesReportData});
    } catch (error) {
      console.error("Error in adminhome:", error);
      res.status(500).send("Internal Server Error");
    }
  } else {
    res.redirect("/admin/login");
  }
};

const fetchSalesReport = async (period) => {
  try {
    let startDate = new Date();
    let endDate = new Date();

    // Adjust startDate and endDate based on the desired period
    if (period === 'daily') {
      // For daily report, fetch sales data for today only
      startDate.setHours(0, 0, 0, 0); // Set start time to the beginning of the day
    } else if (period === 'weekly') {
      // For weekly report, fetch sales data for the past week
      startDate.setDate(startDate.getDate() - 7);
    } else if (period === 'monthly') {
      // For monthly report, fetch sales data for the current month
      startDate.setDate(1); // Set to the beginning of the month
      endDate.setMonth(endDate.getMonth() + 1); // Move to the next month
      endDate.setDate(0); // Set to the last day of the current month
    } else if (period === 'yearly') {
      // For yearly report, fetch sales data for the past year
      startDate.setFullYear(startDate.getFullYear() - 1);
    }

    // Fetch orders within the specified period with status "Delivered"
    const orders = await orderModel.find({
      status: "Delivered",
      createdAt: { $gte: startDate, $lte: endDate }
    }).populate('user', 'name');

    // Prepare the sales report data
    const salesReportData = [];

    for (const order of orders) {
      for (const item of order.items) {
        const product = await productModel.findById(item.productId);
        if (order.user) { // Check if order.user exists
          salesReportData.push({
            productName: product.productName,
            totalStock: product.countInStock,
            customerName: order.user.name,
            totalRevenue: order.billTotal,
            paymentMethod: order.paymentMethod // assuming paymentMethod is available in order
          });
        }
      }
    }

    return salesReportData;
  } catch (error) {
    console.error("Error fetching sales report:", error);
    throw error;
  }
};



const downloadPdf = async (req, res) => {
  try {
    // Obtain the sales data for the desired period (e.g., daily)
    let salesData = null; // Change the parameter based on the desired period

    if (req.query.type === 'daily') {
      salesData = await fetchSalesReport('daily');
    } else if (req.query.type === 'weekly') {
      salesData = await fetchSalesReport('weekly');
    } else if (req.query.type === 'monthly') {
      salesData = await fetchSalesReport('monthly');
    } else if (req.query.type === 'yearly') {
      salesData = await fetchSalesReport('yearly');
    }

    console.log("Sales Data:", salesData); // Log the fetched sales data

    if (!salesData || salesData.length === 0) {
      console.log("No sales data available.");
      return res.status(404).send('No sales data available.');
    }

    let doc = new PDFDocument();

    // Set response headers for the PDF file
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="sales_report.pdf"');

    // Pipe the PDF content to the response
    doc.pipe(res);

    // Add content to the PDF
    doc.fontSize(10).text('Sales Report', { align: 'center' });

    // Insert sales data into the PDF as a table
    if (salesData && salesData.length > 0) {
      const table = {
        headers: ['Product Name', 'Total Stock', 'Customer Name', 'Total Revenue', 'Payment Method'],
        rows: salesData.map(data => [
          data.productName,
          data.totalStock,
          data.customerName,
          `INR ${data.totalRevenue.toFixed(2)}`, // Format revenue as currency
          data.paymentMethod
        ])
      };

      // Draw table manually
      let rowPos = 100; // Starting position for the table rows
      const cellWidth = 100; // Width of each cell
      const cellHeight = 20; // Height of each cell

      // Draw headers
      doc.font('Helvetica-Bold');
      table.headers.forEach((header, index) => {
        doc.rect(50 + index * cellWidth, rowPos, cellWidth, cellHeight).stroke(); // Draw cell outline
        doc.text(header, 55 + index * cellWidth, rowPos + 5); // Adjusted position for header text
      });
      rowPos += cellHeight; // Move down for row content

      // Reset font to default
      doc.font('Helvetica');

      // Draw rows
      table.rows.forEach(row => {
        row.forEach((cell, index) => {
          doc.rect(50 + index * cellWidth, rowPos, cellWidth, cellHeight).stroke(); // Draw cell outline
          doc.text(cell.toString(), 55 + index * cellWidth, rowPos + 5); // Adjusted position for cell text
        });
        rowPos += cellHeight; // Move down for the next row
      });
    } else {
      doc.text('No sales data available.');
    }

    // End the document and send it to the client
    doc.end();
  } catch (error) {
    console.error('Error generating PDF:', error);
    res.status(500).send('Error generating PDF.');
  
}
};


const generateExcel = async (req, res, next) => {
  try {
    const salesDatas = await salesReport(0);
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Sales Report');

    worksheet.columns = [
      { header: 'Total Revenue', key: 'totalRevenue', width: 15 },
      { header: 'Total Orders', key: 'totalOrders', width: 15 },
      { header: 'Total Count In Stock', key: 'totalCountInStock', width: 15 },
      { header: 'Average Sales', key: 'averageSales', width: 15 },
      { header: 'Average Revenue', key: 'averageRevenue', width: 15 },
      { header: 'Revenue', key: 'Revenue', width: 15 },
    ];

    worksheet.addRow({
      totalRevenue: salesDatas.totalRevenue,
      totalOrders: salesDatas.totalOrders,
      totalCountInStock: salesDatas.totalCountInStock,
      averageSales: salesDatas.averageSales ? salesDatas.averageSales.toFixed(2) : 'N/A',
      averageRevenue: salesDatas.averageRevenue ? salesDatas.averageRevenue.toFixed(2) : 'N/A',
      Revenue: salesDatas.Revenue,
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="sales_report.xlsx"');

    workbook.xlsx.write(res).then(() => res.end());
  } catch (error) {
    console.log(error);
    return res.status(500).send('Error generating Excel file.');
  }
};



// const adminDashboard = async (req, res) => {
    
//   try {
//       const products = await productModel.find();
//       const orders = await orderModel.find({status:"Delivered"});
//       const category=await CategoryModel.find()
//       const users= await UserModel.find()
//       const perPage = 2;
//       const totalpages = Math.ceil(orders.length / perPage);

//       const latestOrders = await orderModel.find().sort({ createdOn: -1 }).limit(5);
     




//       const productCount = products.length;
//       const orderCount = orders.length;
//       const categoryCount=category.length
//       const currentpage = req.query.currentPage || 1;
//       let totalRevenue = 0;
//       orders.forEach((order) => {
//         totalRevenue += order.billTotal;
//       });
    

//       // const totalRevenue = orders.reduce((total, order) => total + order.totalPrice, 0);
//       console.log(orderCount,"...........................",products, "////////////");

// console.log(totalRevenue,"this is total revenue");

//        //-------------------this is for the sales graph ------------

//         const monthlySales = await orderModel.aggregate([
//           {
//               $match: {
//                   status: "Delivered", // Filter by status
//               },
//           },
//           {
//               $group: {
//                   _id: {
//                       $month: '$createdOn',
//                   },
//                   count: { $sum: 1 },
//               },
//           },
//           {
//               $sort: {
//                   '_id': 1,
//               },
//           },
//       ]);
//       const monthlySalesArray = Array.from({ length: 12 }, (_, index) => {
//           const monthData = monthlySales.find((item) => item._id === index + 1);
//           return monthData ? monthData.count : 0;
//       });


//       ///----------this is for the product data------
//       const productsPerMonth = Array(12).fill(0);

//       // Iterate through each product
//       products.forEach(product => {
//         // Extract month from the createdAt timestamp
//         const creationMonth = product.createdAt.getMonth(); // JavaScript months are 0-indexed
  
//         // Increment the count for the corresponding month
//         productsPerMonth[creationMonth]++;
//       });
//       ///----------this is for the product data--end----
      
//       res.render('salesreport',{totalRevenue:totalRevenue, orderCount, productCount,categoryCount ,monthlySalesArray,productsPerMonth,latestOrders,orders,totalpages,users,currentpage: currentpage });

//   } catch (error) {
//       console.log('Error happened in admin controller at adminLoginPage function ', error);
//   }
// };

// //graph conditions---------------------------------------------------->

// //monthlyRevenue------------------------->

// const monthlyRevenue = async(req,res)=>{
// console.log("entered ");
//   try {
//     const monthlyRevenueData = await Order.aggregate([
//       {
//         $match: { status: 'Delivered' }
//       },
//       {
//         $group: {
//           _id: { $month: '$createdOn' },
//           totalRevenue: { $sum: '$totalPrice' },
//         },
//       },
//     ]);
//     res.json(monthlyRevenueData);
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: err.message });
//   }
// };

// //weeklyRevenue------------------------------------------>

// const weeklyRevenue = async(req,res)=>{

//   try {
//     const weeklyRevenueData = await Order.aggregate([
//       {
//         $match: { status: 'Delivered' }
//       },
//       {
//         $group: {
//           _id: { $week: '$createdOn' },
//           totalRevenue: { $sum: '$totalPrice' },
//         },
//       },
//     ]);
//     res.json(weeklyRevenueData);
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: err.message });
//   }

//  }

// //yearlyRevenue----------------------------------------------->

//   const yearlyRevenue = async(req,res)=>{
//   try {
//     const yearlyRevenueData = await Order.aggregate([
//       {
//         $match: { status: 'Delivered' }
//       },
//       {
//         $group: {
//           _id: { $year: '$createdOn' },
//           totalRevenue: { $sum: '$totalPrice' },
//         },
//       },
//     ]);
//     res.json(yearlyRevenueData);
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: err.message });
//   }
// };


module.exports = {
  adminlogin,
  loginpost, adminhome, adminlogout, adminusers, admindelete, adduser, adduserpost, userupdate, userupdatepost, userblock, searchuser,downloadPdf,generateExcel,

}