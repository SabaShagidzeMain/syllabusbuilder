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
      <div className="card-wrapper">
        {syllabuses.length === 0 ? (
          <p>No syllabuses found.</p>
        ) : (
          syllabuses.map((item) => (
            <div
              key={item.id}
              className="syllabus-card"
              onClick={() => handleEdit(item)}
            >
              <img
                src="src/assets/alte/altelogo.jpg"
                alt=""
                className="form-image"
              />
              <div className="card-bot-wrapper">
                <h3 className="ft1">{item.title}</h3>
                <button
                  onClick={async (e) => {
                    e.stopPropagation();

                    const confirmDelete = confirm(
                      "Are you sure you want to delete this form?"
                    );
                    if (!confirmDelete) return;

                    const { error } = await supabase
                      .from("syllabus_forms")
                      .delete()
                      .eq("id", item.id);

                    if (error) {
                      console.error("Error deleting form:", error.message);
                      alert("Failed to delete form.");
                    } else {
                      setSyllabuses((prev) =>
                        prev.filter((f) => f.id !== item.id)
                      );
                    }
                  }}
                  className="pdf-btn dlt-btn"
                >
                  Delete
                </button>
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
