import React, { useEffect, useRef, useState } from "react";

import { supabase } from "../../utility/supabaseClient";

import AdminDisplay from "../AdminDisplay/AdminDisplay";
import ProfDisplay from "../ProfDisplay/ProfDisplay";
import AdminSyllabusModal from "../AdminSyllabusModal/AdminSyllabusModal";
import ProfessorFillModal from "../professorFillModal/ProfessorFillModal";
import RegisterProfModal from "../RegisterProfModal/RegisterProfModal";
import AppSidebar from "../AppSidebar/AppSidebar";

import Spinner from "../Spinner/Spinner";

import "./style.css";

const LandingBot = () => {
  /* =========================================
     ADMIN DISPLAY REF
  ========================================= */

  const adminDisplayRef = useRef(null);

  /* =========================================
     GENERAL STATE
  ========================================= */

  const [openModal, setOpenModal] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedForm, setSelectedForm] = useState(null);
  const [showRegisterProfModal, setShowRegisterProfModal] = useState(false);
  const [adminUniversity, setAdminUniversity] = useState(null);

  const [activePage, setActivePage] = useState("syllabuses");

  /* =========================================
     FETCH USER ROLE
  ========================================= */

  useEffect(() => {
    const fetchUserRoleAndUni = async () => {
      try {
        setLoading(true);

        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError) {
          console.error("Auth error:", userError.message);
          setRole(null);
          setAdminUniversity(null);
          return;
        }

        if (!user) {
          setRole(null);
          setAdminUniversity(null);
          return;
        }

        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("role, university")
          .eq("user_id", user.id)
          .single();

        if (profileError) {
          console.error("Error fetching profile role:", profileError.message);

          setRole(null);
          setAdminUniversity(null);

          return;
        }

        setRole(profile?.role);
        setAdminUniversity(profile?.university);
      } catch (error) {
        console.error("Unexpected error:", error);

        setRole(null);
        setAdminUniversity(null);
      } finally {
        setLoading(false);
      }
    };

    fetchUserRoleAndUni();
  }, []);

  /* =========================================
     HANDLE PROFESSOR FORM SAVE
  ========================================= */

  const handleSave = async (updatedSections) => {
    if (!selectedForm) {
      return;
    }

    try {
      const { error } = await supabase
        .from("prof_forms")
        .update({
          content: updatedSections,
        })
        .eq("id", selectedForm.id);

      if (error) {
        alert("Failed to save: " + error.message);
        return;
      }

      setSelectedForm(null);
      setOpenModal(null);
    } catch (err) {
      console.error(err);
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
     SIDEBAR:
     NEW SYLLABUS TEMPLATE
  ========================================= */

  const handleNewSyllabus = () => {
    setActivePage("syllabuses");

    if (adminDisplayRef.current?.createMainSyllabus) {
      adminDisplayRef.current.createMainSyllabus();
    }
  };

  /* =========================================
     SIDEBAR:
     CREATE FROM TEMPLATE
  ========================================= */

  const handleCreateFromTemplate = () => {
    setActivePage("syllabuses");

    if (adminDisplayRef.current?.createSubjectSyllabus) {
      adminDisplayRef.current.createSubjectSyllabus();
    }
  };

  /* =========================================
     SIDEBAR:
     PROFESSOR SUBMISSIONS
  ========================================= */

  const handleProfessorSubmissions = () => {
    setActivePage("submissions");
    setOpenModal("admin");
  };

  /* =========================================
     SIDEBAR:
     REGISTER PROFESSOR
  ========================================= */

  const handleRegisterProfessor = () => {
    setActivePage("register");
    setShowRegisterProfModal(true);
  };

  /* =========================================
     SIDEBAR:
     SETTINGS
  ========================================= */

  const handleSettings = () => {
    setActivePage("settings");
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

      // Force the application to reload
      // so the login page/auth state is refreshed.
      window.location.href = "/login";
    } catch (error) {
      console.error("Unexpected logout error:", error);
    }
  };

  /* =========================================
     APPLICATION
  ========================================= */

  return (
    <div className="application-layout">
      {/* =====================================
          SIDEBAR
          Render it immediately for admins.
      ===================================== */}

      {role?.admin && (
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
      )}

      {/* =====================================
          MAIN CONTENT
      ===================================== */}

      <main
        className={
          role?.admin ? "application-content" : "application-content-full"
        }
      >
        {/* ===================================
            LOADING
        =================================== */}

        {loading && <Spinner />}

        {/* ===================================
            ADMIN
        =================================== */}

        {!loading && role?.admin && (
          <>
            {/* ================================
                ADMIN SYLLABUS DISPLAY
            ================================= */}

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
                PROFESSOR SUBMISSION EDIT
            ================================= */}

            <ProfessorFillModal
              isOpen={openModal === "edit"}
              onClose={handleClose}
              syllabus={selectedForm}
              onSave={handleSave}
              isAdmin={role?.admin}
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
          </>
        )}

        {/* ===================================
            PROFESSOR
        =================================== */}

        {!loading && role?.prof && <ProfDisplay />}

        {/* ===================================
            NO ROLE
        =================================== */}

        {!loading && !role && (
          <div className="no-role-message">
            <p>Loading user role or no role assigned.</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default LandingBot;
