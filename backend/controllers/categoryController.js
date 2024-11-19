const express = require("express");
const Category = require("../models/Category");
const axios = require("axios");
const { authenticateJWT } = require("../config/jwt");
const router = express.Router();

// Cache for icons
let iconsCache = [];

// Add a new category
router.post("/categories", authenticateJWT, async (req, res) => {
    try {
      const { category_name, icon, color } = req.body;
  
      // Check if category already exists
      const existingCategory = await Category.findOne({ category_name });
      if (existingCategory) {
        return res.status(400).json({ message: "Category already exists" });
      }
  
      // Create a new category
      const category = new Category({
        category_name,
        icon,
        color,
      });
  
      // Save the new category
      const savedCategory = await category.save();
      res.status(201).json(savedCategory);
    } catch (error) {
      res.status(500).json({ message: "Failed to create category", error });
    }
  });

// Get all categories
router.get("/categories", async (req, res) => {
    try {
      const categories = await Category.find();
      res.status(200).json(categories);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  });

// Update a category by ID
router.put("/categories/:id", authenticateJWT, async (req, res) => {
    try {
      const { id } = req.params; // Get the category ID from the URL
      const { category_name, icon, color } = req.body; // Get new category details from request body
  
      // Check if the category exists
      const category = await Category.findById(id);
      if (!category) {
        return res.status(404).json({ message: "Category not found" });
      }
  
      // Update category details only if new values are provided
      if (category_name) category.category_name = category_name;
      if (icon) category.icon = icon;
      if (color) category.color = color;
  
      const updatedCategory = await category.save(); // Save the updated category
  
      res.status(200).json(updatedCategory); // Respond with the updated category
    } catch (error) {
      console.error("Error updating category:", error); // Log error for debugging
      res.status(500).json({ message: "Internal server error" });
    }
  });

// Delete a category by ID
router.delete("/categories/:id", authenticateJWT, async (req, res) => {
    try {
      const { id } = req.params; // Get the category ID from the URL
  
      // Check if the category exists
      const category = await Category.findById(id);
      if (!category) {
        return res.status(404).json({ message: "Category not found" });
      }
  
      // Delete the category
      await Category.findByIdAndDelete(id);
      res.status(200).json({ message: "Category deleted successfully" });
    } catch (error) {
      console.error("Error deleting category:", error);
      res.status(500).json({ message: "Failed to delete category" });
    }
  });

// Fetch and search icons
router.get("/icons", async (req, res) => {
  const { query } = req.query;

  // Fetch icons if cache is empty
  if (iconsCache.length === 0) {
    try {
      const { data } = await axios.get(
        "https://cdnjs.cloudflare.com/ajax/libs/bootstrap-icons/1.9.1/font/bootstrap-icons.min.css"
      );

      const iconRegex = /\.bi-([a-zA-Z0-9-]+)/g;
      let match;
      while ((match = iconRegex.exec(data)) !== null) {
        iconsCache.push(`bi-${match[1]}`);
      }
    } catch (error) {
      console.error("Error fetching icons:", error);
      return res.status(500).json({ message: "Failed to fetch icons" });
    }
  }

  // Filter icons based on the query
  if (query) {
    const filteredIcons = iconsCache.filter((icon) => icon.includes(query));
    return res.status(200).json(filteredIcons);
  }

  res.status(200).json(iconsCache);
});

module.exports = router;
