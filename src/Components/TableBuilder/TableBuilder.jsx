import React, { useRef, useEffect, useState } from "react";
import { supabase } from "../../utility/supabaseClient";
import { predefinedTables } from "../../utility/predefinedTables";
import { updateSyllabusForm, fetchUniversityForCurrentUser, insertSyllabusForm } from "../../utility/supabaseHelpers";
import "./style.css";

export default function SyllabusBuilderModal({
  isOpen,
  onClose,
  onSave,
  initialData,
}) {
  const modalRef = useRef();

  const isAdmin = true;

  const [formTitle, setFormTitle] = useState("Syllabus Draft");
  const [sections, setSections] = useState([]);

  useEffect(() => {
    if (initialData) {
      setSections(initialData.content || []);
      setFormTitle(initialData.title || "Syllabus Draft");
    } else {
      setFormTitle("Syllabus Draft");
    }
  }, [initialData]);

  const handleSave = async () => {
    let result;

    if (initialData?.id) {
      result = await updateSyllabusForm(
        initialData.id,
        sections,
        formTitle || initialData.title || "Updated Draft"
      );
    } else {
      const { university, error: profileError } = await fetchUniversityForCurrentUser();
      if (profileError || !university) {
        console.error("Error fetching university:", profileError?.message);
        return;
      }

      result = await insertSyllabusForm(
        formTitle || "Syllabus Draft",
        sections,
        university
      );
    }

    const { data, error } = result;

    if (error) {
      console.error("Supabase error:", error.message);
    } else {
      console.log("Saved successfully!", data);
      onClose();
      if (onSave) onSave(data?.[0]);
    }
  };


  const addSection = () => {
    setSections((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        title: "Untitled Section",
        tableId: "",
        cells: [],
      },
    ]);
  };

  const updateSection = (id, changes) => {
    setSections((prev) =>
      prev.map((section) =>
        section.id === id ? { ...section, ...changes } : section
      )
    );
  };

  const removeSection = (id) => {
    setSections((prev) => prev.filter((s) => s.id !== id));
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [onClose]);

  function autoResize(e, syncId) {
    const allMatching = document.querySelectorAll(`[data-sync-id='${syncId}']`);
    allMatching.forEach((el) => {
      el.style.height = "auto";
      el.style.height = `${e.target.scrollHeight}px`;
    });
  }

  if (!isOpen) return null;
  return (
    <div className="modal">
      <div className="modal-inner" ref={modalRef} style={{ display: "flex" }}>
        {/* Left Panel */}
        <div
          className="modal-left"
          style={{
            width: "50%",
            padding: "10px",
            borderRight: "1px solid #ccc",
          }}
        >
          {isAdmin && !initialData?.id && (
            <div className="title-input-container">
              <label className="component-title">Form Title: </label>
              <textarea
                className="title-input"
                value={formTitle}
                onChange={(e) => {
                  autoResize(e, "form-title");
                  setFormTitle(e.target.value);
                }}
                onInput={(e) => autoResize(e, "form-title")}
                data-sync-id="form-title"
                style={{
                  resize: "none",
                  overflow: "hidden",
                  overflowWrap: "break-word",
                  wordBreak: "break-word",
                  whiteSpace: "pre-wrap",
                  width: "100%",
                  height: "1.8em",
                  padding: "0",
                  lineHeight: "1.1",
                  fontSize: "1rem",
                  fontFamily: "inherit",
                  border: "1px solid #ccc",
                  borderRadius: "6px",
                  boxSizing: "border-box",
                }}
              />
            </div>
          )}
          {sections.map((section) => (
            <div className="modal-card-wrapper" key={section.id}>
              <div
                className="section-wrapper"
                style={{
                  marginTop: "15px",
                  border: "1px solid #ddd",
                  padding: "10px",
                }}
              >
                <div className="input-container">
                  <label className="component-title">Component: </label>
                  <select
                    className="component-selector"
                    value={section.tableId}
                    onChange={(e) => {
                      const table = predefinedTables.find(
                        (t) => t.id === e.target.value
                      );
                      updateSection(section.id, {
                        tableId: table.id,
                        cells: table.cells.map((row) =>
                          row.map((cell) => ({ ...cell }))
                        ),
                      });
                    }}
                  >
                    <option value="">-- Select --</option>
                    {predefinedTables.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>

                {section.cells.length > 0 && isAdmin && (
                  <div style={{ marginTop: "10px" }}>
                    {section.cells.map((row, rIdx) =>
                      row.map((cell, cIdx) =>
                        cell.isTitle ? (
                          <div
                            className="input-container"
                            key={`${rIdx}-${cIdx}`}
                            style={{ marginBottom: 5 }}
                          >
                            <p className="component-title">Title: </p>
                            <label>
                              <textarea
                                data-sync-id={`${section.id}-${rIdx}-${cIdx}`}
                                className="title-input component-title-input"
                                value={cell.value}
                                onChange={(e) => {
                                  autoResize(
                                    e,
                                    `${section.id}-${rIdx}-${cIdx}`
                                  );
                                  const newCells = section.cells.map((r) =>
                                    r.map((c) => ({ ...c }))
                                  );
                                  newCells[rIdx][cIdx].value = e.target.value;
                                  updateSection(section.id, {
                                    cells: newCells,
                                  });
                                }}
                                onInput={(e) =>
                                  autoResize(e, `${section.id}-${rIdx}-${cIdx}`)
                                }
                                style={{
                                  resize: "none",
                                  overflow: "hidden",
                                  overflowWrap: "break-word",
                                  wordBreak: "break-word",
                                  whiteSpace: "pre-wrap",
                                  width: "100%",
                                  height: "100%",
                                  backgroundColor: "none",
                                  background: "none",
                                }}
                              />
                            </label>
                          </div>
                        ) : null
                      )
                    )}
                  </div>
                )}
                <div className="button-container">
                  <button onClick={() => removeSection(section.id)}>
                    Remove Section
                  </button>
                </div>
              </div>
            </div>
          ))}
          <div className="button-container add-btn-container">
            <button onClick={addSection} className="blue-button add-button">
              Add Section
            </button>
          </div>
        </div>

        {/* Right Panel: Preview */}
        <div
          className="modal-right"
          style={{ width: "50%", padding: "10px", overflowY: "auto" }}
        >
          <h3>Syllabus Preview</h3>
          {sections.length === 0 && <p>No sections added yet.</p>}
          {sections.map((section) => (
            <div key={section.id} style={{ marginBottom: "20px" }}>
              {section.cells.length > 0 && (
                <table
                  className="syllabus-table"
                  border="1"
                  style={{ width: "100%", marginTop: 5 }}
                >
                  <tbody>
                    {section.cells.map((row, rIdx) => (
                      <tr key={rIdx}>
                        {row.map((cell, cIdx) => (
                          <td
                            key={cIdx}
                            colSpan={
                              cell.isFullWidth
                                ? section.cells[1]?.length || 1
                                : 1
                            }
                            className={`table-cell ${cell.isTitle ? "title-cell" : ""
                              } ${cell.isFullWidth ? "wide-cell" : ""} ${cell.isSecondary ? "secondary-cell" : ""
                              }`}
                          >
                            {isAdmin ? (
                              <textarea
                                data-sync-id={`${section.id}-${rIdx}-${cIdx}`}
                                className={`syllabus-input ${cell.isTitle ? "title-cell" : ""
                                  }`}
                                value={cell.value}
                                onChange={(e) => {
                                  autoResize(
                                    e,
                                    `${section.id}-${rIdx}-${cIdx}`
                                  );
                                  const newCells = section.cells.map((r) =>
                                    r.map((c) => ({ ...c }))
                                  );
                                  newCells[rIdx][cIdx].value = e.target.value;
                                  updateSection(section.id, {
                                    cells: newCells,
                                  });
                                }}
                                onInput={(e) =>
                                  autoResize(e, `${section.id}-${rIdx}-${cIdx}`)
                                }
                                style={{
                                  resize: "none",
                                  overflow: "hidden",
                                  overflowWrap: "break-word",
                                  wordBreak: "break-word",
                                  whiteSpace: "pre-wrap",
                                  width: "100%",
                                  height: "100%",
                                  backgroundColor: "none",
                                  background: "none",
                                  color:
                                    !cell.isTitle && !cell.isSecondary
                                      ? "black"
                                      : undefined,
                                }}
                              />
                            ) : (
                              <div className="normal-cell">{cell.value}</div>
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          ))}
        </div>
        <button className="close-button blue-button" onClick={handleSave}>
          Save
        </button>
      </div>
    </div>
  );
}
