import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import NavBar from "../components/NavigationBar";
import styles from "../css/ClassSchedule.module.css";
import html2canvas from "html2canvas";

export default function ClassSchedule() {
  // ---------------- STATE ----------------
  // Class schedule ID state
  const { id: scheduleId } = useParams();

  // UI state
  const [courses, setCourses] = useState([]);
  const [courseBlocks, setCourseBlocks] = useState([]);
  const [loading, setLoading] = useState(true);

  // ---------------- EFFECTS ----------------
  useEffect(() => {
    document.title = "Class Schedule | IsSked";
    loadCourses();
  }, []);

  // Fetching data after load/reloading page
  async function loadCourses() {
    if (!scheduleId) return;

    try {
      // Fetching all courses
      const { data: courseListData, error: listErr } = await supabase
        .from("course_list")
        .select("*");

      if (listErr) throw listErr;
      setCourses(courseListData);

      // Fetching course data
      const { data: scheduledData, error: schedErr } = await supabase
        .from("course_day")
        .select(`day, section, course:course_id (
          time_start, time_end,
          course_list (
            name, color
          )
        )
      `).eq("schedule_id", scheduleId);

      if (schedErr) throw schedErr;

      // Formatting course data for layout rendering
      const formatted = scheduledData.map((c) => ({
        day: c.day,
        start: convertDBTime(c.course.time_start),
        end: convertDBTime(c.course.time_end),
        name: c.course.course_list?.name
          ? c.course.course_list.name + (c.section ? ` (Sec ${c.section})` : "")
          : "Untitled",
        color: c.course.course_list?.color || getRandomColor(),
      }));

      // Refresh UI and modules
      setCourseBlocks(formatted);
      setLoading(false);
    } catch (err) {
      console.error("Error loading courses:", err);
    }
  }

  // ---------------- DOWNLOAD AS PNG ----------------
  // Handles downloading class schedule layout as PNG
  async function downloadSchedulePNG() {
    const table = document.querySelector(`.${styles.scheduleTable}`);
    if (!table) return;

    try {
      // Render table into canvas using html2canvas
      const canvas = await html2canvas(table, { scale: 2 });
      const imgData = canvas.toDataURL("image/png");

      // Temporary link and trigger download
      const link = document.createElement("a");
      link.href = imgData;
      link.download = "schedule.png";
      link.click();
    } catch (err) {
      console.error("Error generating PNG:", err);
    }
  }

  // ---------------- TABLE GENERATOR ----------------
  // Data for table generator
  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
  const times = generateTimeSlots();

  // Generating half-hour time slots from 7:00 AM to 7:00 PM
  function generateTimeSlots() {
    const slots = [];
    let hour = 7;
    let minute = 0;

    // Loops from 7:00 AM to 7:00 PM
    while (hour < 19 || (hour === 19 && minute === 0)) {
      const ampm = hour < 12 ? "AM" : "PM";
      const displayHour = hour % 12 === 0 ? 12 : hour % 12;
      const displayMinute = minute === 0 ? "00" : minute;
      slots.push(`${displayHour}:${displayMinute} ${ampm}`);

      // Increment by 30 minutes
      minute += 30;
      if (minute === 60) {
        minute = 0;
        hour++;
      }
    }
    return slots;
  }

  // ---------------- TIME HELPERS ----------------
  // Converts military time string (e.g. "13:00") into display format (e.g. "1:00 PM")
  function convertDBTime(t) {
    let [h, m] = t.split(":").map(Number);
    const ampm = h >= 12 ? "PM" : "AM";
    h = h % 12;
    if (h === 0) h = 12;
    return `${h}:${m.toString().padStart(2, "0")} ${ampm}`;
  }

  // Converts a time string (e.g. "9:30 AM") into index for timetable grid
  function timeToIndex(time) {
    const [hm, ampm] = time.split(" ");
    let [h, m] = hm.split(":").map(Number);

    // Convert to 24‑hour format
    if (ampm === "PM" && h !== 12) h += 12;
    if (ampm === "AM" && h === 12) h = 0;

    // Calculate index: each hour has 2 slots (30 min each)
    return (h - 7) * 2 + (m === 30 ? 1 : 0);
  }

  // Generates a random hex color (fallback if no color in DB)
  function getRandomColor() {
    return "#" + Math.floor(Math.random() * 16777215).toString(16);
  }

  // ---------------- UI COMPONENT ----------------
  return (
    <>
      {/* Gets navigation bar component from is-sked/src/components/NavigationBar.jsx */}
      <NavBar />

      <div className={styles.wholeContent}>
        <div className={styles.leftColumn}>
          <div className={styles.buttonDiv}>
            <button className={styles.addButton}>Add Course</button>
          </div>

          <div className={styles.coursesDiv}>
            <h3 className={styles.coursesTitle}>Course List</h3>
            <hr className={styles.coursesLine} />
            <ul className={styles.courseList}>
              {courses.map((c) => (
                <li key={c.course_id} className={styles.courseItem} style={{ backgroundColor: c.color || getRandomColor() }}>
                  {c.name}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className={styles.rightColumn}>
          <div className={styles.tableContainer}>
            <table className={styles.scheduleTable}>
              <thead>
                <tr>
                  <th></th>
                  {days.map((day) => (
                    <th key={day}>{day}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {times.map((time, rowIndex) => (
                  <tr key={time}>
                    <td className={styles.timeCell} data-time={time}></td>
                    {days.map((day) => {
                      const course = courseBlocks.find(
                        (c) => c.day === day && time === c.start
                      );
                      if (course) {
                        const startIndex = timeToIndex(course.start);
                        const endIndex = timeToIndex(course.end);
                        const span = endIndex - startIndex;

                        return (
                          <td key={day + rowIndex} className={styles.classCell} rowSpan={span} style={{ backgroundColor: course.color }}
                          >
                            {course.name}
                          </td>
                        );
                      }

                      const isSpanned = courseBlocks.some(
                        (c) =>
                          c.day === day &&
                          timeToIndex(c.start) < rowIndex &&
                          timeToIndex(c.end) > rowIndex
                      );
                      return isSpanned ? null : (
                        <td key={day + rowIndex}></td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className={styles.buttonsContainer}>
            <button className={styles.actionButton} onClick={downloadSchedulePNG}>
              Download Schedule as PNG
            </button>
            <button className={styles.actionButton}>Go To Calendar</button>
            <button className={`${styles.actionButton} ${styles.backButton}`}>Back to Main Dashboard</button>
          </div>
        </div>
      </div>
    </>
  );
}