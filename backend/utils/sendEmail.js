const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

const sendVerificationEmail = async (to, firstName, token) => {
    const verifyUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;
    await transporter.sendMail({
        from: `"BhawnaOJ" <${process.env.EMAIL_USER}>`,
        to,
        subject: 'Verify your BhawnaOJ account',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #1e3a8a;">Welcome to BhawnaOJ, ${firstName}!</h2>
                <p>Please verify your email address to activate your account.</p>
                <a href="${verifyUrl}"
                   style="background-color: #1e3a8a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block; margin: 16px 0;">
                    Verify Email
                </a>
                <p style="color: #666; font-size: 14px;">This link expires in 24 hours.</p>
                <p style="color: #666; font-size: 14px;">If you didn't create an account, ignore this email.</p>
            </div>
        `,
    });
};

module.exports = { sendVerificationEmail };
