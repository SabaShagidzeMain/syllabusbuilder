import React, { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "../../utility/supabaseClient";
import html2pdf from "html2pdf.js";
import "./style.css";

export default function SyllabusPdfExport() {
  const { syllabusId } = useParams();
  const [formTitle, setFormTitle] = useState("");
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const exportRef = useRef(); // <<--- Ref to the exportable content

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

  const handleDownload = () => {
    if (!exportRef.current) return;

    const options = {
      margin: 0,
      filename: `${formTitle || "syllabus"}.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: {
        scale: 2,
        useCORS: true,
      },
      jsPDF: {
        unit: "mm",
        format: "a4",
        orientation: "portrait",
      },
    };

    html2pdf().set(options).from(exportRef.current).save();
  };

  if (loading) return <p>Loading...</p>;
  if (error) return <p style={{ color: "red" }}>{error}</p>;

  return (
    <div style={{ padding: 40 }}>
      <button
        onClick={handleDownload}
        style={{
          marginBottom: 20,
          padding: "10px 16px",
          fontSize: "16px",
          cursor: "pointer",
        }}
      >
        Download PDF
      </button>

      {/* Only this part will be exported */}
      <div ref={exportRef} className="export-page">
        <h1 style={{ textAlign: "center", marginBottom: 40 }}>{formTitle}</h1>

        {sections.map((section, sIdx) => (
          <div key={sIdx} style={{ marginBottom: 30 }}>
            {section.cells.length > 0 && (
              <table
                className="syllabus-table"
                style={{ width: "100%", borderCollapse: "collapse" }}
              >
                <tbody>
                  {section.cells.map((row, rIdx) => (
                    <tr key={rIdx}>
                      {row.map((cell, cIdx) => (
                        <td
                          key={cIdx}
                          colSpan={
                            cell.isFullWidth ? section.cells[1]?.length || 1 : 1
                          }
                          className={`table-cell ${
                            cell.isTitle ? "title-cell" : ""
                          } ${cell.isFullWidth ? "wide-cell" : ""} ${
                            cell.isSecondary ? "secondary-cell" : ""
                          }`}
                        //   style={{ padding: "8px", border: "1px solid #000" }}
                        >
                          {cell.value || <em>&nbsp;</em>}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
