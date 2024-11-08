import axios from "axios";
import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import "./details.css";

const ProductsPage = ({ user, openLoginModal }) => {
  const [quantity, setQuantity] = useState(1);
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(""); // New state for error messages

  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const productId = searchParams.get("id");

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await axios.get(
          `http://localhost:4000/api/products/${productId}`
        );
        setProduct(response.data);
        setLoading(false);
      } catch (error) {
        console.error("Product not found for ID:", productId);
        setError("Product not found."); // Set error message
        setLoading(false);
      }
    };

    if (productId) {
      fetchProduct();
    }
  }, [productId]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!product) {
    return <div>Product not found</div>;
  }

  const handleAddToCart = async () => {
    if (!user) {
      openLoginModal(); // Trigger the login modal if the user is not logged in
    } else {
      try {
        const token = sessionStorage.getItem("token");

        const response = await axios.post(
          "http://localhost:4000/api/cart",
          {
            id_product: product._id,
            quantity: quantity,
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        console.log("Product added to cart:", response.data);
        alert("Product added to cart successfully!");
        setError(""); // Clear any previous errors
      } catch (error) {
        console.error("Failed to add product to cart:", error);
      }
    }
  };

  return (
    <div className="container mt-4">
      <nav aria-label="breadcrumb">
        <ol className="breadcrumb">
          <li className="breadcrumb-item">
            <a href="/">Home</a>
          </li>
          <li className="breadcrumb-item active" aria-current="page">
            Product Details
          </li>
        </ol>
      </nav>

      {/* Display error message */}
      {error && <div className="alert alert-danger">{error}</div>}

      <div className="row">
        <div className="col-md-5">
          <img
            src={`http://localhost:4000/${product.image}`}
            alt={product.product_name}
            style={{
              objectFit: "contain", // Corrected to camelCase
              padding: "0 6px 0 1px", // Wrapped padding values in quotes
              width: "100%", // Make the image fill the width of the parent
              height: "500px", // Set a fixed height, adjust as needed
              display: "block", // Removes the bottom gap in some browsers
            }}
          />
        </div>

        <div className="col-md-7">
          <div className="product-info">
            <h1 className="product-title">{product.product_name}</h1>
            <div
              style={{
                display: "inline-block", // Đặt chiều dài bằng nội dung bên trong
                borderRadius: ".5rem", // Bo góc (Cú pháp camelCase cho JSX)
                borderWidth: "1px", // Độ dày của viền
                borderStyle: "solid", // Kiểu viền
                borderColor: "rgba(253, 230, 138, 1)", // Màu viền với độ trong suốt
                padding: "1rem", // Khoảng cách bên trong
                background:
                  "var(--1, linear-gradient(180deg, #fffbeb 0%, #fff 43.98%))", // Nền với biến và giá trị mặc định
                width: "75%",
              }}
            >
              <div className="product-price mt-2">
                {product.money.toLocaleString("vi-VN")} VND
              </div>
              <div style={{ display: "flex", alignItems: "center" }}>
                <p
                  className="old-price"
                  style={{ margin: 0, marginRight: "10px" }}
                >
                  {(
                    product.money /
                    (1 - product.discount_amount / 100)
                  ).toLocaleString("vi-VN")}{" "}
                  VND
                </p>
                <p className="text-danger" style={{ margin: 0 }}>
                  -{product.discount_amount}%
                </p>
              </div>

              <div>
                <div className="quantity-selector mt-4 d-flex align-items-center">
                  <button
                    className="btn btn-outline-secondary"
                    onClick={() => setQuantity(quantity - 1)}
                    disabled={quantity <= 1}
                  >
                    -
                  </button>
                  <input
                    type="text"
                    value={quantity}
                    className="form-control mx-2"
                    readOnly
                    style={{ textAlign: "center" }} // Căn giữa giá trị trong input
                  />

                  <button
                    className="btn btn-outline-secondary"
                    onClick={() => setQuantity(quantity + 1)}
                  >
                    +
                  </button>

                  <span style={{ marginLeft: "auto" }}>
                    Quantity: {product.quantity}
                  </span>
                </div>
                <hr />
                <p>
                  Discount:{" "}
                  {(
                    product.money / (1 - product.discount_amount / 100) -
                    product.money
                  ).toLocaleString("vi-VN")}{" "}
                  VND
                </p>

                <div
                  className="product-buttons mt-4 d-flex"
                  style={{ justifyContent: "flex-end", width: "100%" }} // Sử dụng width: 100% để giữ toàn bộ chiều dài
                >
                  <button
                    className="btn btn-danger"
                    onClick={() => handleAddToCart()}
                    style={{
                      fontSize: "12px", // Kích thước chữ
                      padding: "5px 10px", // Padding trên/dưới và trái/phải
                      width: "150px", // Chiều dài cho nút
                      borderRadius: "4px", // Độ cong của nút
                    }}
                  >
                    Buy Now
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductsPage;
