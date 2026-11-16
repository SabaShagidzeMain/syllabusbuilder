import React, { useState } from "react";
import "./style.css";
import { supabase } from "../../utility/supabaseClient";
import { useNavigate } from "react-router-dom";

const LogScreen = () => {
  const [activeRole, setActiveRole] = useState("professor");
  const [email, setEmail] = useState("");
  const [university, setUniversity] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const navigate = useNavigate();

  const handleLogin = async () => {
    setErrorMsg("");

    try {
      // Step 1: Authenticate user
      const { data: authData, error: authError } =
        await supabase.auth.signInWithPassword({
          email,
          password,
        });

      if (authError) {
        setErrorMsg("Login failed: Incorrect email or password.");
        return;
      }

      // Step 2: Fetch user profile
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("university, role")
        .eq("user_id", authData.user.id)
        .single();

      if (profileError || !profileData) {
        await supabase.auth.signOut();
        setErrorMsg(
          "Login failed: Could not retrieve your user profile. Please contact support.",
        );
        return;
      }

      // Step 3: Validate university
      const universityMatches =
        profileData.university?.trim() === university.trim();

      if (!universityMatches) {
        setErrorMsg(
          "Login failed: The selected university does not match the university registered to your account.",
        );

        await supabase.auth.signOut();

        return;
      }

      // Step 4: Validate role
      const selectedRoleKey = activeRole === "professor" ? "prof" : "admin";

      const roleValue = profileData.role?.[selectedRoleKey]?.toString().trim();

      const hasRole = roleValue === "true";

      if (!hasRole) {
        await supabase.auth.signOut();
        setErrorMsg(
          `Login failed: Your account is not registered as a ${activeRole}.`,
        );
        return;
      }

      // Step 5: All validations passed
      navigate("/");
    } catch (error) {
      await supabase.auth.signOut();
      setErrorMsg("Something went wrong while logging in. Please try again.");
      console.error("Login error:", error);
    }
  };

  return (
    <div className="logScreen-wrapper">
      <div className="logScreen">
        <div className="button-wrapper">
          <button
            type="button"
            className={`log-button-left ${
              activeRole === "professor" ? "log-button-active" : ""
            }`}
            onClick={() => setActiveRole("professor")}
          >
            Professor
          </button>

          <button
            type="button"
            className={`log-button-right ${
              activeRole === "admin" ? "log-button-active" : ""
            }`}
            onClick={() => setActiveRole("admin")}
          >
            Admin
          </button>
        </div>

        <div className="input-wrapper">
          <div className="input-inner">
            <p className="input-name">University</p>
            <select
              className="text-input"
              value={university}
              onChange={(e) => setUniversity(e.target.value)}
            >
              <option value="">Select your university</option>
              <option value="ALTE">ALTE</option>
              <option value="GSU">GSU</option>
              <option value="Tbilisi Uni">Tbilisi Uni</option>
            </select>
          </div>

          <div className="input-inner">
            <p className="input-name">Email</p>
            <input
              type="email"
              className="text-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="input-inner">
            <p className="input-name">Password</p>
            <input
              type="password"
              className="text-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <div className="login-error">{errorMsg && <p>{errorMsg}</p>}</div>

          <div className="log-wrapper">
            <button type="button" className="log-button" onClick={handleLogin}>
              Login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LogScreen;
