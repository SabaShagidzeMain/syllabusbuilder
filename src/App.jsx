import { useState } from "react";
import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";
import "./App.css";
import LogScreen from "./Components/LogScreen/LogScreen";

function App() {
  const [count, setCount] = useState(0);

  return (
    <>
      <div>
        <LogScreen />
      </div>
    </>
  );
}

export default App;
