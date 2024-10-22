import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import './index.css';
import { io } from "socket.io-client";

const HeaderComponent = ({ 
  showLoginModal, 
  showRegisterModal, 
  setShowLoginModal, 
  setShowRegisterModal, 
  user, 
  setUser 
}) => {
  const [loginData, setLoginData] = useState({
    email: '',       
    password: ''
  });

  const [registerData, setRegisterData] = useState({
    username: '',
    email: '',    
    password: '',
    numberphone: '',
    address: ''
  });

  const [notification, setNotification] = useState('');
  const navigate = useNavigate();
  const [cartCount, setCartCount] = useState(0);

  // useEffect to set the user from sessionStorage once on initial load
  useEffect(() => {
    const storedUser = sessionStorage.getItem('user');
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
    }
    localStorage.setItem("showLoginModal", "false");
  }, []);

  // useEffect to handle socket connection when the user is set
  useEffect(() => {
    if (user && user._id) {
      const socket = io('http://localhost:5000');
      
      // Emit event to get the cart count
      socket.emit('getCartCount', user._id); 
      
      socket.on('cartCountUpdated', (count) => {
        setCartCount(count);
      });

      return () => {
        socket.disconnect();
      };
    }
  }, [user]);

  const openLoginModal = () => {
    setShowLoginModal(true);
    setShowRegisterModal(false);
    localStorage.setItem("showLoginModal", "true");
    setNotification('');
  };

  const openRegisterModal = () => {
    setShowRegisterModal(true);
    setShowLoginModal(false);
    setNotification('');
  };

  const closeModals = () => {
    setShowLoginModal(false);
    setShowRegisterModal(false);
    localStorage.setItem("showLoginModal", "false");
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
      setNotification('Please fill in all fields');
      return;
    }
    try {
      const response = await axios.post('http://localhost:5000/api/login', {
        email: loginData.email,
        password: loginData.password
      });

      if (response.data.token) {
        const loggedInUser = response.data.user;
        sessionStorage.setItem('token', response.data.token);
        sessionStorage.setItem('user', JSON.stringify(loggedInUser));
        setUser(loggedInUser);
        sessionStorage.setItem('userId', loggedInUser._id); // Store user ID
        // After login, request cart count
        const socket = io('http://localhost:5000');
        socket.emit('getCartCount', loggedInUser._id);

        socket.on('cartCountUpdated', (count) => {
          setCartCount(count);
        });

        if (loggedInUser.role === 'Admin') {
          navigate('/admin');
        } else {
          navigate('/');
        }
        closeModals();
      }
    } catch (error) {
      console.error('Login failed', error.response ? error.response.data : error.message);
      setNotification(error.response ? error.response.data.message : 'Login failed, please try again!');
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    if (!registerData.username || !registerData.email || !registerData.password || !registerData.numberphone || !registerData.address) {
      setNotification('Please fill in all fields');
      return;
    }
    try {
      const response = await axios.post('http://localhost:5000/api/register', registerData);
      if (response.data) {
        const registeredUser = { username: registerData.username };
        setUser(registeredUser);
        sessionStorage.setItem('user', JSON.stringify(registeredUser));
        setNotification('Registration successful!');
        navigate('/');
        closeModals();
      }
    } catch (error) {
      console.error('Registration failed', error);
      setNotification('Registration failed, please try again!');
    }
  };

  const handleGoogleLoginSuccess = async (credentialResponse) => {
    try {
      const { credential } = credentialResponse;
      const res = await axios.post('http://localhost:5000/auth/google', { token: credential });
      const { user, token } = res.data;
      sessionStorage.setItem('token', token);
      sessionStorage.setItem('userId', user._id); // Store user ID
      sessionStorage.setItem('user', JSON.stringify(user)); // Store the full user object
      setUser(user);
      navigate('/');
      closeModals();
    } catch (error) {
      console.error('Google login failed', error);
      setNotification('Google login failed, please try again!');
    }
  };

  const handleLogout = () => {
    setUser(null);
    sessionStorage.removeItem('user');
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('userId')
 
    setCartCount(0); // Reset cart count
    navigate('/');
  };

  const handleAddToCart = async () => {
    if (!user) {
      openLoginModal(); // Trigger the login modal if the user is not logged in
    } else {
      navigate('/cart'); // Navigate to the cart page if user is logged in
    }
  };

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  return (
    <GoogleOAuthProvider clientId="987967147884-r59bb5gb945o2q81rjgeegc1cmci28gd.apps.googleusercontent.com">
      <nav className="navbar navbar-expand-lg navbar-dark" style={{ backgroundColor: 'green' }}>
        <div className="container navbar-content">
          <a className="navbar-brand" href="/">Teetech</a>
          <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav" aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
            <span className="navbar-toggler-icon"></span>
          </button>
          { user?.role !== 'Admin' && (
            <div className="search-form d-none d-lg-flex">
              <form className="d-flex w-100">
                <div className="input-group w-100">
                  <input className="form-control" type="search" placeholder="Search product" aria-label="Search" />
                  <button className="btn btn-primary" type="submit">
                    <i className="bi bi-search icon-spacing"></i>Search
                  </button>
                </div>
              </form>
            </div>
          )}
          <div className="collapse navbar-collapse" id="navbarNav">
            <ul className="navbar-nav ms-auto">
              <li className="nav-item dropdown">
                {user ? (
                  <>
                    <a className="nav-link" href="#" id="loginRegisterToggle">
                      <i className="bi bi-person icon-spacing"></i>{user.username}
                    </a>
                    <ul className="dropdown-menu">
                    {user && user.role !== 'Admin' && (
                      <li><a className="dropdown-item" href="/profile">Trang cá nhân</a></li>
                    )}
                      <li><a className="dropdown-item" href="#" onClick={handleLogout}>Logout</a></li>
                      {user && user.role !== 'Admin' && (
                      <li><a className="dropdown-item" href="/historyOrder">Lịch sử đơn hàng</a></li>
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
              {user && user.role !== 'Admin' && (
                <a className="nav-link" onClick={handleAddToCart} style={{ position: 'relative' }}>
                  <i className="bi bi-cart icon-spacing"></i>Cart
                  <span id="cartCountBadge" className="badge bg-danger rounded-pill position-absolute top-0 start-100 translate-middle">
                      {cartCount}
                  </span>
                </a>
                 )}
              </li>
            </ul>
          </div>
        </div>
      </nav>

      {notification && (
        <div className="alert alert-warning" role="alert">
          {notification}
        </div>
      )}

      {showLoginModal || showRegisterModal ? <div className="modal-backdrop fade show"></div> : null}

      {showLoginModal && (
        <div className="modal show d-block" tabIndex="-1" role="dialog">
          <div className="modal-dialog modal-dialog-centered" role="document">
            <div className="modal-content">
              <div className="row g-0">
                <div className="col-md-6 left-column">
                  <div className="modal-body">
                    <form onSubmit={handleLoginSubmit}>
                      <div className="mb-3">
                        <label htmlFor="email" className="form-label">Email</label>
                        <input type="email" className="form-control" id="email" placeholder="Email" value={loginData.email} onChange={handleLoginInputChange} required />
                      </div>
                      <div className="mb-3">
                        <label htmlFor="password" className="form-label">Mật khẩu</label>
                        <input type="password" className="form-control" id="password" placeholder="Mật khẩu" value={loginData.password} onChange={handleLoginInputChange} required />
                      </div>
                      <button type="submit" className="btn btn-primary w-100">Tiếp tục</button>
                    </form>
                    <hr />
                    <div className="text-center">
                      <p>Hoặc tiếp tục bằng:</p>
                      <GoogleLogin
                        onSuccess={handleGoogleLoginSuccess}
                        onError={() => {
                          setNotification('Google login failed, please try again!');
                        }}
                        useOneTap
                      />
                    </div>
                    <hr />
                    <div className="text-center">
                      <a href="#" onClick={openRegisterModal}>Đăng kí</a>
                    </div>
                  </div>
                </div>
                <div className="col-md-6 right-column">
                  <div className="position-relative">
                    <button type="button" className="btn-close position-absolute" onClick={closeModals}></button>
                    <img src="https://salt.tikicdn.com/ts/upload/eb/f3/a3/25b2ccba8f33a5157f161b6a50f64a60.png" alt="Login Image" className="img-fluid" />
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
                      <div className="mb-3">
                        <label htmlFor="username" className="form-label">Tên người dùng</label>
                        <input type="text" className="form-control" id="username" placeholder="Tên người dùng" value={registerData.username} onChange={handleRegisterInputChange} />
                      </div>
                      <div className="mb-3">
                        <label htmlFor="email" className="form-label">Email</label>
                        <input type="email" className="form-control" id="email" placeholder="Email" value={registerData.email} onChange={handleRegisterInputChange} />
                      </div>
                      <div className="mb-3">
                        <label htmlFor="password" className="form-label">Mật khẩu</label>
                        <input type="password" className="form-control" id="password" placeholder="Mật khẩu" value={registerData.password} onChange={handleRegisterInputChange} />
                      </div>
                      <div className="mb-3">
                        <label htmlFor="numberphone" className="form-label">Số điện thoại</label>
                        <input type="tel" className="form-control" id="numberphone" placeholder="Số điện thoại" value={registerData.numberphone} onChange={handleRegisterInputChange} />
                      </div>
                      <div className="mb-3">
                        <label htmlFor="address" className="form-label">Địa chỉ</label>
                        <input type="text" className="form-control" id="address" placeholder="Địa chỉ" value={registerData.address} onChange={handleRegisterInputChange} />
                      </div>
                      <button type="submit" className="btn btn-primary w-100">Đăng ký</button>
                    </form>
                    <hr />
                    <div className="text-center">
                      <a href="#" onClick={openLoginModal}>Đăng nhập</a>
                    </div>
                  </div>
                </div>
                <div className="col-md-6 right-column">
                  <div className="position-relative">
                    <button type="button" className="btn-close position-absolute" onClick={closeModals}></button>
                    <img src="https://salt.tikicdn.com/ts/upload/eb/f3/a3/25b2ccba8f33a5157f161b6a50f64a60.png" alt="Register Image" className="img-fluid" />
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
