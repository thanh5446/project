const express = require("express");

const axios = require("axios");

const cheerio = require("cheerio");
const mongoose = require("mongoose");
const cors = require("cors");
const { OAuth2Client } = require("google-auth-library");
const { Schema } = mongoose;
const AutoIncrement = require("mongoose-sequence")(mongoose);
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const bcrypt = require("bcryptjs");
const crypto = require("crypto"); // Đảm bảo đã import ở đây
const querystring = require("querystring");
const multer = require("multer");
const path = require("path");
const passport = require("passport");
const session = require("express-session");
const socketIO = require("socket.io");
const http = require("http");
const bodyParser = require("body-parser");
const url = require("url");
// Middleware to parse JSON and URL-encoded bodies

// Initialize app and Google OAuth2 client
const app = express();
let iconsCache = []; // Global variable to store icons
const server = http.createServer(app);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
const io = socketIO(server, {
  cors: {
    rigin: ["http://localhost:3000", "http://localhost:3001"], // Allow requests from the frontend
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Authorization", "Content-Type"],
    credentials: true,
  },
});

// Google OAuth client
const googleClient = new OAuth2Client(
  "987967147884-r59bb5gb945o2q81rjgeegc1cmci28gd.apps.googleusercontent.com"
); // Thay thế với Google Client ID

// Middleware setup
app.use(express.json());
app.use(
  cors({
    origin: ["http://localhost:3000", "http://localhost:3001"], // Thêm cổng 3001 vào danh sách
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Authorization", "Content-Type"],
    credentials: true,
  })
);

// Serve uploaded files statically
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// MongoDB connection
mongoose
  .connect("mongodb://localhost:27017/shop", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB connected!"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Session middleware setup
app.use(
  session({
    secret: "your_session_secret999999",
    resave: false,
    saveUninitialized: true,
  })
);

// JWT secret key
const JWT_SECRET = "your_jwt_secret_key999999";

// MongoDB Schemas
const roleSchema = new Schema({
  user_role: { type: String, required: true },
});
const Role = mongoose.model("Role", roleSchema);

const userSchema = new Schema({
  username: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String },
  googleId: { type: String },
  id_role: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Role",
    default: new mongoose.Types.ObjectId("6713daec0b1bee2f1eeec409"), // Default role ID
  },
  numberphone: { type: String },
  address: { type: String },
});
userSchema.plugin(AutoIncrement, { inc_field: "id" });
const User = mongoose.model("User", userSchema);

const categorySchema = new Schema({
  category_name: { type: String, required: true },
  icon: { type: String, required: true },
  color: { type: String, required: true },
});
const Category = mongoose.model("Category", categorySchema);

const productSchema = new mongoose.Schema({
  product_name: { type: String, required: true },
  money: { type: Number, required: true },
  discount_amount: { type: Number, default: 0 },
  quantity: { type: Number, default: 0 },
  image: { type: String, required: true },
  id_category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Category",
    required: true,
  },
  isDeleted: { type: Boolean, default: false }, // New field for deleted status
});

//  Function de tao ID cua admin trong mongo
// async function testRoleSchema() {
//   try {
//     // Create a new role
//     const newRole = new Role({ user_role: "Admin" });

//     // Save the role to the database
//     await newRole.save();

//     console.log("Role saved successfully:", newRole);

//     // Retrieve and log all roles
//     const roles = await Role.find();
//     console.log("Retrieved roles from database:", roles);

//   } catch (error) {
//     console.error("Error:", error);
//   } finally {
//     // Close the database connection
//     mongoose.connection.close();
//   }
// }

// // Run the test function
// testRoleSchema();

// Tạo text index cho trường `product_name`
productSchema.index({ product_name: "text" });

const Product = mongoose.model("Product", productSchema);

const cartSchema = new Schema({
  id_product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  id_user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  quantity: { type: Number, required: true, min: 1 },
});
const Cart = mongoose.model("Cart", cartSchema);

