// src/Components/ChangePassword/ChangePassword.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../utility/supabaseClient";

export default function ChangePassword() {
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      alert(error.message);
      setLoading(false);
      return;
    }

    // Clear the must_change_password flag
    await supabase.auth.updateUser({ data: { must_change_password: false } });

    alert("Password changed successfully!");
    navigate("/"); // go to main page
  };

  return (
    <div style={{ padding: "2rem" }}>
      <h2>Change Your Password</h2>
      <form onSubmit={handleChangePassword}>
        <input
          type="password"
          placeholder="New password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
          style={{ padding: "0.5rem", margin: "0.5rem 0" }}
        />
        <br />
        <button type="submit" disabled={loading}>
          {loading ? "Changing..." : "Change Password"}
        </button>
      </form>
    </div>
  );
}
