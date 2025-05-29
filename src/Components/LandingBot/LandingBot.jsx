import React, { useState, useEffect } from "react";
import { supabase } from "../../utility/supabaseClient";
import SyllabusBuilderModal from "../TableBuilder/TableBuilder";
import AdminDisplay from "../AdminDisplay/AdminDisplay";
import ProfDisplay from "../ProfDisplay/ProfDisplay";
import "./style.css";

const LandingBot = () => {
  const [showBuilder, setShowBuilder] = useState(false);
  const [role, setRole] = useState(null); // will hold the role object

  useEffect(() => {
    const fetchUserRole = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setRole(null);
        return;
      }

      const { data: profile, error } = await supabase
        .from("profiles")
        .select("role")
        .eq("user_id", user.id)
        .single();

      if (error) {
        console.error("Error fetching profile role:", error.message);
        setRole(null);
      } else {
        setRole(profile?.role); // This will be the object { prof: true, admin: false }
      }
    };

    fetchUserRole();
  }, []);

  const handleSave = (syllabusData) => {
    console.log("Saved syllabus:", syllabusData);
    setShowBuilder(false);
  };

  const handleClose = () => {
    setShowBuilder(false);
  };

  return (
    <div className="botwrapper">
      <div className="adminView">
        {role?.admin && (
          <>
            <button className="openbtn" onClick={() => setShowBuilder(true)}>
              Create New
            </button>
            <SyllabusBuilderModal
              isOpen={showBuilder}
              onClose={handleClose}
              onSave={handleSave}
            />
          </>
        )}

        {role?.admin && <AdminDisplay />}
        {role?.prof && <ProfDisplay />}

        {!role && <p>Loading user role or no role assigned.</p>}
      </div>
    </div>
  );
};

export default LandingBot;
