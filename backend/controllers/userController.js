const express = require("express");
const bcrypt = require("bcryptjs");
const { authenticateJWT} = require("../config/jwt");
const jwt = require("jsonwebtoken");
const transporter = require("../config/nodemailer");
const JWT_SECRET = process.env.JWT_SECRET;
const { OAuth2Client } = require("google-auth-library");
const User = require("../models/User");
const Role = require("../models/Role");
const Cart = require("../models/Cart"); // Add this line
const Checkout = require("../models/Checkout");
const router = express.Router();
const googleClient = new OAuth2Client("987967147884-r59bb5gb945o2q81rjgeegc1cmci28gd.apps.googleusercontent.com");

// Register a new user
router.post("/register", async (req, res) => {
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

// User login
router.post("/login", async (req, res) => {
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

// Google OAuth Authentication
router.post("/auth/google", async (req, res) => {
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



const generateRandomPassword = (length) => {
  const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()";
  let password = "";
  for (let i = 0; i < length; i++) password += charset[Math.floor(Math.random() * charset.length)];
  return password;
};

router.post("/forgot-password", async (req, res) => {
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

// Update user profile
router.put("/user", authenticateJWT, async (req, res) => {
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

  // Get user details
  router.get("/user", authenticateJWT, async (req, res) => {
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


  // API to get all users
  router.get("/users", async (req, res) => {
    try {
      const users = await User.find().populate("id_role", "user_role");
      res.status(200).json(users);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  });

  // Delete a user API
router.delete("/users/:id", authenticateJWT, async (req, res) => {
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

  router.get("/users/:id", authenticateJWT, async (req, res) => {
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
  
  router.get("/admins", async (req, res) => {
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
  
  
// API to change password
router.put("/change-password", authenticateJWT, async (req, res) => {
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

module.exports = router;