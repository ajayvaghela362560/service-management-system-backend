import nodemailer from "nodemailer";
import { environmentVariablesConfig } from "../config/appConfig.js";

async function sendResetMail(email, resetLink) {
  try {
    // Create transporter for cPanel email
    const transporter = nodemailer.createTransport({
      host: environmentVariablesConfig.smtp_host, // cPanel SMTP host
      port: environmentVariablesConfig.smtp_port, // Convert port to number (465 or 587)
      // secure: environmentVariablesConfig.smtp_secure, // true for SSL, false for TLS
      auth: {
        user: environmentVariablesConfig.smtp_auth_user, // Your cPanel email
        pass: environmentVariablesConfig.smtp_auth_pass, // Your cPanel email password
      },
    });

    // Email content
    const mailOptions = {
      from: `"Support Team" <${environmentVariablesConfig.smtp_auth_user}>`,
      to: email,
      subject: "Password Reset Request",
      html: `
                <p>We received a request to reset your password.</p>
                <p>Click the link below to reset your password:</p>
                <a href="${resetLink}" target="_blank">${resetLink}</a>
                <p>If you did not request this, please ignore this email.</p>
                <p>Thank you,<br/>Support Team</p>
            `,
    };

    // Send the email
    const info = await transporter.sendMail(mailOptions);
    console.log("Password reset email sent: ", info.response);

    return {
      success: true,
      message: "Password reset link has been sent to your email.",
    };
  } catch (error) {
    console.error("Error sending reset email:", error);
    return { success: false, message: "Failed to send password reset email." };
  }
}

async function sendEMail(mailOptions) {
  try {
    // Create transporter for cPanel email
    const transporter = nodemailer.createTransport({
      host: environmentVariablesConfig.smtp_host, // cPanel SMTP host
      port: environmentVariablesConfig.smtp_port, // Convert port to number (465 or 587)
      // secure: environmentVariablesConfig.smtp_secure, // true for SSL, false for TLS
      auth: {
        user: environmentVariablesConfig.smtp_auth_user, // Your cPanel email
        pass: environmentVariablesConfig.smtp_auth_pass, // Your cPanel email password
      },
    });

    // Send the email
    const info = await transporter.sendMail(mailOptions);
    console.log("Success in email send : ", info.response);

    return { success: true, message: "Email sent successfully." };
  } catch (error) {
    console.error("Error in email send :", error);
    return { success: false, message: error.message };
  }
}

export { sendResetMail, sendEMail };
