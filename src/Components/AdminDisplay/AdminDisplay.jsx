import React, { useEffect, useState } from "react";
import { supabase } from "../../utility/supabaseClient";
import "./style.css";
import SyllabusBuilderModal from "../TableBuilder/TableBuilder";

const AdminDisplay = () => {
  const [syllabuses, setSyllabuses] = useState([]);
  const [selectedSyllabus, setSelectedSyllabus] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

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

  const handleModalSave = (updatedData) => {
    if (!updatedData) return;

    const { id, title, content } = updatedData;

    setSyllabuses((prev) => {
      const existing = prev.find((s) => s.id === id);
      if (existing) {
        return prev.map((s) => (s.id === id ? updatedData : s));
      } else {
        return [...prev, updatedData];
      }
    });

    setIsModalOpen(false);
    setSelectedSyllabus(null);
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
