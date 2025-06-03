import React, { useRef, useEffect, useState } from "react";
import { supabase } from "../../utility/supabaseClient";
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
      // 🔁 Update existing syllabus
      const { data, error } = await supabase
        .from("syllabus_forms")
        .update({
          content: sections,
          title: formTitle || initialData.title || "Updated Draft",
        })
        .eq("id", initialData.id)
        .select();

      result = { data, error };
    } else {
      // ➕ Insert new syllabus with university
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("university")
        .eq("user_id", user.id)
        .single();

      if (profileError || !profileData) {
        console.error("Error fetching university:", profileError?.message);
        return;
      }

      const university = profileData.university;

      const { data, error } = await supabase
        .from("syllabus_forms")
        .insert([
          {
            title: formTitle || "Syllabus Draft",
            content: sections,
            university,
          },
        ])
        .select();

      result = { data, error };
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

  const predefinedTables = [
    {
      id: "1",
      name: "1x2 Table",
      cells: [
        [{ value: "", isTitle: true, isFullWidth: true, tag: "title-1" }],
        [{ value: "", tag: "for-title-1" }],
      ],
    },
    {
      id: "2",
      name: "2x2 Table",
      cells: [
        [
          { value: "", isTitle: true, tag: "title-1" },
          { value: "", tag: "for-title-1" },
        ],
        [
          { value: "", isTitle: true, tag: "title-2" },
          { value: "", tag: "for-title-2" },
        ],
      ],
    },
    {
      id: "3",
      name: "3x3 Table",
      cells: [
        [
          { value: "", isTitle: true, tag: "title-1" },
          { value: "", tag: "for-title-1" },
          { value: "", tag: "for-title-1" },
        ],
        [
          { value: "", isTitle: true, tag: "title-2" },
          { value: "", tag: "for-title-2" },
          { value: "", tag: "for-title-2" },
        ],
        [
          { value: "", isTitle: true, tag: "title-3" },
          { value: "", tag: "for-title-3" },
          { value: "", tag: "for-title-3" },
        ],
      ],
    },
    {
      id: "4",
      name: "title top - 3x3 Table",
      cells: [
        [{ value: "", isTitle: true, isFullWidth: true }],
        [
          { value: "", isTitle: true, isSecondary: true, tag: "title-1" },
          { value: "", tag: "for-title-1" },
        ],
        [
          { value: "", isTitle: true, isSecondary: true, tag: "title-2" },
          { value: "", tag: "for-title-2" },
        ],
        [
          { value: "", isTitle: true, isSecondary: true, tag: "title-3" },
          { value: "", tag: "for-title-3" },
        ],
      ],
    },
    {
      id: "5",
      name: "4x2 Table",
      cells: [
        [
          { value: "", isTitle: true, tag: "title-1" },
          { value: "", tag: "for-title-1" },
        ],
        [
          { value: "", isTitle: true, tag: "title-2" },
          { value: "", tag: "for-title-2" },
        ],
      ],
    },
    {
      id: "6",
      name: "title top - 3x8 Table",
      cells: [
        [{ value: "", isTitle: true, isFullWidth: true }],
        [
          { value: "", isTitle: true, isSecondary: true, tag: "title-1" },
          { value: "", tag: "for-title-1" },
        ],
        [
          { value: "", isTitle: true, isSecondary: true, tag: "title-2" },
          { value: "", tag: "for-title-2" },
        ],
        [
          { value: "", isTitle: true, isSecondary: true, tag: "title-3" },
          { value: "", tag: "for-title-3" },
        ],
        [
          { value: "", isTitle: true, isSecondary: true, tag: "title-4" },
          { value: "", tag: "for-title-4" },
        ],
        [
          { value: "", isTitle: true, isSecondary: true, tag: "title-5" },
          { value: "", tag: "for-title-5" },
        ],
        [
          { value: "", isTitle: true, isSecondary: true, tag: "title-6" },
          { value: "", tag: "for-title-6" },
        ],
        [
          { value: "", isTitle: true, isSecondary: true, tag: "title-7" },
          { value: "", tag: "for-title-7" },
        ],
        [
          { value: "", isTitle: true, isSecondary: true, tag: "title-8" },
          { value: "", tag: "for-title-8" },
        ],
      ],
    },
    {
      id: "7",
      name: "title top - Calendar Table",
      cells: [
        [{ value: "", isTitle: true, isFullWidth: true }],
        [
          { value: "", isTitle: true, isSecondary: true },
          {
            value: "",
            isTitle: true,
            isSecondary: true,
            tag: "title-3",
            subtag: "sub-title-1",
          },
          {
            value: "",
            isTitle: true,
            isSecondary: true,
            tag: "title-4",
            subtag: "sub-title-2",
          },
          {
            value: "",
            isTitle: true,
            isSecondary: true,
            tag: "title-3",
            subtag: "sub-title-3",
          },
        ],
        [
          { value: "", isTitle: true, isSecondary: true, tag: "title-1" },
          { value: "", tag: "for-title-1", subtag: "for-sub-1" },
          { value: "", tag: "for-title-1", subtag: "for-sub-2" },
          { value: "", tag: "for-title-1", subtag: "for-sub-3" },
        ],
        [
          { value: "", isTitle: true, isSecondary: true, tag: "title-2" },
          { value: "", tag: "for-title-2", subtag: "for-sub-1" },
          { value: "", tag: "for-title-2", subtag: "for-sub-2" },
          { value: "", tag: "for-title-2", subtag: "for-sub-3" },
        ],
        [
          { value: "", isTitle: true, isSecondary: true, tag: "title-3" },
          { value: "", tag: "for-title-3", subtag: "for-sub-1" },
          { value: "", tag: "for-title-3", subtag: "for-sub-2" },
          { value: "", tag: "for-title-3", subtag: "for-sub-3" },
        ],
        [
          { value: "", isTitle: true, isSecondary: true, tag: "title-4" },
          { value: "", tag: "for-title-4", subtag: "for-sub-1" },
          { value: "", tag: "for-title-4", subtag: "for-sub-2" },
          { value: "", tag: "for-title-4", subtag: "for-sub-3" },
        ],
        [
          { value: "", isTitle: true, isSecondary: true, tag: "title-5" },
          { value: "", tag: "for-title-5", subtag: "for-sub-1" },
          { value: "", tag: "for-title-5", subtag: "for-sub-2" },
          { value: "", tag: "for-title-5", subtag: "for-sub-3" },
        ],
        [
          { value: "", isTitle: true, isSecondary: true, tag: "title-6" },
          { value: "", tag: "for-title-6", subtag: "for-sub-1" },
          { value: "", tag: "for-title-6", subtag: "for-sub-2" },
          { value: "", tag: "for-title-6", subtag: "for-sub-3" },
        ],
        [
          { value: "", isTitle: true, isSecondary: true, tag: "title-7" },
          { value: "", tag: "for-title-7", subtag: "for-sub-1" },
          { value: "", tag: "for-title-7", subtag: "for-sub-2" },
          { value: "", tag: "for-title-7", subtag: "for-sub-3" },
        ],
        [
          { value: "", isTitle: true, isSecondary: true, tag: "title-8" },
          { value: "", tag: "for-title-8", subtag: "for-sub-1" },
          { value: "", tag: "for-title-8", subtag: "for-sub-2" },
          { value: "", tag: "for-title-8", subtag: "for-sub-3" },
        ],
        [
          { value: "", isTitle: true, isSecondary: true, tag: "title-9" },
          { value: "", tag: "for-title-9", subtag: "for-sub-1" },
          { value: "", tag: "for-title-9", subtag: "for-sub-2" },
          { value: "", tag: "for-title-9", subtag: "for-sub-3" },
        ],
        [
          { value: "", isTitle: true, isSecondary: true, tag: "title-10" },
          { value: "", tag: "for-title-10", subtag: "for-sub-1" },
          { value: "", tag: "for-title-10", subtag: "for-sub-2" },
          { value: "", tag: "for-title-10", subtag: "for-sub-3" },
        ],
        [
          { value: "", isTitle: true, isSecondary: true, tag: "title-11" },
          { value: "", tag: "for-title-11", subtag: "for-sub-1" },
          { value: "", tag: "for-title-11", subtag: "for-sub-2" },
          { value: "", tag: "for-title-11", subtag: "for-sub-3" },
        ],
        [
          { value: "", isTitle: true, isSecondary: true, tag: "title-12" },
          { value: "", tag: "for-title-12", subtag: "for-sub-1" },
          { value: "", tag: "for-title-12", subtag: "for-sub-2" },
          { value: "", tag: "for-title-12", subtag: "for-sub-3" },
        ],
        [
          { value: "", isTitle: true, isSecondary: true, tag: "title-13" },
          { value: "", tag: "for-title-13", subtag: "for-sub-1" },
          { value: "", tag: "for-title-13", subtag: "for-sub-2" },
          { value: "", tag: "for-title-13", subtag: "for-sub-3" },
        ],
        [
          { value: "", isTitle: true, isSecondary: true, tag: "title-14" },
          { value: "", tag: "for-title-14", subtag: "for-sub-1" },
          { value: "", tag: "for-title-14", subtag: "for-sub-2" },
          { value: "", tag: "for-title-14", subtag: "for-sub-3" },
        ],
        [
          { value: "", isTitle: true, isSecondary: true, tag: "title-15" },
          { value: "", tag: "for-title-15", subtag: "for-sub-1" },
          { value: "", tag: "for-title-15", subtag: "for-sub-2" },
          { value: "", tag: "for-title-15", subtag: "for-sub-3" },
        ],
      ],
    },
    {
      id: "8",
      name: "2x1 Table",
      cells: [
        [
          { value: "", isTitle: true, tag: "title-1" },
          { value: "", tag: "for-title-1" },
        ],
      ],
    },
    {
      id: "9",
      name: "title top - 4x6 Table",
      cells: [
        [{ value: "", isTitle: true, isFullWidth: true }],
        [
          {
            value: "",
            isTitle: true,
            isSecondary: true,
            subtag: "sub-title-1",
          },
          {
            value: "",
            isTitle: true,
            isSecondary: true,
            subtag: "sub-title-2",
          },
          {
            value: "",
            isTitle: true,
            isSecondary: true,
            subtag: "sub-title-3",
          },
          {
            value: "",
            isTitle: true,
            isSecondary: true,
            subtag: "sub-title-4",
          },
        ],
        [
          { value: "", isTitle: true, isSecondary: true, tag: "title-1" },
          { value: "", tag: "for-title-1" },
          { value: "", tag: "for-title-1" },
          { value: "", tag: "for-title-1" },
        ],
        [
          { value: "", isTitle: true, isSecondary: true, tag: "title-2" },
          { value: "", tag: "for-title-2" },
          { value: "", tag: "for-title-2" },
          { value: "", tag: "for-title-2" },
        ],
        [
          { value: "", isTitle: true, isSecondary: true, tag: "title-3" },
          { value: "", tag: "for-title-3" },
          { value: "", tag: "for-title-3" },
          { value: "", tag: "for-title-3" },
        ],
        [
          { value: "", isTitle: true, isSecondary: true, tag: "title-4" },
          { value: "", tag: "for-title-4" },
          { value: "", tag: "for-title-4" },
          { value: "", tag: "for-title-4" },
        ],
        [
          { value: "", isTitle: true, isSecondary: true, tag: "title-5" },
          { value: "", tag: "for-title-5" },
          { value: "", tag: "for-title-5" },
          { value: "", tag: "for-title-5" },
        ],
      ],
    },
    {
      id: "10",
      name: "title top - 2x4 Table",
      cells: [
        [{ value: "", isTitle: true, isFullWidth: true, tag: "title-1" }],
        [
          {
            value: "",
            isTitle: true,
            isSecondary: true,
            subtag: "sub-title-1",
          },
          {
            value: "",
            isTitle: true,
            isSecondary: true,
            subtag: "sub-title-2",
          },
          {
            value: "",
            isTitle: true,
            isSecondary: true,
            subtag: "sub-title-3",
          },
          {
            value: "",
            isTitle: true,
            isSecondary: true,
            subtag: "sub-title-4",
          },
        ],
        [
          {
            value: "",
            subtag: "for-sub-1",
            isFullWidth: true,
          },
          {
            value: "",
            subtag: "for-sub-2",
          },
          {
            value: "",
            subtag: "for-sub-3",
          },
          {
            value: "",
            subtag: "for-sub-4",
          },
        ],
      ],
    },
  ];

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
            <div
              className="title-input-container"
              style={{ paddingBottom: 10 }}
            >
              <label className="component-title">Form Title: </label>
              <input
                type="text"
                className="title-input"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                placeholder="Enter form title"
              />
            </div>
          )}
          {sections.map((section) => (
            <div className="card-wrapper" key={section.id}>
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
                              <input
                                className="title-input"
                                type="text"
                                value={cell.value}
                                onChange={(e) => {
                                  const newCells = section.cells.map((r) =>
                                    r.map((c) => ({ ...c }))
                                  );
                                  newCells[rIdx][cIdx].value = e.target.value;
                                  updateSection(section.id, {
                                    cells: newCells,
                                  });
                                }}
                                style={{ marginLeft: 5 }}
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
                            className={`table-cell ${
                              cell.isTitle ? "title-cell" : ""
                            } ${cell.isFullWidth ? "wide-cell" : ""} ${
                              cell.isSecondary ? "secondary-cell" : ""
                            }`}
                          >
                            {cell.isTitle && isAdmin ? (
                              <input
                                type="text"
                                className="syllabus-input"
                                value={cell.value}
                                onChange={(e) => {
                                  const newCells = section.cells.map((r) =>
                                    r.map((c) => ({ ...c }))
                                  );
                                  newCells[rIdx][cIdx].value = e.target.value;
                                  updateSection(section.id, {
                                    cells: newCells,
                                  });
                                }}
                                style={{ color: "#fff" }}
                              />
                            ) : (
                              <div>
                                {cell.value || (
                                  <input className="syllabus-input-2" />
                                )}
                              </div>
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
