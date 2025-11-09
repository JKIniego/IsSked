import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import styles from "../css/NavigationBar.module.css";

export default function NavigationBar() {
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [displayName, setDisplayName] = useState("Student");

  useEffect(() => {
    const name = localStorage.getItem("display_name") || "Student";
    setDisplayName(name);
  }, []);

  const toggleDropdown = () => setDropdownOpen(!dropdownOpen);

  const handleLogout = async () => {
    try {
      await supabase.rpc("set_logout_time");
      await supabase.auth.signOut();
      localStorage.clear();
      navigate("/", { replace: true });
    } catch (error) {
      console.error("Logout failed:", error.message);
    }
  };

  return (
    <nav className={styles.navbar}>
      <div className={styles.logo}>IsSked</div>

      <div className={styles.userMenu}>
        <button className={styles.userButton} onClick={toggleDropdown}>
          {displayName} &#x25BC;
        </button>

        {dropdownOpen && (
          <div className={styles.dropdown}>
            <button onClick={handleLogout} className={styles.dropdownItem}>
              Logout
            </button>
          </div>
        )}
      </div>
    </nav>
  );
};