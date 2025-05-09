import React from "react";
import { useState } from "react";
import "./style.css";
import { FaRegLightbulb } from "react-icons/fa";
import { IoEarthOutline } from "react-icons/io5";
import { FaRegUserCircle } from "react-icons/fa";

const Header = () => {
  const [menuOpen, setMenuOpen] = useState(false);

  const toggleMenu = () => {
    setMenuOpen((prev) => !prev);
  };

  return (
    <div className="header">
      <div className="header-left">
        <h1 className="header-h">Structura</h1>

        <div
          className={`hamburger-wrapper ${menuOpen ? "open" : ""}`}
          onClick={toggleMenu}
        >
          <span className="hamburger-line"></span>
          <span className="hamburger-line"></span>
          <span className="hamburger-line"></span>
        </div>
      </div>

      <div className={`header-right ${menuOpen ? "open" : ""}`}>
        <ul className="header-list">
          <li className="header-list-item">
            <a href="#">Home</a>
          </li>
          <li className="header-list-item">
            <a href="#">Help</a>
          </li>
          <li className="header-list-item">
            <a href="#">Contact</a>
          </li>
          <div className="list-icon-wrapper">
            <li className="header-list-item">
              <a href="#">
                <FaRegLightbulb />
              </a>
            </li>
            <li className="header-list-item">
              <a href="#">
                <IoEarthOutline />
              </a>
            </li>
            <li className="header-list-item">
              <a href="#">
                <FaRegUserCircle />
              </a>
            </li>
          </div>
        </ul>
      </div>
    </div>
  );
};

export default Header;
