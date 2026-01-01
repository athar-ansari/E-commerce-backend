const transporter = require("../config/emailConfig");

// Send email function
const sendEmail = async (to, subject, html) => {
  try {
    const mailOptions = {
      from: `"E-Commerce Platform" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(
      `Email sent to ${to} successfully with message ID: ${info.messageId}`
    );
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("Email sending failed:", error.message);
    return { success: false, error: error.message };
  }
};

// ========== TEMPLATE FUNCTIONS ==========

// 1. Seller account approved by admin
const getSellerApprovalEmail = (sellerName, sellerEmail) => {
  const subject = `🎉 Seller Account Approved - E-Commerce Platform`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; color: white; text-align: center;">
        <h1 style="margin: 0; font-size: 28px;">Account Approved!</h1>
      </div>
      
      <div style="padding: 30px; background-color: #f9f9f9;">
        <h2>Hello ${sellerName},</h2>
        
        <p style="font-size: 16px; line-height: 1.6;">
          We're excited to inform you that your seller account has been <strong>approved</strong> by our admin team.
        </p>
        
        <div style="background-color: white; border-left: 4px solid #4CAF50; padding: 20px; margin: 25px 0;">
          <p style="margin: 0;"><strong>Account Status:</strong> ✅ Active & Verified</p>
          <p style="margin: 10px 0 0 0;"><strong>Email:</strong> ${sellerEmail}</p>
        </div>
        
        <p style="font-size: 16px; line-height: 1.6;">
          You can now login to your seller dashboard and start listing your products.
        </p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${
            process.env.FRONTEND_URL || "http://localhost:3000"
          }/login" 
             style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                    color: white; 
                    padding: 14px 28px; 
                    text-decoration: none; 
                    border-radius: 5px; 
                    font-weight: bold;
                    display: inline-block;">
            Login to Seller Dashboard
          </a>
        </div>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
          <p style="color: #666; font-size: 14px;">
            If you have any questions, please contact our support team.
          </p>
          <p style="color: #666; font-size: 14px;">
            Best regards,<br>
            <strong>E-Commerce Platform Team</strong>
          </p>
        </div>
      </div>
    </div>
  `;

  return { subject, html };
};

// 2. Seller created by admin (with credentials)
const getSellerCreationEmail = (sellerName, sellerEmail, password) => {
  const subject = `👋 Welcome! Your Seller Account - E-Commerce Platform`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; color: white; text-align: center;">
        <h1 style="margin: 0; font-size: 28px;">Welcome ${sellerName}!</h1>
      </div>
      
      <div style="padding: 30px; background-color: #f9f9f9;">
        <h2>Your Seller Account is Ready</h2>
        
        <p style="font-size: 16px; line-height: 1.6;">
          An admin has created a seller account for you on our platform.
          Here are your login credentials:
        </p>
        
        <div style="background-color: white; border: 1px solid #ddd; border-radius: 5px; padding: 20px; margin: 25px 0;">
          <p style="margin: 0 0 10px 0;"><strong>🔐 Login Details:</strong></p>
          <p style="margin: 5px 0;"><strong>Email:</strong> ${sellerEmail}</p>
          <p style="margin: 5px 0;"><strong>Temporary Password:</strong> ${password}</p>
        </div>
        
        <div style="background-color: #fff8e1; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0;">
          <p style="margin: 0; font-weight: bold;">⚠️ Important Security Notice:</p>
          <p style="margin: 10px 0 0 0;">Please change your password immediately after first login.</p>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${
            process.env.FRONTEND_URL || "http://localhost:3000"
          }/login" 
             style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                    color: white; 
                    padding: 14px 28px; 
                    text-decoration: none; 
                    border-radius: 5px; 
                    font-weight: bold;
                    display: inline-block;">
            Login Now
          </a>
        </div>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
          <p style="color: #666; font-size: 14px;">
            Need help? Contact our support team at ${
              process.env.SUPPORT_EMAIL || "support@example.com"
            }
          </p>
        </div>
      </div>
    </div>
  `;

  return { subject, html };
};

// 3. Forgot Password OTP
const getForgotPasswordEmail = (userName, userEmail, otp) => {
  const subject = `🔑 Password Reset OTP - E-Commerce Platform`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; color: white; text-align: center;">
        <h1 style="margin: 0; font-size: 28px;">Password Reset</h1>
      </div>
      
      <div style="padding: 30px; background-color: #f9f9f9;">
        <h2>Hello ${userName},</h2>
        
        <p style="font-size: 16px; line-height: 1.6;">
          You requested to reset your password. Use the OTP below to verify your identity:
        </p>
        
        <div style="text-align: center; margin: 30px 0;">
          <div style="display: inline-block; background-color: white; padding: 25px; border-radius: 10px; border: 2px dashed #667eea;">
            <div style="font-size: 32px; font-weight: bold; letter-spacing: 10px; color: #333;">
              ${otp}
            </div>
          </div>
        </div>
        
        <div style="background-color: #ffebee; border-left: 4px solid #f44336; padding: 15px; margin: 20px 0;">
          <p style="margin: 0; font-weight: bold;">⏰ OTP Expires in 5 minutes</p>
          <p style="margin: 10px 0 0 0;">Do not share this OTP with anyone.</p>
        </div>
        
        <p style="color: #666; font-size: 14px;">
          If you didn't request this, please ignore this email or contact support.
        </p>
      </div>
    </div>
  `;

  return { subject, html };
};

module.exports = {
  sendEmail,
  getSellerApprovalEmail,
  getSellerCreationEmail,
  getForgotPasswordEmail,
};
