import dotenv from "dotenv";
dotenv.config();

import { createClient } from "@supabase/supabase-js";

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

        // TODO: Send email with tempPassword here (optional)

        res.status(200).json({
            message: "Professor registered successfully",
            tempPassword, // For now, sending temp password in response (remove for production)
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Internal server error" });
    }
}
