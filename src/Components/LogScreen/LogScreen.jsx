import React, { useState } from "react";
import "./style.css";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../utility/supabaseClient";

const LogScreen = () => {
  const [activeRole, setActiveRole] = useState("professor");
  const [email, setEmail] = useState("");
  const [university, setUniversity] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const navigate = useNavigate();

  const handleLogin = async () => {
    setErrorMsg("");

    // Step 1: Try signing in
    const { data: authData, error: authError } =
      await supabase.auth.signInWithPassword({
        email,
        password,
      });

    if (authError) {
      setErrorMsg(authError.message);
      return;
    }

    // Step 1.5: Check if must_change_password flag is true
    if (authData?.user?.user_metadata?.must_change_password) {
      navigate("/change-password");
      return;
    }

    // Step 2: Fetch profile info
    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("university, role")
      .eq("user_id", authData.user.id)
      .single();

    if (profileError) {
      setErrorMsg("Could not retrieve profile.");
      return;
    }

    // Step 3: Validate university and role
    const selectedRoleKey = activeRole === "professor" ? "prof" : "admin";
    const roleValue = profileData.role?.[selectedRoleKey]?.toString().trim();
    const hasRole = roleValue === "true";
    const universityMatches = profileData.university === university;

    if (!universityMatches) {
      setErrorMsg("University mismatch.");
      return;
    }

    if (!hasRole) {
      setErrorMsg(`You are not authorized as a ${activeRole}.`);
      return;
    }

    // Step 4: All good
    navigate("/");
  };

  return (
    <div className="logScreen-wrapper">
      <div className="logScreen">
        <div className="button-wrapper">
          <button
            className={`log-button-left ${
              activeRole === "professor" ? "log-button-active" : ""
            }`}
            onClick={() => setActiveRole("professor")}
          >
            Professor
          </button>
          <button
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
              type="text"
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
          {errorMsg && <p style={{ color: "red" }}>{errorMsg}</p>}
          <div className="log-wrapper">
            <button className="log-button" onClick={handleLogin}>
              Login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LogScreen;
