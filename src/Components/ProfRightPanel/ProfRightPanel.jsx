import React from "react";

export default function ProfRightPanel({
    sections,
    editingCell,
    setEditingCell,
    setSections,
    rightRowRefs,
    autoResize,
}) {
    const updateCellValue = (sectionIndex, rowIndex, colIndex, value) => {
        const updated = [...sections];
        updated[sectionIndex].cells[rowIndex][colIndex].value = value;
        setSections(updated);
    };

    const handleBlurOrEnter = () => setEditingCell(null);

    const getGlobalRowIndex = (sectionIndex, rowIndex) => {
        let idx = 0;
        for (let i = 0; i < sectionIndex; i++) {
            idx += sections[i]?.cells?.length || 0;
        }
        return idx + rowIndex;
    };

    return (
        <div className="modal-right" style={{ flex: 1, overflowY: "auto", paddingLeft: 10 }}>
            {sections.map((section, sectionIndex) => (
                <div key={section.id || sectionIndex} style={{ marginBottom: 20 }}>
                    <table className="syllabus-table" border="1" style={{ width: "100%", borderCollapse: "collapse" }}>
                        <tbody>
                            {section.cells.map((row, rowIndex) => {
                                const globalIndex = getGlobalRowIndex(sectionIndex, rowIndex);
                                return (
                                    <tr key={rowIndex} ref={(el) => (rightRowRefs.current[globalIndex] = el)}>
                                        {row.map((cell, colIndex) => {
                                            const isEditing =
                                                editingCell &&
                                                editingCell.sectionIndex === sectionIndex &&
                                                editingCell.rowIndex === rowIndex &&
                                                editingCell.colIndex === colIndex;

                                            return (
                                                <td
                                                    key={colIndex}
                                                    className={`table-cell ${cell.isTitle ? "title-cell" : ""}`}
                                                    colSpan={cell.isFullWidth ? section.cells[1]?.length || 1 : 1}
                                                    onClick={() => {
                                                        if (!cell.isTitle) {
                                                            setEditingCell({ sectionIndex, rowIndex, colIndex });
                                                        }
                                                    }}
                                                    style={{
                                                        cursor: cell.isTitle ? "default" : "pointer",
                                                        padding: "6px 8px",
                                                        maxWidth: 300,
                                                        minWidth: 100,
                                                    }}
                                                >
                                                    {isEditing ? (
                                                        <textarea
                                                            autoFocus
                                                            value={cell.value || ""}
                                                            onChange={(e) =>
                                                                updateCellValue(sectionIndex, rowIndex, colIndex, e.target.value)
                                                            }
                                                            onBlur={handleBlurOrEnter}
                                                            onKeyDown={(e) => {
                                                                if (e.key === "Enter" && e.ctrlKey) {
                                                                    e.preventDefault();
                                                                    handleBlurOrEnter();
                                                                }
                                                            }}
                                                            onInput={(e) => autoResize(e.target)}
                                                            style={{
                                                                width: "100%",
                                                                padding: "4px 6px",
                                                                fontSize: "inherit",
                                                                border: "1px solid #ccc",
                                                                borderRadius: 4,
                                                                resize: "none",
                                                                overflow: "hidden",
                                                                minHeight: 40,
                                                            }}
                                                            rows={1}
                                                        />
                                                    ) : (
                                                        <span style={{ display: "block", whiteSpace: "pre-wrap" }}>
                                                            {cell.value || <span className="placeholder-cell"></span>}
                                                        </span>
                                                    )}
                                                </td>
                                            );
                                        })}
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            ))}
        </div>
    );
}
