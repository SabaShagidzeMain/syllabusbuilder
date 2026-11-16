import React, { useRef, useEffect, useState, useLayoutEffect } from "react";

import {
  updateSyllabusForm,
  fetchUniversityForCurrentUser,
  insertSyllabusForm,
} from "../../utility/supabaseHelpers";

import { predefinedTables } from "../../utility/predefinedTables";

import "./style.css";
import alteLogo from "../../assets/alte/altelogo.png";

export default function SyllabusBuilderModal({
  isOpen,
  onClose,
  onSave,
  initialData,
  parentSyllabus,
  university,
  syllabusType = "main",
  parentId = null,
}) {
  // ---------------------------------------------------------
  // REFS AND STATE
  // ---------------------------------------------------------

  const modalRef = useRef(null);

  const isAdmin = true;

  const [formTitle, setFormTitle] = useState("Syllabus Draft");
  const [sections, setSections] = useState([]);
  const [dragState, setDragState] = useState(null);
  const [pages, setPages] = useState(null);

  // ---------------------------------------------------------
  // DEEP CLONE
  // ---------------------------------------------------------

  const cloneSections = (data) => {
    if (!data) return [];

    return JSON.parse(JSON.stringify(data));
  };

  // ---------------------------------------------------------
  // COLUMN COUNT
  // ---------------------------------------------------------

  const getColumnCount = (section) => {
    if (!section?.cells?.length) return 1;

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

  // ---------------------------------------------------------
  // COLUMN WIDTHS
  // ---------------------------------------------------------

  const getColumnWidths = (section) => {
    const columnCount = getColumnCount(section);

    if (
      Array.isArray(section?.columnWidths) &&
      section.columnWidths.length === columnCount
    ) {
      return section.columnWidths;
    }

    if (columnCount <= 1) return [100];

    const firstColumnWidth = 30;
    const remainingWidth = 100 - firstColumnWidth;

    return Array.from({ length: columnCount }, (_, index) =>
      index === 0 ? firstColumnWidth : remainingWidth / (columnCount - 1),
    );
  };

  // ---------------------------------------------------------
  // UPDATE COLUMN WIDTHS
  // ---------------------------------------------------------

  const updateColumnWidths = (sectionId, widths) => {
    setSections((prev) =>
      prev.map((section) =>
        section.id === sectionId
          ? { ...section, columnWidths: widths }
          : section,
      ),
    );
  };

  // ---------------------------------------------------------
  // COLUMN DRAGGING
  // ---------------------------------------------------------

  useEffect(() => {
    if (!dragState) return;

    const handleMouseMove = (event) => {
      const { sectionId, columnIndex, startX, tableWidth, originalWidths } =
        dragState;

      if (columnIndex === 0) return;

      const deltaPixels = event.clientX - startX;
      const deltaPercent = (deltaPixels / tableWidth) * 100;

      const newWidths = [...originalWidths];

      const newLeftWidth = originalWidths[columnIndex] + deltaPercent;
      const newRightWidth = originalWidths[columnIndex + 1] - deltaPercent;

      const MIN_COLUMN_WIDTH = 8;

      if (newLeftWidth < MIN_COLUMN_WIDTH || newRightWidth < MIN_COLUMN_WIDTH) {
        return;
      }

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

  // ---------------------------------------------------------
  // INSTANCE OVERRIDES
  // ---------------------------------------------------------

  const applyOverrides = (baseSections, overrides) => {
    const result = cloneSections(baseSections);

    if (!overrides || typeof overrides !== "object") {
      return result;
    }

    result.forEach((section) => {
      const sectionOverrides = overrides[section.id];

      if (!sectionOverrides) return;

      Object.entries(sectionOverrides).forEach(([cellPosition, value]) => {
        const [rowIndex, cellIndex] = cellPosition.split("-").map(Number);

        if (
          result.find((s) => s.id === section.id)?.cells?.[rowIndex]?.[
            cellIndex
          ]
        ) {
          section.cells[rowIndex][cellIndex].value = value;
        }
      });
    });

    return result;
  };

  // ---------------------------------------------------------
  // BUILD OVERRIDES
  // ---------------------------------------------------------

  const buildOverrides = (baseSections, editedSections) => {
    const overrides = {};

    editedSections.forEach((editedSection) => {
      const baseSection = baseSections.find(
        (section) => section.id === editedSection.id,
      );

      if (!baseSection) return;

      editedSection.cells.forEach((row, rowIndex) => {
        row.forEach((cell, cellIndex) => {
          const baseCell = baseSection.cells?.[rowIndex]?.[cellIndex];

          if (!baseCell) return;

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

  // ---------------------------------------------------------
  // INITIALIZE BUILDER
  // ---------------------------------------------------------

  useEffect(() => {
    if (!isOpen) return;

    // Start with a fresh measurement when opening the modal.
    setPages(null);

    if (initialData && initialData.syllabus_type === "main") {
      setSections(cloneSections(initialData.content || []));
      setFormTitle(initialData.title || "Syllabus Draft");
      return;
    }

    if (initialData && initialData.syllabus_type === "instance") {
      const parentContent = parentSyllabus?.content || [];

      const instanceContent = applyOverrides(
        parentContent,
        initialData.overrides || {},
      );

      if (Array.isArray(initialData.content)) {
        const savedContent = cloneSections(initialData.content);

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

    if (syllabusType === "instance" && parentSyllabus) {
      setSections(cloneSections(parentSyllabus.content || []));
      setFormTitle("");
      return;
    }

    setSections([]);
    setFormTitle("Syllabus Draft");
  }, [isOpen, initialData, parentSyllabus, syllabusType]);

  // ---------------------------------------------------------
  // SAVE
  // ---------------------------------------------------------

  const handleSave = async () => {
    let result;

    if (initialData?.id) {
      if (initialData.syllabus_type === "main") {
        result = await updateSyllabusForm(
          initialData.id,
          sections,
          formTitle || initialData.title || "Updated Draft",
          "main",
          {},
        );
      } else {
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
      const { university: currentUniversity, error: profileError } =
        await fetchUniversityForCurrentUser();

      if (profileError || !currentUniversity) {
        console.error("Error fetching university:", profileError?.message);
        return;
      }

      if (syllabusType === "main") {
        result = await insertSyllabusForm(
          formTitle || "Main Syllabus",
          sections,
          currentUniversity,
          "main",
          null,
          {},
        );
      } else {
        const parentContent = parentSyllabus?.content || [];
        const overrides = buildOverrides(parentContent, sections);

        result = await insertSyllabusForm(
          formTitle || "Subject Syllabus",
          sections,
          currentUniversity,
          "instance",
          parentId,
          overrides,
        );
      }
    }

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

  // ---------------------------------------------------------
  // SECTION FUNCTIONS
  // ---------------------------------------------------------

  const addSection = () => {
    // Structural change: measure the full document again.
    setPages(null);

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
        section.id === id ? { ...section, ...changes } : section,
      ),
    );
  };

  const removeSection = (id) => {
    // Structural change: measure the full document again.
    setPages(null);

    setSections((prev) => prev.filter((section) => section.id !== id));
  };

  // ---------------------------------------------------------
  // TEXTAREA AUTO RESIZE
  // ---------------------------------------------------------

  function autoResize(syncId) {
    const textareas = document.querySelectorAll(`[data-sync-id='${syncId}']`);

    textareas.forEach((textarea) => {
      textarea.style.height = "0px";
      textarea.style.height = `${textarea.scrollHeight}px`;
    });
  }

  // ---------------------------------------------------------
  // RESIZE TEXTAREAS AFTER RENDER
  // ---------------------------------------------------------

  useLayoutEffect(() => {
    if (!isOpen) return;

    const textareas = document.querySelectorAll(
      ".syllabus-document textarea, .modal-left textarea",
    );

    textareas.forEach((textarea) => {
      textarea.style.height = "0px";
      textarea.style.height = `${textarea.scrollHeight}px`;
    });
  }, [sections, isOpen]);

  // ---------------------------------------------------------
  // CALCULATE PAGE BREAKS WITHOUT RESETTING THE PREVIEW
  // ---------------------------------------------------------

  useLayoutEffect(() => {
    if (!isOpen) return;

    const calculatePages = () => {
      const preview = modalRef.current?.querySelector(".preview-pages");

      if (!preview) return;

      // Use the first page to determine the available content height.
      const contentElement = preview.querySelector(".syllabus-content");

      if (!contentElement) return;

      const availableHeight = contentElement.clientHeight;

      if (availableHeight <= 0) return;

      // Collect rows from ALL currently rendered pages.
      // This means we can recalculate pagination without first
      // switching the preview back to one long page.
      const rows = Array.from(preview.querySelectorAll("tr[data-section-id]"));

      const calculatedPages = [[]];

      let currentPage = 0;
      let usedHeight = 0;
      let previousSectionId = null;

      rows.forEach((row) => {
        const sectionId = row.dataset.sectionId;
        const rowIndex = Number(row.dataset.rowIndex);
        const rowHeight = row.getBoundingClientRect().height;

        if (rowHeight <= 0) return;

        const sectionGap =
          previousSectionId !== null && previousSectionId !== sectionId ? 8 : 0;

        // Move to the next page if this row does not fit.
        if (
          calculatedPages[currentPage].length > 0 &&
          usedHeight + sectionGap + rowHeight > availableHeight
        ) {
          calculatedPages.push([]);
          currentPage++;
          usedHeight = 0;
          previousSectionId = null;
        }

        const currentEntries = calculatedPages[currentPage];
        const lastEntry = currentEntries[currentEntries.length - 1];

        // Merge consecutive rows belonging to the same section.
        if (
          lastEntry &&
          lastEntry.sectionId === sectionId &&
          lastEntry.end === rowIndex
        ) {
          lastEntry.end = rowIndex + 1;
        } else {
          currentEntries.push({
            sectionId,
            start: rowIndex,
            end: rowIndex + 1,
          });
        }

        const actualGap =
          previousSectionId !== null && previousSectionId !== sectionId ? 8 : 0;

        usedHeight += actualGap + rowHeight;
        previousSectionId = sectionId;
      });

      // Avoid triggering another render if the page breaks
      // have not actually changed.
      setPages((currentPages) => {
        if (
          currentPages &&
          currentPages.length === calculatedPages.length &&
          currentPages.every(
            (page, pageIndex) =>
              page.length === calculatedPages[pageIndex].length &&
              page.every((entry, entryIndex) => {
                const nextEntry = calculatedPages[pageIndex][entryIndex];

                return (
                  entry.sectionId === nextEntry.sectionId &&
                  entry.start === nextEntry.start &&
                  entry.end === nextEntry.end
                );
              }),
          )
        ) {
          return currentPages;
        }

        return calculatedPages;
      });
    };

    // Wait until React has rendered the updated text and the
    // textarea heights have been adjusted.
    const frame = requestAnimationFrame(calculatePages);

    return () => cancelAnimationFrame(frame);
  }, [isOpen, sections, university]);

  // ---------------------------------------------------------
  // RENDER SECTION / PART OF SECTION
  // ---------------------------------------------------------

  const renderSection = (section, start = 0, end = section.cells.length) => {
    if (!section.cells.length) return null;

    const columnWidths = getColumnWidths(section);
    const visibleRows = section.cells.slice(start, end);

    return (
      <div
        key={`${section.id}-${start}-${end}`}
        style={{
          position: "relative",
          width: "100%",
          marginBottom: "0",
        }}
      >
        <table
          className="syllabus-table"
          border="1"
          style={{
            width: "100%",
            tableLayout: "fixed",
            borderCollapse: "collapse",
          }}
        >
          <colgroup>
            {columnWidths.map((width, columnIndex) => (
              <col key={columnIndex} style={{ width: `${width}%` }} />
            ))}
          </colgroup>

          <tbody>
            {visibleRows.map((row, localIndex) => {
              const rIdx = start + localIndex;

              return (
                <tr
                  key={rIdx}
                  data-section-id={section.id}
                  data-row-index={rIdx}
                >
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
                                row.map((c) => ({ ...c })),
                              );

                              newCells[rIdx][cIdx].checked = e.target.checked;

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
                        // RIGHT-PANEL PREVIEW TEXTAREA
                        <textarea
                          rows={1}
                          data-sync-id={`${section.id}-${rIdx}-${cIdx}`}
                          className={`syllabus-input ${
                            cell.isTitle ? "title-cell" : ""
                          }`}
                          value={cell.value || ""}
                          onChange={(e) => {
                            const newCells = section.cells.map((row) =>
                              row.map((c) => ({ ...c })),
                            );

                            newCells[rIdx][cIdx].value = e.target.value;

                            updateSection(section.id, {
                              cells: newCells,
                            });

                            autoResize(`${section.id}-${rIdx}-${cIdx}`);
                          }}
                          onInput={() => {
                            autoResize(`${section.id}-${rIdx}-${cIdx}`);
                          }}
                          style={{
                            display: "block",
                            width: "100%",
                            height: "auto",
                            minHeight: "0",
                            padding: "0",
                            margin: "0",
                            border: "none",
                            resize: "none",
                            overflow: "hidden",
                            overflowWrap: "anywhere",
                            wordBreak: "break-word",
                            whiteSpace: "pre-wrap",
                            fontSize: cell.isTitle ? "12px" : "11px",
                            lineHeight: "1.2",
                            background: "transparent",
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
              );
            })}
          </tbody>
        </table>

        {/* COLUMN RESIZE HANDLES */}

        {columnWidths.slice(0, -1).map((_, columnIndex) => {
          if (columnIndex === 0) return null;

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

                if (!table) return;

                const tableRect = table.getBoundingClientRect();

                setDragState({
                  sectionId: section.id,
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
  };

  // ---------------------------------------------------------
  // CLOSE WHEN CLICKING OUTSIDE
  // ---------------------------------------------------------

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

  // ---------------------------------------------------------
  // MODAL
  // ---------------------------------------------------------

  if (!isOpen) return null;

  const isMeasuring = pages === null;

  const pageChunks = isMeasuring
    ? [
        sections
          .filter((section) => section.cells.length > 0)
          .map((section) => ({
            sectionId: section.id,
            start: 0,
            end: section.cells.length,
          })),
      ]
    : pages;

  // ---------------------------------------------------------
  // RENDER
  // ---------------------------------------------------------

  return (
    <div className="modal">
      <div className="modal-inner" ref={modalRef} style={{ display: "flex" }}>
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
                rows={1}
                className="title-input"
                value={formTitle}
                onChange={(e) => {
                  setFormTitle(e.target.value);
                  autoResize("form-title");
                }}
                onInput={() => autoResize("form-title")}
                data-sync-id="form-title"
                style={{
                  resize: "none",
                  overflow: "hidden",
                  overflowWrap: "break-word",
                  wordBreak: "break-word",
                  whiteSpace: "pre-wrap",
                  width: "100%",
                  height: "3rem",
                  minHeight: "0",
                  padding: "0 .5rem",
                  lineHeight: "1.1",
                  fontSize: "1rem",
                  fontFamily: "inherit",
                  border: "1px solid #ccc",
                  borderRadius: "6px",
                  boxSizing: "border-box",
                  alignContent: "center",
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

                      if (!table) return;

                      // The table structure is changing, so remeasure.
                      setPages(null);

                      updateSection(section.id, {
                        tableId: table.id,
                        cells: table.cells.map((row) =>
                          row.map((cell) => ({ ...cell })),
                        ),
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

                {/* LEFT-PANEL TITLE EDITORS */}

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
                            <p className="component-title">Title:</p>

                            <label>
                              <textarea
                                rows={1}
                                data-sync-id={`${section.id}-${rIdx}-${cIdx}`}
                                className="syllabus-input title-cell"
                                value={cell.value || ""}
                                onChange={(e) => {
                                  const newCells = section.cells.map((row) =>
                                    row.map((c) => ({ ...c })),
                                  );

                                  newCells[rIdx][cIdx].value = e.target.value;

                                  updateSection(section.id, {
                                    cells: newCells,
                                  });

                                  autoResize(`${section.id}-${rIdx}-${cIdx}`);
                                }}
                                onInput={() =>
                                  autoResize(`${section.id}-${rIdx}-${cIdx}`)
                                }
                                style={{
                                  display: "block",
                                  resize: "none",
                                  overflow: "hidden",
                                  overflowWrap: "anywhere",
                                  wordBreak: "break-word",
                                  whiteSpace: "pre-wrap",
                                  width: "20rem",
                                  height: "2rem",
                                  minHeight: "0",
                                  padding: "0",
                                  margin: "0",
                                  border: "1px solid black",
                                  background: "none",
                                  fontSize: "14px",
                                  lineHeight: "1.2",
                                  boxSizing: "border-box",
                                  borderRadius: "8px",
                                  alignContent: "center",
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
        {/* RIGHT PANEL / MULTI-PAGE PREVIEW */}
        {/* ================================================= */}

        <div
          className="modal-right"
          style={{
            width: "50%",
            padding: "10px",
            overflowY: "auto",
          }}
        >
          {sections.length === 0 && <p>No sections added yet.</p>}

          <div className="preview-pages">
            {pageChunks.map((page, pageIndex) => (
              <div
                key={pageIndex}
                data-measuring={isMeasuring ? "true" : "false"}
                className={`syllabus-document ${
                  university === "ALTE" ? "alte-document" : ""
                }`}
              >
                {/* ALTE HEADER */}

                {university === "ALTE" && (
                  <div className="syllabus-header">
                    <img src={alteLogo} alt="ALTE University" />
                  </div>
                )}

                {/* PAGE CONTENT */}

                <div className="syllabus-content">
                  {page.map((chunk) => {
                    const section = sections.find(
                      (s) => s.id === chunk.sectionId,
                    );

                    if (!section) return null;

                    return renderSection(section, chunk.start, chunk.end);
                  })}
                </div>

                {/* ALTE FOOTER */}

                {university === "ALTE" && (
                  <div className="syllabus-footer">
                    <span>
                      COPYRIGHT © LLC ALTE UNIVERSITY. THE MATERIALS GIVEN IN
                      THIS SYLLABUS ARE INDICATED FOR PERSONAL AND EDUCATIONAL
                      PURPOSES ONLY. PRIOR WRITTEN PERMISSION MUST BE OBTAINED
                      FROM LLC ALTE UNIVERSITY FOR USE IN ANY ACADEMIC
                      PROGRAM(S), TRAINING(S) OR/AND FOR OTHER PURPOSES |
                      ᲡᲐᲐᲕᲢᲝᲠᲝ ᲣᲤᲚᲔᲑᲐ © ᲨᲞᲡ ᲐᲚᲢᲔ ᲣᲜᲘᲕᲔᲠᲡᲘᲢᲔᲢᲘ - ᲡᲘᲚᲐᲑᲣᲡᲨᲘ
                      ᲛᲝᲪᲔᲛᲣᲚᲘ ᲛᲐᲡᲐᲚᲔᲑᲘ ᲛᲘᲗᲘᲗᲔᲑᲣᲚᲘᲐ ᲛᲮᲝᲚᲝᲓ ᲞᲘᲠᲐᲓᲘ ᲛᲝᲮᲛᲐᲠᲔᲑᲘᲡᲐ ᲓᲐ
                      ᲡᲐᲒᲐᲜᲛᲐᲜᲐᲗᲚᲔᲑᲚᲝ ᲛᲘᲖᲐᲜᲘᲡᲗᲕᲘᲡ.
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* ================================================= */}
        {/* SAVE BUTTON */}
        {/* ================================================= */}

        <button
          type="button"
          className="close-button blue-button"
          onClick={handleSave}
        >
          Save
        </button>
      </div>
    </div>
  );
}
