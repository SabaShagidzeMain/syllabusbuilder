import { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { supabase } from "./utility/supabaseClient";

import LogScreen from "./Components/LogScreen/LogScreen";
import MainPage from "./Components/MainPage/MainPage";
import SyllabusPdfExport from "./Components/SyllabusPdfExport/SyllabusPdfExport";

import "./App.css";

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const { data } = await supabase.auth.getSession();
      setUser(data.session?.user ?? null);
      setLoading(false);
    };

    initAuth();

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
      }
    );

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  if (loading) {
    return (
      <div style={{ padding: "20px", textAlign: "center" }}>
        Loading...
      </div>
    );
  }

  return (
    <Router>
      <Routes>

        {/* LOGIN */}
        <Route
          path="/login"
          element={
            user ? <Navigate to="/" replace /> : <LogScreen />
          }
        />

        {/* MAIN PAGE (PROTECTED) */}
        <Route
          path="/"
          element={
            user ? <MainPage /> : <Navigate to="/login" replace />
          }
        />

        {/* EXPORT (PROTECTED) */}
        <Route
          path="/export-preview/:syllabusId"
          element={
            user ? (
              <SyllabusPdfExport />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

      </Routes>
    </Router>
  );
}

export default App;