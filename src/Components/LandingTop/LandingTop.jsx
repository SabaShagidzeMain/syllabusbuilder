import React, { useEffect, useState } from "react";
import "./style.css";
import backgroundImage from "../../assets/alte/altehero.png";
import searchIcon from "../../assets/general/material-symbols_search.png";
import notificationIcon from "../../assets/general/mdi_bell-outline.png";
import userLogo from "../../assets/alte/userlogo.png";
import { supabase } from "../../utility/supabaseClient";

const LandingTop = () => {
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        console.error("Error fetching user:", userError);
        return;
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("name, surname, role")
        .eq("user_id", user.id)
        .single();

      if (error) {
        console.error("Error fetching profile:", error);
      } else {
        setProfile(data);
      }
    };

    fetchProfile();
  }, []);

  return (
    <div className="landingtop-content">
      {/* ========================================= */}
      {/* TOP BAR */}
      {/* ========================================= */}

      <div className="topbar">
        {/* SEARCH */}
        <div className="search-wrapper">
          <span className="search-icon">
            <img src={searchIcon} alt="" className="searchIcon" />
          </span>

          <input type="text" className="search-input" placeholder="Search..." />
        </div>

        {/* RIGHT SIDE */}
        <div className="topbar-right">
          {/* NOTIFICATIONS */}
          <button className="notification-button" type="button">
            <img src={notificationIcon} alt="" className="notificationIcon" />
          </button>

          {/* DIVIDER */}
          <div className="topbar-divider"></div>

          {/* USER */}
          <div className="user-profile">
            <img src={userLogo} alt="User" className="user-profile-icon" />

            <div className="user-profile-info">
              <span className="user-profile-name">
                {profile ? `${profile.name} ${profile.surname}` : "Loading..."}
              </span>

              <span className="user-profile-role">
                {profile?.role?.admin
                  ? "Admin"
                  : profile?.role?.prof
                    ? "Professor"
                    : "User"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================= */}
      {/* HERO / IMAGE ROW */}
      {/* ========================================= */}

      <div className="landing-hero">
        <div
          className="landing-hero-image"
          style={{
            backgroundImage: `url(${backgroundImage})`,
          }}
        >
          <div className="landing-hero-overlay"></div>

          <div className="landing-hero-content">
            {/* <img src={backgroundImage} alt="" className="hero-decoration" /> */}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingTop;
