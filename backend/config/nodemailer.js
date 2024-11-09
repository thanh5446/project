const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: "vuthanh10235@gmail.com", // Your email address
    pass: "pzqdumtphdcfwlst", // Your email password or app password
  },
});

module.exports = transporter;