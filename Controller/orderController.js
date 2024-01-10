const mongoose = require('mongoose')
const UserModel = require('../models/User');
const { productModel } = require('../models/product');
const CategoryModel = require("../models/category");
const addressModel = require("../models/address");
const orderModel = require("../models/order");
const WalletModel =require("../models/wallet")



const OrderManagementPageGet = async (req, res) => {
    try {
        let perPage = 8; // Define how many users you want per page
        let page = parseInt(req.query.page) || 1; // Get the page number from the request query parameters

        let totalOrders = await orderModel.countDocuments()
        let totalPages = Math.ceil(totalOrders / perPage);
        // Ensure the requested page is within a valid range
        page = Math.max(1, Math.min(page, totalPages));

        const orders = await orderModel.find()
            .sort({ createdAt: -1 })
            .populate('user', 'username')
            .skip(perPage * (page - 1))
            .limit(perPage)
            .exec();

        res.render('admin-order-management', {
            pagetitle: 'Order Management',
            orders,
            currentPage: page,
            totalPages,
            perPage
        });
    } catch (err) {
        console.log(err);
    }
}

const OrderDelete = async (req, res) => {
    try {
        const orderId = req.params.orderId;
        if (!mongoose.Types.ObjectId.isValid(orderId)) {
            return res.status(404).json({ success: false, message: 'It is not an Valid Id' });
        }
        // Implement logic to delete the order by its ID from the database
        // You should also add error handling as needed
        const order = await orderModel.findById(orderId);
        if (!order) {
            return res.status(404).json({ success: true, message: 'Order Not found in Database' })
        }
        await orderModel.findByIdAndDelete(orderId);
        res.status(200).json({ success: true })
    } catch (err) {
        console.log(err);
        res.status(500).send('Error deleting the order');
    }
}


const orderDetailedView = async (req, res) => {
    try {
        const orderId = req.params.orderId;
        console.log(orderId)
        if (!mongoose.Types.ObjectId.isValid(orderId)) {
            return res.status(404).json({ success: false, message: 'It is not an Valid Id' });
        }
        // Implement logic to delete the order by its ID from the database
        // You should also add error handling as needed
        const order = await orderModel.findById(orderId);
        if (!order) {
            return res.status(404).json({ success: false, message: 'Order Not found in Database' })
        }

        const orders = await orderModel.findOne({ _id: orderId }).sort({ createdAt: -1 })
        console.log(orders);
        const userId = orders.user;
        const userDetail = await UserModel.findOne({ _id: userId })
        console.log(userDetail)
        res.render('admin-Order-Details', {
            pagetitle: '',
            orders,
            userDetail,

        });

    } catch (err) {
        console.log(err);
        res.status(500).send('Error deleting the order');
    }

}

const updateOrderStatus = async (req, res) => {
    try {
        const orderId = req.params.orderId;
        const newStatus = req.body.orderStatus;

        if (newStatus === 'Canceled') {
            // If the new order status is 'Canceled,' you should retrieve the order details.
            const canceledOrder = await orderModel.findOne({ oId: orderId });

            if (!canceledOrder) {
                return res.status(404).json({ success: false, message: 'Order not found' });
            }

            // Now, you can loop through the order items and increment the product quantities.
            for (const orderItem of canceledOrder.items) {
                const product = await productModel.findById(orderItem.productId);

                if (product) {
                    // Increment the product countInStock based on the quantity in the canceled order.
                    product.countInStock += orderItem.quantity;
                    await product.save();
                }
            }
        }

        // Update the order status.
        const updatedOrder = await orderModel.findOneAndUpdate(
            { oId: orderId },
            { status: newStatus },
            { new: true }
        );

        if (!updatedOrder) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        return res.status(200).json({ success: true, message: 'Order status updated successfully', updatedOrder });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: 'Error updating order status', error: err.message });
    }
};

const refundAmount = async (req, res) => {
    console.log("Refund amount")
    try {
        const { orderId, userId } = req.body;
        console.log("orderId:", orderId, "userId:", userId,"uuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuu");
        // Find the order
        const order = await orderModel.findById(orderId);
        console.log("Order details:", order);
        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        
        // Check if there is a 'Pending' refund request
        const refundRequest = order.requests.find(request => request.type === 'Cancel' && request.status === 'Pending');

        // Check if there is a 'Pending' return request
        const returnRequest = order.requests.find(request => request.type === 'Return' && request.status === 'Pending');

        if (!refundRequest && !returnRequest) {
            return res.status(400).json({ success: false, message: 'No pending refund or return request found for this order' });
        }

        // Update the request status to 'Accepted'
        if (refundRequest) {
            refundRequest.status = 'Accepted';
        }

        if (returnRequest) {
            returnRequest.status = 'Accepted';
        }
        // Save the updated order
      

        // Find the user and their wallet
        const user = await UserModel.findById(userId);
        const wallet = await WalletModel.findOne({ user: userId });

        if (!user || !wallet) {
            return res.status(404).json({ success: false, message: 'User or wallet not found' });
        }

        // Refund the amount to the user's wallet
        wallet.balance += order.billTotal;

        // Add a transaction record for the refund
        wallet.transactions.push({
            amount: order.billTotal,
            type: 'credit',
        });

        // Save the updated wallet
        await order.save();
        await wallet.save();
        

        return res.json({ success: true, message: 'Amount refunded successfully' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, error: 'Internal server error' });
    }
}


module.exports = {
    OrderManagementPageGet, OrderDelete, orderDetailedView, updateOrderStatus,refundAmount
}