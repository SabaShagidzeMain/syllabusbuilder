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
  const [editingCell, setEditingCell] = useState(null);

  // Refs arrays to track rows on left and right sides
  const leftRowRefs = useRef([]);
  const rightRowRefs = useRef([]);

  // Auto resize helper for textareas
  function autoResize(textarea) {
    if (!textarea) return;
    textarea.style.height = "auto";
    textarea.style.height = textarea.scrollHeight + "px";
  }

  const handleCellClick = (sectionIndex, rowIndex, colIndex, cell) => {
    if (cell.isTitle) return; // Prevent editing title cells here
    setEditingCell({ sectionIndex, rowIndex, colIndex });
  };

  const handleCellValueChange = (e, sectionIndex, rowIndex, colIndex) => {
    updateCellValue(sectionIndex, rowIndex, colIndex, e.target.value);
    autoResize(e.target);
  };

  const handleBlurOrEnter = () => {
    setEditingCell(null);
  };

  const isValidContent = (content) => {
    if (!Array.isArray(content)) return false;
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

  // Effect to sync heights between left and right rows
  useEffect(() => {
    // Auto resize all left side textareas first
    leftRowRefs.current.forEach((rowEl) => {
      if (!rowEl) return;
      const textareas = rowEl.querySelectorAll("textarea");
      textareas.forEach(autoResize);
    });

    // After DOM update, sync heights using requestAnimationFrame
    window.requestAnimationFrame(() => {
      leftRowRefs.current.forEach((leftRowEl, index) => {
        const rightRowEl = rightRowRefs.current[index];
        if (leftRowEl && rightRowEl) {
          // Reset height to auto to measure natural height
          leftRowEl.style.height = "auto";
          rightRowEl.style.height = "auto";

          const leftHeight = leftRowEl.getBoundingClientRect().height;
          const rightHeight = rightRowEl.getBoundingClientRect().height;
          const maxHeight = Math.max(leftHeight, rightHeight);

          leftRowEl.style.height = maxHeight + "px";
          rightRowEl.style.height = maxHeight + "px";
        }
      });
    });
  }, [sections]);

  if (!isOpen) return null;

  // Helper to get global index of row across sections for stable refs
  const getGlobalRowIndex = (sectionIndex, rowIndex) => {
    let idx = 0;
    for (let i = 0; i < sectionIndex; i++) {
      idx += sections[i]?.cells?.length || 0;
    }
    return idx + rowIndex;
  };

  return (
    <div className="modal">
      <div className="modal-inner" ref={modalRef} style={{ display: "flex" }}>
        {/* Left Panel */}
        <div
          className="modal-left"
          style={{ flex: 1, overflowY: "auto", paddingRight: 10 }}
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

                {section.cells.map((row, rIdx) => {
                  const globalIndex = getGlobalRowIndex(sectionIndex, rIdx);
                  return (
                    <div
                      key={rIdx}
                      className="row-wrapper"
                      style={{ marginBottom: 10 }}
                      ref={(el) => (leftRowRefs.current[globalIndex] = el)}
                    >
                      {row.map((cell, cIdx) => {
                        if (cell.isTitle) {
                          return (
                            <div
                              key={cIdx}
                              className="title-cell-display"
                              style={{
                                fontWeight: "bold",
                                fontSize: "1.1rem",
                                marginBottom: 6,
                              }}
                            >
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
                            <textarea
                              className="prof-input-field"
                              value={cell.value || ""}
                              placeholder="Enter value"
                              onChange={(e) =>
                                handleCellValueChange(
                                  e,
                                  sectionIndex,
                                  rIdx,
                                  cIdx
                                )
                              }
                              onInput={(e) => autoResize(e.target)}
                              style={{
                                display: "block",
                                width: "100%",
                                padding: "6px 8px",
                                fontSize: 15,
                                border: "1px solid #ccc",
                                borderRadius: 4,
                                resize: "none",
                                overflow: "hidden",
                                minHeight: 40,
                              }}
                              rows={1}
                            />
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
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
          style={{ flex: 1, overflowY: "auto", paddingLeft: 10 }}
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
                  style={{ width: "100%", borderCollapse: "collapse" }}
                >
                  <tbody>
                    {section.cells.map((row, rIdx) => {
                      const globalIndex = getGlobalRowIndex(sectionIndex, rIdx);
                      return (
                        <tr
                          key={rIdx}
                          ref={(el) => (rightRowRefs.current[globalIndex] = el)}
                        >
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
                                verticalAlign: "top",
                                padding: "6px 8px",
                                whiteSpace: "pre-wrap",
                                wordBreak: "break-word",
                                maxWidth: "300px",
                                minWidth: "100px",
                              }}
                            >
                              {editingCell &&
                              editingCell.sectionIndex === sectionIndex &&
                              editingCell.rowIndex === rIdx &&
                              editingCell.colIndex === cIdx ? (
                                <textarea
                                  autoFocus
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
                                    if (e.key === "Enter" && e.ctrlKey) {
                                      e.preventDefault();
                                      handleBlurOrEnter();
                                    }
                                  }}
                                  onInput={(e) => autoResize(e.target)}
                                  style={{
                                    width: "100%",
                                    padding: "4px 6px",
                                    fontSize: "inherit",
                                    border: "1px solid #ccc",
                                    borderRadius: 4,
                                    resize: "none",
                                    overflow: "hidden",
                                    minHeight: 40,
                                  }}
                                  rows={1}
                                  ref={(el) => el && autoResize(el)}
                                />
                              ) : (
                                <span
                                  className="cell-span"
                                  style={{
                                    whiteSpace: "pre-wrap",
                                    wordBreak: "break-word",
                                    display: "block",
                                  }}
                                >
                                  {cell.value || (
                                    <span className="placeholder-cell"></span>
                                  )}
                                </span>
                              )}
                            </td>
                          ))}
                        </tr>
                      );
                    })}
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
