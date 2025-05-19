import React from "react";
import "./style.css";

export default function SyllabusBuilderModal({ isOpen, onClose, onSave }) {
  const [addedTables, setAddedTables] = React.useState([]); // { id, name, cells }
  const [currentTableId, setCurrentTableId] = React.useState(null);
  const [currentTableCells, setCurrentTableCells] = React.useState([]);

  const predefinedTables = [
    {
      id: "1",
      name: "2x2 Table",
      cells: [
        ["", ""],
        ["", ""],
      ],
    },
    {
      id: "2",
      name: "3x3 Table",
      cells: [
        ["", "", ""],
        ["", "", ""],
        ["", "", ""],
      ],
    },
    // add more predefined tables as needed
  ];

  function onSelectPredefinedTable(id) {
    setCurrentTableId(id);
    const table = predefinedTables.find((t) => t.id === id);
    setCurrentTableCells(table.cells.map((row) => [...row]));
  }

  function onEditCell(row, col, value) {
    setCurrentTableCells((prev) => {
      const newCells = prev.map((r) => [...r]);
      newCells[row][col] = value;
      return newCells;
    });
  }

  function onAddOrUpdateTable() {
    if (!currentTableId) return;
    const name = predefinedTables.find((t) => t.id === currentTableId).name;
    setAddedTables((prev) => {
      const exists = prev.findIndex((t) => t.id === currentTableId);
      if (exists >= 0) {
        const updated = [...prev];
        updated[exists] = {
          id: currentTableId,
          name,
          cells: currentTableCells,
        };
        return updated;
      } else {
        return [
          ...prev,
          { id: currentTableId, name, cells: currentTableCells },
        ];
      }
    });
    setCurrentTableId(null);
    setCurrentTableCells([]);
  }

  function onRemoveTable(id) {
    setAddedTables((prev) => prev.filter((t) => t.id !== id));
  }

  if (!isOpen) return null;

  return (
    <div className="modal" onClick={onClose}>
      <div className="modal-inner">
        <div
          className="modal-left"
          style={{
            width: "50%",
            padding: "10px",
            borderRight: "1px solid #ccc",
          }}
        >
          <button onClick={() => setCurrentTableId(null)}>Add Table</button>

          {!currentTableId && (
            <div>
              <h4>Select a table to add:</h4>
              {predefinedTables.map((t) => (
                <button
                  key={t.id}
                  onClick={() => onSelectPredefinedTable(t.id)}
                >
                  {t.name}
                </button>
              ))}
            </div>
          )}

          {currentTableId && (
            <div>
              <h4>
                Editing:{" "}
                {predefinedTables.find((t) => t.id === currentTableId).name}
              </h4>
              <table
                border="1"
                cellPadding="5"
                style={{
                  width: "100%",
                  tableLayout: "fixed",
                  marginBottom: 10,
                }}
              >
                <tbody>
                  {currentTableCells.map((row, rIdx) => (
                    <tr key={rIdx}>
                      {row.map((cell, cIdx) => (
                        <td key={cIdx}>
                          <input
                            type="text"
                            value={cell}
                            onChange={(e) =>
                              onEditCell(rIdx, cIdx, e.target.value)
                            }
                            style={{ width: "100%", boxSizing: "border-box" }}
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              <button
                onClick={onAddOrUpdateTable}
                style={{ marginTop: "10px" }}
              >
                Add / Update Table in Syllabus
              </button>
            </div>
          )}
        </div>

        <div
          className="modal-right"
          style={{ width: "50%", padding: "10px", overflowY: "auto" }}
        >
          <h3>Tables in Syllabus</h3>
          {addedTables.length === 0 && <p>No tables added yet.</p>}
          {addedTables.map((table) => (
            <div key={table.id} style={{ marginBottom: "20px" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <strong>{table.name}</strong>
                <button
                  onClick={() => onRemoveTable(table.id)}
                  style={{
                    background: "red",
                    color: "white",
                    border: "none",
                    borderRadius: 4,
                    cursor: "pointer",
                  }}
                >
                  Remove
                </button>
              </div>
              <table
                border="1"
                cellPadding="5"
                className="table"
                style={{ width: "100%", tableLayout: "fixed", marginTop: 5 }}
              >
                <tbody>
                  {table.cells.map((row, rIdx) => (
                    <tr key={rIdx}>
                      {row.map((cell, cIdx) => (
                        <td key={cIdx}>{cell || <em>[empty]</em>}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
