import React from "react";
import "./style.css";
import backgroundImage from "../../assets/alte/altebck.png";
import { supabase } from "../../utility/supabaseClient";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const LandingTop = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Logout Failed: ", error.message);
    } else {
      navigate("/login");
    }
  };

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

      // ❗ Corrected to use "user_id" not "id"
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

  const getRoleLabel = () => {
    if (!profile?.role) return "Unknown";
    if (profile.role.admin === true) return "Admin";
    if (profile.role.prof === true) return "Professor";
    return "User";
  };

  return (
    <div
      className="landingtop-wrapper"
      style={{
        backgroundImage: `url(${backgroundImage})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        width: "100%",
      }}
    >
      <div className="overlay"></div>
      <div className="landing-left-wrapper">
        <div className="landing-left-inner">
          <img src="src/assets/alte/altelogo.png" alt="" className="toplogo" />
        </div>
      </div>
      <div className="landing-right-wrapper">
        <div className="landing-right-inner">
          <div className="user-info">
            {profile ? (
              <>
                <p className="rolename">{getRoleLabel()}</p>
                <p className="username">
                  {profile.name} {profile.surname}
                </p>
              </>
            ) : (
              <p>Loading...</p>
            )}
            <div className="btn-wrapper">
              <button className="userbtn">Edit Profile</button>
              <button className="userbtn" onClick={handleLogout}>
                Log Out
              </button>
            </div>
          </div>
          <img src="src/assets/alte/userlogo.png" alt="" className="topuser" />
        </div>
      </div>
    </div>
  );
};

export default LandingTop;
