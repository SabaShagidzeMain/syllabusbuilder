import React, { useEffect, useRef, useState } from "react";
import { supabase } from "../../utility/supabaseClient";
import "./style.css";

export default function ProfessorFillModal({ isOpen, onClose, syllabus }) {
  const modalRef = useRef();
  const [sections, setSections] = useState([]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  useEffect(() => {
    if (syllabus) {
      setSections(syllabus.content || []);
    }
  }, [syllabus]);

  const handleSave = async () => {
    const { data, error } = await supabase
      .from("syllabus_forms")
      .update({ content: sections })
      .eq("id", syllabus.id);

    if (error) {
      console.error("Error updating:", error.message);
    } else {
      console.log("Updated successfully");
      onClose();
    }
  };

  const updateCellValue = (sectionIndex, rowIndex, colIndex, value) => {
    const updatedSections = [...sections];
    updatedSections[sectionIndex].cells[rowIndex][colIndex].value = value;
    setSections(updatedSections);
  };

  if (!isOpen) return null;

  return (
    <div className="modal">
      <div
        className="modal-inner"
        ref={modalRef}
        style={{ padding: 20, maxHeight: "80vh", overflowY: "auto" }}
      >
        <h2>Fill in Syllabus: {syllabus.title}</h2>

        {sections.map((section, sectionIndex) => (
          <div key={section.id} style={{ marginBottom: 20 }}>
            <table
              className="syllabus-table"
              border="1"
              style={{ width: "100%" }}
            >
              <tbody>
                {section.cells.map((row, rowIndex) => (
                  <tr key={rowIndex}>
                    {row.map((cell, colIndex) => (
                      <td
                        key={colIndex}
                        className={`table-cell ${
                          cell.isTitle ? "title-cell" : ""
                        } ${cell.isFullWidth ? "wide-cell" : ""} ${
                          cell.isSecondary ? "secondary-cell" : ""
                        }`}
                        colSpan={cell.isFullWidth ? row.length : 1}
                      >
                        {cell.isTitle ? (
                          <div>{cell.value || <em>(Title)</em>}</div>
                        ) : (
                          <input
                            type="text"
                            className="syllabus-input"
                            value={cell.value}
                            onChange={(e) =>
                              updateCellValue(
                                sectionIndex,
                                rowIndex,
                                colIndex,
                                e.target.value
                              )
                            }
                          />
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
        <button className="close-button" onClick={handleSave}>
          Save Responses
        </button>
      </div>
    </div>
  );
}
