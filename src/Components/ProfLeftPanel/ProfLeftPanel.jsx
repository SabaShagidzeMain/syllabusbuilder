import React from "react";

export default function ProfLeftPanel({ sections, setSections, onSave, leftRowRefs, autoResize }) {
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
        <div className="modal-left" style={{ flex: 1, overflowY: "auto", paddingRight: 10 }}>
            {sections.length === 0 ? (
                <p style={{ color: "#888", fontStyle: "italic" }}>No sections to display.</p>
            ) : (
                sections.map((section, sectionIndex) => (
                    <div className="card-wrapper" key={section.id || sectionIndex}>
                        <div className="section-wrapper" style={{ marginTop: 15, border: "1px solid #ddd", padding: 10 }}>
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
                                                return (
                                                    <div key={colIndex} style={{ fontWeight: "bold", marginBottom: 6 }}>
                                                        {cell.value || "(Title)"}
                                                    </div>
                                                );
                                            }

                                            return (
                                                <div key={colIndex} style={{ marginBottom: 6 }}>
                                                    {cell.subtag && (
                                                        <label style={{ fontSize: 13, color: "#555", marginBottom: 4, display: "block" }}>
                                                            {cell.subtag.replace(/(sub-|for-sub-)/, "")}
                                                        </label>
                                                    )}
                                                    <textarea
                                                        className="prof-input-field"
                                                        value={cell.value || ""}
                                                        placeholder="Enter value"
                                                        onChange={(e) => handleChange(e, sectionIndex, rowIndex, colIndex)}
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
                        </div>
                    </div>
                ))
            )}
            <div style={{ marginTop: 20 }}>
                <button onClick={() => onSave(sections)} className="blue-button">
                    Save Responses
                </button>
            </div>
        </div>
    );
}
