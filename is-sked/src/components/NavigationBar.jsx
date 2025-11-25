import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import styles from "../css/NavigationBar.module.css";

export default function NavigationBar() {
  const navigate = useNavigate();

  // ---------------- STATE ----------------
  // Navigation bar state
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [displayName, setDisplayName] = useState("Student");

  // ---------------- EFFECTS ----------------
  useEffect(() => {
    fetchDisplayName();
  }, []);

  // Fetches display name of user from Supabase
  async function fetchDisplayName() {
    // Gets user logged in
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Fetches display name of user from Supabase
    const { data: student, error } = await supabase
      .from("student")
      .select("display_name")
      .eq("user_id", user.id)
      .single();

    if (!error && student?.display_name) setDisplayName(student.display_name);
  }

  // Checks if user toggles dropdown menu
  const toggleDropdown = () => setDropdownOpen(!dropdownOpen);

  // ---------------- LOGOUT ----------------
  // Handles user logout
  async function handleLogout() {
    try {
      // User sign out
      await supabase.rpc("set_logout_time");
      await supabase.auth.signOut();

      // Clear local storage
      localStorage.clear();

      // Navigates to login page
      navigate("/", { replace: true });
    } catch (error) {
      console.error("Logout failed:", error.message);
    }
  };

  // ---------------- PROFILE NAVIGATION ----------------
  // Handles profile navigation
  async function handleProfile() {
    // Navigates to user profile details page
    navigate("/account_profile");
  }

  return (
    <nav className={styles.navbar}>
      <div className={styles.logo}>IsSked</div>

      <div className={styles.userMenu}>
        <button className={styles.userButton} onClick={toggleDropdown}>
          {displayName} &#x25BC;
        </button>

        {dropdownOpen && (
          <div className={styles.dropdown}>
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