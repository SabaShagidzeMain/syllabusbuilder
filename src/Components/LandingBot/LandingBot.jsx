import React, { useState, useEffect } from "react";
import { supabase } from "../../utility/supabaseClient";
import SyllabusBuilderModal from "../TableBuilder/TableBuilder";
import AdminDisplay from "../AdminDisplay/AdminDisplay";
import ProfDisplay from "../ProfDisplay/ProfDisplay";
import AdminSyllabusModal from "../AdminSyllabusModal/AdminSyllabusModal";
import ProfessorFillModal from "../professorFillModal/ProfessorFillModal";
import Spinner from "../Spinner/Spinner";
import "./style.css";

const LandingBot = () => {
  const [showBuilder, setShowBuilder] = useState(false);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedForm, setSelectedForm] = useState(null);
  const [showAdminModal, setShowAdminModal] = useState(false);

  useEffect(() => {
    const fetchUserRole = async () => {
      setLoading(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setRole(null);
      } else {
        const { data: profile, error } = await supabase
          .from("profiles")
          .select("role")
          .eq("user_id", user.id)
          .single();

        if (error) {
          console.error("Error fetching profile role:", error.message);
          setRole(null);
        } else {
          setRole(profile?.role);
        }
      }

      setTimeout(() => setLoading(false), 300);
    };

    fetchUserRole();
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

      setSelectedForm(null);
    } catch (err) {
      alert("Unexpected error");
    }
  };


  const handleClose = () => {
    setShowBuilder(false);
    setSelectedForm(null);
  };

  const handleEditForm = (form) => {
    setSelectedForm(form);
    setShowBuilder(true);       // Open the TableBuilder
    setShowAdminModal(false);   // Close the admin modal
  };


  if (loading) return <Spinner />;

  return (
    <div className="botwrapper">
      <div className="adminView">
        {role?.admin && (
          <>
            <div className="button-wrapper-two">
              <button className="openbtn" onClick={() => setShowBuilder(true)}>
                Create New
              </button>
              <button
                className="openbtn view-btn"
                onClick={() => setShowAdminModal(true)}
              >
                Professor Syllabuses
              </button>
            </div>

            <SyllabusBuilderModal
              isOpen={showBuilder && !selectedForm}
              onClose={handleClose}
              onSave={handleSave}
              existingForm={selectedForm}
            />

            <ProfessorFillModal
              isOpen={!!selectedForm}
              onClose={handleClose}
              syllabus={selectedForm}
              onSave={handleSave}
              isAdmin={role?.admin}
            />

            <AdminSyllabusModal
              isOpen={showAdminModal}
              onClose={() => setShowAdminModal(false)}
              onEdit={handleEditForm}
            />

            <AdminDisplay setLoading={setLoading} />
          </>
        )}

        {role?.prof && <ProfDisplay />}

        {!role && <p>Loading user role or no role assigned.</p>}
      </div>
    </div>
  );
};

export default LandingBot;
