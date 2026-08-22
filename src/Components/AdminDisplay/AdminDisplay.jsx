import React, { useEffect, useState } from "react";
import { supabase } from "../../utility/supabaseClient";
import "./style.css";
import SyllabusBuilderModal from "../TableBuilder/TableBuilder";
import alteLogo from "../../assets/alte/altelogo.png";
import Spinner from "../Spinner/Spinner";

const AdminDisplay = () => {
  const [syllabuses, setSyllabuses] = useState([]);

  const [selectedSyllabus, setSelectedSyllabus] = useState(null);

  const [modalOpen, setModalOpen] = useState(false);

  const [createMenuOpen, setCreateMenuOpen] = useState(false);

  const [instanceMenuOpen, setInstanceMenuOpen] = useState(false);

  const [selectedMainSyllabus, setSelectedMainSyllabus] = useState(null);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSyllabuses();
  }, []);

  const fetchSyllabuses = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from("syllabus_forms")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching syllabuses:", error.message);
    } else {
      setSyllabuses(data || []);
    }

    setLoading(false);
  };

  const mainSyllabuses = syllabuses.filter(
    (syllabus) => syllabus.syllabus_type === "main",
  );

  const instanceSyllabuses = syllabuses.filter(
    (syllabus) => syllabus.syllabus_type === "instance",
  );

  const getParentSyllabus = (parentId) => {
    return mainSyllabuses.find(
      (syllabus) => String(syllabus.id) === String(parentId),
    );
  };

  const handleEdit = (syllabus) => {
    setSelectedSyllabus(syllabus);

    if (syllabus.syllabus_type === "instance") {
      const parent = getParentSyllabus(syllabus.parent_id);
      setSelectedMainSyllabus(parent || null);
    } else {
      setSelectedMainSyllabus(null);
    }

    setModalOpen(true);
  };

  const handleCreateMain = () => {
    setSelectedSyllabus(null);
    setSelectedMainSyllabus(null);
    setCreateMenuOpen(false);
    setInstanceMenuOpen(false);
    setModalOpen(true);
  };

  const handleCreateInstance = (mainSyllabus) => {
    setSelectedSyllabus(null);
    setSelectedMainSyllabus(mainSyllabus);
    setCreateMenuOpen(false);
    setInstanceMenuOpen(false);
    setModalOpen(true);
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setSelectedSyllabus(null);
    setSelectedMainSyllabus(null);
  };

  const handleModalSave = (updatedData) => {
    if (!updatedData) return;

    setSyllabuses((prev) => {
      const existing = prev.find((s) => s.id === updatedData.id);

      if (existing) {
        return prev.map((s) => (s.id === updatedData.id ? updatedData : s));
      }

      return [...prev, updatedData];
    });

    setModalOpen(false);
    setSelectedSyllabus(null);
    setSelectedMainSyllabus(null);
  };

  const handleDelete = async (item) => {
    const isMain = item.syllabus_type === "main";

    let message = "Are you sure you want to delete this syllabus?";

    if (isMain) {
      const children = instanceSyllabuses.filter(
        (instance) => String(instance.parent_id) === String(item.id),
      );

      if (children.length > 0) {
        message =
          `This main syllabus has ${children.length} subject syllabus(es) ` +
          `linked to it.\n\nAre you sure you want to delete it?`;
      }
    }

    const confirmDelete = window.confirm(message);

    if (!confirmDelete) return;

    const { error } = await supabase
      .from("syllabus_forms")
      .delete()
      .eq("id", item.id);

    if (error) {
      console.error("Error deleting syllabus:", error.message);
      alert("Failed to delete syllabus.");
      return;
    }

    setSyllabuses((prev) => prev.filter((syllabus) => syllabus.id !== item.id));
  };

  if (loading) {
    return (
      <div className="admin-display">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="admin-display">
      {/* ========================= */}
      {/* CREATE BUTTONS */}
      {/* ========================= */}

      <div
        style={{
          display: "flex",
          gap: "10px",
          marginBottom: "30px",
          flexWrap: "wrap",
        }}
      >
        <button className="blue-button" onClick={handleCreateMain}>
          + Create Main Syllabus
        </button>

        <button
          className="blue-button"
          onClick={() => setInstanceMenuOpen(true)}
          disabled={mainSyllabuses.length === 0}
        >
          + Create Subject Syllabus
        </button>
      </div>

      {/* ========================= */}
      {/* MAIN SYLLABUSES */}
      {/* ========================= */}

      <section>
        <h2>Main Syllabuses</h2>

        {mainSyllabuses.length === 0 ? (
          <p>No main syllabuses created yet.</p>
        ) : (
          <div className="card-wrapper">
            {mainSyllabuses.map((item) => (
              <div
                key={item.id}
                className="syllabus-card"
                onClick={() => handleEdit(item)}
              >
                <img src={alteLogo} alt="" className="form-image" />

                <div className="card-bot-wrapper">
                  <h3 className="ft1">{item.title}</h3>

                  <p
                    style={{
                      fontSize: "0.85rem",
                      opacity: 0.7,
                    }}
                  >
                    Main Syllabus
                  </p>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(item);
                    }}
                    className="pdf-btn dlt-btn"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ========================= */}
      {/* SUBJECT SYLLABUSES */}
      {/* ========================= */}

      <section style={{ marginTop: "40px" }}>
        <h2>Subject Syllabuses</h2>

        {instanceSyllabuses.length === 0 ? (
          <p>No subject syllabuses created yet.</p>
        ) : (
          <div className="card-wrapper">
            {instanceSyllabuses.map((item) => {
              const parent = getParentSyllabus(item.parent_id);

              return (
                <div
                  key={item.id}
                  className="syllabus-card"
                  onClick={() => handleEdit(item)}
                >
                  <img src={alteLogo} alt="" className="form-image" />

                  <div className="card-bot-wrapper">
                    <h3 className="ft1">{item.title}</h3>

                    <p
                      style={{
                        fontSize: "0.85rem",
                        opacity: 0.7,
                        marginBottom: "10px",
                      }}
                    >
                      Based on:{" "}
                      <strong>
                        {parent?.title || "Unknown Main Syllabus"}
                      </strong>
                    </p>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(item);
                      }}
                      className="pdf-btn dlt-btn"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ========================= */}
      {/* CHOOSE MAIN SYLLABUS */}
      {/* ========================= */}

      {instanceMenuOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1000,
          }}
          onClick={() => setInstanceMenuOpen(false)}
        >
          <div
            style={{
              background: "white",
              padding: "25px",
              borderRadius: "10px",
              width: "400px",
              maxWidth: "90%",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2>Create Subject Syllabus</h2>

            <p>Choose the main syllabus this subject should be based on:</p>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "10px",
                marginTop: "20px",
              }}
            >
              {mainSyllabuses.map((main) => (
                <button
                  key={main.id}
                  className="blue-button"
                  onClick={() => handleCreateInstance(main)}
                >
                  {main.title}
                </button>
              ))}
            </div>

            <button
              style={{
                marginTop: "20px",
                width: "100%",
              }}
              onClick={() => setInstanceMenuOpen(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* ========================= */}
      {/* BUILDER */}
      {/* ========================= */}

      {modalOpen && (
        <SyllabusBuilderModal
          isOpen={modalOpen}
          onClose={handleModalClose}
          onSave={handleModalSave}
          initialData={selectedSyllabus}
          parentSyllabus={selectedMainSyllabus}
          syllabusType={
            selectedSyllabus?.syllabus_type ||
            (selectedMainSyllabus ? "instance" : "main")
          }
          parentId={
            selectedSyllabus?.parent_id || selectedMainSyllabus?.id || null
          }
        />
      )}
    </div>
  );
};

export default AdminDisplay;
