import dotenv from "dotenv";
dotenv.config();

import nodemailer from "nodemailer";

async function testEmail() {
    let transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
    });

    try {
        let info = await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: process.env.EMAIL_USER, // or your own email to receive test
            subject: "Test Email",
            text: "Hello! This is a test email.",
        });
        console.log("Email sent:", info.messageId);
    } catch (error) {
        console.error("Email failed:", error);
    }
}

testEmail();
