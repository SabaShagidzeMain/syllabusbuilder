import React, { useState, useEffect } from "react";
import { supabase } from "../../utility/supabaseClient";
import SyllabusBuilderModal from "../TableBuilder/TableBuilder";
import AdminDisplay from "../AdminDisplay/AdminDisplay";
import ProfDisplay from "../ProfDisplay/ProfDisplay";
import AdminSyllabusModal from "../AdminSyllabusModal/AdminSyllabusModal";
import ProfessorFillModal from "../professorFillModal/ProfessorFillModal";
import Spinner from "../Spinner/Spinner";
import "./style.css";
import RegisterProfModal from "../RegisterProfModal/RegisterProfModal";

const LandingBot = () => {
  const [openModal, setOpenModal] = useState(null); // null | 'create' | 'edit' | 'admin'
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedForm, setSelectedForm] = useState(null);
  const [showRegisterProfModal, setShowRegisterProfModal] = useState(false);
  const [adminUniversity, setAdminUniversity] = useState(null);


  useEffect(() => {
    const fetchUserRoleAndUni = async () => {
      setLoading(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setRole(null);
        setAdminUniversity(null);
      } else {
        const { data: profile, error } = await supabase
          .from("profiles")
          .select("role, university")
          .eq("user_id", user.id)
          .single();

        if (error) {
          console.error("Error fetching profile role:", error.message);
          setRole(null);
          setAdminUniversity(null);
        } else {
          setRole(profile?.role);
          setAdminUniversity(profile?.university);
        }
      }

      setTimeout(() => setLoading(false), 300);
    };

    fetchUserRoleAndUni();
  }, []);

  const handleSave = async (updatedSections) => {
    if (!selectedForm) return;

    try {
      const { error } = await supabase
        .from("prof_forms")
        .update({ content: updatedSections })
        .eq("id", selectedForm.id);

      if (error) {
        alert("Failed to save: " + error.message);
        return;
      }

      // Close modal and reset selectedForm on successful save
      setSelectedForm(null);
      setOpenModal(null);
    } catch (err) {
      alert("Unexpected error");
    }
  };

  const handleClose = () => {
    setOpenModal(null);
    setSelectedForm(null);
  };

  const handleEditForm = (form) => {
    setSelectedForm(form);
    setOpenModal("edit");
  };

  const openCreateModal = () => {
    setSelectedForm(null);
    setOpenModal("create");
  };

  const openAdminModal = () => {
    setOpenModal("admin");
  };

  if (loading) return <Spinner />;

  return (
    <div className="botwrapper">
      <div className="adminView">
        {role?.admin && (
          <>
            <div className="button-wrapper-two">
              <button className="openbtn" onClick={openCreateModal}>
                Create New
              </button>
              <button className="openbtn view-btn" onClick={openAdminModal}>
                Professor Syllabuses
              </button>
              <button
                className="openbtn register-btn"
                onClick={() => setShowRegisterProfModal(true)}
              >
                Register Professor
              </button>
            </div>

            <SyllabusBuilderModal
              isOpen={openModal === "create"}
              onClose={handleClose}
              onSave={handleSave}
              existingForm={selectedForm}
            />

            <ProfessorFillModal
              isOpen={openModal === "edit"}
              onClose={handleClose}
              syllabus={selectedForm}
              onSave={handleSave}
              isAdmin={role?.admin}
            />

            <AdminSyllabusModal
              isOpen={openModal === "admin"}
              onClose={handleClose}
              onEdit={handleEditForm}
            />

            <AdminDisplay setLoading={setLoading} />

            <RegisterProfModal
              isOpen={showRegisterProfModal}
              onClose={() => setShowRegisterProfModal(false)}
              adminUniversity={adminUniversity}
            />

          </>
        )}

        {role?.prof && <ProfDisplay />}

        {!role && <p>Loading user role or no role assigned.</p>}
      </div>
    </div>
  );
};

export default LandingBot;
