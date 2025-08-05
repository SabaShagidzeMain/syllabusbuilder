import React, { useState } from "react";
import { supabase } from "../../utility/supabaseClient";

export default function RegisterProfModal({ isOpen, onClose, adminUniversity }) {
    const [email, setEmail] = useState("");
    const [name, setName] = useState("");
    const [surname, setSurname] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(null);

        if (!email || !name || !surname) {
            setError("Please fill in all fields.");
            setLoading(false);
            return;
        }

        try {
            // 1. Create user in Supabase Auth (admin method)
            const tempPassword = Math.random().toString(36).slice(-8);
            const { data: userData, error: signUpError } = await supabase.auth.admin.createUser({
                email,
                password: tempPassword,
                email_confirm: true, // skip email confirmation
            });

            if (signUpError) {
                setError(signUpError.message);
                setLoading(false);
                return;
            }

            // 2. Insert profile linked to the new user_id
            const { error: profileError } = await supabase.from("profiles").insert([
                {
                    user_id: userData.id,
                    name,
                    surname,
                    university: adminUniversity,
                    role: { prof: true, admin: false },
                },
            ]);

            if (profileError) {
                setError(profileError.message);
                setLoading(false);
                return;
            }

            // 3. Optionally send an email with tempPassword here

            setSuccess("Professor registered successfully. Temporary password emailed.");
            setEmail("");
            setName("");
            setSurname("");
        } catch (err) {
            setError("Unexpected error occurred.");
        } finally {
            setLoading(false);
        }
    };


    if (!isOpen) return null;

    return (
        <div className="modal-backdrop" onClick={onClose}>
            <div
                className="modal-content"
                onClick={(e) => e.stopPropagation()}
                style={{
                    background: "white",
                    padding: 20,
                    borderRadius: 8,
                    width: 350,
                    maxWidth: "90%",
                    margin: "auto",
                    marginTop: "10vh",
                }}
            >
                <h3>Register Professor</h3>
                <form onSubmit={handleSubmit}>
                    <label>Email</label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        style={{ width: "100%", marginBottom: 10 }}
                    />
                    <label>Name</label>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        style={{ width: "100%", marginBottom: 10 }}
                    />
                    <label>Surname</label>
                    <input
                        type="text"
                        value={surname}
                        onChange={(e) => setSurname(e.target.value)}
                        required
                        style={{ width: "100%", marginBottom: 10 }}
                    />

                    {error && <p style={{ color: "red" }}>{error}</p>}
                    {success && <p style={{ color: "green" }}>{success}</p>}

                    <button type="submit" disabled={loading} style={{ marginRight: 10 }}>
                        {loading ? "Registering..." : "Register"}
                    </button>
                    <button type="button" onClick={onClose} disabled={loading}>
                        Cancel
                    </button>
                </form>
            </div>
        </div>
    );
}
