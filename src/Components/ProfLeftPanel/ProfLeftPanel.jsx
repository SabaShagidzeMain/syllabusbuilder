import React, { useState, useEffect } from "react";

export default function ProfLeftPanel({
  sections,
  setSections,
  onSave,
  leftRowRefs,
  autoResize,
  isAdmin,
}) {
  const [sectionComments, setSectionComments] = useState({});
  const [showCommentBox, setShowCommentBox] = useState({}); // { sectionIndex: boolean }

  useEffect(() => {
    // For each section, open comment box if adminComment exists & not empty
    const newShowCommentBox = {};
    sections.forEach((section, index) => {
      newShowCommentBox[index] = !!(
        section.adminComment && section.adminComment.trim() !== ""
      );
    });
    setShowCommentBox(newShowCommentBox);
  }, [sections]);

  const toggleCommentBox = (sectionIndex) => {
    setShowCommentBox((prev) => ({
      ...prev,
      [sectionIndex]: !prev[sectionIndex],
    }));
  };

  const handleCommentChange = (sectionIndex, value) => {
    const updatedSections = [...sections];
    updatedSections[sectionIndex].adminComment = value;
    setSections(updatedSections);
  };

  const handleSaveClick = () => {
    console.log("Saving sections with comments:", sections);
    onSave(sections);
  };

  const updateCellValue = (sectionIndex, rowIndex, colIndex, value) => {
    const updatedSections = [...sections];
    updatedSections[sectionIndex].cells[rowIndex][colIndex].value = value;
    setSections(updatedSections);
  };

  const handleChange = (e, sectionIndex, rowIndex, colIndex) => {
    updateCellValue(sectionIndex, rowIndex, colIndex, e.target.value);
    autoResize(e.target);
  };

  const getGlobalRowIndex = (sectionIndex, rowIndex) => {
    let idx = 0;
    for (let i = 0; i < sectionIndex; i++) {
      idx += sections[i]?.cells?.length || 0;
    }
    return idx + rowIndex;
  };

  return (
    <div
      className="modal-left"
      style={{ flex: 1, overflowY: "auto", paddingRight: 10 }}
    >
      {sections.length === 0 ? (
        <p style={{ color: "#888", fontStyle: "italic" }}>
          No sections to display.
        </p>
      ) : (
        sections.map((section, sectionIndex) => (
          <div className="card-wrapper" key={section.id || sectionIndex}>
            <div
              className="section-wrapper"
              style={{ marginTop: 15, border: "1px solid #ddd", padding: 10 }}
            >
              <h4 style={{ marginBottom: 10 }}>Section {sectionIndex + 1}</h4>

              {section.cells.map((row, rowIndex) => {
                const globalIndex = getGlobalRowIndex(sectionIndex, rowIndex);
                return (
                  <div
                    key={rowIndex}
                    className="row-wrapper"
                    ref={(el) => (leftRowRefs.current[globalIndex] = el)}
                    style={{ marginBottom: 10 }}
                  >
                    {row.map((cell, colIndex) => {
                      if (cell.isTitle) {
                        return isAdmin ? (
                          <textarea
                            key={colIndex}
                            className="prof-input-field title-cell-textarea"
                            value={cell.value || ""}
                            placeholder="Enter title"
                            onChange={(e) =>
                              handleChange(e, sectionIndex, rowIndex, colIndex)
                            }
                            onInput={(e) => autoResize(e.target)}
                            style={{
                              fontWeight: "bold",
                              marginBottom: 6,
                              width: "100%",
                              resize: "none",
                              border: "1px solid #ccc",
                              borderRadius: 4,
                              minHeight: 40,
                            }}
                            rows={1}
                          />
                        ) : (
                          <div
                            key={colIndex}
                            style={{
                              fontWeight: "bold",
                              marginBottom: 6,
                              whiteSpace: "pre-wrap",
                            }}
                          >
                            {cell.value || "(Title)"}
                          </div>
                        );
                      }

                      return (
                        <div key={colIndex} style={{ marginBottom: 6 }}>
                          {cell.subtag && (
                            <label
                              style={{
                                fontSize: 13,
                                color: "#555",
                                marginBottom: 4,
                                display: "block",
                              }}
                            >
                              {cell.subtag.replace(/(sub-|for-sub-)/, "")}
                            </label>
                          )}
                          <textarea
                            className="prof-input-field"
                            value={cell.value || ""}
                            placeholder="Enter value"
                            onChange={(e) =>
                              handleChange(e, sectionIndex, rowIndex, colIndex)
                            }
                            onInput={(e) => autoResize(e.target)}
                            style={{
                              width: "100%",
                              padding: "6px 8px",
                              fontSize: 15,
                              border: "1px solid #ccc",
                              borderRadius: 4,
                              resize: "none",
                              overflow: "hidden",
                              minHeight: 40,
                            }}
                            rows={1}
                          />
                        </div>
                      );
                    })}
                  </div>
                );
              })}

              {(isAdmin ||
                (section.adminComment &&
                  section.adminComment.trim() !== "")) && (
                <div style={{ marginTop: 12 }}>
                  {/* For admins, show toggle button */}
                  {isAdmin && (
                    <button
                      className="blue-button"
                      style={{ marginBottom: 8 }}
                      onClick={() => toggleCommentBox(sectionIndex)}
                    >
                      {showCommentBox[sectionIndex]
                        ? "Hide Comment"
                        : "Add Comment"}
                    </button>
                  )}

                  {/* Show comment box if toggled or if professor and comment exists */}
                  {(showCommentBox[sectionIndex] ||
                    (!isAdmin &&
                      section.adminComment &&
                      section.adminComment.trim() !== "")) && (
                    <div>
                      <label
                        style={{
                          fontWeight: "bold",
                          display: "block",
                          marginBottom: 4,
                        }}
                      >
                        Admin Comment:
                      </label>

                      {isAdmin ? (
                        <textarea
                          value={sections[sectionIndex].adminComment || ""}
                          onChange={(e) =>
                            handleCommentChange(sectionIndex, e.target.value)
                          }
                          placeholder="Write a comment for this section..."
                          style={{
                            width: "100%",
                            minHeight: 60,
                            padding: 8,
                            border: "1px solid #ccc",
                            borderRadius: 4,
                            fontSize: 14,
                            resize: "vertical",
                            backgroundColor: "#fdfdfd",
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            width: "100%",
                            minHeight: 60,
                            padding: 8,
                            border: "1px solid #ccc",
                            borderRadius: 4,
                            fontSize: 14,
                            backgroundColor: "#f5f5f5",
                            whiteSpace: "pre-wrap",
                            overflowY: "auto",
                          }}
                        >
                          {sections[sectionIndex].adminComment ||
                            "(No comment)"}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ))
      )}

      <div style={{ marginTop: 20 }}>
        <button
          onClick={handleSaveClick}
          className="blue-button"
        >
          Save Responses
        </button>
      </div>
    </div>
  );
}
