import React, { useEffect, useState } from "react";

const HistoryPage = () => {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await fetch("http://localhost:4000/api/orders", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${sessionStorage.getItem("token")}`, // Include token if needed
          },
        });

        if (!response.ok) {
          throw new Error("Network response was not ok");
        }

        const data = await response.json();
        setOrders(data); // Assuming the response data is an array of orders
      } catch (error) {
        console.error("Failed to fetch orders:", error);
      }
    };

    fetchOrders();
  }, []);

  return (
    <div className="container mt-4">
      <h2 className="order-header">Order History</h2>

      <div className="table-responsive">
        <table className="table table-striped">
          <thead>
            <tr>
              <th scope="col">Order ID</th>
              <th scope="col">Product Name</th>
              <th scope="col">Quantity</th>
              <th scope="col">Price</th>
              <th scope="col">Status</th>
              <th scope="col">Payment Date</th>
              <th scope="col">Continue Payment</th>
            </tr>
          </thead>
          <tbody id="orderTableBody">
            {orders.length > 0 ? (
              orders.map((order) => (
                <tr key={order.orderId}>
                  {" "}
                  {/* Assuming order object has orderId */}
                  <td>{order.orderId}</td>
                  <td>{order.productName}</td>{" "}
                  {/* Adjust based on your data structure */}
                  <td>{order.quantity}</td>
                  <td>{order.price.toLocaleString("vi-VN")} VNĐ</td>
                  <td>{order.status}</td>
                  <td>
                    {new Date(order.paymentDate).toLocaleDateString("vi-VN")}
                  </td>{" "}
                  {/* Format date */}
                  <td>
                    {/* Kiểm tra trạng thái và hiển thị đường dẫn thanh toán nếu cần */}
                    {order.status === "pending" && order.payUrl ? (
                      <a
                        href={order.payUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <i className="bi bi-cart icon-spacing"></i>{" "}
                        {/* Biểu tượng giỏ hàng */}
                      </a>
                    ) : (
                      <span>Done</span>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="text-center">
                  No orders available
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default HistoryPage;
