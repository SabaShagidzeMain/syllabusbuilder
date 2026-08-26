import React from "react";
import "./style.css";

export default function ProfRightPanel({
  sections,
  editingCell,
  setEditingCell,
  setSections,
  rightRowRefs,
  autoResize,
  isAdmin,
  onSave,
}) {
  const updateCellValue = (sectionIndex, rowIndex, colIndex, value) => {
    const updated = [...sections];

    updated[sectionIndex].cells[rowIndex][colIndex].value = value;

    setSections(updated);
  };

  const handleBlurOrEnter = () => {
    setEditingCell(null);
  };

  const getGlobalRowIndex = (sectionIndex, rowIndex) => {
    let idx = 0;

    for (let i = 0; i < sectionIndex; i++) {
      idx += sections[i]?.cells?.length || 0;
    }

    return idx + rowIndex;
  };

  const handleSaveClick = () => {
    console.log("Saving sections with comments:", sections);

    if (onSave) {
      onSave(sections);
    }
  };

  return (
    <div className="modal-right-wrapper">
      {/* =========================================
          SCROLLABLE CONTENT
      ========================================= */}

      <div className="modal-right">
        {sections.map((section, sectionIndex) => (
          <div key={section.id || sectionIndex}>
            <table
              className="syllabus-table"
              border="1"
              style={{
                width: "100%",
                borderCollapse: "collapse",
              }}
            >
              <tbody>
                {section.cells.map((row, rowIndex) => {
                  const globalIndex = getGlobalRowIndex(sectionIndex, rowIndex);

                  return (
                    <tr
                      key={rowIndex}
                      ref={(el) => {
                        rightRowRefs.current[globalIndex] = el;
                      }}
                    >
                      {row.map((cell, colIndex) => {
                        const isEditing =
                          editingCell &&
                          editingCell.sectionIndex === sectionIndex &&
                          editingCell.rowIndex === rowIndex &&
                          editingCell.colIndex === colIndex;

                        const editable =
                          !cell.isTitle || (cell.isTitle && isAdmin);

                        return (
                          <td
                            key={colIndex}
                            className={`table-cell ${
                              cell.isTitle ? "title-cell" : ""
                            }`}
                            rowSpan={cell.rowSpan}
                            colSpan={
                              cell.isFullWidth
                                ? section.cells[1]?.length || 1
                                : 1
                            }
                            onClick={() => {
                              if (editable) {
                                setEditingCell({
                                  sectionIndex,
                                  rowIndex,
                                  colIndex,
                                });
                              }
                            }}
                            style={{
                              cursor: editable ? "pointer" : "default",
                              maxWidth: 300,
                              minWidth: 100,
                            }}
                          >
                            {isEditing ? (
                              <textarea
                                autoFocus
                                value={cell.value || ""}
                                onChange={(e) =>
                                  updateCellValue(
                                    sectionIndex,
                                    rowIndex,
                                    colIndex,
                                    e.target.value,
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
                                ref={(el) => {
                                  if (el) {
                                    requestAnimationFrame(() => {
                                      el.style.height = "auto";
                                      el.style.height = `${el.scrollHeight}px`;
                                    });
                                  }
                                }}
                                style={{
                                  width: "100%",
                                  padding: "4px 6px",
                                  fontSize: "inherit",
                                  fontFamily: "inherit",
                                  lineHeight: "1.4",
                                  border: "1px solid #ccc",
                                  borderRadius: 4,
                                  resize: "none",
                                  overflow: "hidden",
                                  boxSizing: "border-box",
                                  display: "block",
                                }}
                              />
                            ) : (
                              <span
                                style={{
                                  display: "block",
                                  whiteSpace: "pre-wrap",
                                }}
                              >
                                {cell.value || (
                                  <span className="placeholder-cell"></span>
                                )}
                              </span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ))}
      </div>

      {/* =========================================
          FIXED SAVE BUTTON
      ========================================= */}

      <button onClick={handleSaveClick} className="save-button">
        Save Responses
      </button>
    </div>
  );
}
