import { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";
import { useNavigate } from "react-router-dom";
import NavBar from "../components/NavigationBar";
import styles from "../css/MainDashboard.module.css";

export default function MainDashboard() {
  const navigate = useNavigate();
  
  // ---------------- STATE ----------------
  // UI state
  const [schedules, setSchedules] = useState([]);
  const [activeSchedule, setActiveSchedule] = useState(null);
  const [loading, setLoading] = useState(true);

  // Modal state
  const [showModalCreateSched, setShowModalCreateSched] = useState(false);
  const [showModalEditSched, setShowModalEditSched] = useState(false);
  const [showModalDeleteSched, setShowModalDeleteSched] = useState(false);

  // Class schedule state
  const [scheduleName, setScheduleName] = useState("");
  const [editScheduleName, setEditScheduleName] = useState("");
  const [selectedSchedule, setSelectedSchedule] = useState(null);

  // ---------------- EFFECTS ----------------
  useEffect(() => {
    document.title = "Main Dashboard | IsSked";
    document.body.classList.add(styles.mainBody);
    fetchSchedules();
    return () => {
      document.body.classList.remove(styles.mainBody);
    };
  }, []);

  // Fetching data after load/reloading page
  async function fetchSchedules() {
    // Showing loading state
    setLoading(true);

    // Gets user logged in
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Fetching student ID
    const { data: studentData } = await supabase
      .from("student")
      .select("student_id")
      .eq("user_id", user.id)
      .single();
    if (!studentData) return;

    const studentId = studentData.student_id;

    // Fetching class schedules belonging to this student
    const { data: schedData } = await supabase
      .from("schedule")
      .select("*")
      .eq("student_id", studentId)
      .order("updated_at", { ascending: false });

    // Updating UI state
    setSchedules(schedData || []);
    setActiveSchedule(schedData?.find((s) => s.is_active) || null);

    // Hide loading state
    setLoading(false);
  }

  // ---------------- CREATE CLASS SCHEDULE ----------------
  // Handles class schedule creation
  // Note: There is no code or function yet for handling invalid inputs
  async function handleCreateSchedule() {
    // Checks for blank input
    if (!scheduleName.trim()) return alert("Schedule name is required.");

    // Gets user logged in
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Fetching student ID
    const { data: studentData } = await supabase
      .from("student")
      .select("student_id")
      .eq("user_id", user.id)
      .single();
    const studentId = studentData.student_id;

    // Insert new class schedule to Supabase
    const { error } = await supabase
      .from("schedule")
      .insert([
        {
          student_id: studentId,
          name: scheduleName,
          is_active: false,
        },
      ]);
    if (error) {
      console.error(error);
      return alert("Failed to create schedule");
    }

    // Refresh UI and modules
    setShowModalCreateSched(false);
    setScheduleName("");
    fetchSchedules();
  }

  // ---------------- EDIT CLASS SCHEDULE ----------------
  // Shows modal for edit class schedule
  function openEditModal(sched) {
    setSelectedSchedule(sched);
    setEditScheduleName(sched.name);
    setShowModalEditSched(true);
  }

  // Handles class schedule edit
  // Note: There is no code or function yet for handling invalid inputs
  async function handleEditSchedule() {
    // Checks for blank input
    if (!editScheduleName.trim()) return alert("Schedule name cannot be empty.");

    // Updates class schedule name to Supabase
    const { error } = await supabase
      .from("schedule")
      .update({ name: editScheduleName.trim() })
      .eq("schedule_id", selectedSchedule.schedule_id);

    if (error) {
      console.error(error);
      alert("Failed to update schedule");
      return;
    }

    // Refresh UI and modules
    setShowModalEditSched(false);
    setSelectedSchedule(null);
    setEditScheduleName("");
    fetchSchedules();
  }

  // ---------------- DELETE CLASS SCHEDULE ----------------
  // Shows modal for delete class schedule
  function openDeleteModal(sched) {
    setSelectedSchedule(sched);
    setShowModalDeleteSched(true);
  }

  // Handles class schedule deletion
  async function handleDeleteSchedule() {
    // Delete class schedule record from Supabase
    const { error } = await supabase
      .from("schedule")
      .delete()
      .eq("schedule_id", selectedSchedule.schedule_id);

    if (error) {
      console.error(error);
      alert("Failed to delete schedule");
      return;
    }

    // Refresh UI and modules
    setShowModalDeleteSched(false);
    setSelectedSchedule(null);
    fetchSchedules();
  }

  // ---------------- SET ACTIVE CLASS SCHEDULE ----------------
  // Handles setting a class schedule as active
  async function handleSetActive(scheduleId) {
    // Gets user logged in
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Fetching student ID
    const { data: studentData } = await supabase
      .from("student")
      .select("student_id")
      .eq("user_id", user.id)
      .single();
    const studentId = studentData.student_id;

    // Deactivating all class schedules for this student
    await supabase.from("schedule").update({ is_active: false }).eq("student_id", studentId);

    // Activating the selected class schedule
    const { error } = await supabase.from("schedule").update({ is_active: true }).eq("schedule_id", scheduleId);
    if (error) {
      console.error(error);
      alert("Failed to set schedule as active");
      return;
    }

    // Refresh modules
    fetchSchedules();
  }

  // ---------------- GO TO CLASS SCHEDULE LAYOUT ----------------
  // Handles navigation to class schedule layout
  function handleGoToLayout(scheduleId) {
    navigate(`/class_schedule/${scheduleId}`);
  }

  // ---------------- UI COMPONENT ----------------
  return (
    <>
      {/* Gets navigation bar component from is-sked/src/components/NavigationBar.jsx */}
      <NavBar />

      <div className={styles.wholeContent}>
        <div className={styles.elements}>
          <div className={styles.parent}>
            <div className={`${styles.child} ${styles.left}`}>
              <h1>
                <span style={{ fontSize: "40px" }}>Schedules</span>
                <span className={styles.block}>Active Schedule</span>
              </h1>
            </div>
            <div className={`${styles.child} ${styles.center}`}></div>
            <div className={`${styles.child} ${styles.right}`}>
              <button
                className={styles.addButton}
                onClick={() => setShowModalCreateSched(true)}
              >
                Create New Schedule
              </button>
            </div>
          </div>
        </div>

        {loading && (
          <p style={{ fontSize: "20px", textAlign: "center" }}>
            Loading schedules...
          </p>
        )}

        {!loading && activeSchedule && (
          <div className={styles.scheduleBox}>
            <div className={styles.scheduleInfo}>
              <span className={styles.scheduleTitle}>{activeSchedule.name}</span>
              <span className={styles.dateText}>
                Last Modified: {new Date(activeSchedule.updated_at).toLocaleDateString()}
              </span>
            </div>
            <div className={styles.scheduleActions}>
              <button className={styles.editButton} onClick={() => openEditModal(activeSchedule)}>Edit</button>
              <button className={styles.deleteButton} onClick={() => openDeleteModal(activeSchedule)}>Delete</button>
              <button className={styles.actionButton} onClick={() => handleGoToLayout(activeSchedule.schedule_id)}>Go to Layout</button>
            </div>
          </div>
        )}

        {!loading && !activeSchedule && (
          <div className={`${styles.elements} ${styles.box}`}>
            <span style={{ fontSize: "22px", fontWeight: "bold" }}>
              No active schedule
            </span>
            <span style={{ fontSize: "15px" }}>
              Click "Create New Schedule" to add one!
            </span>
          </div>
        )}

        {!loading && schedules.length > 0 && (
          <div className={`${styles.elements} ${styles.schedList}`}>
            {schedules.filter((s) => !s.is_active).map((sched) => (
              <div key={sched.schedule_id} className={styles.scheduleBox}>
                <div className={styles.scheduleInfo}>
                  <span className={styles.scheduleTitle}>{sched.name}</span>
                  <span className={styles.dateText}>
                    Last Modified: {new Date(sched.updated_at).toLocaleDateString()}
                  </span>
                </div>
                <div className={styles.scheduleActions}>
                  <button className={styles.editButton} onClick={() => openEditModal(sched)}>Edit</button>
                  <button className={styles.deleteButton} onClick={() => openDeleteModal(sched)}>Delete</button>
                  <button className={styles.actionButton} onClick={() => handleSetActive(sched.schedule_id)}>Set as Active</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && schedules.length === 0 && (
          <div className={`${styles.scheduleBox}`} style={{ justifyContent: "center", textAlign: "center", height: "calc(100vh - 70px)" }}>
            <div className={styles.scheduleInfo}>
              <span style={{ fontSize: "30px", fontWeight: "bold" }}>
                No schedules yet!
              </span>
              <span style={{ fontSize: "20px" }}>
                Click "Create New Schedule" to add one!
              </span>
            </div>
          </div>
        )}
      </div>

      {/* --------------- MODAL CREATE CLASS SCHEDULE --------------- */}
      {showModalCreateSched && (
        <div className={styles.modalBackdrop}>
          <div className={styles.modalBox}>
            <h2 className={styles.modalHeading}>CREATE CLASS SCHEDULE</h2>

            <div className={styles.elements}>
              <label className={styles.labelText}>Class Schedule Name</label>
              <input
                type="text"
                placeholder="Schedule 1"
                className={styles.modalInput}
                value={scheduleName}
                onChange={(e) => setScheduleName(e.target.value)}
              />
            </div>

            <div className={styles.modalButtons}>
              <button
                className={styles.primaryButton}
                onClick={handleCreateSchedule}
              >
                Create Class Schedule
              </button>
              <button
                className={styles.closeBtn}
                onClick={() => setShowModalCreateSched(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --------------- MODAL EDIT CLASS SCHEDULE DETAILS --------------- */}
      {showModalEditSched && selectedSchedule && (
        <div className={styles.modalBackdrop}>
          <div className={styles.modalBox}>
            <h2 className={styles.modalHeading}>EDIT CLASS SCHEDULE</h2>
            <div className={styles.elements}>
              <label className={styles.labelText}>Class Schedule Name</label>
              <input
                type="text"
                className={styles.modalInput}
                value={editScheduleName}
                onChange={(e) => setEditScheduleName(e.target.value)}
              />
            </div>
            <div className={styles.modalButtons}>
              <button className={styles.primaryButton} onClick={handleEditSchedule}>Save Changes</button>
              <button className={styles.closeBtn} onClick={() => setShowModalEditSched(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* --------------- MODAL DELETE CLASS SCHEDULE --------------- */}
      {showModalDeleteSched && selectedSchedule && (
        <div className={styles.modalBackdrop}>
          <div className={styles.modalBox}>
            <h2 className={styles.modalHeading}>DELETE CLASS SCHEDULE</h2>
            <p>Are you sure you want to delete "{selectedSchedule.name}"?</p>
            <div className={styles.modalButtons}>
              <button className={styles.primaryButton} onClick={handleDeleteSchedule}>Yes, Delete</button>
              <button className={styles.closeBtn} onClick={() => setShowModalDeleteSched(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}