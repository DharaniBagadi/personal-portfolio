const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

const sendPasswordResetEmail = async (email, resetUrl) => {
  await transporter.sendMail({
    from: `"Royal Flame" <${process.env.SMTP_USER}>`,
    to: email,
    subject: 'Royal Flame - Password Reset',
    text: `You requested a password reset.

Click this link to reset your password:

${resetUrl}

This link expires in 15 minutes.

If you did not request this reset, you can safely ignore this email.`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;">
        <h2>Royal Flame</h2>

        <p>You requested a password reset.</p>

        <p>
          Click the button below to create a new password.
        </p>

        <p>
          <a href="${resetUrl}"
             style="
               display:inline-block;
               padding:12px 20px;
               background:#b8860b;
               color:white;
               text-decoration:none;
               border-radius:5px;
             ">
            Reset Password
          </a>
        </p>

        <p>This link expires in <strong>15 minutes</strong>.</p>

        <p>
          If you did not request this password reset,
          you can safely ignore this email.
        </p>
      </div>
    `
  });
};

module.exports = {
  sendPasswordResetEmail
};