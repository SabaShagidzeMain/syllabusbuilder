import { useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LogScreen from "./Components/LogScreen/LogScreen";
import MainPage from "./Components/MainPage/MainPage";
import SyllabusPdfExport from "./Components/SyllabusPdfExport/SyllabusPdfExport";
import "./App.css";

function App() {
  const [count, setCount] = useState(0);

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LogScreen />} />
        <Route path="/main" element={<MainPage />} />
        <Route
          path="/export-preview/:syllabusId"
          element={<SyllabusPdfExport />}
        />
      </Routes>
    </Router>
  );
}

export default App;
