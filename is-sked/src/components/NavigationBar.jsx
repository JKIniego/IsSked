import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import styles from "../css/NavigationBar.module.css";
import avatar from "../assets/Person Icon.png";

export default function NavigationBar() {
  const navigate = useNavigate();

  // ---------------- STATE ----------------
  // Navigation bar state
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [displayName, setDisplayName] = useState("");

  // Checks if user toggles dropdown menu
  const toggleDropdown = () => setDropdownOpen(!dropdownOpen);

  // ---------------- EFFECT ----------------
  useEffect(() => {
    fetchUser();
  }, []);

  // Fetches display name of logged in user
  async function fetchUser() {
    try {
      // Get logged-in user
      const { data: { user } } = await supabase.auth.getUser();

      // Fetch display_name from student table
      const { data: studentData, error: studentError } = await supabase
        .from("student")
        .select("display_name")
        .eq("user_id", user.id)
        .single();

      if (studentError) {
        console.error("Error fetching student info:", studentError.message);
        return;
      }

      if (studentData?.display_name) {
        setDisplayName(studentData.display_name || "Unknown User");
      }
    } catch (err) {
      console.error("Failed to fetch display name:", err.message);
    }
  }

  // ---------------- LOGOUT ----------------
  // Handles user logout
  async function handleLogout() {
    try {
      // User sign out
      await supabase.rpc("set_logout_time");
      await supabase.auth.signOut();

      // Clear local storage
      localStorage.removeItem("student_id");
      localStorage.removeItem("email");
      localStorage.removeItem("display_name");
      localStorage.removeItem("degree_program_id");
      localStorage.removeItem("authToken");

      // Navigates to login page
      navigate("/", { replace: true });
    } catch (error) {
      console.error("Logout failed:", error.message);
    }
  }

  // ---------------- PROFILE NAVIGATION ----------------
  // Handles profile navigation
  async function handleProfile() {
    // Navigates to user profile details page
    setDropdownOpen(false);
    navigate("/account_profile");
  }

  return (
    <nav className={styles.navbar}>
      <div className={styles.logo}>IsSked</div>

      <div className={styles.userMenu}>
        <button className={styles.userButton} onClick={toggleDropdown}>
          <div className={styles.profileWrapper}>
            <img src={avatar} alt="Profile" className={styles.profileImage} />
            <span className={styles.arrow}>&#x25BC;</span>
          </div>
        </button>

        {dropdownOpen && (
          <div className={styles.dropdown}>
            <div className={styles.dropdownItem}><span className={styles.usernameText}>{displayName}</span></div>
            <button onClick={handleProfile} className={styles.dropdownItem}>
              Profile
            </button>
            <button onClick={handleLogout} className={styles.dropdownItem}>
              Logout
            </button>
          </div>
        )}
      </div>
    </nav>
  );
};