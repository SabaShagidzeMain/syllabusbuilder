import dotenv from "dotenv";
dotenv.config();

import { createClient } from "@supabase/supabase-js";
import nodemailer from "nodemailer";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error("Missing Supabase environment variables");
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

// Setup transporter once, but add verify to catch SMTP issues early
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

transporter.verify(function (error, success) {
  if (error) {
    console.error("SMTP verification failed:", error);
  } else {
    console.log("SMTP server ready to send emails");
  }
});

export async function registerProfessor(req, res) {
  try {
    const { email, name, surname, university } = req.body;

    if (!email || !name || !surname || !university) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Generate a temporary password (OTP)
    const tempPassword = Math.random().toString(36).slice(-8);

    // Create user in Supabase Auth with "must_change_password" flag
    console.log("Creating user in Supabase Auth...");
    const { data, error: signUpError } = await supabase.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: {
        role: "professor",
        must_change_password: true,
      },
    });

    if (signUpError) {
      console.error("Supabase user creation error:", signUpError);
      return res.status(400).json({ error: signUpError.message });
    }

    const user = data.user;
    if (!user || !user.id) {
      console.error("User data missing after creation:", data);
      return res
        .status(500)
        .json({ error: "Failed to retrieve user ID after creation." });
    }

    console.log("Inserting profile data...");
    const { error: profileError } = await supabase.from("profiles").insert([
      {
        user_id: user.id,
        name,
        surname,
        university,
        role: { prof: true, admin: false },
      },
    ]);

    if (profileError) {
      console.error("Profile insert error:", profileError);
      return res.status(400).json({ error: profileError.message });
    }

    // Send OTP email
    console.log("Sending OTP email...");
    await transporter.sendMail({
      from: `"Syllabus Builder" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Your Professor Account",
      html: `
        <h2>Welcome, ${name}!</h2>
        <p>Your professor account has been created.</p>
        <p><b>One-Time Password:</b> ${tempPassword}</p>
        <p>Please log in and change your password immediately — you will be required to do so before using the system.</p>
      `,
    });

    console.log("Email sent successfully.");
    res.status(200).json({
      message: "Professor registered successfully and OTP sent to email.",
    });
  } catch (err) {
    console.error("Unexpected error in registerProfessor:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}