const checkoutSchema = new mongoose.Schema({
  id_product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  id_user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  status: {
    type: String,
    enum: ["pending", "completed", "failed"],
    default: "pending",
  },
  date_checkout: { type: Date, default: Date.now },
  amount: { type: Number, required: true },
  quantity: { type: Number, required: true },
  orderId: { type: String, required: true },
  payUrl: { type: String },
  message: { type: String },
});

const Checkout = mongoose.model("Checkout", checkoutSchema);
module.exports = Checkout;
// Multer configuration for handling file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});
const upload = multer({ storage: storage });

const authenticateJWT = (req, res, next) => {
  const token =
    req.headers.authorization && req.headers.authorization.split(" ")[1];
  if (!token) {
    return res.status(403).json({ message: "Token is required" });
  }
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: "Invalid token" });
    }
    req.user = user;
    next();
  });
};

// Google OAuth Authentication Route
app.post("/auth/google", async (req, res) => {
  try {
    const { token } = req.body;
    const ticket = await googleClient.verifyIdToken({
      idToken: token,
      audience:
        "987967147884-r59bb5gb945o2q81rjgeegc1cmci28gd.apps.googleusercontent.com",
    });
    const payload = ticket.getPayload();
    const googleId = payload["sub"];

    let user = await User.findOne({ googleId });
    if (!user) {
      user = new User({
        username: payload["name"],
        email: payload["email"],
        googleId,
      });
      await user.save();
    }

    const jwtToken = jwt.sign(
      { id: user._id, username: user.username },
      JWT_SECRET,
      { expiresIn: "1h" }
    );
    res.status(200).json({ token: jwtToken, user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Google login failed." });
  }
});

// Standard login route (email/password)
app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }

    const user = await User.findOne({ email }).populate("id_role");
    if (!user) {
      console.warn(`Login attempt with non-existent email: ${email}`);
      return res.status(400).json({ message: "User not found" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      console.warn(`Invalid password attempt for email: ${email}`);
      return res.status(400).json({ message: "Invalid password" });
    }

    const token = jwt.sign(
      { id: user._id, username: user.username, role: user.id_role.user_role },
      JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.status(200).json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.id_role.user_role,
        numberphone: user.numberphone,
        address: user.address,
      },
      message: "Login successful",
    });
  } catch (error) {
    console.error("Internal server error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Registration API
app.post("/api/register", async (req, res) => {
  try {
    const { username, email, password, numberphone, address } = req.body;
    const existingUser = await User.findOne({ $or: [{ username }, { email }] });
    if (existingUser) {
      return res
        .status(400)
        .json({ message: "Username or email already exists." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({
      username,
      email,
      password: hashedPassword,
      numberphone,
      address,
    });

    const savedUser = await user.save();

    // Generate a JWT token
    const token = jwt.sign(
      { id: savedUser._id, username: savedUser.username },
      JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.status(201).json({
      token,
      user: {
        id: savedUser._id,
        username: savedUser.username,
        email: savedUser.email,
        numberphone: savedUser.numberphone,
        address: savedUser.address,
      },
      message: "Registration successful!",
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(400).json({ message: error.message });
  }
});
app.get("/api/productAll", async (req, res) => {
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

// API to get all products
app.get("/api/products", async (req, res) => {
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

// API to add new product
app.post(
  "/api/products",
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

// API to update a product
app.put(
  "/api/products/:id",
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
// Add a new category
app.post("/api/categories", authenticateJWT, async (req, res) => {
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

// API to get all categories
app.get("/api/categories", async (req, res) => {
  try {
    const categories = await Category.find();
    res.status(200).json(categories);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// API to get all users
app.get("/api/users", async (req, res) => {
  try {
    const users = await User.find().populate("id_role", "user_role");
    res.status(200).json(users);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete a user API
app.delete("/api/users/:id", authenticateJWT, async (req, res) => {
  try {
    const { id } = req.params;
    // Check if user exists
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Delete related data (cart and checkout)
    await Cart.deleteMany({ id_user: id });
    await Checkout.deleteMany({ id_user: id });

    // Delete user
    await User.findByIdAndDelete(id);

    res
      .status(200)
      .json({ message: "User and related data deleted successfully" });
  } catch (error) {
    console.error("Error deleting user:", error); // Log the error for debugging
    res.status(500).json({ message: "Internal server error" });
  }
});

// API to get product details by ID
app.get("/api/products/:id", async (req, res) => {
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

app.delete("/api/products/:id", authenticateJWT, async (req, res) => {
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

// API for adding product to cart
app.post("/api/cart", authenticateJWT, async (req, res) => {
  try {
    const { id_product, quantity } = req.body;

    // Check if the product exists and get its available quantity
    const product = await Product.findById(id_product);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Check if the requested quantity exceeds the available quantity
    if (quantity > product.quantity) {
      return res.status(400).json({ message: "Insufficient stock available" });
    }

    // Proceed to create the cart item
    const cartItem = new Cart({
      id_product,
      id_user: req.user.id,
      quantity,
    });
    await cartItem.save();

    // Update the product's quantity
    product.quantity -= quantity;
    await product.save();

    // Emit the updated cart count
    const cartCount = await Cart.countDocuments({ id_user: req.user.id });
    io.emit("cartCountUpdated", cartCount); // Notify all clients
    res.status(201).json(cartItem);
  } catch (error) {
    console.error("Failed to add item to cart:", error); // Log error for debugging
    res.status(500).json({ message: "Failed to add item to cart" });
  }
});
// API to delete a cart item
app.delete("/api/cart/:id", authenticateJWT, async (req, res) => {
  try {
    const { id } = req.params; // Get the cart item ID from the URL

    // Find and delete the cart item
    const cartItem = await Cart.findOneAndDelete({
      _id: id,
      id_user: req.user.id,
    });

    if (!cartItem) {
      return res.status(404).json({ message: "Cart item not found" });
    }

    // Find the associated product
    const product = await Product.findById(cartItem.id_product);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Increase the product's quantity based on the quantity in the cart
    product.quantity += cartItem.quantity;

    // Save the updated product
    await product.save();

    res.status(200).json({ message: "Cart item deleted successfully" });
  } catch (error) {
    console.error("Error deleting cart item:", error);
    res.status(500).json({ message: "Failed to delete cart item" });
  }
});

// API to get products by category ID
app.get("/api/products/category/:categoryId", async (req, res) => {
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

// API to fetch items in the cart
// API to fetch items in the cart
app.get("/api/cart", authenticateJWT, async (req, res) => {
  try {
    const cartItems = await Cart.find({ id_user: req.user.id })
      .populate("id_product", "product_name money quantity image") // Include available quantity
      .exec();

    const populatedCartItems = cartItems.map((item) => ({
      _id: item._id,
      product_id: item.id_product._id,
      product_name: item.id_product.product_name,
      product_price: item.id_product.money,
      product_image: item.id_product.image,
      quantity: item.quantity,
      product_quantity: item.id_product.quantity, // Add this line to get available stock
    }));

    res.status(200).json(populatedCartItems);
  } catch (error) {
    console.error("Failed to fetch cart items:", error);
    res.status(500).json({ message: "Failed to fetch cart items" });
  }
});

const redirectUrl = "http://localhost:4000/api/payment/result"; // Endpoint xử lý kết quả thanh toán

app.post("/api/payment", authenticateJWT, async (req, res) => {
  try {
    const cartItems = await Cart.find({ id_user: req.user.id }).populate(
      "id_product"
    );

    if (!cartItems || cartItems.length === 0) {
      return res
        .status(400)
        .json({ message: "Cart is empty, cannot proceed to payment." });
    }

    const user = await User.findById(req.user.id);
    if (
      !user ||
      !user.username ||
      !user.email ||
      !user.address ||
      !user.numberphone
    ) {
      return res.status(400).json({
        message:
          "Please update your profile with complete information before proceeding to payment.",
      });
    }

    const totalAmount = cartItems.reduce(
      (total, item) => total + item.id_product.money * item.quantity,
      0
    );

    const accessKey = "F8BBA842ECF85";
    const secretKey = "K951B6PE1waDMi640xX08PD3vg6EkVlz";
    const partnerCode = "MOMO";
    const orderId = partnerCode + new Date().getTime();
    const orderInfo = "pay with MoMo " + orderId;
    const ipnUrl = "https://webhook.site/b3088a6a-2d17-4f8d-a383-71389a6c600b";
    const requestType = "payWithMethod";
    const amount = totalAmount.toString();
    const requestId = orderId;
    const extraData = req.user.id; // Store user ID in extraData
    const autoCapture = true;
    const lang = "vi";

    const rawSignature = `accessKey=${accessKey}&amount=${amount}&extraData=${extraData}&ipnUrl=${ipnUrl}&orderId=${orderId}&orderInfo=${orderInfo}&partnerCode=${partnerCode}&redirectUrl=${redirectUrl}&requestId=${requestId}&requestType=${requestType}`;
    const signature = crypto
      .createHmac("sha256", secretKey)
      .update(rawSignature)
      .digest("hex");

    const requestBody = JSON.stringify({
      partnerCode,
      partnerName: "Test",
      storeId: "MomoTestStore",
      requestId,
      amount,
      orderId,
      orderInfo,
      redirectUrl,
      ipnUrl,
      lang,
      requestType,
      autoCapture,
      extraData,
      signature,
    });

    const options = {
      method: "POST",
      url: "https://test-payment.momo.vn/v2/gateway/api/create",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(requestBody),
      },
      data: requestBody,
    };

    let result = await axios(options);
    console.log("Payment response:", result.data);

    const checkoutRecords = cartItems.map((item) => ({
      id_product: item.id_product._id,
      id_user: req.user.id,
      amount: item.id_product.money,
      quantity: item.quantity,
      status: "pending",
      orderId,
      payUrl: result.data.payUrl,
    }));

    // Lưu bản ghi giao dịch với Status "pending" và payUrl
    await Checkout.insertMany(checkoutRecords);

    return res.status(200).json({ payUrl: result.data.payUrl });
  } catch (error) {
    console.error("Error during payment request:", error);
    return res.status(500).json({
      statusCode: 500,
      message: "Server error",
    });
  }
});

app.get("/api/payment/result", async (req, res) => {
  const { orderId, resultCode, message, extraData } = req.query;

  try {
    const status = resultCode === "0" ? "completed" : "failed";

    // Cập nhật trạng thái thanh toán trong cơ sở dữ liệu
    await Checkout.updateMany(
      { orderId: orderId },
      { $set: { status: status, message: message } }
    );

    // Nếu thanh toán không thành công, xóa các bản ghi giao dịch đã lưu
    if (resultCode !== "0") {
      await Checkout.deleteMany({ orderId: orderId });
    } else if (extraData) {
      // Nếu thanh toán thành công, xóa các sản phẩm trong giỏ hàng của người dùng
      await Cart.deleteMany({ id_user: extraData });
    }

    // Chuyển hướng người dùng trở lại trang giỏ hàng với thông báo kết quả
    return res.redirect(
      `http://localhost:3000/cart?resultCode=${resultCode}&message=${encodeURIComponent(
        message
      )}`
    );
  } catch (error) {
    console.error("Error updating payment status:", error);
    return res
      .status(500)
      .json({ message: "Server error while updating payment status" });
  }
});

app.get("/api/orders", authenticateJWT, async (req, res) => {
  try {
    const checkouts = await Checkout.find({ id_user: req.user.id })
      .populate("id_product") // Optionally populate product details
      .exec();

    if (!checkouts || checkouts.length === 0) {
      return res
        .status(404)
        .json({ message: "No orders found for this user." });
    }

    // Format the data to return the relevant fields
    const orderHistory = checkouts.map((order) => ({
      orderId: order.orderId,
      productName: order.id_product.product_name,
      quantity: order.quantity,
      price: order.amount,
      status: order.status,
      paymentDate: order.date_checkout,
      payUrl: order.payUrl,
    }));

    res.status(200).json(orderHistory);
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.get("/api/ordersAll", authenticateJWT, async (req, res) => {
  try {
    const checkouts = await Checkout.find({})
      .populate("id_product")
      .populate({
        path: "id_user",
        select: "username numberphone address",
      })
      .exec();

    console.log(checkouts); // Xem dữ liệu checkouts

    if (!checkouts || checkouts.length === 0) {
      return res.status(404).json({ message: "No orders found." });
    }

    const orderHistory = checkouts.map((order) => ({
      orderId: order.orderId,
      username: order.id_user ? order.id_user.username : "N/A",
      phone: order.id_user ? order.id_user.numberphone : "N/A",
      address: order.id_user ? order.id_user.address : "N/A",
      productName: order.id_product.product_name,
      quantity: order.quantity,
      price: order.amount,
      status: order.status,
      paymentDate: order.date_checkout,
    }));

    res.status(200).json(orderHistory);
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Get user details
app.get("/api/user", authenticateJWT, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json({
      id: user._id.toString(), // Include the ID as a string
      username: user.username,
      email: user.email,
      address: user.address,
      numberphone: user.numberphone,
    });
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Update user details
app.put("/api/user", authenticateJWT, async (req, res) => {
  try {
    const { username, email, address, numberphone } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user.id,
      {
        username,
        email,
        address,
        numberphone,
      },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ message: "User updated successfully" });
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

const removeAccents = (string) => {
  const accentMap = {
    à: "a",
    á: "a",
    ả: "a",
    ã: "a",
    ạ: "a",
    ă: "a",
    ằ: "a",
    ắ: "a",
    ẳ: "a",
    ẵ: "a",
    ặ: "a",
    â: "a",
    ầ: "a",
    ấ: "a",
    ẩ: "a",
    ẫ: "a",
    ậ: "a",
    è: "e",
    é: "e",
    ẻ: "e",
    ẽ: "e",
    ẹ: "e",
    ê: "e",
    ề: "e",
    ế: "e",
    ể: "e",
    ễ: "e",
    ệ: "e",
    ì: "i",
    í: "i",
    ỉ: "i",
    ĩ: "i",
    ị: "i",
    ò: "o",
    ó: "o",
    ỏ: "o",
    õ: "o",
    ọ: "o",
    ô: "o",
    ồ: "o",
    ố: "o",
    ổ: "o",
    ỗ: "o",
    ộ: "o",
    ơ: "o",
    ờ: "o",
    ớ: "o",
    ở: "o",
    ỡ: "o",
    ợ: "o",
    ù: "u",
    ú: "u",
    ủ: "u",
    ũ: "u",
    ụ: "u",
    ư: "u",
    ừ: "u",
    ứ: "u",
    ử: "u",
    ữ: "u",
    ự: "u",
    ỳ: "y",
    ý: "y",
    ỷ: "y",
    ỹ: "y",
    ỵ: "y",
    đ: "d",
    // Add more mappings as necessary
  };

  return string
    .split("")
    .map((char) => accentMap[char] || char)
    .join("");
};

app.get("/api/search", async (req, res) => {
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

app.get("/api/search/suggestions", async (req, res) => {
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

// API to update a category

// Combined API to fetch and search icons
app.get("/api/icons", async (req, res) => {
  const { query } = req.query; // Get the search query from the request

  // Fetch icons from the CDN if the cache is empty
  if (iconsCache.length === 0) {
    try {
      const { data } = await axios.get(
        "https://cdnjs.cloudflare.com/ajax/libs/bootstrap-icons/1.9.1/font/bootstrap-icons.min.css"
      );

      // Regex to match icon class names
      const iconRegex = /\.bi-([a-zA-Z0-9-]+)/g;
      let match;

      while ((match = iconRegex.exec(data)) !== null) {
        iconsCache.push(`bi-${match[1]}`); // Add the icon class name to cache
      }
    } catch (error) {
      console.error("Error fetching icons:", error);
      return res.status(500).json({ message: "Failed to fetch icons" });
    }
  }

  // If there's a query, filter the icons based on the query
  if (query) {
    const filteredIcons = iconsCache.filter((icon) => icon.includes(query)); // Filter icons based on the query
    return res.status(200).json(filteredIcons); // Send the filtered icons as a response
  }

  // If no query, return all icons
  res.status(200).json(iconsCache); // Send the list of icons as a response
});

app.put("/api/categories/:id", authenticateJWT, async (req, res) => {
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
app.delete("/api/categories/:id", authenticateJWT, async (req, res) => {
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
app.get("/api/users/:id", authenticateJWT, async (req, res) => {
  try {
    const { id } = req.params; // Extract user ID from the request parameters

    // Find the user by ID and populate the role if necessary
    const user = await User.findById(id).populate("id_role", "user_role"); // Populating user role if needed

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Return the user data
    res.status(200).json({
      id: user._id,
      username: user.username,
      email: user.email,
      numberphone: user.numberphone,
      address: user.address,
      role: user.id_role.user_role, // Include role if populated
    });
  } catch (error) {
    console.error("Error fetching user by ID:", error); // Log the error for debugging
    res.status(500).json({ message: "Internal server error" });
  }
});
app.get("/api/admins", async (req, res) => {
  try {
    // Đặt ID mặc định cho role Admin từ MongoDB
    const adminRoleId = "6713dadf0b1bee2f1eeec406";

    // Tìm tất cả người dùng có id_role là adminRoleId
    const admins = await User.find({ id_role: adminRoleId });

    if (admins.length === 0) {
      return res.status(404).json({ message: "No admin accounts found" });
    }

    // Trả về danh sách tài khoản admin
    res.status(200).json(admins);
  } catch (error) {
    console.error("Error fetching admin accounts:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// API for updating cart item quantity
app.put("/api/cart/:id", async (req, res) => {
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

// API to change password
app.put("/api/change-password", authenticateJWT, async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  try {
    // Find the user in the database
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // Check if the current password is valid
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res
        .status(400)
        .json({ message: "Current password is incorrect." });
    }

    // Hash the new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    // Update the user's password
    user.password = hashedNewPassword;
    await user.save();

    res.status(200).json({ message: "Password changed successfully." });
  } catch (error) {
    console.error("Error changing password:", error);
    res
      .status(500)
      .json({ message: "Internal server error while changing password." });
  }
});

// Handle Socket.IO connections
io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  socket.on("getCartCount", async (userId) => {
    try {
      const cartCount = await Cart.countDocuments({ id_user: userId });
      socket.emit("cartCountUpdated", cartCount);
    } catch (error) {
      console.error("Error fetching cart count:", error);
      socket.emit("cartCountUpdated", 0); // Fallback to 0 on error
    }
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: "vuthanh10235@gmail.com", // Your email address
    pass: "pzqdumtphdcfwlst", // Your email password or app password
  },
});

// Function to generate a random password
const generateRandomPassword = (length) => {
  const charset =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()";
  let password = "";
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * charset.length);
    password += charset[randomIndex];
  }
  return password;
};

// Request Password Reset
app.post("/api/forgot-password", async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });

    // Check if user exists and does not have a googleId
    if (!user || user.googleId) {
      return res
        .status(404)
        .json({ message: "User not found or Google login not supported" });
    }

    // Generate a new password
    const newPassword = generateRandomPassword(12); // 12 is the length of the password
    user.password = await bcrypt.hash(newPassword, 10); // Hash the new password
    await user.save();

    const mailOptions = {
      to: email,
      subject: "Password Reset",
      html: `<p>Your password has been reset. Your new password is: <strong>${newPassword}</strong></p>`,
    };

    await transporter.sendMail(mailOptions);

    res.json({ message: "New password has been sent to your email" });
  } catch (error) {
    console.error("Error during password reset:", error);
    res
      .status(500)
      .json({ message: "An error occurred while resetting the password" });
  }
});

// Start the server
const PORT = process.env.PORT || 4000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
