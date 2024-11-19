const express = require("express");
const Cart = require("../models/Cart");
const Product = require("../models/Product");
const { authenticateJWT } = require("../config/jwt");
const mongoose = require("mongoose");
module.exports = (io) => {
  const router = express.Router();
  // Add product to cart
  router.post("/", authenticateJWT, async (req, res) => {
    try {
      const { id_product, quantity } = req.body;

      // Check if product exists and has sufficient quantity
      const product = await Product.findById(id_product);
      if (!product || product.quantity < quantity) {
        return res.status(404).json({ message: "Product not found or insufficient stock" });
      }

      // Add item to cart
      const cartItem = new Cart({
        id_product,
        id_user: req.user.id,
        quantity,
      });
      await cartItem.save();

      // Update product quantity in stock
      product.quantity -= quantity;
      await product.save();

      // Emit updated cart count
      const cartCount = await Cart.countDocuments({ id_user: req.user.id });
      io.emit("cartCountUpdated", cartCount);

      res.status(201).json(cartItem);
    } catch (error) {
      console.error("Error adding to cart:", error);
      res.status(500).json({ message: "Failed to add item to cart" });
    }
  });

  // Get all cart items for a user
  router.get("/", authenticateJWT, async (req, res) => {
    try {
      const cartItems = await Cart.find({ id_user: req.user.id })
        .populate("id_product", "product_name money quantity image")
        .exec();

      const populatedCartItems = cartItems.map((item) => ({
        _id: item._id,
        product_id: item.id_product._id,
        product_name: item.id_product.product_name,
        product_price: item.id_product.money,
        product_image: item.id_product.image,
        quantity: item.quantity,
        product_quantity: item.id_product.quantity,
      }));

      res.status(200).json(populatedCartItems);
    } catch (error) {
      console.error("Error fetching cart items:", error);
      res.status(500).json({ message: "Failed to fetch cart items" });
    }
  });

  
  router.put("/:id", async (req, res) => {
    const { id } = req.params; // ID của mục giỏ hàng
    const { quantity } = req.body; // Quantity mới từ body của request
  
    try {
      // Kiểm tra tính hợp lệ của ID
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: "Invalid Cart Item ID" });
      }
  
      // Tìm mục giỏ hàng theo ID
      const cartItem = await Cart.findById(id).populate("id_product");
      if (!cartItem) {
        return res.status(404).json({ message: "Cart item not found" });
      }
  
      // Kiểm tra nếu Quantity mới hợp lệ
      if (quantity < 1) {
        return res.status(400).json({ message: "Quantity must be at least 1" });
      }
  
      // Kiểm tra nếu Quantity vượt quá Quantity sản phẩm có sẵn
      const difference = quantity - cartItem.quantity; // Chênh lệch Quantity
      if (difference > cartItem.id_product.quantity) {
        return res.status(400).json({
          message: `Insufficient stock available. Only ${cartItem.id_product.quantity} items left.`,
        });
      }
  
      // Cập nhật Quantity trong mục giỏ hàng
      cartItem.quantity = quantity;
      await cartItem.save();
  
      // Cập nhật Quantity sản phẩm trong kho (trừ đi sự chênh lệch)
      cartItem.id_product.quantity -= difference;
      await cartItem.id_product.save();
  
      // Gửi phản hồi với số lượng cập nhật
      res.status(200).json({
        message: "Cart item quantity updated successfully",
        cartItem,
        remainingProductQuantity: cartItem.id_product.quantity, // Trả về số lượng sản phẩm còn lại
      });
    } catch (error) {
      console.error("Error updating cart quantity:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Delete a cart item
  router.delete("/:id", authenticateJWT, async (req, res) => {
    try {
      const { id } = req.params;

      const cartItem = await Cart.findOneAndDelete({ _id: id, id_user: req.user.id });
      if (!cartItem) {
        return res.status(404).json({ message: "Cart item not found" });
      }

      const product = await Product.findById(cartItem.id_product);
      if (product) {
        product.quantity += cartItem.quantity;
        await product.save();
      }
       // Emit updated cart count
       const cartCount = await Cart.countDocuments({ id_user: req.user.id });
       io.emit("cartCountUpdated", cartCount);
 

      res.status(200).json({ message: "Cart item deleted successfully" });
    } catch (error) {
      console.error("Error deleting cart item:", error);
      res.status(500).json({ message: "Failed to delete cart item" });
    }
  });

  return router;
};
