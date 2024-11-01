import React, { useEffect, useState } from "react";
import "./cart.css";

const CartPage = () => {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null); // State to store user information
  const [notification, setNotification] = useState(""); // State for notifications
  const shippingFee = 0; // Phí giao hàng
  const discount = 0; // Giảm Price

  useEffect(() => {
    const fetchCartItems = async () => {
      try {
        const response = await fetch("http://localhost:4000/api/cart", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${sessionStorage.getItem("token")}`,
          },
        });

        if (!response.ok) {
          throw new Error("Network response was not ok");
        }

        const data = await response.json();
        setCartItems(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Failed to fetch cart items:", error);
        setCartItems([]);
      } finally {
        setLoading(false);
      }
    };

    const fetchUser = async () => {
      try {
        const response = await fetch("http://localhost:4000/api/user", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${sessionStorage.getItem("token")}`,
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch user data");
        }

        const userData = await response.json();
        setUser(userData);
      } catch (error) {
        console.error("Failed to fetch user:", error);
      }
    };

    fetchCartItems();
    fetchUser(); // Fetch user information on component mount
  }, []);

  const handleQuantityChange = async (id, newQuantity) => {
    const item = cartItems.find((item) => item._id === id);
    if (!item) return;

    // Kiểm tra nếu Quantity nhỏ hơn 1 hoặc lớn hơn Quantity sản phẩm hiện có
    if (newQuantity < 1) return; // Prevent decreasing below 1
    if (newQuantity > item.product_quantity) {
      alert(
        `Insufficient quantity. Only ${item.product_quantity} items are available in stock.`
      );

      return;
    }

    try {
      const response = await fetch(`http://localhost:4000/api/cart/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`, // Token nếu cần thiết
        },
        body: JSON.stringify({ quantity: newQuantity }), // Gửi Quantity mới
      });

      if (!response.ok) {
        throw new Error("Failed to update the shopping cart.");
      }

      const updatedItem = await response.json(); // Nhận dữ liệu giỏ hàng đã cập nhật từ API

      // Cập nhật Status giỏ hàng trên frontend với phản hồi từ API
      const updatedCartItems = cartItems.map((item) => {
        if (item._id === id) {
          return { ...item, quantity: updatedItem.cartItem.quantity };
        }
        return item;
      });

      setCartItems(updatedCartItems); // Cập nhật giỏ hàng trong state
      alert("Cart quantity has been updated.");
    } catch (error) {
      console.error("Error updating cart:", error);
      alert("An error occurred while updating the cart.");
    }
  };

  const totalPrice =
    cartItems.reduce((total, item) => {
      return total + item.product_price * item.quantity;
    }, 0) -
    discount +
    shippingFee;

  const handleDelete = async (id) => {
    try {
      const response = await fetch(`http://localhost:4000/api/cart/${id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionStorage.getItem("token")}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to delete item from cart");
      }

      setCartItems(cartItems.filter((item) => item._id !== id));
    } catch (error) {
      console.error("Error deleting cart item:", error);
    }
  };

  const handleCheckout = async () => {
    if (
      !user ||
      !user.username ||
      !user.email ||
      !user.address ||
      !user.numberphone
    ) {
      setNotification(
        "Please update your personal information completely before proceeding to checkout."
      );

      return; // Dừng nếu thông tin cá nhân không đầy đủ
    }

    const checkoutData = {
      id_product: cartItems.map((item) => item.product_id),
      quantity: cartItems.map((item) => item.quantity),
      totalAmount: totalPrice,
    };

    try {
      const response = await fetch("http://localhost:4000/api/payment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionStorage.getItem("token")}`,
        },
        body: JSON.stringify(checkoutData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Payment error data:", errorData);
        throw new Error(errorData.message || "Failed to process payment");
      }

      const data = await response.json();
      console.log("Payment successful:", data);

      // Điều hướng tới trang thanh toán của MoMo
      if (data.payUrl) {
        window.location.href = data.payUrl;
      } else {
      }
    } catch (error) {
      console.error("Checkout error:", error);
      alert("Checkout failed: " + error.message);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mt-4">
      {notification && (
        <div className="alert alert-warning" role="alert">
          {notification}
        </div>
      )}
      <h2 className="cart-header">Cart</h2>
      <div className="row">
        <div className="col-md-8">
          <table className="table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Unit Price</th>
                <th style={{ width: "180px" }}>Quantity</th>
                <th>Total</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {cartItems.length > 0 ? (
                cartItems.map((item) => (
                  <tr key={item._id}>
                    <td>{item.product_name}</td>
                    <td>{item.product_price.toLocaleString("vi-VN")} VNĐ</td>
                    <td>
                      <div className="input-group">
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() =>
                            handleQuantityChange(item._id, item.quantity - 1)
                          }
                        >
                          -
                        </button>
                        <input
                          type="number"
                          className="form-control"
                          value={item.quantity}
                          min="1"
                          readOnly
                        />
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() =>
                            handleQuantityChange(item._id, item.quantity + 1)
                          }
                        >
                          +
                        </button>
                      </div>
                    </td>
                    <td>
                      <strong>
                        {(item.product_price * item.quantity).toLocaleString(
                          "vi-VN"
                        )}{" "}
                        VNĐ
                      </strong>
                    </td>
                    <td>
                      <button
                        className="btn btn-danger btn-sm"
                        title="Xóa"
                        onClick={() => handleDelete(item._id)}
                      >
                        <i className="bi bi-trash"></i>
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="text-center">
                    Empty Cart
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="col-md-4">
          <div className="total-section">
            <h5>Total</h5>
            <p>
              Subtotal:{" "}
              <strong>{totalPrice.toLocaleString("en-US")} VND</strong>
            </p>
            <p>
              Discount: <strong>{discount.toLocaleString("en-US")} VND</strong>
            </p>
            <p>
              Shipping Fee:{" "}
              <strong>{shippingFee.toLocaleString("en-US")} VND</strong>
            </p>
            <h5>
              <strong>
                Grand Total: {totalPrice.toLocaleString("en-US")} VND
              </strong>
            </h5>
            <button className="btn btn-danger w-100" onClick={handleCheckout}>
              Checkout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartPage;
