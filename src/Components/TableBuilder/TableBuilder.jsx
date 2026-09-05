import React, { useRef, useEffect, useState } from "react";
import {
  updateSyllabusForm,
  fetchUniversityForCurrentUser,
  insertSyllabusForm,
} from "../../utility/supabaseHelpers";
import { predefinedTables } from "../../utility/predefinedTables";
import "./style.css";

export default function SyllabusBuilderModal({
  isOpen,
  onClose,
  onSave,
  initialData,
  parentSyllabus,
  syllabusType = "main",
  parentId = null,
}) {
  const modalRef = useRef();

  const isAdmin = true;

  const [formTitle, setFormTitle] = useState("Syllabus Draft");
  const [sections, setSections] = useState([]);

  /*
   * ---------------------------------------------------------
   * COLUMN RESIZE STATE
   * ---------------------------------------------------------
   */

  const [dragState, setDragState] = useState(null);

  /*
   * ---------------------------------------------------------
   * DEEP CLONE
   * ---------------------------------------------------------
   */

  const cloneSections = (data) => {
    if (!data) return [];

    return JSON.parse(JSON.stringify(data));
  };

  /*
   * ---------------------------------------------------------
   * GET COLUMN COUNT
   * ---------------------------------------------------------
   *
   * Determines how many actual columns the table has.
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
   *
   * The first column is ALWAYS 30%.
   *
   * The remaining columns divide the remaining 70%.
   *
   * If custom widths already exist, use those instead.
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
   * UPDATE COLUMN WIDTHS
   * ---------------------------------------------------------
   */

  const updateColumnWidths = (sectionId, widths) => {
    setSections((prev) =>
      prev.map((section) =>
        section.id === sectionId
          ? {
              ...section,
              columnWidths: widths,
            }
          : section,
      ),
    );
  };

  /*
   * ---------------------------------------------------------
   * COLUMN DRAGGING
   * ---------------------------------------------------------
   *
   * columnIndex represents the column immediately to the
   * LEFT of the divider being dragged.
   *
   * Example:
   *
   * [ Column 1 ][ Column 2 ][ Column 3 ][ Column 4 ]
   *              ^
   *              columnIndex = 0
   *
   *              [ Column 2 ][ Column 3 ]
   *                           ^
   *                           columnIndex = 1
   *
   * The first divider is deliberately disabled.
   */

  useEffect(() => {
    if (!dragState) {
      return;
    }

    const handleMouseMove = (event) => {
      const { sectionId, columnIndex, startX, tableWidth, originalWidths } =
        dragState;

      /*
       * columnIndex === 0 means the divider between
       * column 1 and column 2.
       *
       * The first column must NEVER change width,
       * therefore this divider cannot be dragged.
       */
      if (columnIndex === 0) {
        return;
      }

      const deltaPixels = event.clientX - startX;

      const deltaPercent = (deltaPixels / tableWidth) * 100;

      const newWidths = [...originalWidths];

      /*
       * The divider sits between:
       *
       * columnIndex
       * and
       * columnIndex + 1
       */

      const newLeftWidth = originalWidths[columnIndex] + deltaPercent;

      const newRightWidth = originalWidths[columnIndex + 1] - deltaPercent;

      /*
       * Prevent columns from becoming too narrow.
       */

      const MIN_COLUMN_WIDTH = 8;

      if (newLeftWidth < MIN_COLUMN_WIDTH) {
        return;
      }

      if (newRightWidth < MIN_COLUMN_WIDTH) {
        return;
      }

      /*
       * IMPORTANT:
       *
       * We only modify the two columns adjacent
       * to the dragged divider.
       *
       * Column 1 is never touched.
       */

      newWidths[columnIndex] = newLeftWidth;
      newWidths[columnIndex + 1] = newRightWidth;

      updateColumnWidths(sectionId, newWidths);
    };

    const handleMouseUp = () => {
      setDragState(null);

      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };

    document.addEventListener("mousemove", handleMouseMove);

    document.addEventListener("mouseup", handleMouseUp);

    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);

      document.removeEventListener("mouseup", handleMouseUp);

      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [dragState]);

  /*
   * ---------------------------------------------------------
   * APPLY INSTANCE OVERRIDES
   * ---------------------------------------------------------
   */

  const applyOverrides = (baseSections, overrides) => {
    const result = cloneSections(baseSections);

    if (!overrides || typeof overrides !== "object") {
      return result;
    }

    result.forEach((section) => {
      const sectionOverrides = overrides[section.id];

      if (!sectionOverrides) {
        return;
      }

      Object.entries(sectionOverrides).forEach(([cellPosition, value]) => {
        const [rowIndex, cellIndex] = cellPosition.split("-").map(Number);

        if (
          result.includes(section) &&
          result.find((s) => s.id === section.id)?.cells?.[rowIndex]?.[
            cellIndex
          ]
        ) {
          result.find((s) => s.id === section.id).cells[rowIndex][
            cellIndex
          ].value = value;
        }
      });
    });

    return result;
  };

  /*
   * ---------------------------------------------------------
   * BUILD OVERRIDES
   * ---------------------------------------------------------
   *
   * Compare the edited instance with the main syllabus.
   *
   * Only changed cell values are stored as overrides.
   */

  const buildOverrides = (baseSections, editedSections) => {
    const overrides = {};

    editedSections.forEach((editedSection) => {
      const baseSection = baseSections.find(
        (section) => section.id === editedSection.id,
      );

      if (!baseSection) {
        return;
      }

      editedSection.cells.forEach((row, rowIndex) => {
        row.forEach((cell, cellIndex) => {
          const baseCell = baseSection.cells?.[rowIndex]?.[cellIndex];

          if (!baseCell) {
            return;
          }

          const editedValue = cell.value ?? "";
          const baseValue = baseCell.value ?? "";

          if (editedValue !== baseValue) {
            if (!overrides[editedSection.id]) {
              overrides[editedSection.id] = {};
            }

            overrides[editedSection.id][`${rowIndex}-${cellIndex}`] =
              editedValue;
          }
        });
      });
    });

    return overrides;
  };

  /*
   * ---------------------------------------------------------
   * INITIALIZE BUILDER
   * ---------------------------------------------------------
   */

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    /*
     * Editing an existing MAIN syllabus
     */

    if (initialData && initialData.syllabus_type === "main") {
      setSections(cloneSections(initialData.content || []));

      setFormTitle(initialData.title || "Syllabus Draft");

      return;
    }

    /*
     * Editing an existing INSTANCE
     */

    if (initialData && initialData.syllabus_type === "instance") {
      const parentContent = parentSyllabus?.content || [];

      const instanceContent = applyOverrides(
        parentContent,
        initialData.overrides || {},
      );

      /*
       * If the instance already contains saved
       * column widths, preserve them.
       */

      if (Array.isArray(initialData.content)) {
        const savedContent = cloneSections(initialData.content);

        /*
         * Apply cell-value overrides while preserving
         * the saved column widths.
         */

        savedContent.forEach((savedSection) => {
          const overrideSection = instanceContent.find(
            (section) => section.id === savedSection.id,
          );

          if (overrideSection && Array.isArray(savedSection.columnWidths)) {
            overrideSection.columnWidths = savedSection.columnWidths;
          }
        });

        setSections(savedContent);
      } else {
        setSections(instanceContent);
      }

      setFormTitle(initialData.title || "Subject Syllabus");

      return;
    }

    /*
     * Creating a new INSTANCE
     */

    if (syllabusType === "instance" && parentSyllabus) {
      setSections(cloneSections(parentSyllabus.content || []));

      setFormTitle("");

      return;
    }

    /*
     * Creating a new MAIN syllabus
     */

    setSections([]);
    setFormTitle("Syllabus Draft");
  }, [isOpen, initialData, parentSyllabus, syllabusType]);

  /*
   * ---------------------------------------------------------
   * SAVE
   * ---------------------------------------------------------
   */

  const handleSave = async () => {
    let result;

    /*
     * =======================================================
     * EXISTING SYLLABUS
     * =======================================================
     */

    if (initialData?.id) {
      /*
       * -----------------------------------------------------
       * EDITING MAIN SYLLABUS
       * -----------------------------------------------------
       */

      if (initialData.syllabus_type === "main") {
        result = await updateSyllabusForm(
          initialData.id,
          sections,
          formTitle || initialData.title || "Updated Draft",
          "main",
          {},
        );
      } else {
        /*
         * -----------------------------------------------------
         * EDITING INSTANCE
         * -----------------------------------------------------
         */

        const parentContent = parentSyllabus?.content || [];

        const overrides = buildOverrides(parentContent, sections);

        result = await updateSyllabusForm(
          initialData.id,
          sections,
          formTitle || initialData.title || "Updated Subject Syllabus",
          "instance",
          overrides,
        );
      }
    } else {
      /*
       * =======================================================
       * CREATE NEW SYLLABUS
       * =======================================================
       */

      const { university, error: profileError } =
        await fetchUniversityForCurrentUser();

      if (profileError || !university) {
        console.error("Error fetching university:", profileError?.message);

        return;
      }

      /*
       * -----------------------------------------------------
       * NEW MAIN
       * -----------------------------------------------------
       */

      if (syllabusType === "main") {
        result = await insertSyllabusForm(
          formTitle || "Main Syllabus",
          sections,
          university,
          "main",
          null,
          {},
        );
      } else {
        /*
         * -----------------------------------------------------
         * NEW INSTANCE
         * -----------------------------------------------------
         */

        const parentContent = parentSyllabus?.content || [];

        const overrides = buildOverrides(parentContent, sections);

        result = await insertSyllabusForm(
          formTitle || "Subject Syllabus",
          sections,
          university,
          "instance",
          parentId,
          overrides,
        );
      }
    }

    /*
     * =======================================================
     * RESULT
     * =======================================================
     */

    const { data, error } = result;

    if (error) {
      console.error("Supabase error:", error.message);

      return;
    }

    console.log("Saved successfully!", data);

    onClose();

    if (onSave) {
      onSave(data?.[0]);
    }
  };

  /*
   * ---------------------------------------------------------
   * SECTION FUNCTIONS
   * ---------------------------------------------------------
   */

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
        section.id === id
          ? {
              ...section,
              ...changes,
            }
          : section,
      ),
    );
  };

  const removeSection = (id) => {
    setSections((prev) => prev.filter((section) => section.id !== id));
  };

  /*
   * ---------------------------------------------------------
   * CLOSE WHEN CLICKING OUTSIDE
   * ---------------------------------------------------------
   */

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

  /*
   * ---------------------------------------------------------
   * TEXTAREA AUTO RESIZE
   * ---------------------------------------------------------
   */

  function autoResize(e, syncId) {
    const allMatching = document.querySelectorAll(`[data-sync-id='${syncId}']`);

    allMatching.forEach((el) => {
      el.style.height = "auto";

      el.style.height = `${e.target.scrollHeight}px`;
    });
  }

  /*
   * ---------------------------------------------------------
   * MODAL
   * ---------------------------------------------------------
   */

  if (!isOpen) {
    return null;
  }

  return (
    <div className="modal">
      <div
        className="modal-inner"
        ref={modalRef}
        style={{
          display: "flex",
        }}
      >
        {/* ================================================= */}
        {/* LEFT PANEL */}
        {/* ================================================= */}

        <div
          className="modal-left"
          style={{
            width: "50%",
            padding: "10px",
            borderRight: "1px solid #ccc",
          }}
        >
          {/* FORM TITLE */}

          {isAdmin && (
            <div className="title-input-container">
              <label className="component-title">Form Title:</label>

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

          {/* SECTIONS */}

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
                  <label className="component-title">Component:</label>

                  <select
                    className="component-selector"
                    value={section.tableId}
                    onChange={(e) => {
                      const table = predefinedTables.find(
                        (t) => t.id === e.target.value,
                      );

                      if (!table) {
                        return;
                      }

                      updateSection(section.id, {
                        tableId: table.id,

                        cells: table.cells.map((row) =>
                          row.map((cell) => ({
                            ...cell,
                          })),
                        ),

                        /*
                         * Reset custom widths when
                         * selecting a completely new table.
                         */
                        columnWidths: undefined,
                      });
                    }}
                  >
                    <option value="">-- Select --</option>

                    {predefinedTables.map((table) => (
                      <option key={table.id} value={table.id}>
                        {table.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* TITLE EDITORS */}

                {section.cells.length > 0 && isAdmin && (
                  <div
                    style={{
                      marginTop: "10px",
                    }}
                  >
                    {section.cells.map((row, rIdx) =>
                      row.map((cell, cIdx) =>
                        cell.isTitle ? (
                          <div
                            className="input-container"
                            key={`${rIdx}-${cIdx}`}
                            style={{
                              marginBottom: 5,
                            }}
                          >
                            <p className="component-title">Title:</p>

                            <label>
                              <textarea
                                data-sync-id={`${section.id}-${rIdx}-${cIdx}`}
                                className="title-input component-title-input"
                                value={cell.value}
                                onChange={(e) => {
                                  autoResize(
                                    e,
                                    `${section.id}-${rIdx}-${cIdx}`,
                                  );

                                  const newCells = section.cells.map((row) =>
                                    row.map((c) => ({
                                      ...c,
                                    })),
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
                                  background: "none",
                                }}
                              />
                            </label>
                          </div>
                        ) : null,
                      ),
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

          {/* ADD SECTION */}

          <div className="button-container add-btn-container">
            <button onClick={addSection} className="blue-button add-button">
              Add Section
            </button>
          </div>
        </div>

        {/* ================================================= */}
        {/* RIGHT PANEL */}
        {/* ================================================= */}

        <div
          className="modal-right"
          style={{
            width: "50%",
            padding: "10px",
            overflowY: "auto",
          }}
        >
          <h3>Syllabus Preview</h3>

          {sections.length === 0 && <p>No sections added yet.</p>}

          {sections.map((section) => {
            if (section.cells.length === 0) {
              return null;
            }

            const columnWidths = getColumnWidths(section);

            return (
              <div
                key={section.id}
                style={{
                  position: "relative",
                  width: "100%",
                }}
              >
                {/* ================================================= */}
                {/* TABLE */}
                {/* ================================================= */}

                <table
                  className="syllabus-table"
                  border="1"
                  style={{
                    width: "100%",
                    tableLayout: "fixed",
                    borderCollapse: "collapse",
                  }}
                >
                  {/* ================================================= */}
                  {/* COLUMN WIDTH DEFINITIONS */}
                  {/* ================================================= */}

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
                    {section.cells.map((row, rIdx) => (
                      <tr key={rIdx}>
                        {row.map((cell, cIdx) => (
                          <td
                            key={cIdx}
                            rowSpan={cell.rowSpan}
                            colSpan={
                              cell.isFullWidth
                                ? section.cells[1]?.length || 1
                                : cell.colSpan || 1
                            }
                            className={`
                                  table-cell
                                  ${cell.isTitle ? "title-cell" : ""}
                                  ${cell.isFullWidth ? "wide-cell" : ""}
                                  ${cell.isSecondary ? "secondary-cell" : ""}
                                  ${cell.isFullHeight ? "full-height-cell" : ""}
                                `}
                          >
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
                                    const newCells = section.cells.map((row) =>
                                      row.map((c) => ({
                                        ...c,
                                      })),
                                    );

                                    newCells[rIdx][cIdx].checked =
                                      e.target.checked;

                                    updateSection(section.id, {
                                      cells: newCells,
                                    });
                                  }}
                                  style={{
                                    width: "18px",
                                    height: "18px",
                                    cursor: "pointer",
                                  }}
                                />
                              </div>
                            ) : isAdmin ? (
                              <textarea
                                data-sync-id={`${section.id}-${rIdx}-${cIdx}`}
                                className={`syllabus-input ${
                                  cell.isTitle ? "title-cell" : ""
                                }`}
                                value={cell.value || ""}
                                onChange={(e) => {
                                  autoResize(
                                    e,
                                    `${section.id}-${rIdx}-${cIdx}`,
                                  );

                                  const newCells = section.cells.map((row) =>
                                    row.map((c) => ({
                                      ...c,
                                    })),
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
                                  background: "none",
                                  color:
                                    !cell.isTitle && !cell.isSecondary
                                      ? "black"
                                      : undefined,
                                  boxSizing: "border-box",
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

                {/* ================================================= */}
                {/* RESIZE HANDLES */}
                {/* ================================================= */}

                {columnWidths.slice(0, -1).map((_, columnIndex) => {
                  /*
                   * DO NOT render the first divider.
                   *
                   * columnIndex 0 =
                   * divider between column 1 and 2
                   *
                   * That divider must remain fixed.
                   */

                  if (columnIndex === 0) {
                    return null;
                  }

                  /*
                   * Find the horizontal position
                   * of this divider.
                   *
                   * Example:
                   *
                   * widths:
                   * [30, 20, 25, 25]
                   *
                   * divider after column 2:
                   * 30 + 20 = 50%
                   */

                  const leftPosition = columnWidths
                    .slice(0, columnIndex + 1)
                    .reduce((sum, width) => sum + width, 0);

                  return (
                    <div
                      key={`resize-${columnIndex}`}
                      className="column-resize-handle"
                      style={{
                        position: "absolute",
                        top: 0,
                        bottom: 0,
                        left: `${leftPosition}%`,
                        width: "10px",
                        transform: "translateX(-50%)",
                        cursor: "col-resize",
                        zIndex: 50,
                      }}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        e.stopPropagation();

                        const table =
                          e.currentTarget.parentElement.querySelector("table");

                        if (!table) {
                          return;
                        }

                        const tableRect = table.getBoundingClientRect();

                        setDragState({
                          sectionId: section.id,

                          /*
                           * This is the column
                           * immediately LEFT
                           * of the divider.
                           */
                          columnIndex,

                          startX: e.clientX,

                          tableWidth: tableRect.width,

                          originalWidths: [...columnWidths],
                        });
                      }}
                    />
                  );
                })}
              </div>
            );
          })}
        </div>

        {/* ================================================= */}
        {/* SAVE */}
        {/* ================================================= */}

        <button className="close-button blue-button" onClick={handleSave}>
          Save
        </button>
      </div>
    </div>
  );
}
