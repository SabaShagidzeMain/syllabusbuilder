import React, { useState } from "react";
import "./style.css";
import { supabase } from "../../utility/supabaseClient";
import { useNavigate } from "react-router-dom";

const LogScreen = () => {
  const [activeRole, setActiveRole] = useState("professor");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const navigate = useNavigate();

  const handleLogin = async () => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setErrorMsg(error.message);
    } else {
      setErrorMsg("");
      navigate("/main");
    }
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
            <input type="text" className="text-input" />
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
