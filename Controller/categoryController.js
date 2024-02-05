const CategoryModel = require("../models/category");
const { productModel } = require('../models/product');
const mongoose = require('mongoose')

const categoryManagementGet = async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = 5; // number of categories per page
    try {
        const totalCategory = await CategoryModel.countDocuments()
        const totalPages = Math.ceil(totalCategory/limit)

        const categories = await CategoryModel.find()// Fetch all categories from the database
        .skip((page-1)*limit)
        .limit(limit)

        // Pass the categories to the view
        res.render('category', {
            pagetitle: 'Category',
            categories: categories, // Pass the categories to the view
            currentPage:page,
            totalPages
        });
    } catch (error) {
        console.error('Error fetching categories:', error);
        res.status(500).send('Internal Server Error');
    }
};


const categoryManagementCreate = async (req, res) => {
    try {
        const { name, description } = req.body;
        let image = null;

        if (req.file) {
            image = req.file.path.replace(/\\/g, '/').replace('public/', '');
        }

        // Check if a category with the same name (case-insensitive) already exists
        const existingCategory = await CategoryModel.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') } });

        if (existingCategory) {
            return res.status(400).json({ error: 'Category with the same name already exists.' });
        }

        const category = new CategoryModel({
            name,
            description,
            image,
        });

        await category.save();

        // Send a success response if the category is created
        res.status(200).json({ success: true, message: 'Category created successfully.' });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};






const categoryManagementEdit = async (req, res) => {
    try {
        let { editName, editDescription } = req.body;
        editName = editName.trim();
        editDescription = editDescription.trim();
        const categoryId = req.params.categoryId;
        const page = parseInt(req.query.page) || 1;
        const limit = 5; // number of categories per page

        const category = await CategoryModel.findById(categoryId);

        if (!category) {
            return res.status(404).json({ message: 'Category not found' });
        }

        // Check if a category with the same name (case-insensitive) already exists
        const existingCategory = await CategoryModel.findOne({
            name: { $regex: new RegExp(`^${editName}$`, 'i') },
        });

        if (existingCategory && existingCategory._id.toString() !== categoryId) {
            return res.status(400).json({ error: 'Category with the same name already exists.' });
        }

        // Update name and description
        category.name = editName;
        category.description = editDescription;

        // Update image if a new one is uploaded
        if (req.file) {
            // Replace backslashes with forward slashes and remove 'public/' from the path
            const newImage = req.file.path.replace(/\\/g, '/').replace('public/', '');
            category.image = newImage;
        }

        await category.save();

        const totalCategory = await CategoryModel.countDocuments();
        const totalPages = Math.ceil(totalCategory / limit);

        const categories = await CategoryModel.find()
            .skip((page - 1) * limit)
            .limit(limit);

        res.render('category', {
            pagetitle: 'Category',
            categories: categories,
            currentPage: page,
            totalPages,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};






const categoryManagementFeatured = async (req, res) => {
    try {
        let { categoryId } = req.body
        let data = await CategoryModel.findById(categoryId)
        if (data.isFeatured === true) {
            data.isFeatured = false
            await productModel.updateMany({ category: new mongoose.Types.ObjectId(categoryId) }, { $set: { isFeatured: false } })
            await data.save()
            res.status(200).json({ status: true })
        } else if (data.isFeatured === false) {
            data.isFeatured = true
            await productModel.updateMany({ category: new mongoose.Types.ObjectId(categoryId) }, { $set: { isFeatured: true } })
            await data.save()
            res.status(200).json({ status: true })
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
}


module.exports = {
    categoryManagementCreate,
    categoryManagementGet,
    categoryManagementEdit,
    categoryManagementFeatured
}