import React, { useEffect, useLayoutEffect, useState } from "react";
import "./style.css";
import alteLogo from "../../assets/alte/altelogo.png";

export default function ProfRightPanel({
  sections,
  editingCell,
  setEditingCell,
  setSections,
  rightRowRefs,
  autoResize,
  isAdmin,
  onSave,
  university,
}) {
  const [pages, setPages] = useState(null);

  // ---------------------------------------------------------
  // COLUMN COUNT
  // ---------------------------------------------------------

  console.log("University received by ProfRightPanel:", university);

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
  // GLOBAL ROW INDEX
  // ---------------------------------------------------------

  const getGlobalRowIndex = (sectionIndex, rowIndex) => {
    let idx = 0;

    for (let i = 0; i < sectionIndex; i++) {
      idx += sections[i]?.cells?.length || 0;
    }

    return idx + rowIndex;
  };

  // ---------------------------------------------------------
  // UPDATE CELL
  // ---------------------------------------------------------

  const updateCellValue = (sectionIndex, rowIndex, colIndex, value) => {
    const updated = sections.map((section) => ({
      ...section,
      cells: section.cells.map((row) => row.map((cell) => ({ ...cell }))),
    }));

    updated[sectionIndex].cells[rowIndex][colIndex].value = value;

    setSections(updated);
  };

  // ---------------------------------------------------------
  // UPDATE CHECKBOX
  // ---------------------------------------------------------

  const updateCheckbox = (sectionIndex, rowIndex, colIndex, checked) => {
    const updated = sections.map((section) => ({
      ...section,
      cells: section.cells.map((row) => row.map((cell) => ({ ...cell }))),
    }));

    updated[sectionIndex].cells[rowIndex][colIndex].checked = checked;

    setSections(updated);
  };

  // ---------------------------------------------------------
  // EDITING
  // ---------------------------------------------------------

  const handleBlurOrEnter = () => {
    setEditingCell(null);
  };

  // ---------------------------------------------------------
  // SAVE
  // ---------------------------------------------------------

  const handleSaveClick = () => {
    console.log("Saving sections with comments:", sections);

    if (onSave) {
      onSave(sections);
    }
  };

  // ---------------------------------------------------------
  // CALCULATE PAGINATION
  // ---------------------------------------------------------

  useLayoutEffect(() => {
    const calculatePages = () => {
      const preview = document.querySelector(".professor-preview-pages");

      if (!preview) return;

      const contentElement = preview.querySelector(
        ".professor-syllabus-content",
      );

      if (!contentElement) return;

      const availableHeight = contentElement.clientHeight;

      if (availableHeight <= 0) return;

      // Collect rows from every currently rendered page.
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

        // No extra margin between tables.
        const sectionGap = 0;

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

        // Combine consecutive rows from the same section.
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

        usedHeight += rowHeight;
        previousSectionId = sectionId;
      });

      // Don't cause unnecessary renders if page breaks are unchanged.
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

    const frame = requestAnimationFrame(calculatePages);

    return () => cancelAnimationFrame(frame);
  }, [sections, university]);

  // ---------------------------------------------------------
  // RENDER SECTION CHUNK
  // ---------------------------------------------------------

  const renderSection = (
    section,
    sectionIndex,
    start = 0,
    end = section.cells.length,
  ) => {
    if (!section.cells.length) return null;

    const columnWidths = getColumnWidths(section);
    const visibleRows = section.cells.slice(start, end);

    return (
      <div
        key={`${section.id}-${start}-${end}`}
        className="professor-section-table"
      >
        <table
          className="syllabus-table"
          border="1"
          style={{
            width: "100%",
            borderCollapse: "collapse",
            tableLayout: "fixed",
          }}
        >
          <colgroup>
            {columnWidths.map((width, columnIndex) => (
              <col key={columnIndex} style={{ width: `${width}%` }} />
            ))}
          </colgroup>

          <tbody>
            {visibleRows.map((row, localIndex) => {
              const rowIndex = start + localIndex;

              const globalIndex = getGlobalRowIndex(sectionIndex, rowIndex);

              return (
                <tr
                  key={rowIndex}
                  data-section-id={section.id}
                  data-row-index={rowIndex}
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
                      cell.isCheckbox ||
                      !cell.isTitle ||
                      (cell.isTitle && isAdmin);

                    return (
                      <td
                        key={colIndex}
                        className={`table-cell ${
                          cell.isTitle ? "title-cell" : ""
                        } ${cell.isFullWidth ? "wide-cell" : ""} ${
                          cell.isSecondary ? "secondary-cell" : ""
                        } ${cell.isFullHeight ? "full-height-cell" : ""}`}
                        rowSpan={cell.rowSpan}
                        colSpan={
                          cell.isFullWidth
                            ? section.cells[1]?.length || 1
                            : cell.colSpan || 1
                        }
                        onClick={() => {
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
                        {/* CHECKBOX */}

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
                              onChange={(e) =>
                                updateCheckbox(
                                  sectionIndex,
                                  rowIndex,
                                  colIndex,
                                  e.target.checked,
                                )
                              }
                              onClick={(e) => e.stopPropagation()}
                              style={{
                                width: "18px",
                                height: "18px",
                                cursor: "pointer",
                              }}
                            />
                          </div>
                        ) : isEditing ? (
                          /* EDITING CELL */

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
                          /* NORMAL DISPLAY CELL */

                          <span
                            style={{
                              display: "block",
                              whiteSpace: "pre-wrap",
                              overflowWrap: "anywhere",
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
  };

  // ---------------------------------------------------------
  // PAGE CHUNKS
  // ---------------------------------------------------------

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
    <div className="modal-right-wrapper">
      <div className="modal-right">
        {sections.length === 0 ? (
          <p>No sections available.</p>
        ) : (
          <div className="professor-preview-pages">
            {pageChunks.map((page, pageIndex) => (
              <div key={pageIndex} className="professor-syllabus-page">
                {/* HEADER */}

                {university === "ALTE" && (
                  <div className="syllabus-header-right">
                    <img src={alteLogo} alt="ALTE University" />
                  </div>
                )}

                {/* PAGE CONTENT */}

                <div className="professor-syllabus-content">
                  {page.map((chunk) => {
                    const sectionIndex = sections.findIndex(
                      (section) => section.id === chunk.sectionId,
                    );

                    const section = sections[sectionIndex];

                    if (!section) return null;

                    return renderSection(
                      section,
                      sectionIndex,
                      chunk.start,
                      chunk.end,
                    );
                  })}
                </div>

                {/* FOOTER */}

                {university === "ALTE" && (
                  <div className="syllabus-footer-right">
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
        )}
      </div>

      {/* FIXED SAVE BUTTON */}

      <button onClick={handleSaveClick} className="save-button">
        Save Responses
      </button>
    </div>
  );
}
