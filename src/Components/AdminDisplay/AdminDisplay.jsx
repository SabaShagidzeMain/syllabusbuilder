import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useState,
} from "react";

import { supabase } from "../../utility/supabaseClient";
import "./style.css";

import SyllabusBuilderModal from "../TableBuilder/TableBuilder";
import alteLogo from "../../assets/alte/altelogo2.png";
import Spinner from "../Spinner/Spinner";

const AdminDisplay = forwardRef((props, ref) => {
  const [syllabuses, setSyllabuses] = useState([]);
  const [professorSyllabuses, setProfessorSyllabuses] = useState([]);

  const [selectedSyllabus, setSelectedSyllabus] = useState(null);
  const [selectedMainSyllabus, setSelectedMainSyllabus] = useState(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [instanceMenuOpen, setInstanceMenuOpen] = useState(false);

  const [loading, setLoading] = useState(true);

  /* ==========================================
     FETCH SYLLABUSES
  ========================================== */

  useEffect(() => {
    fetchSyllabuses();
  }, []);

  const fetchSyllabuses = async () => {
    setLoading(true);

    try {
      /* =========================================
         GET CURRENT USER
      ========================================= */

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        console.error("Auth error:", userError?.message);
        return;
      }

      /* =========================================
         GET ADMIN PROFILE
      ========================================= */

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("university")
        .eq("user_id", user.id)
        .single();

      if (profileError) {
        console.error("Profile error:", profileError.message);
        return;
      }

      /* =========================================
         GET ADMIN SYLLABUS TEMPLATES
      ========================================= */

      const { data: syllabusData, error: syllabusError } = await supabase
        .from("syllabus_forms")
        .select("*")
        .eq("university", profile.university)
        .order("created_at", { ascending: false });

      if (syllabusError) {
        console.error("Error fetching syllabuses:", syllabusError.message);
      } else {
        setSyllabuses(syllabusData || []);
      }

      /* =========================================
         GET PROFESSOR SYLLABUSES
      ========================================= */

      const { data: professorData, error: professorError } = await supabase
        .from("prof_forms")
        .select("*")
        .eq("university", profile.university)
        .order("created_at", { ascending: false });

      if (professorError) {
        console.error(
          "Error fetching professor syllabuses:",
          professorError.message,
        );
      } else {
        setProfessorSyllabuses(professorData || []);
      }
    } catch (error) {
      console.error("Unexpected fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  /* ==========================================
     FILTER SYLLABUSES
  ========================================== */

  const mainSyllabuses = syllabuses.filter(
    (syllabus) => syllabus.syllabus_type === "main",
  );

  const instanceSyllabuses = syllabuses.filter(
    (syllabus) => syllabus.syllabus_type === "instance",
  );

  /* ==========================================
     FIND PARENT
  ========================================== */

  const getParentSyllabus = (parentId) => {
    return mainSyllabuses.find(
      (syllabus) => String(syllabus.id) === String(parentId),
    );
  };

  /* ==========================================
     EDIT SYLLABUS
  ========================================== */

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

  /* ==========================================
     EDIT PROFESSOR SYLLABUS
  ========================================== */

  const handleEditProfessorSyllabus = (syllabus) => {
    setSelectedSyllabus(syllabus);
    setSelectedMainSyllabus(null);
    setModalOpen(true);
  };

  /* ==========================================
     CREATE MAIN SYLLABUS
  ========================================== */

  const handleCreateMain = () => {
    setSelectedSyllabus(null);
    setSelectedMainSyllabus(null);
    setInstanceMenuOpen(false);
    setModalOpen(true);
  };

  /* ==========================================
     CREATE SUBJECT SYLLABUS
  ========================================== */

  const handleCreateInstance = (mainSyllabus) => {
    setSelectedSyllabus(null);
    setSelectedMainSyllabus(mainSyllabus);
    setInstanceMenuOpen(false);
    setModalOpen(true);
  };

  /* ==========================================
     OPEN SUBJECT SYLLABUS SELECTION
  ========================================== */

  const handleCreateFromTemplate = () => {
    if (mainSyllabuses.length === 0) {
      return;
    }

    setInstanceMenuOpen(true);
  };

  /* ==========================================
     EXPOSE ACTIONS TO SIDEBAR
  ========================================== */

  useImperativeHandle(ref, () => ({
    createMainSyllabus: () => {
      handleCreateMain();
    },

    createSubjectSyllabus: () => {
      handleCreateFromTemplate();
    },
  }));

  /* ==========================================
     CLOSE BUILDER
  ========================================== */

  const handleModalClose = () => {
    setModalOpen(false);
    setSelectedSyllabus(null);
    setSelectedMainSyllabus(null);
  };

  /* ==========================================
     SAVE BUILDER
  ========================================== */

  const handleModalSave = (updatedData) => {
    if (!updatedData) {
      return;
    }

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

  /* ==========================================
     DELETE ADMIN SYLLABUS
  ========================================== */

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

    if (!confirmDelete) {
      return;
    }

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

  /* ==========================================
     DELETE PROFESSOR SYLLABUS
  ========================================== */

  const handleDeleteProfessorSyllabus = async (item) => {
    const confirmDelete = window.confirm(
      `Are you sure you want to delete "${item.title || "Untitled Syllabus"}"?`,
    );

    if (!confirmDelete) {
      return;
    }

    const { error } = await supabase
      .from("prof_forms")
      .delete()
      .eq("id", item.id);

    if (error) {
      console.error("Error deleting professor syllabus:", error.message);

      alert("Failed to delete professor syllabus.");

      return;
    }

    setProfessorSyllabuses((prev) =>
      prev.filter((syllabus) => syllabus.id !== item.id),
    );
  };

  /* ==========================================
     LOADING
  ========================================== */

  if (loading) {
    return (
      <div className="admin-display">
        <Spinner />
      </div>
    );
  }

  /* ==========================================
     UI
  ========================================== */

  return (
    <div className="admin-display">
      {/* ======================================
          MAIN SYLLABUSES
      ====================================== */}

      <section className="syllabus-section">
        <div className="section-header">
          <div>
            <div>
              <h2>Your Templates</h2>
            </div>
          </div>

          <span className="syllabus-count">{mainSyllabuses.length}</span>
        </div>

        {mainSyllabuses.length === 0 ? (
          <div className="empty-state">
            <h3>No main syllabuses yet</h3>

            <p>Create a main syllabus template to get started.</p>

            <button className="blue-button" onClick={handleCreateMain}>
              + Create Main Syllabus
            </button>
          </div>
        ) : (
          <div className="card-wrapper">
            {mainSyllabuses.map((item) => (
              <div
                key={item.id}
                className="syllabus-card"
                onClick={() => handleEdit(item)}
              >
                <div className="card-top-wrapper">
                  <img src={alteLogo} alt="" className="form-image" />
                </div>
                <div className="card-bot-wrapper">
                  <div className="card-title-row">
                    <h3 className="ft1">{item.title}</h3>

                    <span className="syllabus-badge main-badge">MAIN</span>
                  </div>

                  <p className="card-description">Main syllabus template</p>

                  <div className="card-actions">
                    <button
                      className="edit-button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEdit(item);
                      }}
                    >
                      Edit
                    </button>

                    <button
                      className="pdf-btn dlt-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(item);
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ======================================
          TEMPLATE INSTANCES
      ====================================== */}

      <section className="syllabus-section subject-section">
        <div className="section-header">
          <div>
            <h2>Template Instances</h2>
          </div>

          <span className="syllabus-count">{instanceSyllabuses.length}</span>
        </div>

        {instanceSyllabuses.length === 0 ? (
          <div className="empty-state">
            <h3>No subject syllabuses yet</h3>

            <p>Create a subject syllabus from one of your main templates.</p>

            {mainSyllabuses.length > 0 && (
              <button
                className="blue-button"
                onClick={handleCreateFromTemplate}
              >
                + Create Subject Syllabus
              </button>
            )}
          </div>
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
                  <div className="card-top-wrapper">
                    <img src={alteLogo} alt="" className="form-image" />
                  </div>

                  <div className="card-bot-wrapper">
                    <div className="card-title-row">
                      <h3 className="ft1">{item.title}</h3>

                      <span className="syllabus-badge instance-badge">
                        SUBJECT
                      </span>
                    </div>

                    <p className="card-description">
                      Based on:
                      <strong>
                        {parent?.title || "Unknown Main Syllabus"}
                      </strong>
                    </p>

                    <div className="card-actions">
                      <button
                        className="edit-button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEdit(item);
                        }}
                      >
                        Edit
                      </button>

                      <button
                        className="pdf-btn dlt-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(item);
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ======================================
          PROFESSOR SYLLABUSES
      ====================================== */}

      <section className="syllabus-section professor-section">
        <div className="section-header">
          <div>
            <h2>Professor Syllabuses</h2>
          </div>

          <span className="syllabus-count">{professorSyllabuses.length}</span>
        </div>

        {professorSyllabuses.length === 0 ? (
          <div className="empty-state">
            <h3>No professor syllabuses yet</h3>

            <p>Syllabuses created by professors will appear here.</p>
          </div>
        ) : (
          <div className="card-wrapper">
            {professorSyllabuses.map((item) => (
              <div
                key={item.id}
                className="syllabus-card"
                onClick={() => handleEditProfessorSyllabus(item)}
              >
                <div className="card-top-wrapper">
                  <img src={alteLogo} alt="" className="form-image" />
                </div>

                <div className="card-bot-wrapper">
                  <div className="card-title-row">
                    <h3 className="ft1">{item.title || "Untitled Syllabus"}</h3>

                    <span className="syllabus-badge professor-badge">
                      PROFESSOR
                    </span>
                  </div>

                  <p className="card-description">
                    Syllabus created by a professor
                  </p>

                  <div className="card-actions">
                    <button
                      className="edit-button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditProfessorSyllabus(item);
                      }}
                    >
                      View
                    </button>

                    <button
                      className="pdf-btn dlt-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteProfessorSyllabus(item);
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ======================================
          SELECT MAIN SYLLABUS
      ====================================== */}

      {instanceMenuOpen && (
        <div
          className="selection-overlay"
          onClick={() => setInstanceMenuOpen(false)}
        >
          <div className="selection-modal" onClick={(e) => e.stopPropagation()}>
            <div className="selection-header">
              <div>
                <h2>Create Subject Syllabus</h2>

                <p>Choose the main syllabus this subject should be based on.</p>
              </div>

              <button
                className="modal-close"
                onClick={() => setInstanceMenuOpen(false)}
              >
                ×
              </button>
            </div>

            <div className="main-selection-list">
              {mainSyllabuses.map((main) => (
                <button
                  key={main.id}
                  className="main-selection-card"
                  onClick={() => handleCreateInstance(main)}
                >
                  <img src={alteLogo} alt="" />

                  <div>
                    <strong>{main.title}</strong>

                    <span>Main Syllabus</span>
                  </div>

                  <span className="selection-arrow">→</span>
                </button>
              ))}
            </div>

            <button
              className="cancel-button"
              onClick={() => setInstanceMenuOpen(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* ======================================
          SYLLABUS BUILDER
      ====================================== */}

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
});

export default AdminDisplay;
