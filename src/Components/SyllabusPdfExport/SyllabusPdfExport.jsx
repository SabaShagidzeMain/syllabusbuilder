import React, { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "../../utility/supabaseClient";
import { useReactToPrint } from "react-to-print";

import "./style.css";

export default function SyllabusPdfExport() {
  const { syllabusId } = useParams();

  const [formTitle, setFormTitle] = useState("");
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const contentRef = useRef(null);

  /* =========================================
     CLONE
  ========================================= */

  const cloneSections = (data) => {
    if (!Array.isArray(data)) {
      return [];
    }

    return JSON.parse(JSON.stringify(data));
  };

  /* =========================================
     GET COLUMN COUNT
  ========================================= */

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

  /* =========================================
     GET COLUMN WIDTHS
  ========================================= */

  const getColumnWidths = (section) => {
    const columnCount = getColumnCount(section);

    /*
     * Use saved widths from the builder.
     */

    if (
      Array.isArray(section?.columnWidths) &&
      section.columnWidths.length === columnCount
    ) {
      return section.columnWidths;
    }

    /*
     * Default:
     *
     * Column 1 = 30%
     * Remaining columns = 70%
     */

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

  /* =========================================
     APPLY INSTANCE OVERRIDES
  ========================================= */

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

      Object.entries(sectionOverrides).forEach(([cellPosition, override]) => {
        const [rowIndex, cellIndex] = cellPosition.split("-").map(Number);

        const targetSection = result.find((s) => s.id === section.id);

        const targetCell = targetSection?.cells?.[rowIndex]?.[cellIndex];

        if (!targetCell) {
          return;
        }

        /*
         * Support both the old format:
         *
         * "0-1": "some text"
         *
         * and the newer object format:
         *
         * "0-1": {
         *   value: "some text",
         *   checked: true
         * }
         */

        if (
          override &&
          typeof override === "object" &&
          !Array.isArray(override)
        ) {
          if ("value" in override) {
            targetCell.value = override.value;
          }

          if ("checked" in override) {
            targetCell.checked = override.checked;
          }
        } else {
          /*
           * Backwards compatibility with
           * existing overrides.
           */

          targetCell.value = override;
        }
      });
    });

    return result;
  };

  /* =========================================
     FETCH
  ========================================= */

  useEffect(() => {
    const fetchSyllabus = async () => {
      try {
        setLoading(true);
        setError(null);

        console.log("Export: fetching prof form:", syllabusId);

        /* -----------------------------------------
           1. GET PROFESSOR FORM
        ----------------------------------------- */

        const { data: profForm, error: profFormError } = await supabase
          .from("prof_forms")
          .select("*")
          .eq("id", syllabusId)
          .single();

        if (profFormError) {
          throw new Error(profFormError.message);
        }

        if (!profForm) {
          throw new Error("Professor syllabus not found.");
        }

        console.log("Export: prof form:", profForm);

        setFormTitle(profForm.title || "Syllabus");

        /* -----------------------------------------
           2. IF CONTENT EXISTS, USE IT
        ----------------------------------------- */

        if (Array.isArray(profForm.content) && profForm.content.length > 0) {
          console.log("Export: using prof_forms.content");

          /*
           * IMPORTANT:
           *
           * This content already contains:
           *
           * - columnWidths
           * - checkbox states
           * - cell values
           *
           * so don't rebuild it.
           */

          setSections(cloneSections(profForm.content));

          setLoading(false);

          return;
        }

        /* -----------------------------------------
           3. GET INSTANCE USING origin_id
        ----------------------------------------- */

        if (!profForm.origin_id) {
          throw new Error("This professor form has no origin_id.");
        }

        console.log("Export: fetching instance:", profForm.origin_id);

        const { data: instance, error: instanceError } = await supabase
          .from("syllabus_forms")
          .select("*")
          .eq("id", profForm.origin_id)
          .single();

        if (instanceError) {
          throw new Error(instanceError.message);
        }

        if (!instance) {
          throw new Error("Origin syllabus instance not found.");
        }

        console.log("Export: instance:", instance);

        /* -----------------------------------------
           4. GET MAIN SYLLABUS
        ----------------------------------------- */

        let baseContent = instance.content || [];

        if (instance.syllabus_type === "instance" && instance.parent_id) {
          console.log("Export: fetching main syllabus:", instance.parent_id);

          const { data: mainSyllabus, error: mainError } = await supabase
            .from("syllabus_forms")
            .select("content")
            .eq("id", instance.parent_id)
            .single();

          if (mainError) {
            throw new Error(mainError.message);
          }

          if (!mainSyllabus) {
            throw new Error("Main syllabus not found.");
          }

          baseContent = mainSyllabus.content || [];
        }

        /* -----------------------------------------
           5. APPLY INSTANCE OVERRIDES
        ----------------------------------------- */

        const resolvedContent = applyOverrides(
          baseContent,
          instance.overrides || {},
        );

        console.log("Export: resolved sections:", resolvedContent);

        setSections(resolvedContent);
        setLoading(false);
      } catch (err) {
        console.error("Export error:", err);

        setError(err.message || "Failed to load syllabus.");

        setLoading(false);
      }
    };

    if (syllabusId) {
      fetchSyllabus();
    } else {
      setError("No syllabus ID provided.");

      setLoading(false);
    }
  }, [syllabusId]);

  /* =========================================
     PRINT
  ========================================= */

  const handlePrint = useReactToPrint({
    contentRef,
    documentTitle: formTitle || "syllabus",

    onAfterPrint: () => {
      console.log("Print done");
    },
  });

  /* =========================================
     LOADING
  ========================================= */

  if (loading) {
    return <p>Loading...</p>;
  }

  /* =========================================
     ERROR
  ========================================= */

  if (error) {
    return <p style={{ color: "red" }}>{error}</p>;
  }

  /* =========================================
     UI
  ========================================= */

  return (
    <div style={{ padding: 40 }}>
      <button onClick={handlePrint} className="dwnld-btn">
        Download PDF
      </button>

      <div ref={contentRef} className="export-wrapper">
        {/* =====================================
            FIRST PAGE
        ===================================== */}

        <div className="first-page page">
          <div className="title-container">
            <h1 className="form-title">{formTitle}</h1>
          </div>
        </div>

        {/* =====================================
            SYLLABUS
        ===================================== */}

        <div className="other-pages page">
          {sections.map((section, sIdx) => {
            if (!section.cells?.length) {
              return null;
            }

            const columnWidths = getColumnWidths(section);

            return (
              <table
                className="syllabus-table"
                key={section.id || sIdx}
                style={{
                  width: "100%",
                  tableLayout: "fixed",
                  borderCollapse: "collapse",
                }}
              >
                {/* =================================
                    COLUMN WIDTHS
                ================================= */}

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
                    <tr
                      key={rIdx}
                      style={{
                        breakInside: "avoid",
                        pageBreakInside: "avoid",
                      }}
                    >
                      {row.map((cell, cIdx) => (
                        <td
                          key={cIdx}
                          rowSpan={cell.rowSpan || 1}
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
                          style={{
                            whiteSpace: "pre-wrap",
                            wordBreak: "break-word",
                            overflowWrap: "break-word",
                            boxSizing: "border-box",
                            padding: "6px 8px",
                            verticalAlign: "top",
                          }}
                        >
                          {/* ===============================
                                  CHECKBOX
                              =============================== */}

                          {cell.isCheckbox ? (
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                width: "100%",
                                minHeight: "20px",
                              }}
                            >
                              <input
                                type="checkbox"
                                checked={cell.checked || false}
                                readOnly
                                style={{
                                  width: "18px",
                                  height: "18px",
                                  margin: 0,
                                }}
                              />
                            </div>
                          ) : (
                            cell.value || <em>&nbsp;</em>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            );
          })}
        </div>
      </div>
    </div>
  );
}
