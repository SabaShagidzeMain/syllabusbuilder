import React, { useEffect, useState } from "react";
import { supabase } from "../../utility/supabaseClient";
import "./style.css";
import SyllabusBuilderModal from "../TableBuilder/TableBuilder";

const AdminDisplay = () => {
  const [syllabuses, setSyllabuses] = useState([]);
  const [selectedSyllabus, setSelectedSyllabus] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    const fetchSyllabuses = async () => {
      const { data, error } = await supabase.from("syllabus_forms").select("*");
      if (error) {
        console.error("Error fetching syllabuses:", error.message);
      } else {
        setSyllabuses(data);
      }
    };

    fetchSyllabuses();
  }, []);

  const handleEdit = (syllabus) => {
    setSelectedSyllabus(syllabus);
    setModalOpen(true);
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setSelectedSyllabus(null);
  };

  const handleModalSave = async (updatedData) => {
    const { id, title, content } = updatedData;

    const { error } = await supabase
      .from("syllabus_forms")
      .update({ title, content })
      .eq("id", id);

    if (error) console.error("Error updating syllabus:", error.message);
    else {
      // Refetch or update state
      setSyllabuses((prev) =>
        prev.map((s) => (s.id === id ? { ...s, title, content } : s))
      );
    }

    handleModalClose();
  };

  return (
    <div className="admin-display">
      <h2>Saved Syllabuses</h2>
      <div className="syllabus-grid">
        {syllabuses.length === 0 ? (
          <p>No syllabuses found.</p>
        ) : (
          syllabuses.map((item) => (
            <div
              key={item.id}
              className="syllabus-card"
              onClick={() => handleEdit(item)}
            >
              <h3>{item.title}</h3>
              <p>{item.content?.length} section(s)</p>
              <div className="preview-table">
                {item.content?.[0]?.cells?.slice(0, 2).map((row, rIdx) => (
                  <div key={rIdx} className="preview-row">
                    {row.map((cell, cIdx) => (
                      <span key={cIdx} className="preview-cell">
                        {cell.value || "-"}
                      </span>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {modalOpen && selectedSyllabus && (
        <SyllabusBuilderModal
          isOpen={modalOpen}
          onClose={handleModalClose}
          onSave={handleModalSave}
          initialData={selectedSyllabus}
        />
      )}
    </div>
  );
};

export default AdminDisplay;
