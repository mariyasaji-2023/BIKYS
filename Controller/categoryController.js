const CategoryModel = require("../models/category");
const { productModel } = require("../models/product");
const mongoose = require("mongoose")


const categoryManagementGet = async (req, res) => {
    try {
        const categories = await CategoryModel.find(); // Fetch all categories from the database

        // Pass the categories to the view
        res.render('category', {
            pagetitle: 'Category',
            categories: categories, // Pass the categories to the view
        });
    } catch (error) {
        console.error('Error fetching categories:', error);
        res.status(500).send('Internal Server Error');
    }
};


const categoryManagementCreate = async (req, res) => {
    try {
        const { name, description } = req.body;
        let image = null
        if (req.file) {

            image = req.file.path.replace(/\\/g, '/').replace('public/', '');
        }
        // const image = req.file ? req.file.buffer.toString('base64') : null; // Store image as base64 string

        const category = new CategoryModel({
            name,
            description,
            image
        });

        await category.save();

        res.status(201).redirect('/admin/category-management');
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
}


const categoryManagementEdit = async (req, res) => {
    try {
        let { editName, editDescription } = req.body;
        editName = editName.trim();
        editDescription = editDescription.trim();
        const categoryId = req.params.categoryId;
        const category = await CategoryModel.findById(categoryId);

        if (!category) {
            return res.status(404).json({ message: 'Category not found' });
        }
        // Update name and description
        category.name = editName;
        category.description = editDescription;
        // console.log(category.image+"############");
        // Update image if a new one is uploaded
        if (req.file) {
            // Replace backslashes with forward slashes and remove 'public/' from the path
            const newImage = req.file.path.replace(/\\/g, '/').replace('public/', '');
            category.image = newImage;
        }
        console.log(req.body, req.file);
        await category.save();

        res.status(200).redirect('/admin/category-management');
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
}


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

