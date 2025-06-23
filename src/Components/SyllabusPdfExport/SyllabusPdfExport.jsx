import React, { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "../../utility/supabaseClient";
import { useReactToPrint } from "react-to-print";
import banner from "../../assets/alte/banner.png";
import "./style.css";

export default function SyllabusPdfExport() {
  const { syllabusId } = useParams();
  const [formTitle, setFormTitle] = useState("");
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const contentRef = useRef(null);

  useEffect(() => {
    async function fetchSyllabus() {
      const { data, error } = await supabase
        .from("prof_forms")
        .select("title, content")
        .eq("id", syllabusId)
        .single();

      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }

      setFormTitle(data.title);
      setSections(data.content || []);
      setLoading(false);
    }

    if (syllabusId) {
      fetchSyllabus();
    } else {
      setError("No syllabus ID provided.");
      setLoading(false);
    }
  }, [syllabusId]);

  const handlePrint = useReactToPrint({
    contentRef,
    documentTitle: formTitle || "syllabus",
    onAfterPrint: () => console.log("Print done"),
  });

  if (loading) return <p>Loading...</p>;
  if (error) return <p style={{ color: "red" }}>{error}</p>;

  return (
    <div style={{ padding: 40 }}>
      <button onClick={handlePrint} className="dwnld-btn">
        Download PDF
      </button>

      <div ref={contentRef} className="export-wrapper">
        <div className="first-page page">
          <div className="title-container">
            <h1 className="form-title">{formTitle}</h1>
          </div>
        </div>

        <div className="other-pages page">
          {sections.map((section, sIdx) =>
            section.cells.length > 0 ? (
              <table className="syllabus-table" key={sIdx}>
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
                          className={`table-cell ${cell.isTitle ? "title-cell" : ""}
                            ${cell.isFullWidth ? "wide-cell" : ""}
                            ${cell.isSecondary ? "secondary-cell" : ""}`}
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
            ) : null
          )}
        </div>
      </div>
    </div>
  );
}
