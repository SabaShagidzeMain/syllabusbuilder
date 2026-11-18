import React, { useLayoutEffect, useState } from "react";
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

  console.log("University received by ProfRightPanel:", university);

  // ---------------------------------------------------------
  // SECTION HELPERS
  // ---------------------------------------------------------

  const isCustomLayout = (section) =>
    section?.type === "custom-layout" || section?.tableId === "custom-layout";

  const getSectionRowCount = (section) => {
    if (isCustomLayout(section)) {
      return 1;
    }

    return Array.isArray(section?.cells) ? section.cells.length : 0;
  };

  const hasRenderableContent = (section) => {
    if (isCustomLayout(section)) {
      return Array.isArray(section.content) && section.content.length > 0;
    }

    return Array.isArray(section?.cells) && section.cells.length > 0;
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
  // GLOBAL ROW INDEX
  // ---------------------------------------------------------

  const getGlobalRowIndex = (sectionIndex, rowIndex) => {
    let idx = 0;

    for (let i = 0; i < sectionIndex; i++) {
      idx += getSectionRowCount(sections[i]);
    }

    return idx + rowIndex;
  };

  // ---------------------------------------------------------
  // UPDATE NORMAL TABLE CELL
  // ---------------------------------------------------------

  const updateCellValue = (sectionIndex, rowIndex, colIndex, value) => {
    setSections((previous) =>
      previous.map((section, currentSectionIndex) => {
        if (currentSectionIndex !== sectionIndex) return section;

        return {
          ...section,
          cells: section.cells.map((row, currentRowIndex) =>
            currentRowIndex !== rowIndex
              ? row
              : row.map((cell, currentColIndex) =>
                  currentColIndex !== colIndex ? cell : { ...cell, value },
                ),
          ),
        };
      }),
    );
  };

  // ---------------------------------------------------------
  // UPDATE NORMAL TABLE CHECKBOX
  // ---------------------------------------------------------

  const updateCheckbox = (sectionIndex, rowIndex, colIndex, checked) => {
    setSections((previous) =>
      previous.map((section, currentSectionIndex) => {
        if (currentSectionIndex !== sectionIndex) return section;

        return {
          ...section,
          cells: section.cells.map((row, currentRowIndex) =>
            currentRowIndex !== rowIndex
              ? row
              : row.map((cell, currentColIndex) =>
                  currentColIndex !== colIndex ? cell : { ...cell, checked },
                ),
          ),
        };
      }),
    );
  };

  // ---------------------------------------------------------
  // UPDATE CUSTOM TEXT BLOCK
  // ---------------------------------------------------------

  const updateCustomText = (sectionIndex, contentIndex, value) => {
    setSections((previous) =>
      previous.map((section, currentSectionIndex) => {
        if (currentSectionIndex !== sectionIndex) return section;

        return {
          ...section,
          content: section.content.map((block, currentIndex) =>
            currentIndex !== contentIndex ? block : { ...block, value },
          ),
        };
      }),
    );
  };

  // ---------------------------------------------------------
  // UPDATE CUSTOM NESTED TABLE CELL
  // ---------------------------------------------------------

  const updateCustomTableCell = (
    sectionIndex,
    contentIndex,
    rowIndex,
    colIndex,
    value,
  ) => {
    setSections((previous) =>
      previous.map((section, currentSectionIndex) => {
        if (currentSectionIndex !== sectionIndex) return section;

        return {
          ...section,
          content: section.content.map((block, currentContentIndex) => {
            if (currentContentIndex !== contentIndex) return block;

            return {
              ...block,
              rows: block.rows.map((row, currentRowIndex) =>
                currentRowIndex !== rowIndex
                  ? row
                  : row.map((cell, currentColIndex) =>
                      currentColIndex !== colIndex ? cell : { ...cell, value },
                    ),
              ),
            };
          }),
        };
      }),
    );
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
  // PAGINATION
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

      // Normal table rows and custom-layout section wrappers
      const rows = Array.from(
        preview.querySelectorAll("[data-section-id][data-row-index]"),
      );

      const calculatedPages = [[]];

      let currentPage = 0;
      let usedHeight = 0;

      rows.forEach((row) => {
        const sectionId = row.dataset.sectionId;
        const rowIndex = Number(row.dataset.rowIndex);
        const rowHeight = row.getBoundingClientRect().height;

        if (rowHeight <= 0) return;

        if (
          calculatedPages[currentPage].length > 0 &&
          usedHeight + rowHeight > availableHeight
        ) {
          calculatedPages.push([]);
          currentPage++;
          usedHeight = 0;
        }

        const currentEntries = calculatedPages[currentPage];
        const lastEntry = currentEntries[currentEntries.length - 1];

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
      });

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
  // RENDER CUSTOM CONTENT BLOCK
  // ---------------------------------------------------------

  const renderCustomBlock = (block, sectionIndex, contentIndex) => {
    if (!block) return null;

    // TEXT BLOCK
    if (block.type === "text") {
      const isEditing =
        editingCell?.type === "custom-text" &&
        editingCell.sectionIndex === sectionIndex &&
        editingCell.contentIndex === contentIndex;

      const editable = !block.isTitle || isAdmin;

      return (
        <div
          key={block.id || contentIndex}
          className="professor-custom-text"
          onClick={() => {
            if (editable) {
              setEditingCell({
                type: "custom-text",
                sectionIndex,
                contentIndex,
              });
            }
          }}
          style={{
            cursor: editable ? "pointer" : "default",
            whiteSpace: "pre-wrap",
            overflowWrap: "anywhere",
            wordBreak: "break-word",
            minWidth: 0,
          }}
        >
          {isEditing ? (
            <textarea
              autoFocus
              value={block.value || ""}
              onChange={(e) =>
                updateCustomText(sectionIndex, contentIndex, e.target.value)
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
                maxWidth: "100%",
                minHeight: "40px",
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
            <span>
              {block.value || <span className="placeholder-cell"></span>}
            </span>
          )}
        </div>
      );
    }

    // NESTED TABLE BLOCK
    if (block.type === "table") {
      return (
        <table
          key={block.id || contentIndex}
          className="syllabus-table professor-custom-table custom-layout-nested-table"
          border="1"
          style={{
            width: "100%",
            borderCollapse: "collapse",
            tableLayout: "fixed",
          }}
        >
          <tbody>
            {(block.rows || []).map((row, rowIndex) => (
              <tr key={rowIndex}>
                {row.map((cell, colIndex) => {
                  const isEditing =
                    editingCell?.type === "custom-table" &&
                    editingCell.sectionIndex === sectionIndex &&
                    editingCell.contentIndex === contentIndex &&
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
                      } ${cell.isSecondary ? "secondary-cell" : ""}`}
                      rowSpan={cell.rowSpan}
                      colSpan={cell.colSpan || 1}
                      onClick={() => {
                        if (editable && !cell.isCheckbox) {
                          setEditingCell({
                            type: "custom-table",
                            sectionIndex,
                            contentIndex,
                            rowIndex,
                            colIndex,
                          });
                        }
                      }}
                      style={{
                        cursor: editable ? "pointer" : "default",
                        boxSizing: "border-box",
                        overflow: "hidden",
                      }}
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
                              const checked = e.target.checked;

                              setSections((previous) =>
                                previous.map((section, currentSectionIndex) => {
                                  if (currentSectionIndex !== sectionIndex) {
                                    return section;
                                  }

                                  return {
                                    ...section,
                                    content: section.content.map(
                                      (currentBlock, currentContentIndex) => {
                                        if (
                                          currentContentIndex !== contentIndex
                                        ) {
                                          return currentBlock;
                                        }

                                        return {
                                          ...currentBlock,
                                          rows: currentBlock.rows.map(
                                            (currentRow, currentRowIndex) =>
                                              currentRowIndex !== rowIndex
                                                ? currentRow
                                                : currentRow.map(
                                                    (
                                                      currentCell,
                                                      currentColIndex,
                                                    ) =>
                                                      currentColIndex !==
                                                      colIndex
                                                        ? currentCell
                                                        : {
                                                            ...currentCell,
                                                            checked,
                                                          },
                                                  ),
                                          ),
                                        };
                                      },
                                    ),
                                  };
                                }),
                              );
                            }}
                            onClick={(e) => e.stopPropagation()}
                            style={{
                              width: "18px",
                              height: "18px",
                              cursor: "pointer",
                            }}
                          />
                        </div>
                      ) : isEditing ? (
                        <textarea
                          autoFocus
                          value={cell.value || ""}
                          onChange={(e) =>
                            updateCustomTableCell(
                              sectionIndex,
                              contentIndex,
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
            ))}
          </tbody>
        </table>
      );
    }

    return null;
  };

  // ---------------------------------------------------------
  // RENDER CUSTOM SECTION
  // ---------------------------------------------------------

  const renderCustomSection = (section, sectionIndex) => {
    const blocks = section.content || [];

    return (
      <div
        key={section.id}
        className="professor-custom-layout"
        data-section-id={section.id}
        data-row-index="0"
      >
        <table className="custom-layout-outer-table">
          <tbody>
            <tr>
              {/* LEFT HEADER CELL */}
              <td className="custom-layout-header-cell">
                {section.header || ""}
              </td>

              {/* RIGHT CONTENT CELL */}
              <td className="custom-layout-content-cell">
                <div className="custom-layout-content-block">
                  {blocks.map((block, contentIndex) => (
                    <div
                      key={block.id || contentIndex}
                      className={
                        block.type === "text"
                          ? "custom-layout-text-block"
                          : "custom-layout-table-block"
                      }
                    >
                      {renderCustomBlock(block, sectionIndex, contentIndex)}
                    </div>
                  ))}
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  };

  // ---------------------------------------------------------
  // RENDER NORMAL SECTION CHUNK
  // ---------------------------------------------------------

  const renderSection = (
    section,
    sectionIndex,
    start = 0,
    end = getSectionRowCount(section),
  ) => {
    if (isCustomLayout(section)) {
      if (start > 0 || end <= 0) return null;

      return renderCustomSection(section, sectionIndex);
    }

    if (!section.cells?.length) return null;

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
                      editingCell?.type !== "custom-text" &&
                      editingCell?.type !== "custom-table" &&
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
        sections.filter(hasRenderableContent).map((section) => ({
          sectionId: section.id,
          start: 0,
          end: getSectionRowCount(section),
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
