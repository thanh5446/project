const mongoose = require("mongoose");
const { Schema } = mongoose;

const roleSchema = new Schema({
    user_role: { type: String, required: true },
  });

const Role = mongoose.model("Role", roleSchema);

module.exports = Role;


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