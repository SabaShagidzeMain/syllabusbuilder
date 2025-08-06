import "./regprofmod.css";
import React, { useState } from "react";

export default function RegisterProfModal({
  isOpen,
  onClose,
  adminUniversity,
}) {
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
      // Call your backend API
      const response = await fetch(
        "http://localhost:5000/api/registerProfessor",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email,
            name,
            surname,
            university: adminUniversity,
          }),
        }
      );

      const data = await response.json();

      // Inside your RegisterProfModal component, update this part in handleSubmit after successful registration:

      if (!response.ok) {
        setError(data.error || "Failed to register professor.");
      } else {
        setSuccess(
          `✅ Professor registered successfully!\n\n` +
            `Temporary password: ${data.tempPassword}\n\n` +
            `⚠️ Please share this password securely with the professor and remind them to change it after first login.`
        );
        setEmail("");
        setName("");
        setSurname("");
      }
    } catch (err) {
      setError("Unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h3>Register Professor</h3>
        <form onSubmit={handleSubmit}>
          <div className="reg-input-wrapper">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="reg-input"
            />
            <label>Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="reg-input"
            />
            <label>Surname</label>
            <input
              type="text"
              value={surname}
              onChange={(e) => setSurname(e.target.value)}
              required
              className="reg-input"
            />
          </div>

          {error && <p style={{ color: "red" }}>{error}</p>}
          {success && (
            <pre style={{ color: "green", whiteSpace: "pre-wrap" }}>
              {success}
            </pre>
          )}

          <button
            className="blue-button"
            type="submit"
            disabled={loading}
            style={{ marginRight: 10 }}
          >
            {loading ? "Registering..." : "Register"}
          </button>
          <button
            className="blue-button"
            type="button"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </button>
        </form>
      </div>
    </div>
  );
}
