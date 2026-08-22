import React from "react";
import LandingTop from "../LandingTop/LandingTop";
import LandingBot from "../LandingBot/LandingBot";
import "./style.css";

const MainPage = () => {
  return (
    <div className="main-wrapper">
      <LandingTop />
      <LandingBot />
    </div>
  );
};

export default MainPage;
