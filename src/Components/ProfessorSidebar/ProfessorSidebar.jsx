import React from "react";
import "./style.css";

import syllabusIcon from "../../assets/general/tabler_template.png";
import createIcon from "../../assets/general/ri_instance-line.png";
import settingsIcon from "../../assets/general/material-symbols_settings-outline-rounded.png";

const ProfessorSidebar = ({
  activePage,
  setActivePage,
  onSyllabuses,
  onCreateSyllabus,
  onSettings,
  onLogout,
}) => {
  return (
    <aside className="professor-sidebar">
      {/* =========================================
          BRAND
      ========================================= */}

      <div className="sidebar-brand">
        <h1>Structura</h1>
      </div>

      {/* =========================================
          NAVIGATION
      ========================================= */}

      <nav className="sidebar-nav">
        {/* =====================================
            MY SYLLABUSES
        ===================================== */}

        <button
          className={`sidebar-item ${
            activePage === "syllabuses" ? "active" : ""
          }`}
          onClick={onSyllabuses}
        >
          <img src={syllabusIcon} alt="Syllabuses" className="sidebar-icon" />

          <span>My Syllabuses</span>
        </button>

        {/* =====================================
            CREATE SYLLABUS
        ===================================== */}

        <button
          className={`sidebar-item ${activePage === "create" ? "active" : ""}`}
          onClick={onCreateSyllabus}
        >
          <img src={createIcon} alt="Create" className="sidebar-icon" />

          <span>Create Syllabus</span>
        </button>
      </nav>

      {/* =========================================
          BOTTOM
      ========================================= */}

      <div className="sidebar-bottom">
        {/* =====================================
            SETTINGS
        ===================================== */}

        <button
          className={`sidebar-item ${
            activePage === "settings" ? "active" : ""
          }`}
          onClick={onSettings}
        >
          <img src={settingsIcon} alt="Settings" className="sidebar-icon" />

          <span>Settings</span>
        </button>

        {/* =====================================
            LOGOUT
        ===================================== */}

        <button className="sidebar-item logout-item" onClick={onLogout}>
          <span className="sidebar-icon logout-icon">↪</span>

          <span>Log out</span>
        </button>
      </div>
    </aside>
  );
};

export default ProfessorSidebar;
