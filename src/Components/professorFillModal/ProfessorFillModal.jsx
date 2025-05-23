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

  // Update value of input cell in state
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
        id="prof-modal-inner"
        ref={modalRef}
        style={{ padding: 20, maxHeight: "80vh", overflowY: "auto" }}
      >
        <h2>Fill in Syllabus: {syllabus.title}</h2>

        {sections.map((section, sectionIndex) => {
          // Flatten all cells with coordinates
          const cellMap = [];

          section.cells.forEach((row, rowIndex) => {
            row.forEach((cell, colIndex) => {
              cellMap.push({ ...cell, rowIndex, colIndex });
            });
          });

          // Get all title cells
          const titleCells = cellMap.filter((cell) => cell.isTitle && cell.tag);

          return (
            <div
              key={section.id || sectionIndex}
              style={{ marginBottom: 20 }}
              className="form-container"
            >
              {titleCells.map((titleCell, i) => {
                // Find all inputs linked to this title
                const linkedInputs = cellMap.filter(
                  (cell) => cell.tag === `for-${titleCell.tag}`
                );

                return (
                  <div
                    key={titleCell.tag || i}
                    style={{ marginBottom: 16 }}
                    className="form-in-wrapper"
                  >
                    <h4 className="prof-inp-title">
                      {titleCell.value || "(Title)"}
                    </h4>

                    {linkedInputs.length > 0 ? (
                      linkedInputs.map((inputCell, j) => (
                        <input
                          key={`${inputCell.tag}-${j}`}
                          type="text"
                          className="prof-input-field"
                          value={inputCell.value || ""}
                          placeholder="Enter value"
                          onChange={(e) =>
                            updateCellValue(
                              sectionIndex,
                              inputCell.rowIndex,
                              inputCell.colIndex,
                              e.target.value
                            )
                          }
                          style={{
                            display: "block",
                            width: "100%",
                            marginTop: 4,
                            marginBottom: 8,
                            padding: "6px 8px",
                            fontSize: 16,
                          }}
                        />
                      ))
                    ) : (
                      <em style={{ color: "#666" }}>
                        No input fields linked to this title.
                      </em>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })}

        <button className="close-button" onClick={() => onSave(sections)}>
          Save Responses
        </button>
      </div>
    </div>
  );
}
