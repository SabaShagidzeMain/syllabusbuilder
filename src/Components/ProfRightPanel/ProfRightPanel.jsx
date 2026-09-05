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

  const updateCheckbox = (sectionIndex, rowIndex, colIndex, checked) => {
    const updated = sections.map((section) => ({
      ...section,
      cells: section.cells.map((row) =>
        row.map((cell) => ({
          ...cell,
        })),
      ),
    }));

    updated[sectionIndex].cells[rowIndex][colIndex].checked = checked;

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

  /*
   * ---------------------------------------------------------
   * GET COLUMN COUNT
   * ---------------------------------------------------------
   */

  const getColumnCount = (section) => {
    if (!section?.cells?.length) {
      return 1;
    }

    let maxColumns = 1;

    section.cells.forEach((row) => {
      let rowColumns = 0;

      row.forEach((cell) => {
        if (cell.isFullWidth) {
          rowColumns = Math.max(
            rowColumns,
            section.cells[1]?.length || row.length || 1,
          );
        } else {
          rowColumns += cell.colSpan || 1;
        }
      });

      maxColumns = Math.max(maxColumns, rowColumns);
    });

    return maxColumns;
  };

  /*
   * ---------------------------------------------------------
   * GET COLUMN WIDTHS
   * ---------------------------------------------------------
   */

  const getColumnWidths = (section) => {
    const columnCount = getColumnCount(section);

    if (
      Array.isArray(section?.columnWidths) &&
      section.columnWidths.length === columnCount
    ) {
      return section.columnWidths;
    }

    if (columnCount <= 1) {
      return [100];
    }

    const firstColumnWidth = 30;
    const remainingWidth = 100 - firstColumnWidth;

    const otherColumnWidth = remainingWidth / (columnCount - 1);

    return Array.from({ length: columnCount }, (_, index) =>
      index === 0 ? firstColumnWidth : otherColumnWidth,
    );
  };

  /*
   * ---------------------------------------------------------
   * SAVE
   * ---------------------------------------------------------
   */

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
        {sections.map((section, sectionIndex) => {
          const columnWidths = getColumnWidths(section);

          return (
            <div key={section.id || sectionIndex}>
              <table
                className="syllabus-table"
                border="1"
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  tableLayout: "fixed",
                }}
              >
                {/* =========================================
                    COLUMN WIDTHS
                ========================================= */}

                <colgroup>
                  {columnWidths.map((width, columnIndex) => (
                    <col
                      key={columnIndex}
                      style={{
                        width: `${width}%`,
                      }}
                    />
                  ))}
                </colgroup>

                <tbody>
                  {section.cells.map((row, rowIndex) => {
                    const globalIndex = getGlobalRowIndex(
                      sectionIndex,
                      rowIndex,
                    );

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

                          /*
                           * Checkbox cells are always editable,
                           * even when they aren't normal text cells.
                           */
                          const editable =
                            cell.isCheckbox ||
                            !cell.isTitle ||
                            (cell.isTitle && isAdmin);

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
                                  : cell.colSpan || 1
                              }
                              onClick={() => {
                                /*
                                 * Don't open the textarea when
                                 * clicking a checkbox.
                                 */
                                if (editable && !cell.isCheckbox) {
                                  setEditingCell({
                                    sectionIndex,
                                    rowIndex,
                                    colIndex,
                                  });
                                }
                              }}
                              style={{
                                cursor: cell.isCheckbox
                                  ? "default"
                                  : editable
                                    ? "pointer"
                                    : "default",
                                boxSizing: "border-box",
                                overflow: "hidden",
                              }}
                            >
                              {/* =====================================
                                  CHECKBOX CELL
                              ===================================== */}

                              {cell.isCheckbox ? (
                                <div
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    width: "100%",
                                    height: "100%",
                                  }}
                                >
                                  <input
                                    type="checkbox"
                                    checked={cell.checked || false}
                                    onChange={(e) => {
                                      updateCheckbox(
                                        sectionIndex,
                                        rowIndex,
                                        colIndex,
                                        e.target.checked,
                                      );
                                    }}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                    }}
                                    style={{
                                      width: "18px",
                                      height: "18px",
                                      cursor: "pointer",
                                    }}
                                  />
                                </div>
                              ) : isEditing ? (
                                /* =====================================
                                    NORMAL EDITING CELL
                                ===================================== */

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
                                    maxWidth: "100%",
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
                                /* =====================================
                                    NORMAL DISPLAY CELL
                                ===================================== */

                                <span
                                  style={{
                                    display: "block",
                                    whiteSpace: "pre-wrap",
                                    overflowWrap: "break-word",
                                    wordBreak: "break-word",
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
          );
        })}
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
