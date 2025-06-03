import React, { useEffect, useRef, useState } from "react";
import "./style.css";

export default function ProfessorFillModal({
  isOpen,
  onClose,
  syllabus,
  onSave,
}) {
  const modalRef = useRef();
  const [sections, setSections] = useState([]);

  const [editingCell, setEditingCell] = useState(null); // New state

  const handleCellClick = (sectionIndex, rowIndex, colIndex, cell) => {
    if (cell.isTitle) return; // Prevent editing title cells here
    setEditingCell({ sectionIndex, rowIndex, colIndex });
  };

  const handleCellValueChange = (e, sectionIndex, rowIndex, colIndex) => {
    updateCellValue(sectionIndex, rowIndex, colIndex, e.target.value);
  };

  const handleBlurOrEnter = () => {
    setEditingCell(null);
  };

  // Helper to validate content structure
  const isValidContent = (content) => {
    if (!Array.isArray(content)) return false;
    // Optional: check if every section has cells array
    return content.every(
      (section) =>
        section &&
        Array.isArray(section.cells) &&
        section.cells.every(
          (row) =>
            Array.isArray(row) && row.every((cell) => typeof cell === "object")
        )
    );
  };

  useEffect(() => {
    if (syllabus && isValidContent(syllabus.content)) {
      setSections(syllabus.content || []);
    } else {
      // fallback to empty array if content invalid or missing
      setSections([]);
    }
  }, [syllabus]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  // Update value of input cell in state
  const updateCellValue = (sectionIndex, rowIndex, colIndex, value) => {
    const updatedSections = [...sections];
    if (
      updatedSections[sectionIndex] &&
      updatedSections[sectionIndex].cells?.[rowIndex] &&
      updatedSections[sectionIndex].cells[rowIndex][colIndex]
    ) {
      updatedSections[sectionIndex].cells[rowIndex][colIndex].value = value;
      setSections(updatedSections);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal">
      <div className="modal-inner" ref={modalRef} style={{ display: "flex" }}>
        {/* Left Panel */}
        <div
          className="modal-left"
          style={{
            width: "50%",
            borderRight: "1px solid #ccc",
          }}
        >
          {sections.length === 0 && (
            <p style={{ color: "#888", fontStyle: "italic" }}>
              No sections to display.
            </p>
          )}

          {sections.map((section, sectionIndex) => (
            <div className="card-wrapper" key={section.id || sectionIndex}>
              <div
                className="section-wrapper"
                style={{
                  marginTop: "15px",
                  border: "1px solid #ddd",
                  padding: "10px",
                  width: "100%",
                }}
              >
                <h4
                  style={{ marginBottom: 10, fontWeight: 600, color: "#333" }}
                >
                  Section {sectionIndex + 1}
                </h4>

                {section.cells.map((row, rIdx) => (
                  <div key={rIdx} className="row-wrapper">
                    {row.map((cell, cIdx) => {
                      if (cell.isTitle) {
                        return (
                          <div key={cIdx} className="title-cell-display">
                            {cell.value || "(Title)"}
                          </div>
                        );
                      }

                      return (
                        <div
                          key={cIdx}
                          className="input-container"
                          style={{ marginBottom: 6 }}
                        >
                          {cell.subtag && (
                            <label
                              style={{
                                display: "block",
                                fontSize: 13,
                                color: "#555",
                                marginBottom: 4,
                              }}
                            >
                              {cell.subtag.replace(/(sub-|for-sub-)/, "")}
                            </label>
                          )}
                          <input
                            type="text"
                            className="prof-input-field"
                            value={cell.value || ""}
                            placeholder="Enter value"
                            onChange={(e) =>
                              updateCellValue(
                                sectionIndex,
                                rIdx,
                                cIdx,
                                e.target.value
                              )
                            }
                            style={{
                              display: "block",
                              width: "100%",
                              padding: "6px 8px",
                              fontSize: 15,
                              border: "1px solid #ccc",
                              borderRadius: 4,
                            }}
                          />
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          ))}

          <div className="button-container" style={{ marginTop: 20 }}>
            <button onClick={() => onSave(sections)} className="blue-button">
              Save Responses
            </button>
          </div>
        </div>

        {/* Right Panel: Preview */}
        <div
          className="modal-right"
          style={{ width: "50%", overflowY: "auto" }}
        >
          {sections.map((section, sectionIndex) => (
            <div
              key={section.id || sectionIndex}
              style={{ marginBottom: "20px" }}
            >
              {section.cells.length > 0 && (
                <table
                  className="syllabus-table"
                  border="1"
                  style={{ width: "100%" }}
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
                            onClick={() =>
                              handleCellClick(sectionIndex, rIdx, cIdx, cell)
                            }
                            style={{
                              cursor: cell.isTitle ? "default" : "pointer",
                            }}
                          >
                            {editingCell &&
                            editingCell.sectionIndex === sectionIndex &&
                            editingCell.rowIndex === rIdx &&
                            editingCell.colIndex === cIdx ? (
                              <input
                                autoFocus
                                type="text"
                                value={cell.value || ""}
                                onChange={(e) =>
                                  handleCellValueChange(
                                    e,
                                    sectionIndex,
                                    rIdx,
                                    cIdx
                                  )
                                }
                                onBlur={handleBlurOrEnter}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") handleBlurOrEnter();
                                }}
                                style={{
                                  width: "100%",
                                  padding: "4px 6px",
                                  fontSize: "inherit",
                                  border: "1px solid #ccc",
                                  borderRadius: 4,
                                }}
                              />
                            ) : (
                              <span className="cell-span">
                                {cell.value || (
                                  <span className="placeholder-cell"></span>
                                )}
                              </span>
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
