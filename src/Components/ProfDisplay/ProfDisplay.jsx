import React, { useEffect, useState } from "react";
import { supabase } from "../../utility/supabaseClient";
import ProfessorFillModal from "../professorFillModal/professorFillModal";
import "./style.css";
import jsPDF from "jspdf";

const ProfDisplay = () => {
  const [userId, setUserId] = useState(null);
  const [university, setUniversity] = useState("");
  const [syllabuses, setSyllabuses] = useState([]);
  const [profForms, setProfForms] = useState([]);
  const [selectedSyllabus, setSelectedSyllabus] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [mode, setMode] = useState("view");

  // Pdf download function
  const downloadSyllabusAsPDF = (form) => {
    if (!form.content || !Array.isArray(form.content)) return;

    const doc = new jsPDF();
    let y = 10;

    doc.setFontSize(16);
    doc.text(form.title || "Syllabus", 10, y);
    y += 10;

    form.content.forEach((section, idx) => {
      const title = section.title || `Section ${idx + 1}`;
      doc.setFontSize(14);
      doc.text(`${title}:`, 10, y);
      y += 8;

      (section.cells || []).forEach((cell) => {
        doc.setFontSize(12);
        const label = cell.label || "Label";
        const value = cell.value || "—";
        doc.text(`- ${label}: ${value}`, 12, y);
        y += 7;

        if (y > 280) {
          doc.addPage();
          y = 10;
        }
      });

      y += 5;
    });

    doc.save(`${form.title || "syllabus"}.pdf`);
  };

  // Helper function to fetch prof forms fresh from DB
  const fetchProfForms = async (userId) => {
    if (!userId) return [];
    const { data, error } = await supabase
      .from("prof_forms")
      .select("*")
      .eq("user_id", userId);
    if (error) {
      console.error("Error fetching prof forms:", error.message);
      return [];
    }
    return data || [];
  };

  useEffect(() => {
    const fetchData = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return console.error("No user found");

      setUserId(user.id);

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("university")
        .eq("user_id", user.id)
        .single();

      if (profileError) {
        console.error("Profile error:", profileError.message);
        return;
      }
      setUniversity(profile.university);

      const { data: syllabusData, error: syllabusError } = await supabase
        .from("syllabus_forms")
        .select("*")
        .eq("university", profile.university);

      if (syllabusError) {
        console.error("Syllabus fetch error:", syllabusError.message);
        return;
      }
      setSyllabuses(syllabusData);

      const profData = await fetchProfForms(user.id);
      setProfForms(profData);
    };

    fetchData();
  }, []);

  const handleSave = async (editedContent) => {
    console.log("handleSave called");
    console.log("selectedSyllabus:", selectedSyllabus);
    console.log("userId:", userId);

    if (!selectedSyllabus) {
      console.error("Error: selectedSyllabus is null!");
      return;
    }
    if (!userId) {
      console.error("Error: userId is null!");
      return;
    }

    const formPayload = {
      title: selectedSyllabus.title,
      content: editedContent,
      origin_id: selectedSyllabus.origin_id || selectedSyllabus.id,
      user_id: userId,
      university,
    };

    console.log("formPayload:", formPayload);

    try {
      if (mode === "create") {
        const { data, error } = await supabase
          .from("prof_forms")
          .insert([formPayload]);
        if (error) {
          console.error("Insert error:", error.message);
          return;
        }
      } else {
        const { error } = await supabase
          .from("prof_forms")
          .update(formPayload)
          .eq("id", selectedSyllabus.id);
        if (error) {
          console.error("Update error:", error.message);
          return;
        }
      }

      // Refetch the profForms list to keep state fresh
      const updatedForms = await fetchProfForms(userId);
      setProfForms(updatedForms);

      setIsModalOpen(false);
      setSelectedSyllabus(null);
      setMode("view");
    } catch (e) {
      console.error("Exception in handleSave:", e);
    }
  };

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

      {/* Dropdown for new form */}
      {isModalOpen && mode === "create" && !selectedSyllabus && (
        <div className="modal-backdrop">
          <div className="dropdown-modal">
            <h3>Select a Syllabus Template</h3>
            <select
              onChange={(e) => {
                const selected = syllabuses.find(
                  (s) => String(s.id) === e.target.value
                );
                setSelectedSyllabus(selected);
              }}
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

      {/* Render already created forms */}
      <div className="card-wrapper">
        {profForms.map((form) => (
          <div
            key={form.id}
            className="syllabus-card"
            onClick={() => {
              console.log("Selected form clicked:", form);
              setSelectedSyllabus(form);
              setIsModalOpen(true);
              setMode("view");
            }}
          >
            <img
              src="src/assets/alte/altelogo.jpg"
              className="form-image"
              alt="form logo"
            />
            <div className="card-bot-wrapper">
              <h4>{form.title || "Untitled Form"}</h4>
              <div className="card-btn-wrapper">
                <button
                  className="pdf-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!form?.id) {
                      alert("No syllabus selected");
                      return;
                    }
                    window.open(`/export-preview/${form.id}`, "_blank");
                  }}
                >
                  Export
                </button>
                <button
                  onClick={async (e) => {
                    e.stopPropagation();

                    const confirmDelete = confirm(
                      "Are you sure you want to delete this form?"
                    );
                    if (!confirmDelete) return;

                    const { error } = await supabase
                      .from("prof_forms") // replace with your actual table name
                      .delete()
                      .eq("id", form.id);

                    if (error) {
                      console.error("Error deleting form:", error.message);
                      alert("Failed to delete form.");
                    } else {
                      setProfForms((prev) =>
                        prev.filter((f) => f.id !== form.id)
                      );
                    }
                  }}
                  className="pdf-btn"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal for viewing/editing form */}
      {isModalOpen && selectedSyllabus && (
        <ProfessorFillModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedSyllabus(null);
            setMode("view");
          }}
          syllabus={selectedSyllabus}
          onSave={handleSave}
        />
      )}
    </div>
  );
};

export default ProfDisplay;
