import React, { useEffect, useState } from "react";
import { supabase } from "../../utility/supabaseClient";
import ProfessorFillModal from "../professorFillModal/professorFillModal";
import "./style.css";

const profDisplay = () => {
  const [syllabuses, setSyllabuses] = useState([]);
  const [selectedSyllabus, setSelectedSyllabus] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const fetchForms = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        console.error("❌ No user found.");
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("university")
        .eq("user_id", user.id)
        .single();

      if (profileError) {
        console.error("❌ Error fetching profile:", profileError.message);
        return;
      }

      const { university } = profile;

      const { data: forms, error: formsError } = await supabase
        .from("syllabus_forms")
        .select("*")
        .eq("university", university);

      if (formsError) {
        console.error("❌ Error fetching forms:", formsError.message);
      } else {
        setSyllabuses(forms);
      }
    };

    fetchForms();
  }, []);

  return (
    <div>
      <h2>Available Syllabuses</h2>
      <div className="syllabus-grid">
        {syllabuses.map((s) => (
          <div
            key={s.id}
            className="syllabus-card"
            onClick={() => {
              setSelectedSyllabus(s);
              setIsModalOpen(true);
            }}
          >
            <h3>{s.title}</h3>
            <p>{s.content?.length || 0} sections</p>
          </div>
        ))}
      </div>

      {isModalOpen && selectedSyllabus && (
        <ProfessorFillModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedSyllabus(null);
          }}
          syllabus={selectedSyllabus}
        />
      )}
    </div>
  );
};

export default profDisplay;
