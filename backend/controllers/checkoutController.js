const express = require("express");
const axios = require("axios");
const crypto = require("crypto");

const { authenticateJWT } = require("../config/jwt");
const Checkout = require("../models/Checkout");
const Cart = require("../models/Cart");
const User = require("../models/User");
const Product = require("../models/Product");
const router = express.Router();
const redirectUrl = "http://localhost:4000/api/payment/result"; // Endpoint xử lý kết quả thanh toán

router.post("/payment", authenticateJWT, async (req, res) => {
  try {
    const cartItems = await Cart.find({ id_user: req.user.id }).populate(
      "id_product"
    );

    if (!cartItems || cartItems.length === 0) {
      return res
        .status(400)
        .json({ message: "Cart is empty, cannot proceed to payment." });
    }

    const user = await User.findById(req.user.id);
    if (
      !user ||
      !user.username ||
      !user.email ||
      !user.address ||
      !user.numberphone
    ) {
      return res.status(400).json({
        message:
          "Please update your profile with complete information before proceeding to payment.",
      });
    }

    const totalAmount = cartItems.reduce(
      (total, item) => total + item.id_product.money * item.quantity,
      0
    );

    const accessKey = "F8BBA842ECF85";
    const secretKey = "K951B6PE1waDMi640xX08PD3vg6EkVlz";
    const partnerCode = "MOMO";
    const orderId = partnerCode + new Date().getTime();
    const orderInfo = "pay with MoMo " + orderId;
    const ipnUrl = "https://webhook.site/b3088a6a-2d17-4f8d-a383-71389a6c600b";
    const requestType = "payWithMethod";
    const amount = totalAmount.toString();
    const requestId = orderId;
    const extraData = req.user.id; // Store user ID in extraData
    const autoCapture = true;
    const lang = "vi";

    const rawSignature = `accessKey=${accessKey}&amount=${amount}&extraData=${extraData}&ipnUrl=${ipnUrl}&orderId=${orderId}&orderInfo=${orderInfo}&partnerCode=${partnerCode}&redirectUrl=${redirectUrl}&requestId=${requestId}&requestType=${requestType}`;
    const signature = crypto
      .createHmac("sha256", secretKey)
      .update(rawSignature)
      .digest("hex");

    const requestBody = JSON.stringify({
      partnerCode,
      partnerName: "Test",
      storeId: "MomoTestStore",
      requestId,
      amount,
      orderId,
      orderInfo,
      redirectUrl,
      ipnUrl,
      lang,
      requestType,
      autoCapture,
      extraData,
      signature,
    });

    const options = {
      method: "POST",
      url: "https://test-payment.momo.vn/v2/gateway/api/create",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(requestBody),
      },
      data: requestBody,
    };

    let result = await axios(options);
    console.log("Payment response:", result.data);

    const checkoutRecords = cartItems.map((item) => ({
      id_product: item.id_product._id,
      id_user: req.user.id,
      amount: item.id_product.money,
      quantity: item.quantity,
      status: "pending",
      orderId,
      payUrl: result.data.payUrl,
    }));

    // Lưu bản ghi giao dịch với Status "pending" và payUrl
    await Checkout.insertMany(checkoutRecords);

    return res.status(200).json({ payUrl: result.data.payUrl });
  } catch (error) {
    console.error("Error during payment request:", error);
    return res.status(500).json({
      statusCode: 500,
      message: "Server error",
    });
  }
});

router.get("/payment/result", async (req, res) => {
  const { orderId, resultCode, message, extraData } = req.query;

  try {
    const status = resultCode === "0" ? "completed" : "failed";

    // Cập nhật trạng thái thanh toán trong cơ sở dữ liệu
    await Checkout.updateMany(
      { orderId: orderId },
      { $set: { status: status, message: message } }
    );

    // Nếu thanh toán không thành công, xóa các bản ghi giao dịch đã lưu
    if (resultCode !== "0") {
      await Checkout.deleteMany({ orderId: orderId });
    } else if (extraData) {
      // Nếu thanh toán thành công, xóa các sản phẩm trong giỏ hàng của người dùng
      await Cart.deleteMany({ id_user: extraData });
    }

    // Chuyển hướng người dùng trở lại trang giỏ hàng với thông báo kết quả
    return res.redirect(
      `http://localhost:3000/cart?resultCode=${resultCode}&message=${encodeURIComponent(
        message
      )}`
    );
  } catch (error) {
    console.error("Error updating payment status:", error);
    return res
      .status(500)
      .json({ message: "Server error while updating payment status" });
  }
});
// Get User Orders
router.get("/orders", authenticateJWT, async (req, res) => {
    try {
      const checkouts = await Checkout.find({ id_user: req.user.id })
        .populate("id_product") // Optionally populate product details
        .exec();
  
      if (!checkouts || checkouts.length === 0) {
        return res
          .status(404)
          .json({ message: "No orders found for this user." });
      }
  
      // Format the data to return the relevant fields
      const orderHistory = checkouts.map((order) => ({
        orderId: order.orderId,
        productName: order.id_product.product_name,
        quantity: order.quantity,
        price: order.amount,
        status: order.status,
        paymentDate: order.date_checkout,
        payUrl: order.payUrl,
      }));
  
      res.status(200).json(orderHistory);
    } catch (error) {
      console.error("Error fetching orders:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

   // Get All Orders (Admin)
router.get("/ordersAll", authenticateJWT, async (req, res) => {
  try {
    const checkouts = await Checkout.find({})
      .populate("id_product")
      .populate({
        path: "id_user",
        select: "username numberphone address",
      })
      .exec();

    if (!checkouts || checkouts.length === 0) {
      return res.status(404).json({ message: "No orders found." });
    }

    const allOrders = checkouts.map((order) => ({
      orderId: order.orderId,
      username: order.id_user ? order.id_user.username : "N/A", // Check if id_user is populated
      phone: order.id_user ? order.id_user.numberphone : "N/A",
      address: order.id_user ? order.id_user.address : "N/A",
      productName: order.id_product ? order.id_product.product_name : "N/A", // Check if id_product is not null
      quantity: order.quantity,
      price: order.amount,
      status: order.status,
      paymentDate: order.date_checkout,
    }));

    res.status(200).json(allOrders);
  } catch (error) {
    console.error("Error fetching all orders:", error);
    res.status(500).json({ message: "Error fetching all orders." });
  }
});




module.exports = router;
