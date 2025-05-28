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

  // Helper to validate content structure
  const isValidContent = (content) => {
    if (!Array.isArray(content)) return false;
    // Optional: check if every section has cells array
    return content.every(
      (section) =>
        section &&
        Array.isArray(section.cells) &&
        section.cells.every(
          (row) =>
            Array.isArray(row) && row.every((cell) => typeof cell === "object")
        )
    );
  };

  useEffect(() => {
    if (syllabus && isValidContent(syllabus.content)) {
      setSections(syllabus.content || []);
    } else {
      // fallback to empty array if content invalid or missing
      setSections([]);
    }
  }, [syllabus]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  // Update value of input cell in state
  const updateCellValue = (sectionIndex, rowIndex, colIndex, value) => {
    const updatedSections = [...sections];
    if (
      updatedSections[sectionIndex] &&
      updatedSections[sectionIndex].cells?.[rowIndex] &&
      updatedSections[sectionIndex].cells[rowIndex][colIndex]
    ) {
      updatedSections[sectionIndex].cells[rowIndex][colIndex].value = value;
      setSections(updatedSections);
    }
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
        <h2>Fill in Syllabus: {syllabus?.title || "(Untitled Form)"}</h2>

        {sections.length === 0 ? (
          <p style={{ color: "#999" }}>No sections or content available.</p>
        ) : (
          sections.map((section, sectionIndex) => {
            const cellMap = [];

            section.cells.forEach((row, rowIndex) => {
              row.forEach((cell, colIndex) => {
                cellMap.push({ ...cell, rowIndex, colIndex });
              });
            });

            const titleCells = cellMap.filter(
              (cell) => cell.isTitle && cell.tag
            );

            return (
              <div
                key={section.id || sectionIndex}
                style={{ marginBottom: 20 }}
                className="form-container"
              >
                {titleCells.length === 0 ? (
                  <em style={{ color: "#666" }}>
                    No title cells found in this section.
                  </em>
                ) : (
                  titleCells.map((titleCell, i) => {
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
                  })
                )}
              </div>
            );
          })
        )}

        <button onClick={() => onSave(sections)}>
          Save Responses
        </button>
      </div>
    </div>
  );
}
