import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import NavBar from "../components/NavigationBar";
import styles from "../css/ClassSchedule.module.css";
import html2canvas from "html2canvas";

export default function ClassSchedule() {
  const navigate = useNavigate();
  const defaultStart = "08:00";
  const defaultEnd = "16:00";

  // ---------------- STATE ----------------
  // Class schedule ID state
  const { id: scheduleId } = useParams();

  // UI state
  const [courses, setCourses] = useState([]);
  const [courseBlocks, setCourseBlocks] = useState([]);
  const [degreeProgCourses, setDegreeProgCourses] = useState([]);
  const [times, setTimes] = useState(generateTimeSlots("08:00", "16:00"));
  const [days, setDays] = useState(["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [showAddCourseModal, setShowAddCourseModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showModalDeleteCourse, setShowModalDeleteCourse] = useState(false);

  // Add course state
  const [courseID, setCourseID] = useState("");
  const [section, setSection] = useState("");
  const [classType, setClassType] = useState("Lec");
  const [selectedDays, setSelectedDays] = useState([]);
  const [timeStart, setTimeStart] = useState("07:00");
  const [timeEnd, setTimeEnd] = useState("08:00");

  // Edit course state
  const [editingCourse, setEditingCourse] = useState(null);

  // Delete course state
  const [courseToDelete, setCourseToDelete] = useState(null);

  // ---------------- EFFECTS ----------------
  useEffect(() => {
    document.title = "Class Schedule | IsSked";
    loadCourses();
    loadDegreeProgCourses();
  }, []);

  // Fetching data after load/reloading page
  async function loadCourses() {
    setLoading(true);

    if(!scheduleId) return;

    try {
      const { data: scheduledCourses, error: schedErr } = await supabase
        .from("course")
        .select(`
          course_uuid,
          course_id,
          section,
          lec_or_lab,
          time_start,
          time_end,
          course_list:course_id (
            title
          ),
          course_days:course_day!inner (
            day
          )
        `)
        .eq("schedule_id", scheduleId);

      if(schedErr) throw schedErr;

      const formatted = [];
      const courseListForUI = [];

      const dayMap = {
        Mon: "Monday",
        Tue: "Tuesday",
        Wed: "Wednesday",
        Thu: "Thursday",
        Fri: "Friday",
        Sat: "Saturday",
        Sun: "Sunday",
      };

      scheduledCourses.forEach((course) => {
        const courseName = course.course_id + " - " + course.section + " (" + course.lec_or_lab + ")";

        const color = "#98ce80ff";

        // Populate course layout with course blocks
        course.course_days.forEach((dayObj) => {
          formatted.push({
            course_uuid: course.course_uuid,
            day: dayMap[dayObj.day] || dayObj.day,
            start: convertDBTime(course.time_start),
            end: convertDBTime(course.time_end),
            name: courseName,
            color: color,
          });
        });

        // Populate course list
        courseListForUI.push({
          course_uuid: course.course_uuid,
          course_id: course.course_id,
          section: course.section,
          lec_or_lab: course.lec_or_lab,
          time_start: course.time_start,
          time_end: course.time_end,
          course_days: course.course_days,
          name: courseName,
          color: color,
        });
      });

      setCourseBlocks(formatted);
      setCourses(courseListForUI);

      // Compute dynamic layout
      const { start: minTime, end: maxTime } = computeTimeRange(scheduledCourses);
      setTimes(generateTimeSlots(minTime, maxTime));
      setDays(computeDays(scheduledCourses));
      setLoading(false);
    } catch(err) {
      console.error("Error loading courses:", err);
    }
  }

  // Fetching courses depending on degree program of student
  async function loadDegreeProgCourses() {
    // Gets user logged in
    const { data: { user } } = await supabase.auth.getUser();
    if(!user) return;

    // Fetches student's degree program
    const { data: studentData, error: studentErr } = await supabase
      .from("student")
      .select("degree_program_id")
      .eq("user_id", user.id)
      .single();

    if(studentErr) {
      console.error(studentErr);
      return;
    }

    const degreeProgram = studentData.degree_program_id;

    // Fetches courses in that degree program
    const { data: courseData, error: courseErr } = await supabase
      .from("course_program")
      .select("course_id")
      .in("degree_program_id", [degreeProgram, "UPTac0000"])
      .order("course_id", { ascending: true });

    if(courseErr) {
      alert("Error fetching degree program courses:", courseErr);
      return;
    }

    setDegreeProgCourses(courseData);
  }

  // ---------------- DOWNLOAD AS PNG ----------------
  // Handles downloading class schedule layout as PNG
  async function downloadSchedulePNG() {
    const table = document.querySelector(`.${styles.scheduleTable}`);
    if(!table) return;

    try {
      // Render table into canvas using html2canvas
      const canvas = await html2canvas(table, { scale: 2 });
      const imgData = canvas.toDataURL("image/png");

      // Temporary link and trigger download
      const link = document.createElement("a");
      link.href = imgData;
      link.download = "schedule.png";
      link.click();
    } catch(err) {
      console.error("Error generating PNG:", err);
    }
  }

  // ---------------- ADD COURSE ----------------
  // Handles adding a course
  async function handleAddCourse() {
    // Checks for blank inputs
    if(!courseID || !section) {
      alert("Please enter all inputs.");
      return;
    }

    if(selectedDays.length === 0) {
      alert("Please select at least one day.");
      return;
    }

    // Checks for valid time frame
    if(!isValidTimeRange(timeStart, timeEnd)) {
      alert("Start time must be earlier than end time.");
      return;
    }

    try {
      // Fetch existing courses for conflict checking
      const { data: existingCourses, error: conflictErr } = await supabase
        .from("course")
        .select(`
          course_uuid,
          time_start,
          time_end,
          course_days:course_day!inner(day)
        `)
        .eq("schedule_id", scheduleId);

      if(conflictErr) throw conflictErr;

      // Only check conflict if there are existing courses
      if(existingCourses && existingCourses.length > 0) {
        const newCourse = { timeStart, timeEnd, selectedDays };
        if(hasConflict(newCourse, existingCourses)) {
          alert("Course conflicts with an existing course on the same day and time.");
          return;
        }
      }

      // Insert into course table
      const { data: courseData, error: courseErr } = await supabase
        .from("course")
        .insert([
          {
            schedule_id: scheduleId,
            course_id: courseID,
            lec_or_lab: classType,
            time_start: timeStart,
            time_end: timeEnd,
            section: section,
          },
        ])
        .select()
        .single();

      if(courseErr) throw courseErr;

      const courseUUID = courseData.course_uuid;

      // Insert into course_day
      const courseDayInserts = selectedDays.map((day) => ({
        course_uuid: courseUUID,
        day: day,
      }));

      const { error: dayErr } = await supabase
        .from("course_day")
        .insert(courseDayInserts);

      if(dayErr) throw dayErr;

      alert("Course successfully added!");
      loadCourses();
      setShowAddCourseModal(false);

      // Reset modal state
      setCourseID("");
      setClassType("Lec");
      setSelectedDays([]);
      setTimeStart("07:00");
      setTimeEnd("08:00");
    } catch(err) {
      alert("Failed to add course.");
    }
  }

  // ---------------- EDIT COURSE ----------------
  // Shows modal for edit course
  function handleEditModal(course) {
    setEditingCourse({
      course_uuid: course.course_uuid,
      course_id: course.course_id,
      section: course.section,
      lec_or_lab: course.lec_or_lab,
      time_start: course.time_start,
      time_end: course.time_end,
      selectedDays: course.course_days.map(d => d.day),
    });
    setShowEditModal(true);
  }

  // Handles edit course details
  async function handleUpdateCourse() {
    if(!editingCourse) return;

    // Check for blank course ID
    if(!editingCourse.course_id || !editingCourse.section) {
      alert("Please enter all inputs.");
      return;
    }

    // Check for at least one day
    if(!editingCourse.selectedDays || editingCourse.selectedDays.length === 0) {
      alert("Please select at least one day.");
      return;
    }

    // Validate time range
    if(!isValidTimeRange(editingCourse.time_start, editingCourse.time_end)) {
      alert("Start time must be earlier than end time.");
      return;
    }

    try {
      // Fetch existing courses for conflict checking (excluding the current one)
      const { data: existingCourses, error: conflictErr } = await supabase
        .from("course")
        .select(`
          course_uuid,
          time_start,
          time_end,
          course_days:course_day!inner(day)
        `)
        .eq("schedule_id", scheduleId);

      if(conflictErr) throw conflictErr;

      // Normalize all courses first
      const dayMap = {
        Mon: "Monday", Tue: "Tuesday", Wed: "Wednesday",
        Thu: "Thursday", Fri: "Friday", Sat: "Saturday", Sun: "Sunday"
      };

      const normalizedCourses = existingCourses.map(course => ({
        course_uuid: course.course_uuid,
        time_start: course.time_start,
        time_end: course.time_end,
        course_days: course.course_days.map(d => ({ day: dayMap[d.day] || d.day }))
      }));

      // Exclude the course being edited
      const otherCourses = normalizedCourses.filter(c => c.course_uuid !== editingCourse.course_uuid);

      // Normalize editingCourse's selectedDays
      const normalizedSelectedDays = editingCourse.selectedDays.map(d => dayMap[d] || d);

      if(hasConflict(
        {
          timeStart: editingCourse.time_start,
          timeEnd: editingCourse.time_end,
          selectedDays: normalizedSelectedDays,
        },
        otherCourses
      )) {
        alert("This course conflicts with an existing course.");
        return;
      }

      // Update course table
      const { error: courseErr } = await supabase
        .from("course")
        .update({
          course_id: editingCourse.course_id,
          section: editingCourse.section,
          lec_or_lab: editingCourse.lec_or_lab,
          time_start: editingCourse.time_start,
          time_end: editingCourse.time_end,
        })
        .eq("course_uuid", editingCourse.course_uuid);

      if(courseErr) throw courseErr;

      // Update course_day table
      const { error: deleteErr } = await supabase
        .from("course_day")
        .delete()
        .eq("course_uuid", editingCourse.course_uuid);
      if(deleteErr) throw deleteErr;

      // Insert new days
      const dayInserts = editingCourse.selectedDays.map((day) => ({
        course_uuid: editingCourse.course_uuid,
        day,
      }));

      const { error: dayErr } = await supabase
        .from("course_day")
        .insert(dayInserts);
      
      if(dayErr) throw dayErr;

      // Reload courses and close modal
      loadCourses();
      setShowEditModal(false);
      setEditingCourse(null);

      alert("Course updated successfully!");
    } catch(err) {
      alert("Failed to update course.");
    }
  }

  // Checks if time range is valid
  function isValidTimeRange(start, end) {
    const [startHour, startMinute] = start.split(":").map(Number);
    const [endHour, endMinute] = end.split(":").map(Number);

    const startTotal = startHour * 60 + startMinute;
    const endTotal = endHour * 60 + endMinute;

    return startTotal < endTotal;
  }

  // Checks for conflict
  function hasConflict(newCourse, existingCourses) {
    if(!existingCourses || existingCourses.length === 0) return false;

    const [startHour, startMinute] = newCourse.timeStart.split(":").map(Number);
    const [endHour, endMinute] = newCourse.timeEnd.split(":").map(Number);
    const startTotal = startHour * 60 + startMinute;
    const endTotal = endHour * 60 + endMinute;

    const selectedDaySet = new Set(newCourse.selectedDays);

    return existingCourses.some((course) =>
      course.course_days.some((dayObj) => {
        if(!selectedDaySet.has(dayObj.day)) return false;

        const [courseStartHour, courseStartMinute] = course.time_start
          .split(":")
          .map(Number);
        const [courseEndHour, courseEndMinute] = course.time_end
          .split(":")
          .map(Number);

        const courseStart = courseStartHour * 60 + courseStartMinute;
        const courseEnd = courseEndHour * 60 + courseEndMinute;

        // Overlap if start < courseEnd && end > courseStart
        return startTotal < courseEnd && endTotal > courseStart;
      })
    );
  }

  // ---------------- DELETE COURSE ----------------
  // Handles deleting a course
  async function handleDeleteCourse(course_uuid) {
    try {
      const { data, error } = await supabase
        .from("course")
        .delete()
        .eq("course_uuid", course_uuid)
        .select("*");
      if (error) throw error;

      alert("Course deleted successfully!");
      loadCourses();
      setShowModalDeleteCourse(false);
      setCourseToDelete(null);
      setShowEditModal(false);
      setEditingCourse(null);
    } catch (err) {
      alert("Failed to delete course.");
    }
  }

  // ---------------- TABLE GENERATOR ----------------
  // Generating half-hour time slots from 8:00 AM to 4:00 PM
  function generateTimeSlots(startTime, endTime) {
    const slots = [];
    let [hour, minute] = startTime.split(":").map(Number);
    const [endHour, endMinute] = endTime.split(":").map(Number);

    while(hour < endHour || (hour === endHour && minute <= endMinute)) {
      const ampm = hour < 12 ? "AM" : "PM";
      const displayHour = hour % 12 === 0 ? 12 : hour % 12;
      const displayMinute = minute === 0 ? "00" : minute;
      slots.push(`${displayHour}:${displayMinute} ${ampm}`);

      minute += 30;
      if(minute === 60) {
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
    if(h === 0) h = 12;
    return `${h}:${m === 0 ? "00" : m} ${ampm}`;
  }

  // Converts a time string (e.g. "9:30 AM") into index for timetable grid
  function timeToIndexInTimes(time) {
    const index = times.findIndex(t => t === time);
    return index === -1 ? times.length : index;
  }

  // Compute dynamic time range
  function computeTimeRange(courses) {
    if(!courses || courses.length === 0) return { start: defaultStart, end: defaultEnd };

    let min = defaultStart;
    let max = defaultEnd;

    courses.forEach(course => {
      if(course.time_start < min) min = course.time_start;
      if(course.time_end > max) max = course.time_end;
    });

    return { start: min, end: max };
  }

  // Compute dynamic days
  function computeDays(courses) {
    const defaultDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
    const dayMap = {
      Mon: "Monday",
      Tue: "Tuesday",
      Wed: "Wednesday",
      Thu: "Thursday",
      Fri: "Friday",
      Sat: "Saturday",
      Sun: "Sunday",
    };

    // Variable that checks if any course is on Sat or Sun
    let classOnWeekend = false;

    courses.forEach(course => {
      course.course_days.forEach(dayObj => {
        const dayName = dayMap[dayObj.day] || dayObj.day;
        if (dayName === "Saturday" || dayName === "Sunday") {
          classOnWeekend = true;
        }
      });
    });

    // Include weekends if there is a class on weekends
    const extraDays = classOnWeekend ? ["Saturday", "Sunday"] : [];

    return [...defaultDays, ...extraDays];
  }

  // ---------------- UI COMPONENT ----------------
  return (
    <>
      {/* Gets navigation bar component from is-sked/src/components/NavigationBar.jsx */}
      <NavBar />

      <div className={styles.wholeContent}>
        <div className={styles.leftColumn}>
          <div className={styles.buttonDiv}>
            <button className={styles.addButton} onClick={() => setShowAddCourseModal(true)}>Add Course</button>
          </div>

          <div className={styles.coursesDiv}>
            <h3 className={styles.coursesTitle}>Course List</h3>
            <hr className={styles.coursesLine} />
            <ul className={styles.courseList}>
              {courses.map((c) => (
                <li key={c.course_uuid} className={styles.courseItem} style={{ backgroundColor: c.color }} onClick={() => handleEditModal(c)}>
                  {c.name}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className={styles.rightColumn}>
          <div className={styles.tableContainer}>
            {loading && (
              <div style={{ display: 'flex', fontSize: "20px", justifyContent: 'center', alignItems: "center" }}>
                <p>Loading schedules...</p>
              </div>
            )}

            {!loading && (
              <table className={styles.scheduleTable}>
                <thead>
                  <tr>
                    <th>{/* Days of the week header */}</th>
                    {days.map((day) => (
                      <th key={day}>{day}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {times.map((time, rowIndex) => (
                    <tr key={time}>
                      <td className={styles.timeCell} data-time={time}>{/* Time column (e.g. 7:00 am, 7:30 am, ... , 4:00pm) */}</td>
                      {days.map((day) => {
                        {/* Maaping out course blocks inside the class schedule layout */}
                        const rowIndex = times.findIndex(t => t === time);
                        const course = courseBlocks.find(c => 
                          c.day === day &&
                          timeToIndexInTimes(c.start) === rowIndex
                        );
                        if(course) {
                          const startIndex = timeToIndexInTimes(course.start);
                          const endIndex = timeToIndexInTimes(course.end);
                          const span = endIndex - startIndex;

                          return (
                            <td key={day + rowIndex} className={styles.classCell} rowSpan={span} style={{ backgroundColor: course.color, border: "1px solid gray" }} onClick={() => {
                              navigate(`/task_dashboard/${course.course_uuid}`, {
                                state: {
                                  name: course.name,
                                },
                              })
                            }}
                            >
                              {course.name}
                            </td>
                          );
                        }

                        {/* Checks if this certain cell is already spanned by some class schedule */}
                        const isSpanned = courseBlocks.some(
                          (c) =>
                            c.day === day &&
                            timeToIndexInTimes(c.start) < rowIndex &&
                            timeToIndexInTimes(c.end) > rowIndex
                        );
                        return isSpanned ? null : (
                          <td key={day + rowIndex}></td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className={styles.buttonsContainer}>
            <button className={styles.actionButton} onClick={downloadSchedulePNG}>
              Download Schedule as PNG
            </button>
            <button className={styles.actionButton} onClick={() => alert("Calendar view is still WIP")}>Go To Calendar</button>
            <button className={`${styles.actionButton} ${styles.backButton}`} onClick={() => navigate("/main_dashboard")}>Back to Main Dashboard</button>
          </div>
        </div>
      </div>

      {/* --------------- MODAL ADD COURSE --------------- */}
      {showAddCourseModal && (
        <div className={styles.modalBackdrop}>
          <div className={styles.modalBox}>
            <h2 className={styles.modalHeading}>ADD COURSE</h2>

            <div className={`${styles.elements} ${styles.firstCol}`}>
              <div className={styles.courseIdDiv}>
                <label className={styles.labelText}>Course ID*</label>
                <select className={styles.modalInput} value={courseID} onChange={(e) => setCourseID(e.target.value)}>
                  <option value="">-- Select a Course --</option>
                  {degreeProgCourses.map((c) => (
                    <option key={c.course_id} value={c.course_id}>
                      {c.course_id}
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.sectionDiv}>
                <label className={styles.labelText}>Section*</label>
                <input type="text" placeholder="Section" className={styles.modalInput} value={section} onChange={(e) => setSection(e.target.value)}/>
              </div>

              <div className={styles.lecOrLabDiv}>
                <label className={styles.labelText}>Class Type*</label>
                <select className={styles.modalInput} value={classType} onChange={(e) => setClassType(e.target.value)}>
                  <option value="Lec">Lec</option>
                  <option value="Lab">Lab</option>
                </select>
              </div>
            </div>

            <div className={`${styles.elements} ${styles.centerDiv}`}>
              <div className={styles.checkboxGroup}>
                {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
                  <label key={day} className={styles.checkboxLabel}>
                    <input type="checkbox" value={day} checked={selectedDays.includes(day)}
                      onChange={() => {
                        if(selectedDays.includes(day)) {
                          setSelectedDays(selectedDays.filter(d => d !== day));
                        } else {
                          setSelectedDays([...selectedDays, day]);
                        }
                      }}
                    />
                    {day}
                  </label>
                ))}
              </div>
            </div>

            <div className={`${styles.elements} ${styles.centerDiv}`}>
              <div className={styles.timeDiv}>
                <div className={styles.timeInput}>
                  <label className={styles.labelText}>Start Time*</label>
                  <input type="time" className={styles.modalInput} value={timeStart} onChange={(e) => {
                      let val = e.target.value;
                      if (!val) return;

                      let [h, m] = val.split(":");

                      if (m < 15) m = "00";
                      else if (m < 45) m = "30";
                      else {
                        m = "00";
                        h = String((parseInt(h) + 1) % 24).padStart(2, "0");
                      }

                      setTimeStart(`${h}:${m}`);
                    }}
                  />
                </div>

                <div className={styles.timeInput}>
                  <label className={styles.labelText}>End Time*</label>
                  <input type="time" className={styles.modalInput} value={timeEnd} onChange={(e) => {
                      let val = e.target.value;
                      if (!val) return;

                      let [h, m] = val.split(":");

                      if (m < 15) m = "00";
                      else if (m < 45) m = "30";
                      else {
                        m = "00";
                        h = String((parseInt(h) + 1) % 24).padStart(2, "0");
                      }

                      setTimeEnd(`${h}:${m}`);
                    }}
                  />
                </div>
              </div>
            </div>

            <div className={styles.modalButtons}>
              <button className={styles.primaryButton} onClick={handleAddCourse}>Add Course</button>
              <button className={styles.closeBtn} onClick={() => setShowAddCourseModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* --------------- MODAL EDIT COURSE --------------- */}
      {showEditModal && editingCourse && (
        <div className={styles.modalBackdrop}>
          <div className={styles.modalBox}>
            <h2 className={styles.modalHeading}>EDIT COURSE</h2>

            <div className={`${styles.elements} ${styles.firstCol}`}>
              <div className={styles.courseIdDiv}>
                <label className={styles.labelText}>Course ID*</label>
                <select className={styles.modalInput} value={editingCourse.course_id} onChange={(e) => setEditingCourse({ ...editingCourse, course_id: e.target.value })}>
                  <option value="">-- Select a Course --</option>
                  {degreeProgCourses.map((c) => (
                    <option key={c.course_id} value={c.course_id}>
                      {c.course_id}
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.sectionDiv}>
                <label className={styles.labelText}>Section*</label>
                <input type="text" className={styles.modalInput} value={editingCourse.section} onChange={(e) => setEditingCourse({ ...editingCourse, section: e.target.value })}/>
              </div>

              <div className={styles.lecOrLabDiv}>
                <label className={styles.labelText}>Class Type*</label>
                <select className={styles.modalInput} value={editingCourse.lec_or_lab} onChange={(e) => setEditingCourse({ ...editingCourse, lec_or_lab: e.target.value }) }>
                  <option value="Lec">Lec</option>
                  <option value="Lab">Lab</option>
                </select>
              </div>
            </div>
            
            <div className={`${styles.elements} ${styles.centerDiv}`}>
              <div className={styles.checkboxGroup}>
                {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
                  <label key={day} className={styles.checkboxLabel}>
                    <input type="checkbox" value={day} checked={editingCourse.selectedDays.includes(day)}
                      onChange={() => {
                        const days = editingCourse.selectedDays.includes(day)
                          ? editingCourse.selectedDays.filter(d => d !== day)
                          : [...editingCourse.selectedDays, day];
                        setEditingCourse({ ...editingCourse, selectedDays: days });
                      }}
                    />
                    {day}
                  </label>
                ))}
              </div>
            </div>

            <div className={`${styles.elements} ${styles.centerDiv}`}>
              <div className={styles.timeDiv}>
                <div className={styles.timeInput}>
                  <label className={styles.labelText}>Start Time*</label>
                  <input type="time" className={styles.modalInput} value={editingCourse.time_start}
                    onChange={(e) => {
                      let val = e.target.value;
                      if (!val) {
                        setEditingCourse({ ...editingCourse, time_start: "" });
                        return;
                      }

                      let [h, m] = val.split(":").map(Number);

                      if (m < 15) m = 0;
                      else if (m < 45) m = 30;
                      else {
                        m = 0;
                        h = (h + 1) % 24;
                      }

                      const snapped = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
                      setEditingCourse({ ...editingCourse, time_start: snapped });
                    }}
                  />
                </div>

                <div className={styles.timeInput}>
                  <label className={styles.labelText}>End Time*</label>
                  <input type="time" className={styles.modalInput} value={editingCourse.time_end}
                    onChange={(e) => {
                      let val = e.target.value;
                      if (!val) {
                        setEditingCourse({ ...editingCourse, time_end: "" });
                        return;
                      }

                      let [h, m] = val.split(":").map(Number);

                      if (m < 15) m = 0;
                      else if (m < 45) m = 30;
                      else {
                        m = 0;
                        h = (h + 1) % 24;
                      }

                      const snapped = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
                      setEditingCourse({ ...editingCourse, time_end: snapped });
                    }}
                  />
                </div>
              </div>
            </div>

            <div className={styles.modalButtons}>
              <button className={styles.primaryButton} onClick={handleUpdateCourse}>
                Save Changes
              </button>
              <button className={styles.closeBtn} onClick={() => setShowEditModal(false)}>
                Cancel
              </button>
              <button className={styles.closeBtn} onClick={() => {
                setCourseToDelete(editingCourse);
                setShowModalDeleteCourse(true);
              }}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --------------- MODAL DELETE COURSE --------------- */}
      {showModalDeleteCourse && courseToDelete && (
        <div className={styles.modalBackdrop}>
          <div className={styles.modalBoxConfirm}>
            <h2 className={styles.modalHeading}>DELETE COURSE</h2>
            <p>Are you sure you want to delete <strong>{courseToDelete.course_id} - {courseToDelete.section} ({courseToDelete.lec_or_lab})</strong>?</p>
            <div className={styles.modalButtons}>
              <button className={styles.primaryButton} onClick={() => 
                handleDeleteCourse(courseToDelete.course_uuid)
              }>Yes, Delete</button>
              <button className={styles.closeBtn} onClick={() => {
                setShowModalDeleteCourse(false);
                setCourseToDelete(null);
              }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}