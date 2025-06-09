import React, { useState } from "react";
import ProfessorFillModal from "../professorFillModal/ProfessorFillModal";
import { useProfData } from "../../hooks/useProfData";
import { useHandleSave } from "../../hooks/useHandleSave";
import { downloadSyllabusAsPDF } from "../../utility/downloadPdf";
import "./style.css";

export default function ProfDisplay() {
  const { userId, university, syllabuses, profForms, setProfForms } = useProfData();

  const [selectedSyllabus, setSelectedSyllabus] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [mode, setMode] = useState("view");

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedSyllabus(null);
    setMode("view");
  };

  const handleSave = useHandleSave(
    mode,
    selectedSyllabus,
    userId,
    university,
    setProfForms,
    closeModal
  );

  return (
    <div>
      <button
        className="openbtn"
        onClick={() => {
          setIsModalOpen(true);
          setMode("create");
          setSelectedSyllabus(null);
        }}
      >
        Create New
      </button>

      {isModalOpen && mode === "create" && !selectedSyllabus && (
        <div className="modal-backdrop" onClick={closeModal}>
          <div className="dropdown-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Select a Syllabus Template</h3>
            <select
              onChange={(e) =>
                setSelectedSyllabus(syllabuses.find((s) => String(s.id) === e.target.value))
              }
              defaultValue=""
            >
              <option value="" disabled>
                -- Choose Syllabus --
              </option>
              {syllabuses.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.title}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      <div className="card-wrapper">
        {profForms.map((form) => (
          <div
            key={form.id}
            className="syllabus-card"
            onClick={() => {
              setSelectedSyllabus(form);
              setIsModalOpen(true);
              setMode("view");
            }}
          >
            <img src="src/assets/alte/altelogo.jpg" className="form-image" alt="form logo" />
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
                    if (confirm("Are you sure you want to delete this form?")) {
                      const { error } = await supabase
                        .from("prof_forms")
                        .delete()
                        .eq("id", form.id);

                      if (error) {
                        console.error("Delete error:", error.message);
                        alert("Failed to delete form.");
                      } else {
                        setProfForms((prev) => prev.filter((f) => f.id !== form.id));
                      }
                    }
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && selectedSyllabus && (
        <ProfessorFillModal
          isOpen={isModalOpen}
          onClose={closeModal}
          syllabus={selectedSyllabus}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
