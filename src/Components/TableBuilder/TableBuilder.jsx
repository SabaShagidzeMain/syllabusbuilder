import React from "react";
import "./style.css";

export default function SyllabusBuilderModal({ isOpen, onClose, onSave }) {
  const isAdmin = true;

  const predefinedTables = [
    {
      id: "1",
      name: "1x1 Table",
      cells: [[{ value: "", isTitle: true }]],
    },
    {
      id: "2",
      name: "2x2 Table",
      cells: [
        [{ value: "", isTitle: true }, { value: "" }],
        [{ value: "", isTitle: true }, { value: "" }],
      ],
    },
    {
      id: "3",
      name: "3x3 Table",
      cells: [
        [{ value: "", isTitle: true }, { value: "" }, { value: "" }],
        [{ value: "", isTitle: true }, { value: "" }, { value: "" }],
        [{ value: "", isTitle: false }, { value: "" }, { value: "" }],
      ],
    },
    {
      id: "4",
      name: "title top - 3x3 Table",
      cells: [
        [{ value: "", isTitle: true, isFullWidth: true }],
        [{ value: "", isTitle: true, isSecondary: true }, { value: "" }],
        [{ value: "", isTitle: true, isSecondary: true }, { value: "" }],
        [{ value: "", isTitle: true, isSecondary: true }, { value: "" }],
      ],
    },
  ];

  const [sections, setSections] = React.useState([]);

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

  if (!isOpen) return null;

  return (
    <div className="modal">
      <div className="modal-inner" style={{ display: "flex" }}>
        {/* Left Panel */}
        <div
          className="modal-left"
          style={{
            width: "50%",
            padding: "10px",
            borderRight: "1px solid #ccc",
          }}
        >
          <button onClick={addSection} className="blue-button">
            Add Section
          </button>
          {sections.map((section) => (
            <div
              className="section-wrapper"
              key={section.id}
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

              {/* Admin Title Cell Inputs */}
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
                                updateSection(section.id, { cells: newCells });
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
          ))}
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
                            colSpan={
                              cell.isFullWidth
                                ? section.cells[1]?.length || 1
                                : 1
                            }
                            key={cIdx}
                            className={`table-cell ${
                              cell.isTitle ? "title-cell" : ""
                            } ${cell.isFullwidth ? "wide-cell" : ""}
                            ${cell.isSecondary ? "secondary-cell" : ""}`}
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
                              />
                            ) : (
                              <div>{cell.value || <em></em>}</div>
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
      </div>
    </div>
  );
}
