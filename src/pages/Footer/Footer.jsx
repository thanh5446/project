import React from "react";

import "./Footer.css"; // Optional: to add custom CSS styles for the footer

const Footer = () => {
  return (
    <footer className="footer-section">
      <div className="container">
        <div className="row">
          {/* Customer Support Section */}
          <div className="col-md-3">
            <h6>Customer Service</h6>
            <p>
              Hotline: <strong>1900-6035</strong>
              <br />
              <small>
                (1000 VND/min, 8 AM - 9 PM, including Saturdays and Sundays.)
              </small>
            </p>
          </div>

          {/* About Section */}
          <div className="col-md-2">
            <h6>About Teetech</h6>
            <ul className="list-unstyled">
              <li>
                <a href="#">Introduction to Teetech</a>
              </li>
              <li>
                <a href="#">Teetech Blog</a>
              </li>
            </ul>
          </div>

          {/* Partnerships Section */}
          <div className="col-md-2">
            <h6>Collaboration and Alliances</h6>
            <ul className="list-unstyled">
              <li>
                <a href="#">
                  Operational Regulations of the E-commerce Platform
                </a>
              </li>
              <li>
                <a href="#">Sell with Teetech</a>
              </li>
            </ul>
            <h6 className="mt-3">Accredited by</h6>
            <img
              src="https://frontend.tikicdn.com/_desktop-next/static/img/footer/bo-cong-thuong-2.png"
              alt="Certification 1"
              className="me-2"
              style={{ width: "40px", height: "auto" }} // Adjust width as needed
            />
            <img
              src="https://frontend.tikicdn.com/_desktop-next/static/img/footer/bo-cong-thuong.svg"
              alt="Certification 2"
              style={{ width: "40px", height: "auto" }} // Adjust width as needed
            />
          </div>

          {/* Payment Methods Section */}
          <div className="col-md-2">
            <h6>Payment Method</h6>
            <div className="d-flex flex-wrap">
              <img
                src="https://developers.momo.vn/v3/vi/assets/images/square-8c08a00f550e40a2efafea4a005b1232.png"
                alt="Payment 1"
                className="me-2 mb-2"
                style={{ width: "40px", height: "auto" }} // Adjust width as needed
              />
            </div>
            <h6 className="mt-3">Delivery Service</h6>
            <p>Teetech</p>
          </div>

          {/* Social Media and App Download */}
          <div className="col-md-3">
            <h6>Connect with Us</h6>{" "}
            <a
              href="https://www.facebook.com/profile.php?id=100007858573546&locale=vi_VN"
              className="me-2"
            >
              <img
                src="https://static.vecteezy.com/system/resources/previews/016/716/481/non_2x/facebook-icon-free-png.png"
                alt="Facebook"
                style={{ width: "30px", height: "30px" }} // Adjust dimensions as needed
              />
            </a>
            <a href="https://github.com/thanh5446" className="me-2">
              <img
                src=" https://github.githubassets.com/assets/GitHub-Mark-ea2971cee799.png"
                alt="Facebook"
                style={{ width: "30px", height: "30px" }} // Adjust dimensions as needed
              />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
