// server.js
require("dotenv").config();
const express = require("express");
const http = require("http");
const socketIO = require("socket.io");
const Cart = require("./models/Cart");
const cors = require("cors");


const connectDB = require("./config/db");
const app = express();
const server = http.createServer(app);
connectDB();

// Socket.IO configuration with corrected CORS setup
const io = socketIO(server, {
  cors: {
    origin: ["http://localhost:3000", "http://localhost:3001"], // Allow requests from frontend
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Authorization", "Content-Type"],
    credentials: true,
  },
});
app.use(cors());
// Middleware setup
app.use(express.json()); // Parses JSON requests
app.use(express.urlencoded({ extended: true })); // Parses URL-encoded requests

// CORS configuration for API routes
app.use(
  cors({
    origin: ["http://localhost:3000", "http://localhost:3001"],
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Authorization", "Content-Type"],
    credentials: true,
  })
);
app.use("/uploads", express.static("uploads"));
const cartController = require("./controllers/cartController");
app.use("/api/cart", cartController(io));
const productController = require("./controllers/productController");
app.use("/api", productController);
const checkoutController = require("./controllers/checkoutController");
app.use("/api", checkoutController);

const categoryController = require("./controllers/categoryController");
app.use("/api", categoryController);

const userController = require("./controllers/userController");
app.use("/api", userController);

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

// Start the server
const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
