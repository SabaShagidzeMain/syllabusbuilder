import React, { useState } from "react";
import SyllabusBuilderModal from "../TableBuilder/TableBuilder"; // Adjust path & name if needed
import "./style.css";

const LandingBot = () => {
  const [showBuilder, setShowBuilder] = useState(false);

  const handleSave = (syllabusData) => {
    console.log("Saved syllabus:", syllabusData);
    // Do something with the saved data (send to backend, etc)
    setShowBuilder(false);
  };

  const handleClose = () => {
    setShowBuilder(false);
  };

  return (
    <div className="botwrapper">
      <button className="openbtn" onClick={() => setShowBuilder(true)}>
        Create New
      </button>

      <SyllabusBuilderModal
        isOpen={showBuilder}
        onClose={handleClose}
        onSave={handleSave}
      />
    </div>
  );
};

export default LandingBot;
