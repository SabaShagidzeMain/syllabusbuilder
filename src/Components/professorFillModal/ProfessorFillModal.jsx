import React, { useEffect, useRef, useState } from "react";
import "./style.css";

export default function ProfessorFillModal({
  isOpen,
  onClose,
  syllabus,
  onSave,
}) {
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

  const updateCellValue = (sectionIndex, rowIndex, colIndex, value) => {
    const updatedSections = [...sections];
    updatedSections[sectionIndex].cells[rowIndex][colIndex].value = value;
    setSections(updatedSections);
  };

  const handleSave = () => {
    if (onSave) {
      onSave(sections); // Send filled content to parent
    }
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
          <div key={section.id || sectionIndex} style={{ marginBottom: 20 }}>
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
                        } 
                          ${cell.isFullWidth ? "wide-cell" : ""} 
                          ${cell.isSecondary ? "secondary-cell" : ""}`}
                        colSpan={cell.isFullWidth ? row.length : 1}
                      >
                        {cell.isTitle ? (
                          <div>{cell.value || <em>(Title)</em>}</div>
                        ) : (
                          <input
                            type="text"
                            className="syllabus-input"
                            placeholder="Enter text"
                            value={cell.value || ""}
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
