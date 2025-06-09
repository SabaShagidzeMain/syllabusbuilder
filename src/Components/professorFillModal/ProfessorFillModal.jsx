import React, { useEffect, useRef, useState } from "react";
import ProfLeftPanel from "../ProfLeftPanel/ProfLeftPanel";
import ProfRightPanel from "../ProfRightPanel/ProfRightPanel";
import { autoResize, isValidContent, getGlobalRowIndex } from "../../utility/utils";
import "./style.css";

export default function ProfessorFillModal({ isOpen, onClose, syllabus, onSave }) {
  const modalRef = useRef();
  const leftRowRefs = useRef([]);
  const rightRowRefs = useRef([]);
  const [sections, setSections] = useState([]);
  const [editingCell, setEditingCell] = useState(null);

  useEffect(() => {
    if (syllabus && isValidContent(syllabus.content)) {
      setSections(syllabus.content || []);
    } else {
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

  useEffect(() => {
    leftRowRefs.current.forEach(row => {
      if (row) row.querySelectorAll("textarea").forEach(autoResize);
    });

    requestAnimationFrame(() => {
      leftRowRefs.current.forEach((leftRow, i) => {
        const rightRow = rightRowRefs.current[i];
        if (leftRow && rightRow) {
          leftRow.style.height = rightRow.style.height = "auto";
          const maxHeight = Math.max(
            leftRow.getBoundingClientRect().height,
            rightRow.getBoundingClientRect().height
          );
          leftRow.style.height = rightRow.style.height = `${maxHeight}px`;
        }
      });
    });
  }, [sections]);

  if (!isOpen) return null;

  return (
    <div className="modal">
      <div className="modal-inner" ref={modalRef}>
        <ProfLeftPanel
          sections={sections}
          setSections={setSections}
          onSave={onSave}
          leftRowRefs={leftRowRefs}
          autoResize={autoResize}
        />
        <ProfRightPanel
          sections={sections}
          editingCell={editingCell}
          setEditingCell={setEditingCell}
          setSections={setSections}
          rightRowRefs={rightRowRefs}
          autoResize={autoResize}
        />
      </div>
    </div>
  );
}
