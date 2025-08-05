import dotenv from "dotenv";
dotenv.config();

import { createClient } from "@supabase/supabase-js";
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    service: 'gmail', // or use SMTP if you want
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error("Missing Supabase environment variables");
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

export async function registerProfessor(req, res) {
    try {
        const { email, name, surname, university } = req.body;

        if (!email || !name || !surname || !university) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        // Generate a temporary password
        const tempPassword = Math.random().toString(36).slice(-8);

        // Create user in Supabase Auth with admin privileges
        const { data: userData, error: signUpError } = await supabase.auth.admin.createUser({
            email,
            password: tempPassword,
            email_confirm: true,
        });

        if (signUpError) {
            return res.status(400).json({ error: signUpError.message });
        }

        // Insert profile linked to the new user_id
        const { error: profileError } = await supabase.from("profiles").insert([
            {
                user_id: userData.id,
                name,
                surname,
                university,
                role: { prof: true, admin: false },
            },
        ]);

        if (profileError) {
            return res.status(400).json({ error: profileError.message });
        }

        // Send email with tempPassword
        try {
            await transporter.sendMail({
                from: process.env.EMAIL_USER,
                to: email,
                subject: "Your temporary password for Syllabus Builder",
                text: `Hello ${name},

Your account was successfully created.

Temporary password: ${tempPassword}

Please log in and change your password as soon as possible.

Best regards,
Syllabus Builder Team`,
            });
        } catch (emailErr) {
            console.error("Email sending failed:", emailErr);
            return res.status(500).json({
                error: "User created but failed to send email with password",
            });
        }

        res.status(200).json({
            message: "Professor registered successfully, temporary password emailed.",
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Internal server error" });
    }
}
