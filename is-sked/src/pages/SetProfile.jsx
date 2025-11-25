import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import styles from "../css/SetProfile.module.css";

export default function SetProfile() {
  const navigate = useNavigate();

  // ---------------- STATE ----------------
  // Profile details state
  const [degreeProgram, setDegreeProgram] = useState("");

  // Handles list of degree programs available
  const [programs, setPrograms] = useState([]);

  // ---------------- EFFECTS ----------------
  useEffect(() => {
    document.title = "Set Profile | IsSked";
    document.body.classList.add(styles.profileBody);

    fetchPrograms();

    return () => {
      document.body.classList.remove(styles.profileBody);
    };
  }, []);

  // Fetches degree program list from Supabase
  async function fetchPrograms() {
    const { data, error } = await supabase
      .from("degree_program")
      .select("degree_program_id, name")
      .neq("degree_program_id", "UPTac-0000");

    if (error) {
      console.error("Error fetching programs:", error);
    } else {
      setPrograms(data);
      if (data.length > 0) setDegreeProgram(data[0].degree_program_id);
    }
  }

  // ---------------- MAIN DASHBOARD NAVIGATION ----------------
  // Handles navigation to main dashboard after setting up profile details after creating new account
  async function handleNavigation() {
    // Alerts if no degree program is selected
    if (!degreeProgram) return alert("Please select a degree program");

    // Gets user logged in
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError) {
      console.error("Error getting user:", userError);
      return;
    }

    // Updates degree program to user in Supabase
    const { error } = await supabase
      .from("student")
      .update({ degree_program_id: degreeProgram })
      .eq("user_id", user.id);

    // Checks for any unexpected error
    if (error) console.error("Error updating profile:", error);
    else {
      localStorage.setItem("degree_program_id", degreeProgram);
      navigate("/main_dashboard");
    }
  }

  return (
    <div className={styles.profileContainer}>
      <h1 className={styles.heading}>PROFILE SET UP</h1>

      <div className={styles.elements}>
        <label className={styles.labelText}>Degree Program</label>
        <select
          className={styles.inputField}
          value={degreeProgram}
          onChange={(e) => setDegreeProgram(e.target.value)} > {
              programs.map((program) => (
              <option key={program.degree_program_id} value={program.degree_program_id} >
                {program.name}
              </option>
            ))
          }
        </select>
      </div>

      <div className={styles.elements}>
        <button className={styles.primaryButton} onClick={handleNavigation}>
          CONTINUE
        </button>
      </div>
    </div>
  );
}
