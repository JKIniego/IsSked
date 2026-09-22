import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import NavBar from "../components/NavigationBar";
import styles from "../css/AccountProfile.module.css";

export default function AccountProfile() {
  const navigate = useNavigate();

  // ---------------- STATE ----------------
  // UI state
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Modal state
  const [editModalOpen, setEditModalOpen] = useState(false);

  // Edit profile state
  const [programs, setPrograms] = useState([]);
  const [displayName, setDisplayName] = useState("");
  const [degreeProgram, setDegreeProgram] = useState("");

  // ---------------- EFFECTS ----------------
  useEffect(() => {
    document.title = "Profile | IsSked";
    document.body.classList.add(styles.mainBody);
    fetchProfile();
    fetchPrograms();
    return () => {
      document.body.classList.remove(styles.mainBody);
    };
  }, []);

  // Fetching data after load/reloading page
  async function fetchProfile() {
    setLoading(true);
    
    // Gets logged in user
    const { data: { user } } = await supabase.auth.getUser();
    if(!user) return;

    // Loads student's profile info from Supabase
    const { data, error } = await supabase
      .from("student")
      .select(`
        student_id,
        email,
        display_name,
        degree_program_id,
        notification_threshold,
        created_at,
        updated_at,
        degree_program:degree_program_id (
          name
        )
      `)
      .eq("user_id", user.id)
      .single();

    if(error) {
      console.error("Error loading profile:", error);
      return;
    }

    setProfile(data);
    setLoading(false);
  }

  // Fetching data after load/reloading page
  async function fetchPrograms() {
    const { data, error } = await supabase
      .from("degree_program")
      .select("degree_program_id, name")
      .neq("degree_program_id", "UPTac0000");

    if(error) {
      console.error("Error fetching programs:", error);
    } else {
      setPrograms(data);
      if (data.length > 0) setDegreeProgram(data[0].degree_program_id);
    }
  }

  // ---------------- EDIT PROFILE DETAILS ----------------
  // Shows modal for edit class schedule
  async function openEditProfileModal() {
    setDisplayName(profile.display_name);
    setDegreeProgram(profile.degree_program_id);
    setEditModalOpen(true);
  }

  // Handles edit profile details
  async function handleEditProfile() {
    // Checks for blank inputs
    if(!displayName || !degreeProgram) {
      return alert("Please fill in all fields.");
    }

    // Checks for valid username
    if(displayName.length > 100) {
      alert("Username must not exceed 100 characters.");
      return;
    }

    const displayNameRegex = /^[A-Za-z0-9 ]*$/;
    if(!displayNameRegex.test(displayName)) {
      alert("Username must only include letters, numbers, and spaces.");
      return;
    }

    try {
      const { error } = await supabase
        .from("student")
        .update({
          display_name: displayName,
          degree_program_id: degreeProgram,
          updated_at: new Date().toISOString(),
        })
        .eq("student_id", profile.student_id);

      if(error) throw error;

      alert("Profile updated successfully!");

      // Refresh profile
      fetchProfile();
      setEditModalOpen(false);
    } catch(err) {
      alert("Failed to update profile.");
    }
  }
  
  // ---------------- UI COMPONENT ----------------
  return (
    <>
      {/* Gets navigation bar component from is-sked/src/components/NavigationBar.jsx */}
      <NavBar />
      
      {/* Loading screen */}
      {loading && (
        <div className={styles.wholeContent} style={{ justifyContent: "center", textAlign: "center" }}>
          <p>Loading profile...</p>
        </div>
      )}

      {/* Loads this part after fetching student's info */}
      {!loading && profile && (
        <div className={styles.wholeContent}>
          <div className={styles.elements}>
            <div className={styles.parent}>
              <div className={`${styles.child} ${styles.left}`}>
                <h1>
                  <span style={{ fontSize: "40px" }}>{profile.display_name}</span>
                  <span className={styles.block}>{profile.email}</span>
                </h1>
              </div>
              <div className={`${styles.child} ${styles.center}`}></div>
              <div className={`${styles.child} ${styles.right}`}>
                <button className={styles.editButton} onClick={openEditProfileModal}>
                  Edit Profile
                </button>
              </div>
            </div>
          </div>

          <div className={styles.accountList}>
            <div className={styles.accountBox}>
              <span className={styles.accountTitle}>Student ID: </span> {profile.student_id}
            </div>

            <div className={styles.accountBox}>
              <span className={styles.accountTitle}>Degree Program: </span> {profile.degree_program?.name}
            </div>

            <div className={styles.accountBox}>
              <span className={styles.accountTitle}>Account Created: </span> {new Date(profile.created_at).toLocaleString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
                hour: "numeric",
                minute: "2-digit",
                hour12: true,
              })}
            </div>

            <div className={styles.accountBox}>
              <span className={styles.accountTitle}>Account Updated: </span> {new Date(profile.updated_at).toLocaleString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
                hour: "numeric",
                minute: "2-digit",
                hour12: true,
              })}
            </div>
          </div>

          <div className={`${styles.elements} ${styles.buttonContainer}`}>
            <button className={styles.backButton} onClick={() => navigate("/main_dashboard")}>Back to Main Dashboard</button>
          </div>
        </div>
      )}

      {/* ---------------- EDIT PROFILE MODAL ---------------- */}
      {editModalOpen && (
        <div className={styles.modalBackdrop}>
          <div className={styles.modalBox}>
            <h2 className={styles.modalHeading}>Edit Profile</h2>

            <div className={styles.elements}>
              <label className={styles.labelText}>Display Name</label>
              <input type="text" className={styles.modalInput} value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
            </div>

            <div className={styles.elements}>
              <label className={styles.labelText}>Degree Program</label>
              <select
                className={styles.modalInput}
                value={degreeProgram}
                onChange={(e) => setDegreeProgram(e.target.value)}
              >
                {programs.map((program) => (
                  <option key={program.degree_program_id} value={program.degree_program_id}>
                    {program.name}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.modalButtons}>
              <button className={styles.primaryButton} onClick={handleEditProfile}>Save Changes</button>
              <button className={styles.closeBtn} onClick={() => setEditModalOpen(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}