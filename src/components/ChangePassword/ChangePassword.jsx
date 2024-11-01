import axios from "axios";
import React, { useState } from "react";

const ChangePassword = () => {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [notification, setNotification] = useState("");
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Check if passwords match
    if (newPassword !== confirmPassword) {
      setNotification("New password and confirmation do not match.");
      return;
    }

    // Validate new password length
    if (newPassword.length < 6) {
      setNotification("New password must be at least 6 characters long.");
      return;
    }

    try {
      const token = sessionStorage.getItem("token"); // Retrieve token from sessionStorage

      // Make sure the token is available
      if (!token) {
        setNotification("You must be logged in to change your password.");
        return;
      }

      // Make the request with the Authorization header
      const response = await axios.put(
        "http://localhost:4000/api/change-password",
        {
          currentPassword,
          newPassword,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`, // Include the token in the request headers
          },
        }
      );

      // Check if the response indicates success
      if (response.status === 200) {
        setNotification("Password changed successfully!");

        // Clear form fields
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        // Handle specific error messages from the response
        setNotification(
          response.data.message || "Error changing password. Please try again."
        );
      }
    } catch (error) {
      console.error("Error changing password:", error);

      // Handle different error scenarios
      if (error.response) {
        // Server responded with a status other than 200 range
        setNotification(
          error.response.data.message ||
            "Error changing password. Please try again."
        );
      } else if (error.request) {
        // Request was made but no response received
        setNotification(
          "Network error. Please check your connection and try again."
        );
      } else {
        // Something happened in setting up the request
        setNotification("An unexpected error occurred. Please try again.");
      }
    }
  };

  return (
    <div className="container mt-5">
      <h2 className="text-center mb-4">Change Password</h2>
      {notification && <div className="alert alert-info">{notification}</div>}
      <form
        onSubmit={handleSubmit}
        className="form-signin mx-auto"
        style={{ maxWidth: "400px" }}
      >
        <div className="mb-3">
          <label htmlFor="currentPassword" className="form-label">
            Current Password
          </label>
          <input
            type="password"
            className="form-control"
            id="currentPassword"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
          />
        </div>
        <div className="mb-3">
          <label htmlFor="newPassword" className="form-label">
            New Password
          </label>
          <input
            type="password"
            className="form-control"
            id="newPassword"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />
        </div>
        <div className="mb-3">
          <label htmlFor="confirmPassword" className="form-label">
            Confirm New Password
          </label>
          <input
            type="password"
            className="form-control"
            id="confirmPassword"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit" className="btn btn-primary w-100">
          Change Password
        </button>
      </form>
    </div>
  );
};

export default ChangePassword;
