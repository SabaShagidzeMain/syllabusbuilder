import React from "react";
import "./style.css";

import templateIcon from "../../assets/general/tabler_template.png";
import instanceIcon from "../../assets/general/ri_instance-line.png";
import submissionsIcon from "../../assets/general/typcn_document.png";
import registerIcon from "../../assets/general/mdi_register-outline.png";
import settingsIcon from "../../assets/general/material-symbols_settings-outline-rounded.png";
import logoutIcon from "../../assets/general/material-symbols_logout.png";

const AppSidebar = ({
  activePage,
  setActivePage,
  onNewSyllabus,
  onCreateFromTemplate,
  onProfessorSubmissions,
  onRegisterProfessor,
  onSettings,
  onLogout,
}) => {
  return (
    <aside className="app-sidebar">
      {/* ========================= */}
      {/* BRAND */}
      {/* ========================= */}

      <div className="sidebar-brand">
        <h1>Structura</h1>
      </div>

      {/* ========================= */}
      {/* MAIN NAVIGATION */}
      {/* ========================= */}

      <nav className="sidebar-nav">
        {/* NEW SYLLABUS TEMPLATE */}

        <button className="sidebar-item" onClick={onNewSyllabus}>
          <img src={templateIcon} className="sidebar-icon" alt="" />
          <span>New Syllabus Template</span>
        </button>

        {/* CREATE FROM TEMPLATE */}

        <button className="sidebar-item" onClick={onCreateFromTemplate}>
          <img src={instanceIcon} className="sidebar-icon" alt="" />
          <span>Create From Template</span>
        </button>

        {/* PROFESSOR SUBMISSIONS */}

        <button className="sidebar-item" onClick={onProfessorSubmissions}>
          <img src={submissionsIcon} className="sidebar-icon" alt="" />
          <span>Professor Submissions</span>
        </button>

        {/* REGISTER PROFESSOR */}

        <button className="sidebar-item" onClick={onRegisterProfessor}>
          <img src={registerIcon} className="sidebar-icon" alt="" />
          <span>Register Professor</span>
        </button>
      </nav>

      {/* ========================= */}
      {/* BOTTOM */}
      {/* ========================= */}

      <div className="sidebar-bottom">
        {/* SETTINGS */}

        <button
          className={`sidebar-item ${
            activePage === "settings" ? "active" : ""
          }`}
          onClick={onSettings}
        >
          <img src={settingsIcon} className="sidebar-icon" alt="" />
          <span>Settings</span>
        </button>

        {/* LOG OUT */}

        <button className="sidebar-item logout-item" onClick={onLogout}>
          <img src={logoutIcon} className="sidebar-icon" alt="" />
          <span>Log out</span>
        </button>
      </div>
    </aside>
  );
};

export default AppSidebar;
