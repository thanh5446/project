import { GoogleLogin, GoogleOAuthProvider } from "@react-oauth/google";
import axios from "axios";
import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import "./index.css";

const HeaderComponent = ({
  showLoginModal,
  showRegisterModal,
  setShowLoginModal,
  setShowRegisterModal,
  user,
  setUser,
  updateSearchedProducts,
  setIsOpen, // Pass the setIsOpen function to control chat visibility
}) => {
  const [loginData, setLoginData] = useState({
    email: "",
    password: "",
  });

  const [registerData, setRegisterData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "", // Added confirmPassword field
    numberphone: "",
    address: "",
  });

  const [notification, setNotification] = useState("");
  const navigate = useNavigate();
  const [cartCount, setCartCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState(""); // Term to search
  const [suggestions, setSuggestions] = useState([]); // Store search suggestions
  const [showForgetModal, setShowForgetModal] = useState(false);

  // Effect to set the user from sessionStorage once on initial load
  useEffect(() => {
    const storedUser = sessionStorage.getItem("user");
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
    }
  }, [setUser]);

  // Effect to handle socket connection when the user is set
  useEffect(() => {
    if (user && user._id) {
      console.log("id" + user._id);
      const socket = io("http://localhost:4000");
      socket.emit("getCartCount", user._id);
      socket.on("cartCountUpdated", (count) => {
        setCartCount(count);
      });

      return () => {
        socket.disconnect();
      };
    }
  }, [user]);

  // Handle search submission
  const handleSearchSubmit = async (event) => {
    event.preventDefault(); // Prevent default form submission behavior
    if (!searchTerm.trim()) {
      setNotification("Please enter a search term.");
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:4000/api/search?search=${searchTerm}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch products");
      }

      const products = await response.json();

      // Store the searched products in localStorage
      localStorage.setItem("searchedProducts", JSON.stringify(products)); // Save products as a JSON string

      // Reset searchTerm and suggestions to allow new searches
      setSearchTerm(""); // Reset search term
      setSuggestions([]); // Clear suggestions

      navigate(`/search?query=${searchTerm}`);
    } catch (error) {
      console.error("Error searching products:", error);
    }
  };
  const handleForgotPasswordSubmit = async (e) => {
    e.preventDefault();
    const email = e.target.email.value; // Assuming you have an email input in your form

    if (!email) {
      setNotification("Please enter your email");
      return;
    }

    try {
      const response = await axios.post(
        "http://localhost:4000/api/forgot-password",
        { email }
      );
      setNotification("Password reset link sent to your email!");
    } catch (error) {
      console.error("Error sending reset link:", error);
      setNotification("Failed to send reset link, please try again!");
    }
  };
  // Handle input change for search
  const handleInputChange = async (e) => {
    const query = e.target.value;
    setSearchTerm(query);

    if (query.trim()) {
      try {
        const response = await fetch(
          `http://localhost:4000/api/search/suggestions?query=${query}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch suggestions");
        }

        const suggestions = await response.json();
        setSuggestions(suggestions);
      } catch (error) {
        console.error("Error fetching suggestions:", error);
        setSuggestions([]); // Reset suggestions on error
      }
    } else {
      setSuggestions([]); // Clear suggestions if input is empty
    }
  };

  // Handle suggestion click
  const handleSuggestionClick = (suggestion) => {
    setSearchTerm(suggestion);
    setSuggestions([]); // Hide suggestions after selecting
  };

  // Open and close modals
  const openLoginModal = () => {
    setShowLoginModal(true);
    setShowRegisterModal(false);
    setShowForgetModal(false); // Set the forgot password modal to show
    setNotification("");
  };
  const openForgetModal = () => {
    setShowLoginModal(false); // Ensure login modal is closed
    setShowRegisterModal(false); // Ensure register modal is closed
    setShowForgetModal(true); // Set the forgot password modal to show
    setNotification(""); // Clear any previous notifications
  };

  const openRegisterModal = () => {
    setShowRegisterModal(true);
    setShowLoginModal(false);
    setShowForgetModal(false); // Set the forgot password modal to show
    setNotification("");
  };

  const closeModals = () => {
    setShowLoginModal(false);
    setShowRegisterModal(false);
    setShowForgetModal(false); // Set the forgot password modal to show
  };

  const handleLoginInputChange = (e) => {
    setLoginData({ ...loginData, [e.target.id]: e.target.value });
  };

  const handleRegisterInputChange = (e) => {
    setRegisterData({ ...registerData, [e.target.id]: e.target.value });
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (!loginData.email || !loginData.password) {
      setNotification("Please fill in all fields");
      return;
    }
    try {
      const response = await axios.post(
        "http://localhost:4000/api/login",
        loginData
      );

      if (response.data.token) {
        const loggedInUser = response.data.user;
        sessionStorage.setItem("token", response.data.token);
        sessionStorage.setItem("user", JSON.stringify(loggedInUser));
        setUser(loggedInUser);
        sessionStorage.setItem("userId", loggedInUser.id);
        sessionStorage.setItem("username", loggedInUser.username);

        // Notify about cart count
        const socket = io("http://localhost:4000");
        socket.emit("getCartCount", loggedInUser.id);
        socket.on("cartCountUpdated", (count) => {
          setCartCount(count);
        });

        navigate(loggedInUser.role === "Admin" ? "/admin" : "/");
        closeModals();
      }
    } catch (error) {
      console.error(
        "Login failed",
        error.response ? error.response.data : error.message
      );
      setNotification(
        error.response
          ? error.response.data.message
          : "Login failed, please try again!"
      );
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();

    // Check if all fields are filled
    if (
      !registerData.username ||
      !registerData.email ||
      !registerData.password ||
      !registerData.confirmPassword ||
      !registerData.numberphone ||
      !registerData.address
    ) {
      setNotification("Please fill in all fields");
      return;
    }

    // Check if the phone number is exactly 10 digits
    if (
      registerData.numberphone.length !== 10 ||
      isNaN(registerData.numberphone)
    ) {
      setNotification("Invalid phone number");
      return;
    }

    // Check if password and confirm password match
    if (registerData.password !== registerData.confirmPassword) {
      setNotification("Passwords do not match");
      return;
    }

    try {
      const response = await axios.post(
        "http://localhost:4000/api/register",
        registerData
      );
      if (response.data) {
        const registeredUser = {
          id: response.data.user.id,
          username: response.data.user.username,
          token: response.data.token,
        };

        setUser(registeredUser);

        // Store user information in session storage
        sessionStorage.setItem("user", JSON.stringify(registeredUser));
        sessionStorage.setItem("token", response.data.token);
        sessionStorage.setItem("userId", registeredUser.id);
        sessionStorage.setItem("username", registeredUser.username);

        setNotification("Registration successful!");
        navigate("/"); // Navigate to the homepage or another page
        closeModals();
      }
    } catch (error) {
      console.error("Registration failed", error);
      setNotification("Registration failed, please try again!");
    }
  };

  const handleGoogleLoginSuccess = async (credentialResponse) => {
    try {
      const { credential } = credentialResponse;
      const res = await axios.post("http://localhost:4000/auth/google", {
        token: credential,
      });
      const { user, token } = res.data;
      sessionStorage.setItem("token", token);
      sessionStorage.setItem("userId", user._id);
      sessionStorage.setItem("username", user.username);
      sessionStorage.setItem("user", JSON.stringify(user));
      setUser(user);
      navigate("/");
      closeModals();
    } catch (error) {
      console.error("Google login failed", error);
      setNotification("Google login failed, please try again!");
    }
  };

  const handleLogout = () => {
    setUser(null);
    sessionStorage.clear(); // Clear all session storage on logout
    setCartCount(0);
    setIsOpen(false); // Close chat widget on logout
    navigate("/"); // Navigate to home on logout
  };

  const handleAddToCart = () => {
    if (!user) {
      openLoginModal();
    } else {
      navigate("/cart");
    }
  };

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(""), 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);
  return (
    <GoogleOAuthProvider clientId="987967147884-r59bb5gb945o2q81rjgeegc1cmci28gd.apps.googleusercontent.com">
      <nav
        className="navbar navbar-expand-lg navbar-dark"
        style={{ backgroundColor: "green" }}
      >
        <div className="container navbar-content">
          <a
            className="navbar-brand"
            href={user?.role !== "Admin" ? "/" : "/admin"}
          >
            {user?.role !== "Admin" ? "Teetech" : "Admin Dashboard"}
          </a>

          <button
            className="navbar-toggler"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#navbarNav"
            aria-controls="navbarNav"
            aria-expanded="false"
            aria-label="Toggle navigation"
          >
            <span className="navbar-toggler-icon"></span>
          </button>
          {user?.role !== "Admin" && (
            <div className="search-form d-none d-lg-flex position-relative">
              <form className="d-flex w-100" onSubmit={handleSearchSubmit}>
                <div className="input-group w-100">
                  <input
                    className="form-control"
                    type="search"
                    placeholder="Search product"
                    aria-label="Search"
                    value={searchTerm}
                    onChange={handleInputChange} // Trigger search suggestions
                  />
                  <button className="btn btn-primary" type="submit">
                    <i className="bi bi-search icon-spacing"></i>Search
                  </button>
                </div>

                {/* Dropdown to display search suggestions */}
                {suggestions.length > 0 && (
                  <ul
                    className="dropdown-menu show w-100"
                    style={{ position: "absolute", top: "100%", zIndex: 1000 }}
                  >
                    {suggestions.map((suggestion, index) => (
                      <li
                        key={index}
                        className="dropdown-item"
                        onClick={() => handleSuggestionClick(suggestion)} // Click to select suggestion
                        style={{ cursor: "pointer" }}
                      >
                        {suggestion} {/* Display product name */}
                      </li>
                    ))}
                  </ul>
                )}
              </form>
            </div>
          )}

          <div className="collapse navbar-collapse" id="navbarNav">
            <ul className="navbar-nav ms-auto">
              <li className="nav-item dropdown">
                {user ? (
                  <>
                    <a className="nav-link" href="#" id="loginRegisterToggle">
                      <i className="bi bi-person icon-spacing"></i>
                      {user.username}
                    </a>
                    <ul className="dropdown-menu">
                      {user && user.role !== "Admin" && (
                        <li>
                          <a className="dropdown-item" href="/profile">
                            My Profile
                          </a>
                        </li>
                      )}
                      <li>
                        <a
                          className="dropdown-item"
                          href="#"
                          onClick={handleLogout}
                        >
                          Logout
                        </a>
                      </li>
                      {user && user.role !== "Admin" && (
                        <li>
                          <a className="dropdown-item" href="/historyOrder">
                            Order History
                          </a>
                        </li>
                      )}
                      {user &&
                        user.role !== "Admin" &&
                        !user.googleId && ( // Check for Google login
                          <li>
                            <a
                              className="dropdown-item"
                              href="/change-password"
                            >
                              Change Password
                            </a>
                          </li>
                        )}
                    </ul>
                  </>
                ) : (
                  <a className="nav-link" href="#" onClick={openLoginModal}>
                    <i className="bi bi-person icon-spacing"></i>Login/Register
                  </a>
                )}
              </li>
              <li className="nav-item position-relative">
                {user && user.role !== "Admin" && (
                  <a
                    className="nav-link"
                    onClick={handleAddToCart}
                    style={{ position: "relative" }}
                  >
                    <i className="bi bi-cart icon-spacing"></i>Cart
                    <span
                      id="cartCountBadge"
                      className="badge bg-danger rounded-pill position-absolute top-0 start-100 translate-middle"
                    >
                      {cartCount}
                    </span>
                  </a>
                )}
              </li>
            </ul>
          </div>
        </div>
      </nav>

      {showLoginModal || showRegisterModal || showForgetModal ? (
        <div className="modal-backdrop fade show"></div>
      ) : null}

      {showLoginModal && (
        <div className="modal show d-block" tabIndex="-1" role="dialog">
          <div className="modal-dialog modal-dialog-centered" role="document">
            <div className="modal-content">
              <div className="row g-0">
                <div className="col-md-6 left-column">
                  <div className="modal-body">
                    <form onSubmit={handleLoginSubmit}>
                      {notification && (
                        <div className="alert alert-warning" role="alert">
                          {notification}
                        </div>
                      )}
                      <div className="mb-3">
                        <label htmlFor="email" className="form-label">
                          Email
                        </label>
                        <input
                          type="email"
                          className="form-control"
                          id="email"
                          placeholder="Email"
                          value={loginData.email}
                          onChange={handleLoginInputChange}
                          required
                        />
                      </div>
                      <div className="mb-3">
                        <label htmlFor="password" className="form-label">
                          Password
                        </label>
                        <input
                          type="password"
                          className="form-control"
                          id="password"
                          placeholder="Password"
                          value={loginData.password}
                          onChange={handleLoginInputChange}
                          required
                        />
                      </div>
                      <button type="submit" className="btn btn-primary w-100">
                        Continue
                      </button>
                    </form>
                    <div className="text-start mt-2">
                      <Link
                        to="#"
                        className="text-muted"
                        onClick={openForgetModal}
                      >
                        Forgot Password?
                      </Link>
                    </div>
                    <hr />
                    <div className="text-center">
                      <p>Or continue with:</p>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "center",
                          alignItems: "center",
                        }}
                      >
                        <GoogleLogin
                          onSuccess={handleGoogleLoginSuccess}
                          onError={() => {
                            setNotification(
                              "Google login failed, please try again!"
                            );
                          }}
                          ux_mode="popup" // Bắt buộc Google sử dụng popup thay vì One Tap
                          prompt="select_account" // Luôn hiển thị màn hình chọn tài khoản
                        />
                      </div>
                    </div>
                    <hr />
                    <div className="text-center">
                      <a href="#" onClick={openRegisterModal}>
                        Register
                      </a>
                    </div>
                  </div>
                </div>
                <div className="col-md-6 right-column">
                  <div className="position-relative">
                    <button
                      type="button"
                      className="btn-close position-absolute"
                      onClick={closeModals}
                    ></button>
                    <img
                      src="https://salt.tikicdn.com/ts/upload/eb/f3/a3/25b2ccba8f33a5157f161b6a50f64a60.png"
                      alt="Login Image"
                      className="img-fluid"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {showForgetModal && (
        <div className="modal show d-block" tabIndex="-1" role="dialog">
          <div className="modal-dialog modal-dialog-centered" role="document">
            <div className="modal-content">
              <div className="row g-0">
                <div className="col-md-6 left-column">
                  <div className="modal-body">
                    <div className="text-start mt-2">
                      <p
                        className="text-center"
                        style={{ textTransform: "uppercase" }}
                      >
                        Forgot Password
                      </p>
                    </div>
                    <div className="mb-5"></div>
                    <form onSubmit={handleForgotPasswordSubmit}>
                      {notification && (
                        <div className="alert alert-warning" role="alert">
                          {notification}
                        </div>
                      )}
                      <div className="mb-3">
                        <input
                          type="email"
                          className="form-control"
                          id="email"
                          placeholder="Email"
                          value={loginData.email}
                          onChange={handleLoginInputChange}
                          required
                        />
                      </div>

                      <button type="submit" className="btn btn-primary w-100">
                        Continue
                      </button>
                    </form>
                    <div className="text-start mt-2">
                      <Link
                        to="#"
                        className="text-muted"
                        onClick={openLoginModal}
                      >
                        Login
                      </Link>
                    </div>
                  </div>
                </div>
                <div className="col-md-6 right-column">
                  <div className="position-relative">
                    <button
                      type="button"
                      className="btn-close position-absolute"
                      onClick={closeModals}
                    ></button>
                    <img
                      src="https://salt.tikicdn.com/ts/upload/eb/f3/a3/25b2ccba8f33a5157f161b6a50f64a60.png"
                      alt="Login Image"
                      className="img-fluid"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showRegisterModal && (
        <div className="modal show d-block" tabIndex="-1" role="dialog">
          <div className="modal-dialog modal-dialog-centered" role="document">
            <div className="modal-content">
              <div className="row g-0">
                <div className="col-md-6 left-column">
                  <div className="modal-body">
                    <form onSubmit={handleRegisterSubmit}>
                      {notification && (
                        <div className="alert alert-warning" role="alert">
                          {notification}
                        </div>
                      )}
                      <div className="mb-3">
                        <label htmlFor="username" className="form-label">
                          Username
                        </label>
                        <input
                          type="text"
                          className="form-control"
                          id="username"
                          placeholder="Username"
                          value={registerData.username}
                          onChange={handleRegisterInputChange}
                        />
                      </div>
                      <div className="mb-3">
                        <label htmlFor="email" className="form-label">
                          Email
                        </label>
                        <input
                          type="email"
                          className="form-control"
                          id="email"
                          placeholder="Email"
                          value={registerData.email}
                          onChange={handleRegisterInputChange}
                        />
                      </div>
                      <div className="mb-3">
                        <label htmlFor="password" className="form-label">
                          Password
                        </label>
                        <input
                          type="password"
                          className="form-control"
                          id="password"
                          placeholder="Password"
                          value={registerData.password}
                          onChange={handleRegisterInputChange}
                        />
                      </div>
                      <div className="mb-3">
                        <label htmlFor="confirmPassword" className="form-label">
                          Confirm Password
                        </label>
                        <input
                          type="password"
                          className="form-control"
                          id="confirmPassword"
                          placeholder="Confirm Password"
                          value={registerData.confirmPassword}
                          onChange={handleRegisterInputChange} // Ensure you handle this in your function
                        />
                      </div>
                      <div className="mb-3">
                        <label htmlFor="numberphone" className="form-label">
                          Phone Number
                        </label>
                        <input
                          type="tel"
                          className="form-control"
                          id="numberphone"
                          placeholder="Phone Number"
                          value={registerData.numberphone}
                          onChange={handleRegisterInputChange}
                        />
                      </div>
                      <div className="mb-3">
                        <label htmlFor="address" className="form-label">
                          Address
                        </label>
                        <input
                          type="text"
                          className="form-control"
                          id="address"
                          placeholder="Address"
                          value={registerData.address}
                          onChange={handleRegisterInputChange}
                        />
                      </div>
                      <button type="submit" className="btn btn-primary w-100">
                        Sign Up
                      </button>
                    </form>
                    <hr />
                    <div className="text-center">
                      <a href="#" onClick={openLoginModal}>
                        Login
                      </a>
                    </div>
                  </div>
                </div>
                <div className="col-md-6 right-column">
                  <div className="position-relative">
                    <button
                      type="button"
                      className="btn-close position-absolute"
                      onClick={closeModals}
                    ></button>
                    <img
                      src="https://salt.tikicdn.com/ts/upload/eb/f3/a3/25b2ccba8f33a5157f161b6a50f64a60.png"
                      alt="Register Image"
                      className="img-fluid"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </GoogleOAuthProvider>
  );
};

export default HeaderComponent;
