import React, { useState } from "react";

import ProfessorFillModal from "../professorFillModal/ProfessorFillModal";

import { useProfData } from "../../hooks/useProfData";
import { useHandleSave } from "../../hooks/useHandleSave";

import { supabase } from "../../utility/supabaseClient";

import Spinner from "../Spinner/Spinner";

import alteLogo from "../../assets/alte/altelogo.jpg";

import "./style.css";

export default function ProfDisplay() {
  const { userId, university, syllabuses, profForms, setProfForms, loading } =
    useProfData();

  const [selectedSyllabus, setSelectedSyllabus] = useState(null);

  const [isModalOpen, setIsModalOpen] = useState(false);

  const [mode, setMode] = useState("view");

  const handleSave = useHandleSave(
    mode,
    selectedSyllabus,
    userId,
    university,
    setProfForms,
    () => {
      setIsModalOpen(false);
      setSelectedSyllabus(null);
      setMode("view");
    },
  );

  // =========================================
  // ACTUAL DATA LOADING
  // =========================================

  if (loading) {
    return <Spinner />;
  }

  // =========================================
  // OPEN CREATE MODAL
  // =========================================

  const handleCreateNew = () => {
    setIsModalOpen(true);
    setMode("create");
    setSelectedSyllabus(null);
  };

  // =========================================
  // CLOSE MODAL
  // =========================================

  const handleClose = () => {
    setIsModalOpen(false);
    setSelectedSyllabus(null);
    setMode("view");
  };

  // =========================================
  // UI
  // =========================================

  return (
    <div className="prof-display">
      {/* =====================================
          CREATE BUTTON
      ===================================== */}

      <button className="openbtn" onClick={handleCreateNew}>
        Create New
      </button>

      {/* =====================================
          SELECT SYLLABUS
      ===================================== */}

      {isModalOpen && mode === "create" && !selectedSyllabus && (
        <div className="modal-backdrop" onClick={handleClose}>
          <div className="dropdown-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Select a Syllabus Template</h3>

            {syllabuses.length === 0 ? (
              <div className="empty-state">
                <p>No syllabus templates are available yet.</p>

                <button className="openbtn" onClick={handleClose}>
                  Close
                </button>
              </div>
            ) : (
              <select
                onChange={(e) => {
                  const syllabus = syllabuses.find(
                    (s) => String(s.id) === e.target.value,
                  );

                  setSelectedSyllabus(syllabus || null);
                }}
                defaultValue=""
              >
                <option value="" disabled>
                  -- Choose Syllabus --
                </option>

                {syllabuses.map((syllabus) => (
                  <option key={syllabus.id} value={syllabus.id}>
                    {syllabus.title}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>
      )}

      {/* =====================================
          PROFESSOR FORMS
      ===================================== */}

      <div className="card-wrapper">
        {profForms.length === 0 ? (
          <div className="empty-state">
            <h3>No syllabuses created yet</h3>

            <p>Create your first syllabus using the button above.</p>
          </div>
        ) : (
          profForms.map((form) => (
            <div
              key={form.id}
              className="syllabus-card"
              onClick={() => {
                setSelectedSyllabus(form);
                setIsModalOpen(true);
                setMode("view");
              }}
            >
              <img src={alteLogo} className="form-image" alt="form logo" />

              <div className="card-bot-wrapper">
                <h4>{form.title || "Untitled Form"}</h4>

                <div className="card-btn-wrapper">
                  <button
                    className="pdf-btn"
                    onClick={(e) => {
                      e.stopPropagation();

                      window.open(`/export-preview/${form.id}`, "_blank");
                    }}
                  >
                    Export
                  </button>

                  <button
                    className="pdf-btn"
                    onClick={async (e) => {
                      e.stopPropagation();

                      const confirmed = window.confirm(
                        "Are you sure you want to delete this form?",
                      );

                      if (!confirmed) {
                        return;
                      }

                      const { error } = await supabase
                        .from("prof_forms")
                        .delete()
                        .eq("id", form.id);

                      if (error) {
                        console.error("Delete error:", error.message);

                        alert("Failed to delete form.");

                        return;
                      }

                      setProfForms((prev) =>
                        prev.filter((f) => f.id !== form.id),
                      );
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* =====================================
          PROFESSOR FILL MODAL
      ===================================== */}

      {isModalOpen && selectedSyllabus && (
        <ProfessorFillModal
          isOpen={isModalOpen}
          onClose={handleClose}
          syllabus={selectedSyllabus}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
