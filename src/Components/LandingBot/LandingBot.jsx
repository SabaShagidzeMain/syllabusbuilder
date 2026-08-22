import React, { useEffect, useRef, useState } from "react";

import { supabase } from "../../utility/supabaseClient";

import AdminDisplay from "../AdminDisplay/AdminDisplay";
import ProfDisplay from "../ProfDisplay/ProfDisplay";
import AdminSyllabusModal from "../AdminSyllabusModal/AdminSyllabusModal";
import ProfessorFillModal from "../professorFillModal/ProfessorFillModal";
import RegisterProfModal from "../RegisterProfModal/RegisterProfModal";
import AppSidebar from "../AppSidebar/AppSidebar";
import ProfessorSidebar from "../ProfessorSidebar/ProfessorSidebar";

import Spinner from "../Spinner/Spinner";

import "./style.css";

const LandingBot = () => {
  /* =========================================
     REFS
  ========================================= */

  const adminDisplayRef = useRef(null);
  const profDisplayRef = useRef(null);

  /* =========================================
     GENERAL STATE
  ========================================= */

  const [openModal, setOpenModal] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  const [selectedForm, setSelectedForm] = useState(null);
  const [showRegisterProfModal, setShowRegisterProfModal] = useState(false);

  const [adminUniversity, setAdminUniversity] = useState(null);

  /* =========================================
     ADMIN PAGE
  ========================================= */

  const [activePage, setActivePage] = useState("syllabuses");

  /* =========================================
     PROFESSOR PAGE
  ========================================= */

  const [activeProfPage, setActiveProfPage] = useState("syllabuses");

  /* =========================================
     LOAD USER
  ========================================= */

  useEffect(() => {
    let cancelled = false;

    const loadUser = async () => {
      console.log("LandingBot: starting user check...");

      try {
        /*
         * =====================================
         * GET AUTH USER
         * =====================================
         */

        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        console.log("LandingBot: auth result:", {
          user,
          authError,
        });

        if (cancelled) return;

        if (authError) {
          console.error("LandingBot: auth error:", authError.message);

          setRole(null);
          setAdminUniversity(null);

          return;
        }

        if (!user) {
          console.warn("LandingBot: no authenticated user");

          setRole(null);
          setAdminUniversity(null);

          return;
        }

        /*
         * =====================================
         * GET PROFILE
         * =====================================
         */

        console.log("LandingBot: fetching profile...");

        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("role, university")
          .eq("user_id", user.id)
          .maybeSingle();

        console.log("LandingBot: profile result:", {
          profile,
          profileError,
        });

        if (cancelled) return;

        if (profileError) {
          console.error("LandingBot: profile error:", profileError.message);

          setRole(null);
          setAdminUniversity(null);

          return;
        }

        if (!profile) {
          console.warn("LandingBot: profile does not exist");

          setRole(null);
          setAdminUniversity(null);

          return;
        }

        /*
         * =====================================
         * SET ROLE
         * =====================================
         */

        console.log("LandingBot: ROLE =", profile.role);

        console.log("LandingBot: UNIVERSITY =", profile.university);

        setRole(profile.role || null);
        setAdminUniversity(profile.university || null);
      } catch (error) {
        console.error("LandingBot: unexpected error:", error);

        if (!cancelled) {
          setRole(null);
          setAdminUniversity(null);
        }
      } finally {
        if (!cancelled) {
          console.log("LandingBot: finished loading.");

          setLoading(false);
        }
      }
    };

    loadUser();

    return () => {
      cancelled = true;
    };
  }, []);

  /* =========================================
     PROFESSOR FORM SAVE
  ========================================= */

  const handleSave = async (updatedSections) => {
    if (!selectedForm) return;

    try {
      const { error } = await supabase
        .from("prof_forms")
        .update({
          content: updatedSections,
        })
        .eq("id", selectedForm.id);

      if (error) {
        console.error("Failed to save:", error.message);

        alert("Failed to save: " + error.message);

        return;
      }

      setSelectedForm(null);
      setOpenModal(null);
    } catch (error) {
      console.error(error);

      alert("Unexpected error");
    }
  };

  /* =========================================
     CLOSE MODAL
  ========================================= */

  const handleClose = () => {
    setOpenModal(null);
    setSelectedForm(null);
  };

  /* =========================================
     EDIT PROFESSOR FORM
  ========================================= */

  const handleEditForm = (form) => {
    setSelectedForm(form);
    setOpenModal("edit");
  };

  /* =========================================
     ADMIN:
     NEW SYLLABUS
  ========================================= */

  const handleNewSyllabus = () => {
    setActivePage("syllabuses");

    if (adminDisplayRef.current?.createMainSyllabus) {
      adminDisplayRef.current.createMainSyllabus();
    }
  };

  /* =========================================
     ADMIN:
     CREATE FROM TEMPLATE
  ========================================= */

  const handleCreateFromTemplate = () => {
    setActivePage("syllabuses");

    if (adminDisplayRef.current?.createSubjectSyllabus) {
      adminDisplayRef.current.createSubjectSyllabus();
    }
  };

  /* =========================================
     ADMIN:
     PROFESSOR SUBMISSIONS
  ========================================= */

  const handleProfessorSubmissions = () => {
    setActivePage("submissions");
    setOpenModal("admin");
  };

  /* =========================================
     ADMIN:
     REGISTER PROFESSOR
  ========================================= */

  const handleRegisterProfessor = () => {
    setActivePage("register");
    setShowRegisterProfModal(true);
  };

  /* =========================================
     ADMIN:
     SETTINGS
  ========================================= */

  const handleSettings = () => {
    setActivePage("settings");
  };

  /* =========================================
     PROFESSOR:
     SYLLABUSES
  ========================================= */

  const handleProfessorSyllabuses = () => {
    setActiveProfPage("syllabuses");
  };

  /* =========================================
     PROFESSOR:
     CREATE SYLLABUS
  ========================================= */

  const handleProfessorCreate = () => {
    setActiveProfPage("syllabuses");

    if (profDisplayRef.current?.createNewSyllabus) {
      profDisplayRef.current.createNewSyllabus();
    }
  };

  /* =========================================
     PROFESSOR:
     SETTINGS
  ========================================= */

  const handleProfessorSettings = () => {
    setActiveProfPage("settings");
  };

  /* =========================================
     LOGOUT
  ========================================= */

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        console.error("Logout error:", error.message);

        alert("Failed to log out.");

        return;
      }

      window.location.href = "/login";
    } catch (error) {
      console.error(error);
    }
  };

  /* =========================================
     LOADING
  ========================================= */

  if (loading) {
    return (
      <div className="application-loading">
        <Spinner />
      </div>
    );
  }

  /* =========================================
     NO ROLE
  ========================================= */

  if (!role) {
    return (
      <div className="no-role-message">
        <h2>Account Error</h2>

        <p>No role was found for this account.</p>

        <button onClick={handleLogout}>Log out</button>
      </div>
    );
  }

  /* =========================================
     PROFESSOR
  ========================================= */

  if (role.prof === true) {
    return (
      <div className="application-layout">
        {/* ================================
            PROFESSOR SIDEBAR
        ================================= */}

        <ProfessorSidebar
          activePage={activeProfPage}
          setActivePage={setActiveProfPage}
          onSyllabuses={handleProfessorSyllabuses}
          onCreateSyllabus={handleProfessorCreate}
          onSettings={handleProfessorSettings}
          onLogout={handleLogout}
        />

        {/* ================================
            PROFESSOR CONTENT
        ================================= */}

        <main className="application-content">
          {activeProfPage === "syllabuses" && (
            <ProfDisplay ref={profDisplayRef} />
          )}

          {activeProfPage === "settings" && (
            <div className="settings-page">
              <h2>Settings</h2>

              <p>Professor account settings</p>
            </div>
          )}
        </main>
      </div>
    );
  }

  /* =========================================
     ADMIN
  ========================================= */

  if (role.admin === true) {
    return (
      <div className="application-layout">
        {/* ================================
            ADMIN SIDEBAR
        ================================= */}

        <AppSidebar
          activePage={activePage}
          setActivePage={setActivePage}
          onNewSyllabus={handleNewSyllabus}
          onCreateFromTemplate={handleCreateFromTemplate}
          onProfessorSubmissions={handleProfessorSubmissions}
          onRegisterProfessor={handleRegisterProfessor}
          onSettings={handleSettings}
          onLogout={handleLogout}
        />

        {/* ================================
            ADMIN CONTENT
        ================================= */}

        <main className="application-content">
          {activePage === "syllabuses" && (
            <AdminDisplay ref={adminDisplayRef} />
          )}

          {/* ================================
              PROFESSOR SUBMISSIONS
          ================================= */}

          <AdminSyllabusModal
            isOpen={openModal === "admin"}
            onClose={() => {
              setOpenModal(null);
              setActivePage("syllabuses");
            }}
            onEdit={handleEditForm}
          />

          {/* ================================
              PROFESSOR FORM EDIT
          ================================= */}

          <ProfessorFillModal
            isOpen={openModal === "edit"}
            onClose={handleClose}
            syllabus={selectedForm}
            onSave={handleSave}
            isAdmin={true}
          />

          {/* ================================
              REGISTER PROFESSOR
          ================================= */}

          <RegisterProfModal
            isOpen={showRegisterProfModal}
            onClose={() => {
              setShowRegisterProfModal(false);

              setActivePage("syllabuses");
            }}
            adminUniversity={adminUniversity}
          />
        </main>
      </div>
    );
  }

  /* =========================================
     UNKNOWN ROLE
  ========================================= */

  return (
    <div className="no-role-message">
      <h2>Unknown Role</h2>

      <p>The account has a role, but Structura doesn't recognize it.</p>

      <button onClick={handleLogout}>Log out</button>
    </div>
  );
};

export default LandingBot;
