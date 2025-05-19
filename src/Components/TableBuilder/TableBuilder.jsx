import React from "react";
import "./style.css";

export default function SyllabusBuilderModal({ isOpen, onClose, onSave }) {
  const [addedTables, setAddedTables] = React.useState([]); // array of { id, name, cells }
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
    // more predefined tables
  ];

  // When admin picks a table from predefined list
  function onSelectPredefinedTable(id) {
    setCurrentTableId(id);
    const table = predefinedTables.find((t) => t.id === id);
    // Deep clone cells so edits don't mutate original
    setCurrentTableCells(table.cells.map((row) => [...row]));
  }

  // Handle edits in the left panel
  function onEditCell(row, col, value) {
    setCurrentTableCells((prev) => {
      const newCells = prev.map((r) => [...r]);
      newCells[row][col] = value;
      return newCells;
    });
  }

  // Add currently edited table to syllabus list or update existing
  function onAddOrUpdateTable() {
    setAddedTables((prev) => {
      const exists = prev.findIndex((t) => t.id === currentTableId);
      if (exists >= 0) {
        const updated = [...prev];
        updated[exists] = {
          id: currentTableId,
          name: predefinedTables.find((t) => t.id === currentTableId).name,
          cells: currentTableCells,
        };
        return updated;
      } else {
        return [
          ...prev,
          {
            id: currentTableId,
            name: predefinedTables.find((t) => t.id === currentTableId).name,
            cells: currentTableCells,
          },
        ];
      }
    });
    setCurrentTableId(null);
    setCurrentTableCells([]);
  }

  if (!isOpen) return null;

  return (
    <div className="modal">
      <div
        className="modal-left"
        style={{ width: "50%", padding: "10px", borderRight: "1px solid #ccc" }}
      >
        <button onClick={() => setCurrentTableId(null)}>Add Table</button>
        {!currentTableId && (
          <div>
            <h4>Select a table to add:</h4>
            {predefinedTables.map((t) => (
              <button key={t.id} onClick={() => onSelectPredefinedTable(t.id)}>
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
            <table border="1" cellPadding="5">
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
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            <button onClick={onAddOrUpdateTable} style={{ marginTop: "10px" }}>
              Add / Update Table in Syllabus
            </button>
          </div>
        )}
      </div>

      <div className="modal-right" style={{ width: "50%", padding: "10px" }}>
        <h3>Tables in Syllabus</h3>
        {addedTables.length === 0 && <p>No tables added yet.</p>}
        {addedTables.map((table) => (
          <div key={table.id} style={{ marginBottom: "20px" }}>
            <table border="1" cellPadding="5" className="table">
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
  );
}
