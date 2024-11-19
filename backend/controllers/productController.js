const express = require("express");
const { authenticateJWT } = require("../config/jwt"); // Adjust the path according to your folder structure
const multer = require("multer");
const Product = require("../models/Product");
const Category = require("../models/Category");
const path = require("path");

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});
const upload = multer({ storage: storage });


// Add new product
router.post(
  "/products",
  authenticateJWT,
  upload.single("image"),
  async (req, res) => {
    try {
      const { product_name, money, discount_amount, quantity, id_category } =
        req.body;

      // Check if the product name already exists and is not deleted
      const existingProduct = await Product.findOne({
        product_name,
        isDeleted: false,
      });
      if (existingProduct) {
        return res
          .status(400)
          .json({ message: "Product already exists and is active." });
      }

      // Check if the specified category exists
      const category = await Category.findById(id_category);
      if (!category) {
        return res.status(400).json({ message: "Category not found" });
      }

      // Calculate the final price after discount
      const discount = discount_amount ? parseFloat(discount_amount) / 100 : 0; // Convert discount percentage to decimal
      const finalPrice = money - money * discount; // Calculate final price after discount

      // Create a new product
      const product = new Product({
        product_name,
        money: finalPrice, // Save the final price after discount
        discount_amount: discount_amount || 0,
        quantity,
        image: req.file.path,
        id_category,
        isDeleted: false, // Ensure the new product is not marked as deleted
      });

      // Save the new product to the database
      const savedProduct = await product.save();
      res.status(201).json(savedProduct);
    } catch (error) {
      console.error("Error adding product:", error); // Log error for debugging
      res.status(500).json({ message: error.message });
    }
  }
);



