// db.js
const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    await mongoose.connect("mongodb://localhost:27017/shop", {
      // useNewUrlParser: true,
      // useUnifiedTopology: true,
      // đã lỗi thời và ko cần
    });
    console.log("MongoDB connected!");
  } catch (err) {
    console.error("MongoDB connection error:", err);
    process.exit(1); // Exit the process with a failure code if unable to connect
  }
};
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

module.exports = connectDB;
