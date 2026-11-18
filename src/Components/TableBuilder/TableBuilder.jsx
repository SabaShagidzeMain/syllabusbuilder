import React, { useRef, useEffect, useState, useLayoutEffect } from "react";

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

        if (section.cells?.[rowIndex]?.[cellIndex]) {
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

      if (!baseSection || !Array.isArray(editedSection.cells)) return;

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

  const createCustomLayout = (sectionId) => {
    setSections((prev) =>
      prev.map((section) =>
        section.id === sectionId
          ? {
              ...section,
              type: "custom-layout",
              tableId: "custom-layout",
              header: "Header",
              content: [],
              cells: undefined,
              columnWidths: undefined,
            }
          : section,
      ),
    );
  };

  const addCustomContentBlock = (sectionId, type) => {
    setSections((prev) =>
      prev.map((section) => {
        if (section.id !== sectionId) return section;

        const block =
          type === "text"
            ? {
                id: `${Date.now()}-${Math.random()}`,
                type: "text",
                value: "",
              }
            : {
                id: `${Date.now()}-${Math.random()}`,
                type: "table",
                rows: [
                  [{ value: "" }, { value: "" }],
                  [{ value: "" }, { value: "" }],
                ],
              };

        return {
          ...section,
          content: [...(section.content || []), block],
        };
      }),
    );
  };

  const updateCustomContentBlock = (sectionId, blockId, updater) => {
    setSections((prev) =>
      prev.map((section) => {
        if (section.id !== sectionId) return section;

        return {
          ...section,
          content: (section.content || []).map((block) =>
            block.id === blockId ? updater(block) : block,
          ),
        };
      }),
    );
  };

  const removeCustomContentBlock = (sectionId, blockId) => {
    setSections((prev) =>
      prev.map((section) =>
        section.id === sectionId
          ? {
              ...section,
              content: (section.content || []).filter(
                (block) => block.id !== blockId,
              ),
            }
          : section,
      ),
    );
  };

  const updateSection = (id, changes) => {
    setSections((prev) =>
      prev.map((section) =>
        section.id === id ? { ...section, ...changes } : section,
      ),
    );
  };

  const removeSection = (id) => {
    setSections((prev) => prev.filter((section) => section.id !== id));
  };

  // ---------------------------------------------------------
  // TEXTAREA AUTO RESIZE
  // ---------------------------------------------------------

  function autoResize(syncId) {
    const textareas = document.querySelectorAll(`[data-sync-id='${syncId}']`);

    textareas.forEach((textarea) => {
      textarea.style.height = "auto";
      textarea.style.height = `${textarea.scrollHeight}px`;
    });
  }

  // ---------------------------------------------------------
  // RESIZE TEXTAREAS AFTER RENDER
  // ---------------------------------------------------------

  useLayoutEffect(() => {
    if (!isOpen) return;

    const resizeAllTextareas = () => {
      const textareas = document.querySelectorAll(
        ".syllabus-document textarea, .modal-left textarea",
      );

      textareas.forEach((textarea) => {
        textarea.style.height = "auto";
        textarea.style.height = `${textarea.scrollHeight}px`;
      });
    };

    resizeAllTextareas();

    const frame = requestAnimationFrame(resizeAllTextareas);

    return () => cancelAnimationFrame(frame);
  }, [sections, isOpen]);

  // ---------------------------------------------------------
  // CUSTOM LAYOUT ITEMS
  // ---------------------------------------------------------

  const getCustomLayoutItems = (section) => {
    const items = [];

    (section.content || []).forEach((block) => {
      if (block.type === "text") {
        items.push({
          type: "text",
          block,
        });
      }

      if (block.type === "table") {
        (block.rows || []).forEach((row, rowIndex) => {
          items.push({
            type: "table-row",
            block,
            row,
            rowIndex,
            isLastRow: rowIndex === block.rows.length - 1,
          });
        });
      }
    });

    if (items.length === 0) {
      items.push({ type: "empty" });
    }

    return items;
  };

  // ---------------------------------------------------------
  // RENDER SECTION
  // ---------------------------------------------------------

  const renderSection = (section) => {
    // =======================================================
    // CUSTOM TWO-CELL LAYOUT
    // =======================================================

    if (
      section.type === "custom-layout" ||
      section.tableId === "custom-layout"
    ) {
      const visibleItems = getCustomLayoutItems(section);

      const isEmptySection =
        visibleItems.length === 1 && visibleItems[0].type === "empty";

      return (
        <div
          key={section.id}
          style={{
            width: "100%",
            marginBottom: 0,
          }}
        >
          <table
            className="syllabus-table custom-layout-outer-table"
            border="1"
            style={{
              width: "100%",
              maxWidth: "100%",
              tableLayout: "fixed",
              borderCollapse: "collapse",
            }}
          >
            <colgroup>
              <col style={{ width: "30%" }} />
              <col style={{ width: "70%" }} />
            </colgroup>

            <tbody>
              <tr
                data-section-id={isEmptySection ? section.id : undefined}
                data-row-index={isEmptySection ? 0 : undefined}
              >
                {/* LEFT HEADER CELL */}

                <td className="table-cell custom-layout-header-cell">
                  {isAdmin ? (
                    <textarea
                      rows={1}
                      className="syllabus-input title-cell"
                      value={section.header || ""}
                      onChange={(e) =>
                        updateSection(section.id, {
                          header: e.target.value,
                        })
                      }
                    />
                  ) : (
                    <div className="normal-cell">{section.header}</div>
                  )}
                </td>

                {/* RIGHT CONTENT CELL */}

                <td className="table-cell custom-layout-content-cell">
                  <div className="custom-layout-content-block">
                    {visibleItems.map((item, itemIndex) => {
                      if (item.type === "empty") {
                        return null;
                      }

                      // ---------------------------------------
                      // TEXT BLOCK
                      // ---------------------------------------

                      if (item.type === "text") {
                        return (
                          <div
                            key={item.block.id}
                            className="custom-layout-text-block"
                            data-section-id={section.id}
                            data-row-index={itemIndex}
                          >
                            {isAdmin ? (
                              <textarea
                                rows={1}
                                className="syllabus-input custom-layout-text-input"
                                value={item.block.value || ""}
                                onChange={(e) => {
                                  updateCustomContentBlock(
                                    section.id,
                                    item.block.id,
                                    (current) => ({
                                      ...current,
                                      value: e.target.value,
                                    }),
                                  );

                                  e.target.style.height = "auto";
                                  e.target.style.height = `${e.target.scrollHeight}px`;
                                }}
                                onInput={(e) => {
                                  e.target.style.height = "auto";
                                  e.target.style.height = `${e.target.scrollHeight}px`;
                                }}
                                style={{
                                  display: "block",
                                  width: "100%",
                                  minWidth: 0,
                                  height: "auto",
                                  minHeight: "1.3em",
                                  maxHeight: "none",
                                  padding: 0,
                                  margin: 0,
                                  border: "none",
                                  resize: "none",
                                  overflow: "hidden",
                                  overflowWrap: "anywhere",
                                  wordBreak: "break-word",
                                  whiteSpace: "pre-wrap",
                                  boxSizing: "border-box",
                                  background: "transparent",
                                  lineHeight: "1.3",
                                }}
                              />
                            ) : (
                              <div className="normal-cell">
                                {item.block.value}
                              </div>
                            )}
                          </div>
                        );
                      }

                      // ---------------------------------------
                      // TABLE BLOCK
                      // ---------------------------------------

                      const isFirstVisibleRowOfBlock =
                        itemIndex === 0 ||
                        visibleItems[itemIndex - 1].block?.id !== item.block.id;

                      if (!isFirstVisibleRowOfBlock) return null;

                      const blockRows = visibleItems
                        .map((entry) => ({
                          entry,
                        }))
                        .filter(
                          ({ entry }) =>
                            entry.type === "table-row" &&
                            entry.block.id === item.block.id,
                        );

                      const columnCount = Math.max(
                        1,
                        item.block.rows?.[0]?.length || 1,
                      );

                      return (
                        <div
                          key={item.block.id}
                          className="custom-layout-table-block"
                        >
                          <table
                            className="syllabus-table custom-layout-nested-table"
                            border="0"
                            style={{
                              width: "100%",
                              maxWidth: "100%",
                              tableLayout: "fixed",
                              borderCollapse: "collapse",
                            }}
                          >
                            <colgroup>
                              {Array.from(
                                { length: columnCount },
                                (_, columnIndex) => (
                                  <col
                                    key={columnIndex}
                                    style={{
                                      width: `${100 / columnCount}%`,
                                    }}
                                  />
                                ),
                              )}
                            </colgroup>

                            <tbody>
                              {blockRows.map(({ entry }) => {
                                const absoluteIndex =
                                  visibleItems.indexOf(entry);

                                return (
                                  <tr
                                    key={entry.rowIndex}
                                    data-section-id={section.id}
                                    data-row-index={absoluteIndex}
                                  >
                                    {entry.row.map((cell, cellIndex) => (
                                      <td
                                        className="table-cell"
                                        key={cellIndex}
                                      >
                                        {isAdmin ? (
                                          <textarea
                                            rows={1}
                                            className="syllabus-input"
                                            value={cell.value || ""}
                                            onChange={(e) =>
                                              updateCustomContentBlock(
                                                section.id,
                                                item.block.id,
                                                (current) => ({
                                                  ...current,
                                                  rows: current.rows.map(
                                                    (row, rowIndex) =>
                                                      row.map((c, ci) =>
                                                        rowIndex ===
                                                          entry.rowIndex &&
                                                        ci === cellIndex
                                                          ? {
                                                              ...c,
                                                              value:
                                                                e.target.value,
                                                            }
                                                          : { ...c },
                                                      ),
                                                  ),
                                                }),
                                              )
                                            }
                                            onInput={(e) => {
                                              e.target.style.height = "auto";
                                              e.target.style.height = `${e.target.scrollHeight}px`;
                                            }}
                                            style={{
                                              display: "block",
                                              width: "100%",
                                              minWidth: 0,
                                              height: "auto",
                                              minHeight: 0,
                                              padding: 0,
                                              margin: 0,
                                              border: "none",
                                              resize: "none",
                                              overflow: "hidden",
                                              overflowWrap: "anywhere",
                                              wordBreak: "break-word",
                                              whiteSpace: "pre-wrap",
                                              boxSizing: "border-box",
                                              background: "transparent",
                                            }}
                                          />
                                        ) : (
                                          <div className="normal-cell">
                                            {cell.value}
                                          </div>
                                        )}
                                      </td>
                                    ))}
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>

                          {/* TABLE ACTIONS */}

                          {isAdmin &&
                            blockRows.some(({ entry }) => entry.isLastRow) && (
                              <div className="custom-layout-table-actions">
                                <button
                                  type="button"
                                  onClick={() => {
                                    updateCustomContentBlock(
                                      section.id,
                                      item.block.id,
                                      (current) => ({
                                        ...current,
                                        rows: [
                                          ...(current.rows || []).map((row) =>
                                            row.map((cell) => ({ ...cell })),
                                          ),
                                          Array(current.rows?.[0]?.length || 2)
                                            .fill(null)
                                            .map(() => ({ value: "" })),
                                        ],
                                      }),
                                    );
                                  }}
                                >
                                  + Row
                                </button>

                                <button
                                  type="button"
                                  onClick={() => {
                                    updateCustomContentBlock(
                                      section.id,
                                      item.block.id,
                                      (current) => ({
                                        ...current,
                                        rows: (current.rows || []).map(
                                          (row) => [
                                            ...row.map((cell) => ({ ...cell })),
                                            { value: "" },
                                          ],
                                        ),
                                      }),
                                    );
                                  }}
                                >
                                  + Column
                                </button>
                              </div>
                            )}
                        </div>
                      );
                    })}
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      );
    }

    // =======================================================
    // NORMAL PREDEFINED TABLE
    // =======================================================

    if (!section.cells?.length) return null;

    const columnWidths = getColumnWidths(section);
    const visibleRows = section.cells;

    return (
      <div
        key={section.id}
        style={{
          position: "relative",
          width: "100%",
          marginBottom: 0,
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
              const rIdx = localIndex;

              return (
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
                            minHeight: 0,
                            padding: 0,
                            margin: 0,
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
                  minHeight: 0,
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
                    value={section.tableId || ""}
                    onChange={(e) => {
                      if (e.target.value === "custom-layout") {
                        createCustomLayout(section.id);
                        return;
                      }

                      const table = predefinedTables.find(
                        (t) => t.id === e.target.value,
                      );

                      if (!table) return;

                      updateSection(section.id, {
                        type: "table",
                        tableId: table.id,
                        cells: table.cells.map((row) =>
                          row.map((cell) => ({ ...cell })),
                        ),
                        header: undefined,
                        content: undefined,
                        columnWidths: undefined,
                      });
                    }}
                  >
                    <option value="">-- Select --</option>

                    <option value="custom-layout">
                      Custom Two-Cell Layout
                    </option>

                    {predefinedTables.map((table) => (
                      <option key={table.id} value={table.id}>
                        {table.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* LEFT-PANEL TITLE EDITORS */}

                {section.type !== "custom-layout" &&
                  section.tableId !== "custom-layout" &&
                  section.cells?.length > 0 &&
                  isAdmin && (
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
                                    minHeight: 0,
                                    padding: 0,
                                    margin: 0,
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

                {/* CUSTOM LAYOUT EDITOR */}

                {(section.type === "custom-layout" ||
                  section.tableId === "custom-layout") && (
                  <div className="custom-layout-controls">
                    <label className="component-title">Left cell header:</label>

                    <textarea
                      rows={2}
                      className="syllabus-input"
                      value={section.header || ""}
                      onChange={(e) =>
                        updateSection(section.id, {
                          header: e.target.value,
                        })
                      }
                    />

                    <p className="component-title">Right cell content:</p>

                    {(section.content || []).map((block, index) => (
                      <div
                        className="custom-layout-block-control"
                        key={block.id}
                      >
                        <span>
                          {index + 1}.{" "}
                          {block.type === "text" ? "Text block" : "Table"}
                        </span>

                        <button
                          type="button"
                          onClick={() =>
                            removeCustomContentBlock(section.id, block.id)
                          }
                        >
                          Remove
                        </button>
                      </div>
                    ))}

                    <div className="custom-layout-add-actions">
                      <button
                        type="button"
                        onClick={() =>
                          addCustomContentBlock(section.id, "text")
                        }
                      >
                        + Add Text
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          addCustomContentBlock(section.id, "table")
                        }
                      >
                        + Add Table
                      </button>
                    </div>

                    <p className="custom-layout-hint">
                      Content is stacked vertically in the right cell. Nested
                      tables use the same table styling as the existing syllabus
                      tables.
                    </p>
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
        {/* RIGHT PANEL / CONTINUOUS DOCUMENT */}
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
            <div
              className="syllabus-document"
              style={{
                height: "auto",
                minHeight: 0,
                overflow: "visible",
              }}
            >
              <div
                className="syllabus-content"
                style={{
                  height: "auto",
                  minHeight: 0,
                  overflow: "visible",
                }}
              >
                {sections
                  .filter(
                    (section) =>
                      section.type === "custom-layout" ||
                      section.tableId === "custom-layout" ||
                      section.cells?.length > 0,
                  )
                  .map((section) => renderSection(section))}
              </div>
            </div>
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