// Get all products with pagination and sorting
router.get("/products", async (req, res) => {
    try {
      const { page = 1, limit = 11, sortBy = "price", order = "asc" } = req.query;
  
      // Convert pagination parameters to numbers
      const pageNumber = parseInt(page, 11);
      const limitNumber = parseInt(limit, 11);
      const sortOrder = order === "asc" ? 1 : -1; // MongoDB sort order
  
      // Find products
      const products = await Product.find({ isDeleted: false })
        .populate("id_category")
        .sort({ [sortBy]: sortOrder }) // Sort by the specified field
        .skip((pageNumber - 1) * limitNumber) // Pagination
        .limit(limitNumber); // Limit results
  
      // Get total count of products
      const totalCount = await Product.countDocuments({ isDeleted: false });
  
      // Respond with products and metadata
      res.status(200).json({
        totalCount,
        page: pageNumber,
        limit: limitNumber,
        products,
      });
    } catch (error) {
      console.error("Error fetching products:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

// Get a single product by ID
router.get("/products/:id", async (req, res) => {
    try {
      // Find the product by ID and ensure it is not marked as deleted
      const product = await Product.findOne({
        _id: req.params.id,
        isDeleted: false,
      });
  
      if (!product) {
        return res
          .status(404)
          .json({ message: "Product not found or has been deleted" });
      }
  
      res.json(product);
    } catch (error) {
      console.error("Error fetching product:", error); // Log the error for debugging
      res.status(500).json({ message: "Internal server error" });
    }
  });

// Update product details
router.put(
    "/products/:id",
    authenticateJWT,
    upload.single("image"),
    async (req, res) => {
      try {
        const { id } = req.params;
        const { product_name, money, discount_amount, quantity, id_category } =
          req.body;
  
        const product = await Product.findById(id);
        if (!product) {
          return res.status(404).json({ message: "Product not found" });
        }
  
        product.product_name = product_name;
        product.money = money;
        product.discount_amount = discount_amount || 0;
        product.quantity = quantity;
        product.id_category = id_category;
  
        if (req.file) {
          product.image = req.file.path;
        }
  
        const updatedProduct = await product.save();
        res.status(200).json(updatedProduct);
      } catch (error) {
        res.status(500).json({ message: error.message });
      }
    }
  );

// Soft-delete a product
router.delete("/products/:id", authenticateJWT, async (req, res) => {
    try {
      const { id } = req.params;
      const product = await Product.findById(id);
  
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
  
      // Mark the product as deleted
      product.isDeleted = true;
      await product.save();
  
      res.status(200).json({ message: "Product deleted successfully" });
    } catch (error) {
      console.error("Error deleting product:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  router.get("/productAll", async (req, res) => {
    try {
      const products = await Product.find({ isDeleted: false }).populate(
        "id_category"
      );
      res.status(200).json(products);
    } catch (error) {
      console.error("Error fetching products:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
// API to get products by category ID
router.get("/products/category/:categoryId", async (req, res) => {
    try {
      const { categoryId } = req.params; // Get the category ID from the URL
  
      // Find products by category ID and ensure they are not marked as deleted
      const products = await Product.find({
        id_category: categoryId,
        isDeleted: false,
      }).populate("id_category");
  
      // Return an empty array if no products are found
      if (!products || products.length === 0) {
        console.warn(`No products found for category ID: ${categoryId}`);
        return res.status(200).json([]); // Return an empty array instead of 404
      }
  
      res.status(200).json(products);
    } catch (error) {
      console.error("Error fetching products by category:", error);
      res.status(500).json({ message: "Failed to fetch products by category" });
    }
  });

// Function to remove accents from search terms
const removeAccents = (string) => {
    const accentMap = {
        à: "a", á: "a", ả: "a", ã: "a", ạ: "a", ă: "a", ằ: "a", ắ: "a", ẳ: "a",
        ẵ: "a", ặ: "a", â: "a", ầ: "a", ấ: "a", ẩ: "a", ẫ: "a", ậ: "a", è: "e",
        é: "e", ẻ: "e", ẽ: "e", ẹ: "e", ê: "e", ề: "e", ế: "e", ể: "e", ễ: "e",
        ệ: "e", ì: "i", í: "i", ỉ: "i", ĩ: "i", ị: "i", ò: "o", ó: "o", ỏ: "o",
        õ: "o", ọ: "o", ô: "o", ồ: "o", ố: "o", ổ: "o", ỗ: "o", ộ: "o", ơ: "o",
        ờ: "o", ớ: "o", ở: "o", ỡ: "o", ợ: "o", ù: "u", ú: "u", ủ: "u", ũ: "u",
        ụ: "u", ư: "u", ừ: "u", ứ: "u", ử: "u", ữ: "u", ự: "u", ỳ: "y", ý: "y",
        ỷ: "y", ỹ: "y", ỵ: "y", đ: "d"
    };

    return string
        .split("")
        .map((char) => accentMap[char] || char)
        .join("");
};

// Product search with accent removal
router.get("/search", async (req, res) => {
    const searchTerm = req.query.search || ""; // Get the search term from query parameters
    const normalizedSearchTerm = removeAccents(searchTerm); // Normalize the search term
    console.log(`Searching products with term: "${normalizedSearchTerm}"`);
  
    try {
      if (!normalizedSearchTerm.trim()) {
        return res.status(400).json({ message: "Search term cannot be empty" });
      }
  
      // Use regex search for both normalized term and the original search term
      const products = await Product.find({
        $or: [
          { product_name: { $regex: normalizedSearchTerm, $options: "i" } }, // Search without accents
          { product_name: { $regex: searchTerm, $options: "i" } }, // Optional: Search with accents if needed
        ],
        isDeleted: false, // Only get products that are not deleted
      });
  
      // Check if no products were found and return an empty array
      if (products.length === 0) {
        console.log("No products found");
        return res.status(200).json([]); // Return an empty array if no products found
      }
  
      console.log(
        `Found ${products.length} products for term: "${normalizedSearchTerm}"`
      );
      res.status(200).json(products); // Return the found products
    } catch (error) {
      console.error("Error fetching products:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  router.get("/search/suggestions", async (req, res) => {
    const searchTerm = req.query.query || ""; // Lấy từ khóa từ query parameters
  
    console.log(`Received search term: "${searchTerm}"`); // Log để kiểm tra Price trị từ client
  
    try {
      // Nếu từ khóa trống, trả về mảng rỗng
      if (!searchTerm.trim()) {
        return res.status(200).json([]);
      }
  
      // Tìm kiếm sản phẩm có tên chứa từ khóa (không phân biệt chữ hoa/thường)
      const suggestions = await Product.find({
        product_name: { $regex: searchTerm, $options: "i" }, // Tìm kiếm với regex
        isDeleted: false, // Chỉ lấy sản phẩm chưa bị xóa
      })
        .limit(10) // Giới hạn Quantity gợi ý trả về
        .select("product_name"); // Chỉ lấy trường product_name
  
      // Kiểm tra xem có sản phẩm nào khớp không
      if (suggestions.length === 0) {
        console.log("No products found for search term:", searchTerm);
      } else {
        console.log(
          `Found ${suggestions.length} products for term: "${searchTerm}"`
        );
      }
  
      // Trả về danh sách Product Name làm gợi ý
      const suggestionNames = suggestions.map((product) => product.product_name);
      res.status(200).json(suggestionNames); // Trả về mảng Product Name
    } catch (error) {
      console.error("Error fetching suggestions:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

module.exports = router;
