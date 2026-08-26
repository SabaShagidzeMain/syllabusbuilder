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

      Object.entries(sectionOverrides).forEach(([cellPosition, value]) => {
        const [rowIndex, cellIndex] = cellPosition.split("-").map(Number);

        const targetSection = result.find((s) => s.id === section.id);

        if (targetSection?.cells?.[rowIndex]?.[cellIndex]) {
          targetSection.cells[rowIndex][cellIndex].value = value;
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

          setSections(profForm.content);
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
        {/* FIRST PAGE */}

        <div className="first-page page">
          <div className="title-container">
            <h1 className="form-title">{formTitle}</h1>
          </div>
        </div>

        {/* SYLLABUS */}

        <div className="other-pages page">
          {sections.map((section, sIdx) =>
            section.cells?.length > 0 ? (
              <table className="syllabus-table" key={section.id || sIdx}>
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
                            cell.isFullWidth ? section.cells[1]?.length || 1 : 1
                          }
                          className={`
                                  table-cell
                                  ${cell.isTitle ? "title-cell" : ""}
                                  ${cell.isFullWidth ? "wide-cell" : ""}
                                  ${cell.isSecondary ? "secondary-cell" : ""}
                                `}
                          style={{
                            whiteSpace: "pre-wrap",
                            wordBreak: "break-word",
                            maxWidth: "300px",
                            minWidth: "100px",
                            padding: "6px 8px",
                            verticalAlign: "top",
                          }}
                        >
                          {cell.value || <em>&nbsp;</em>}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : null,
          )}
        </div>
      </div>
    </div>
  );
}
