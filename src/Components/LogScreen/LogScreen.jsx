import React, { useState } from "react";
import "./style.css";

const LogScreen = () => {
  const [activeRole, setActiveRole] = useState("professor");

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
            <input type="text" className="text-input" />
          </div>
          <div className="input-inner">
            <p className="input-name">Password</p>
            <input type="password" className="text-input" />
          </div>
          <div className="log-wrapper">
            <button className="log-button">Login</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LogScreen;
