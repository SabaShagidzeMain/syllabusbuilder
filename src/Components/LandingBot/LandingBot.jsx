import React, { useState, useEffect } from "react";
import { supabase } from "../../utility/supabaseClient";
import SyllabusBuilderModal from "../TableBuilder/TableBuilder";
import AdminDisplay from "../AdminDisplay/AdminDisplay";
import ProfDisplay from "../ProfDisplay/ProfDisplay";
import "./style.css";
import Spinner from "../Spinner/Spinner";

const LandingBot = () => {
  const [showBuilder, setShowBuilder] = useState(false);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserRole = async () => {
      setLoading(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setRole(null);
      } else {
        const { data: profile, error } = await supabase
          .from("profiles")
          .select("role")
          .eq("user_id", user.id)
          .single();

        if (error) {
          console.error("Error fetching profile role:", error.message);
          setRole(null);
        } else {
          setRole(profile?.role);
        }
      }

      setTimeout(() => setLoading(false), 300);
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

  if (loading) return <Spinner />;

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
            <AdminDisplay setLoading={setLoading} /> {/* ✅ Only one */}
          </>
        )}

        {role?.prof && <ProfDisplay />}

        {!role && <p>Loading user role or no role assigned.</p>}
      </div>
    </div>
  );
};

export default LandingBot;
