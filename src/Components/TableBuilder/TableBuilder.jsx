import React, { useRef, useEffect, useState } from "react";
import {
  updateSyllabusForm,
  fetchUniversityForCurrentUser,
  insertSyllabusForm,
} from "../../utility/supabaseHelpers";
import { predefinedTables } from "../../utility/predefinedTables";
import "./style.css";

export default function SyllabusBuilderModal({
  isOpen,
  onClose,
  onSave,
  initialData,
  parentSyllabus,
  syllabusType = "main",
  parentId = null,
}) {
  const modalRef = useRef();

  const isAdmin = true;

  const [formTitle, setFormTitle] = useState("Syllabus Draft");
  const [sections, setSections] = useState([]);

  /*
   * ---------------------------------------------------------
   * DEEP CLONE
   * ---------------------------------------------------------
   */

  const cloneSections = (data) => {
    if (!data) return [];

    return JSON.parse(JSON.stringify(data));
  };

  /*
   * ---------------------------------------------------------
   * APPLY INSTANCE OVERRIDES
   * ---------------------------------------------------------
   *
   * overrides format:
   *
   * {
   *   "sectionId": {
   *     "rowIndex-cellIndex": "new value"
   *   }
   * }
   *
   * Example:
   *
   * {
   *   "1750670134197": {
   *     "0-1": "Bioinformatics"
   *   }
   * }
   */

  const applyOverrides = (baseSections, overrides) => {
    const result = cloneSections(baseSections);

    if (!overrides || typeof overrides !== "object") {
      return result;
    }

    result.forEach((section) => {
      const sectionOverrides = overrides[section.id];

      if (!sectionOverrides) return;

      Object.entries(sectionOverrides).forEach(
        ([cellPosition, value]) => {
          const [rowIndex, cellIndex] =
            cellPosition.split("-").map(Number);

          if (
            result.includes(section) &&
            result.find((s) => s.id === section.id)?.cells?.[rowIndex]?.[
              cellIndex
            ]
          ) {
            result.find(
              (s) => s.id === section.id
            ).cells[rowIndex][cellIndex].value = value;
          }
        }
      );
    });

    return result;
  };

  /*
   * ---------------------------------------------------------
   * BUILD OVERRIDES
   * ---------------------------------------------------------
   *
   * Compare the edited instance with the main syllabus.
   *
   * Only changed cell values are stored.
   */

  const buildOverrides = (baseSections, editedSections) => {
    const overrides = {};

    editedSections.forEach((editedSection) => {
      const baseSection = baseSections.find(
        (section) => section.id === editedSection.id
      );

      if (!baseSection) return;

      editedSection.cells.forEach((row, rowIndex) => {
        row.forEach((cell, cellIndex) => {
          const baseCell =
            baseSection.cells?.[rowIndex]?.[cellIndex];

          if (!baseCell) return;

          const editedValue = cell.value ?? "";
          const baseValue = baseCell.value ?? "";

          if (editedValue !== baseValue) {
            if (!overrides[editedSection.id]) {
              overrides[editedSection.id] = {};
            }

            overrides[editedSection.id][
              `${rowIndex}-${cellIndex}`
            ] = editedValue;
          }
        });
      });
    });

    return overrides;
  };

  /*
   * ---------------------------------------------------------
   * INITIALIZE BUILDER
   * ---------------------------------------------------------
   */

  useEffect(() => {
    if (!isOpen) return;

    /*
     * Editing an existing MAIN syllabus
     */
    if (
      initialData &&
      initialData.syllabus_type === "main"
    ) {
      setSections(
        cloneSections(initialData.content || [])
      );

      setFormTitle(
        initialData.title || "Syllabus Draft"
      );

      return;
    }

    /*
     * Editing an existing INSTANCE
     */
    if (
      initialData &&
      initialData.syllabus_type === "instance"
    ) {
      const parentContent =
        parentSyllabus?.content ||
        [];

      const instanceContent =
        applyOverrides(
          parentContent,
          initialData.overrides || {}
        );

      setSections(instanceContent);

      setFormTitle(
        initialData.title || "Subject Syllabus"
      );

      return;
    }

    /*
     * Creating a new INSTANCE
     */
    if (
      syllabusType === "instance" &&
      parentSyllabus
    ) {
      setSections(
        cloneSections(
          parentSyllabus.content || []
        )
      );

      setFormTitle("");

      return;
    }

    /*
     * Creating a new MAIN syllabus
     */
    setSections([]);
    setFormTitle("Syllabus Draft");
  }, [
    isOpen,
    initialData,
    parentSyllabus,
    syllabusType,
  ]);

  /*
   * ---------------------------------------------------------
   * SAVE
   * ---------------------------------------------------------
   */

  const handleSave = async () => {
    let result;

    /*
     * =======================================================
     * EXISTING SYLLABUS
     * =======================================================
     */

    if (initialData?.id) {
      /*
       * -----------------------------------------------------
       * EDITING MAIN SYLLABUS
       * -----------------------------------------------------
       */

      if (
        initialData.syllabus_type === "main"
      ) {
        result = await updateSyllabusForm(
          initialData.id,
          sections,
          formTitle || initialData.title || "Updated Draft",
          "main",
          {}
        );
      }

      /*
       * -----------------------------------------------------
       * EDITING INSTANCE
       * -----------------------------------------------------
       */

      else {
        const parentContent =
          parentSyllabus?.content || [];

        const overrides = buildOverrides(
          parentContent,
          sections
        );

        result = await updateSyllabusForm(
          initialData.id,
          sections,
          formTitle || initialData.title || "Updated Subject Syllabus",
          "instance",
          overrides
        );
      }
    }

    /*
     * =======================================================
     * CREATE NEW SYLLABUS
     * =======================================================
     */

    else {
      const {
        university,
        error: profileError,
      } = await fetchUniversityForCurrentUser();

      if (
        profileError ||
        !university
      ) {
        console.error(
          "Error fetching university:",
          profileError?.message
        );

        return;
      }

      /*
       * -----------------------------------------------------
       * NEW MAIN
       * -----------------------------------------------------
       */

      if (syllabusType === "main") {
        result = await insertSyllabusForm(
          formTitle || "Main Syllabus",
          sections,
          university,
          "main",
          null,
          {}
        );
      }

      /*
       * -----------------------------------------------------
       * NEW INSTANCE
       * -----------------------------------------------------
       */

      else {
        const parentContent =
          parentSyllabus?.content || [];

        /*
         * Initially the instance is identical
         * to the main syllabus, so there are
         * no overrides.
         */
        const overrides = buildOverrides(
          parentContent,
          sections
        );

        result = await insertSyllabusForm(
          formTitle || "Subject Syllabus",
          [],
          university,
          "instance",
          parentId,
          overrides
        );
      }
    }

    /*
     * =======================================================
     * RESULT
     * =======================================================
     */

    const {
      data,
      error,
    } = result;

    if (error) {
      console.error(
        "Supabase error:",
        error.message
      );

      return;
    }

    console.log(
      "Saved successfully!",
      data
    );

    onClose();

    if (onSave) {
      onSave(data?.[0]);
    }
  };

  /*
   * ---------------------------------------------------------
   * SECTION FUNCTIONS
   * ---------------------------------------------------------
   */

  const addSection = () => {
    setSections((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        title: "Untitled Section",
        tableId: "",
        cells: [],
      },
    ]);
  };

  const updateSection = (
    id,
    changes
  ) => {
    setSections((prev) =>
      prev.map((section) =>
        section.id === id
          ? {
              ...section,
              ...changes,
            }
          : section
      )
    );
  };

  const removeSection = (id) => {
    setSections((prev) =>
      prev.filter(
        (section) =>
          section.id !== id
      )
    );
  };

  /*
   * ---------------------------------------------------------
   * CLOSE WHEN CLICKING OUTSIDE
   * ---------------------------------------------------------
   */

  useEffect(() => {
    const handleClickOutside = (
      event
    ) => {
      if (
        modalRef.current &&
        !modalRef.current.contains(
          event.target
        )
      ) {
        onClose();
      }
    };

    document.addEventListener(
      "mousedown",
      handleClickOutside
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleClickOutside
      );
    };
  }, [onClose]);

  /*
   * ---------------------------------------------------------
   * TEXTAREA AUTO RESIZE
   * ---------------------------------------------------------
   */

  function autoResize(
    e,
    syncId
  ) {
    const allMatching =
      document.querySelectorAll(
        `[data-sync-id='${syncId}']`
      );

    allMatching.forEach(
      (el) => {
        el.style.height = "auto";

        el.style.height =
          `${e.target.scrollHeight}px`;
      }
    );
  }

  if (!isOpen) {
    return null;
  }

  return (
    <div className="modal">
      <div
        className="modal-inner"
        ref={modalRef}
        style={{
          display: "flex",
        }}
      >

        {/* ================================================= */}
        {/* LEFT PANEL */}
        {/* ================================================= */}

        <div
          className="modal-left"
          style={{
            width: "50%",
            padding: "10px",
            borderRight:
              "1px solid #ccc",
          }}
        >

          {/* FORM TITLE */}

          {isAdmin && (
            <div className="title-input-container">

              <label className="component-title">
                Form Title:
              </label>

              <textarea
                className="title-input"
                value={formTitle}
                onChange={(e) => {
                  autoResize(
                    e,
                    "form-title"
                  );

                  setFormTitle(
                    e.target.value
                  );
                }}
                onInput={(e) =>
                  autoResize(
                    e,
                    "form-title"
                  )
                }
                data-sync-id="form-title"
                style={{
                  resize: "none",
                  overflow: "hidden",
                  overflowWrap:
                    "break-word",
                  wordBreak:
                    "break-word",
                  whiteSpace:
                    "pre-wrap",
                  width: "100%",
                  height: "1.8em",
                  padding: "0",
                  lineHeight: "1.1",
                  fontSize: "1rem",
                  fontFamily:
                    "inherit",
                  border:
                    "1px solid #ccc",
                  borderRadius:
                    "6px",
                  boxSizing:
                    "border-box",
                }}
              />

            </div>
          )}

          {/* SECTIONS */}

          {sections.map(
            (section) => (
              <div
                className="modal-card-wrapper"
                key={section.id}
              >

                <div
                  className="section-wrapper"
                  style={{
                    marginTop:
                      "15px",
                    border:
                      "1px solid #ddd",
                    padding:
                      "10px",
                  }}
                >

                  <div className="input-container">

                    <label className="component-title">
                      Component:
                    </label>

                    <select
                      className="component-selector"
                      value={
                        section.tableId
                      }
                      onChange={(e) => {

                        const table =
                          predefinedTables.find(
                            (t) =>
                              t.id ===
                              e.target.value
                          );

                        if (!table)
                          return;

                        updateSection(
                          section.id,
                          {
                            tableId:
                              table.id,

                            cells:
                              table.cells.map(
                                (row) =>
                                  row.map(
                                    (cell) =>
                                      ({
                                        ...cell,
                                      })
                                  )
                              ),
                          }
                        );
                      }}
                    >

                      <option value="">
                        -- Select --
                      </option>

                      {predefinedTables.map(
                        (table) => (
                          <option
                            key={
                              table.id
                            }
                            value={
                              table.id
                            }
                          >
                            {table.name}
                          </option>
                        )
                      )}

                    </select>

                  </div>

                  {/* TITLE EDITORS */}

                  {section.cells.length >
                    0 &&
                    isAdmin && (
                      <div
                        style={{
                          marginTop:
                            "10px",
                        }}
                      >

                        {section.cells.map(
                          (
                            row,
                            rIdx
                          ) =>
                            row.map(
                              (
                                cell,
                                cIdx
                              ) =>
                                cell.isTitle ? (
                                  <div
                                    className="input-container"
                                    key={`${rIdx}-${cIdx}`}
                                    style={{
                                      marginBottom:
                                        5,
                                    }}
                                  >

                                    <p className="component-title">
                                      Title:
                                    </p>

                                    <label>

                                      <textarea
                                        data-sync-id={`${section.id}-${rIdx}-${cIdx}`}
                                        className="title-input component-title-input"
                                        value={
                                          cell.value
                                        }
                                        onChange={(
                                          e
                                        ) => {

                                          autoResize(
                                            e,
                                            `${section.id}-${rIdx}-${cIdx}`
                                          );

                                          const newCells =
                                            section.cells.map(
                                              (
                                                row
                                              ) =>
                                                row.map(
                                                  (
                                                    c
                                                  ) =>
                                                    ({
                                                      ...c,
                                                    })
                                                )
                                            );

                                          newCells[
                                            rIdx
                                          ][
                                            cIdx
                                          ].value =
                                            e.target.value;

                                          updateSection(
                                            section.id,
                                            {
                                              cells:
                                                newCells,
                                            }
                                          );
                                        }}
                                        onInput={(
                                          e
                                        ) =>
                                          autoResize(
                                            e,
                                            `${section.id}-${rIdx}-${cIdx}`
                                          )
                                        }
                                        style={{
                                          resize:
                                            "none",
                                          overflow:
                                            "hidden",
                                          overflowWrap:
                                            "break-word",
                                          wordBreak:
                                            "break-word",
                                          whiteSpace:
                                            "pre-wrap",
                                          width:
                                            "100%",
                                          height:
                                            "100%",
                                          background:
                                            "none",
                                        }}
                                      />

                                    </label>

                                  </div>
                                ) : null
                            )
                        )}

                      </div>
                    )}

                  <div className="button-container">

                    <button
                      onClick={() =>
                        removeSection(
                          section.id
                        )
                      }
                    >
                      Remove Section
                    </button>

                  </div>

                </div>

              </div>
            )
          )}

          {/* ADD SECTION */}

          <div className="button-container add-btn-container">

            <button
              onClick={addSection}
              className="blue-button add-button"
            >
              Add Section
            </button>

          </div>

        </div>

        {/* ================================================= */}
        {/* RIGHT PANEL */}
        {/* ================================================= */}

        <div
          className="modal-right"
          style={{
            width: "50%",
            padding: "10px",
            overflowY:
              "auto",
          }}
        >

          <h3>
            Syllabus Preview
          </h3>

          {sections.length ===
            0 && (
            <p>
              No sections added yet.
            </p>
          )}

          {sections.map(
            (section) => (
              <div
                key={
                  section.id
                }
              >

                {section.cells
                  .length >
                  0 && (
                  <table
                    className="syllabus-table"
                    border="1"
                    style={{
                      width:
                        "100%",
                    }}
                  >

                    <tbody>

                      {section.cells.map(
                        (
                          row,
                          rIdx
                        ) => (
                          <tr
                            key={
                              rIdx
                            }
                          >

                            {row.map(
                              (
                                cell,
                                cIdx
                              ) => (

                                <td
                                  key={
                                    cIdx
                                  }
                                  rowSpan={
                                    cell.rowSpan
                                  }
                                  colSpan={
                                    cell.isFullWidth
                                      ? section
                                          .cells[1]
                                          ?.length ||
                                        1
                                      : 1
                                  }
                                  className={`
                                    table-cell
                                    ${
                                      cell.isTitle
                                        ? "title-cell"
                                        : ""
                                    }
                                    ${
                                      cell.isFullWidth
                                        ? "wide-cell"
                                        : ""
                                    }
                                    ${
                                      cell.isSecondary
                                        ? "secondary-cell"
                                        : ""
                                    }
                                    ${
                                      cell.isFullHeight
                                        ? "full-height-cell"
                                        : ""
                                    }
                                  `}
                                >

                                  {isAdmin ? (

                                    <textarea
                                      data-sync-id={`${section.id}-${rIdx}-${cIdx}`}
                                      className={`syllabus-input ${
                                        cell.isTitle
                                          ? "title-cell"
                                          : ""
                                      }`}
                                      value={
                                        cell.value ||
                                        ""
                                      }
                                      onChange={(
                                        e
                                      ) => {

                                        autoResize(
                                          e,
                                          `${section.id}-${rIdx}-${cIdx}`
                                        );

                                        const newCells =
                                          section.cells.map(
                                            (
                                              row
                                            ) =>
                                              row.map(
                                                (
                                                  c
                                                ) =>
                                                  ({
                                                    ...c,
                                                  })
                                              )
                                          );

                                        newCells[
                                          rIdx
                                        ][
                                          cIdx
                                        ].value =
                                          e.target.value;

                                        updateSection(
                                          section.id,
                                          {
                                            cells:
                                              newCells,
                                          }
                                        );
                                      }}
                                      onInput={(
                                        e
                                      ) =>
                                        autoResize(
                                          e,
                                          `${section.id}-${rIdx}-${cIdx}`
                                        )
                                      }
                                      style={{
                                        resize:
                                          "none",
                                        overflow:
                                          "hidden",
                                        overflowWrap:
                                          "break-word",
                                        wordBreak:
                                          "break-word",
                                        whiteSpace:
                                          "pre-wrap",
                                        width:
                                          "100%",
                                        height:
                                          "100%",
                                        background:
                                          "none",
                                        color:
                                          !cell.isTitle &&
                                          !cell.isSecondary
                                            ? "black"
                                            : undefined,
                                      }}
                                    />

                                  ) : (

                                    <div className="normal-cell">
                                      {
                                        cell.value
                                      }
                                    </div>

                                  )}

                                </td>

                              )
                            )}

                          </tr>
                        )
                      )}

                    </tbody>

                  </table>
                )}

              </div>
            )
          )}

        </div>

        {/* SAVE */}

        <button
          className="close-button blue-button"
          onClick={
            handleSave
          }
        >
          Save
        </button>

      </div>
    </div>
  );
}