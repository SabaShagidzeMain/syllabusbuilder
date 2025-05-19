import React, { useState } from "react";
import SyllabusBuilderModal from "../TableBuilder/TableBuilder"; // Adjust path & name if needed

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
    <div>
      <button onClick={() => setShowBuilder(true)}>Create New Template</button>

      <SyllabusBuilderModal
        isOpen={showBuilder}
        onClose={handleClose}
        onSave={handleSave}
      />
    </div>
  );
};

export default LandingBot;
