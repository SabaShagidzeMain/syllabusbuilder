import React, { useEffect, useState } from "react";
import { supabase } from "../../utility/supabaseClient";
import ProfessorFillModal from "../professorFillModal/professorFillModal";
import "./style.css";

const ProfDisplay = () => {
  const [userId, setUserId] = useState(null);
  const [university, setUniversity] = useState("");
  const [syllabuses, setSyllabuses] = useState([]);
  const [profForms, setProfForms] = useState([]);
  const [selectedSyllabus, setSelectedSyllabus] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [mode, setMode] = useState("view"); // "create" or "view"

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

      if (profileError)
        return console.error("Profile error:", profileError.message);
      setUniversity(profile.university);

      const { data: syllabusData, error: syllabusError } = await supabase
        .from("syllabus_forms")
        .select("*")
        .eq("university", profile.university);

      if (syllabusError)
        return console.error("Syllabus fetch error:", syllabusError.message);
      setSyllabuses(syllabusData);

      const { data: profData, error: profError } = await supabase
        .from("prof_forms")
        .select("*")
        .eq("user_id", user.id);

      if (profError)
        return console.error("Prof forms fetch error:", profError.message);
      setProfForms(profData || []);
    };

    fetchData();
  }, []);

  const handleSave = async (editedContent) => {
    if (!selectedSyllabus || !userId) return;

    if (mode === "create") {
      const { data, error } = await supabase.from("prof_forms").insert([
        {
          title: selectedSyllabus.title,
          content: editedContent,
          origin_id: selectedSyllabus.id,
          user_id: userId,
        },
      ]);

      if (error) return console.error("Insert error:", error.message);
      setProfForms((prev) => [
        ...prev,
        ...(Array.isArray(data) ? data : [data]),
      ]);
    } else {
      const { error } = await supabase
        .from("prof_forms")
        .update({ content: editedContent })
        .eq("id", selectedSyllabus.id);

      if (error) return console.error("Update error:", error.message);

      setProfForms((prev) =>
        prev.map((f) =>
          f.id === selectedSyllabus.id ? { ...f, content: editedContent } : f
        )
      );
    }

    setIsModalOpen(false);
    setSelectedSyllabus(null);
    setMode("view");
  };

  return (
    <div>
      <h2>Professor View</h2>

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
        <div className="dropdown-modal">
          <h3>Select a Syllabus Template</h3>
          <select
            onChange={(e) => {
              const selected = syllabuses.find((s) => s.id === e.target.value);
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
      )}

      {/* Render already created forms */}
      <h3>Your Submitted Forms</h3>
      <div className="syllabus-grid">
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
            <img
              src="src/assets/alte/altelogo.jpg"
              className="form-image"
              alt="form logo"
            />
            <h4>{form.title}</h4>
          </div>
        ))}
      </div>

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
