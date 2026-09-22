import { useEffect, useState } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import NavBar from "../components/NavigationBar";
import styles from "../css/TaskDashboard.module.css";

export default function TaskDashboard() {
  const { course_uuid } = useParams();
  const navigate = useNavigate();
  const { name = "" } = useLocation().state || {};

  // ---------------- STATE ----------------
  // UI state
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal state
  const [showCreateTaskModal, setShowCreateTaskModal] = useState(false);
  const [showEditTaskModal, setShowEditTaskModal] = useState(false);
  const [showDeleteTaskModal, setShowDeleteTaskModal] = useState(false);

  // Add task state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [status, setStatus] = useState("IN_PROGRESS");

  // Edit task state
  const [editTask, setEditTask] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editDueDate, setEditDueDate] = useState("");

  // Delete task state
  const [deleteTask, setDeleteTask] = useState(null);

  // ---------------- EFFECTS ----------------
  useEffect(() => {
    document.title = "Task Dashboard | IsSked";
    document.body.classList.add(styles.mainBody);
    fetchTasks();
    return () => {
      document.body.classList.remove(styles.mainBody);
    };
  }, []);

  // Fetching data after load/reloading page
  async function fetchTasks() {
    if (!course_uuid) return;

    setLoading(true);

    try {
      const { data, error } = await supabase
        .from("task")
        .select("*")
        .eq("course_uuid", course_uuid)
        .order("due_date", { ascending: true });

      if(error) throw error;

      // Formats the time to local time since Supabase stores time in UTC
      const taskFormat = data.map(task => ({
        ...task,
        due_date: new Date(task.due_date).toISOString(),
        isOverdue: new Date(task.due_date) < new Date()
      }));

      setTasks(taskFormat);
      setLoading(false);
    } catch(err) {
      console.error("Error fetching tasks:", err);
    }
  }

  // ---------------- ADD TASK ----------------
  // Handles task creation
  async function handleCreateTask() {
    // Checks for blank inputs
    if (!title || !dueDate) {
      alert("Please fill in all required fields.");
      return;
    }

    try {
      // Converts to UTC (Supabase standard time)
      const dueDateUTC = new Date(dueDate).toISOString();

      const { error } = await supabase.from("task").insert([
        {
          course_uuid,
          title: title,
          description: description,
          due_date: dueDateUTC,
          status: status,
        }
      ]);

      if(error) {
        if(error.message.includes("duplicate key")) {
          // Alerts that task already exists
          alert("Task already exists!");
        } else {
          alert("Failed to create task");
        }
        return;
      }

      alert("Task added successfully!");

      // Close modal and reset fields
      setShowCreateTaskModal(false);
      setTitle("");
      setDescription("");
      setDueDate("");
      setStatus("IN_PROGRESS");

      // Refresh tasks
      fetchTasks();
    } catch(err) {
      alert("Failed to create task.");
    }
  }

  // ---------------- EDIT TASK ----------------
  // Shows modal for edit task
  async function openEditTaskModal(task) {
    setEditTask(task);
    setEditTitle(task.title);
    setEditDescription(task.description);

    const date = new Date(task.due_date);
    const offset = date.getTimezoneOffset() * 60000;
    const localDateTime = new Date(date.getTime() - offset).toISOString().slice(0,16);
    
    setEditDueDate(localDateTime);
    setShowEditTaskModal(true);
  }

  // Handles updating task
  async function handleUpdateTask() {
    // Checks for blank inputs
    if(!editTitle || !editDueDate) {
      return alert("Please fill in all required fields.");
    }

    try {
      // Converts from local date-time to UTC (Supabase standard time)
      const editDueDateUTC = new Date(editDueDate).toISOString();

      const { error } = await supabase
        .from("task")
        .update({
          title: editTitle,
          description: editDescription,
          due_date: editDueDateUTC
        })
        .eq("task_id", editTask.task_id);

      if(error) {
        if(error.message.includes("duplicate key")) {
          // Alerts that task already exists
          alert("Task already exists!");
        } else {
          alert("Failed to update task");
        }
        return;
      }

      alert("Task updated successfully!");

      // Close modal and reset fields
      setShowEditTaskModal(false);
      setEditTask(null);
      setEditTitle("");
      setEditDescription("");
      setEditDueDate("");

      // Refresh tasks
      fetchTasks();
    } catch(err) {
      alert("Failed to update task.");
    }
  }

  // ---------------- DELETE TASK ----------------
  // Shows modal for delete task
  async function openDeleteTaskModal(task) {
    setDeleteTask(task);
    setShowDeleteTaskModal(true);
  }

  // Handles deleting task
  async function handleDeleteTask() {
    if (!deleteTask) return;

    try {
      const { error } = await supabase
        .from("task")
        .delete()
        .eq("task_id", deleteTask.task_id);

      if (error) throw error;

      alert("Task deleted successfully!");

      // Close modal
      setShowDeleteTaskModal(false);
      setDeleteTask(null);

      // Refresh task list
      fetchTasks();
    } catch (err) {
      alert("Failed to delete task.");
    }
  }

  // ---------------- CHANGE STATUS ----------------
  // Handles status change
  async function handleStatusChange(taskId, newStatus) {
    try {
      // Update in Supabase
      const { error } = await supabase
        .from("task")
        .update({ status: newStatus })
        .eq("task_id", taskId);

      if (error) throw error;

      // Update local state
      setTasks(prev =>
        prev.map(t =>
          t.task_id === taskId ? { ...t, status: newStatus } : t
        )
      );

      fetchTasks();
    } catch(err) {
      alert("Failed to update task status");
    }
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
                <span style={{ fontSize: "40px" }}>Tasks</span>
                <span className={styles.block}>{name}</span>
              </h1>
            </div>
            <div className={`${styles.child} ${styles.center}`}></div>
            <div className={`${styles.child} ${styles.right}`}>
              <button className={styles.addButton} onClick={() => setShowCreateTaskModal(true)}>
                Create New Task
              </button>
            </div>
          </div>
        </div>
        
        {loading ? (
          <div className={styles.taskBox} style={{ justifyContent: "center", textAlign: "center", height: "calc(100vh - 70px)" }}>
            <div className={styles.taskInfo}>
              <span style={{ fontSize: "20px" }}>Loading tasks...</span>
            </div>
          </div>
        ) : tasks.length === 0 ? (
          // Loads this part if there are no tasks for the selected course
          <div className={styles.taskBox} style={{ justifyContent: "center", textAlign: "center", height: "calc(100vh - 70px)" }}>
            <div className={styles.taskInfo}>
              <span style={{ fontSize: "30px", fontWeight: "bold" }}>No tasks yet!</span>
              <span style={{ fontSize: "20px" }}>Click "Create New Task" to add one!</span>
            </div>
          </div>
        ) : (
          // Loads this part if there are tasks for the selected course
          <div className={styles.taskList}>
            {tasks.map((task) => (
              <div key={task.task_id} className={`${styles.taskBox} ${task.isOverdue && task.status !== "CANCELLED" && task.status == "IN_PROGRESS" ? styles.overdueBox : ""} ${task.status === "CANCELLED" ? styles.cancelledBox : ""} ${task.status === "COMPLETED" ? styles.completeBox : ""}`}>
                <div className={styles.taskInfo}>
                  <span className={styles.taskTitle}>{task.title}</span>
                  <span className={styles.dateText}>
                    Deadline: {new Date(task.due_date).toLocaleString("en-US", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                      hour: "numeric",
                      minute: "numeric",
                    })} {task.isOverdue && task.status !== "CANCELLED" && (<span style={{ color: "red", fontWeight: "bold" }}> (Overdue)</span>)}
                  </span>
                </div>

                <div className={styles.taskActions}>
                  <button className={styles.editButton} onClick={() => openEditTaskModal(task)}>Edit</button>
                  <button className={styles.deleteButton} onClick={() => openDeleteTaskModal(task)}>Delete</button>

                  <select className={`${styles.dropdownBox} ${
                    task.status === "IN_PROGRESS" ? styles.inProgress
                      : task.status === "COMPLETED" ? styles.completed
                      : styles.cancelled
                  }`}
                  value={task.status} onChange={(e) => handleStatusChange(task.task_id, e.target.value)}>
                    <option style={{ backgroundColor: "white"}} value="IN_PROGRESS">In Progress</option>
                    <option style={{ backgroundColor: "white"}} value="COMPLETED">Completed</option>
                    <option style={{ backgroundColor: "white"}} value="CANCELLED">Cancelled</option>
                  </select>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className={`${styles.elements} ${styles.buttonContainer}`}>
          <button className={styles.backButton} onClick={() => navigate(-1 || "/main_dashboard")}>Back to Class Schedule Layout</button>
        </div>
      </div>

      {/* --------------- MODAL ADD TASK --------------- */}
      {showCreateTaskModal && (
        <div className={styles.modalBackdrop}>
          <div className={styles.modalBox}>
            <h2 className={styles.modalHeading}>ADD TASK</h2>

            <div className={`${styles.elements} ${styles.titleDate}`}>
              <div className={styles.titleDiv}>
                <label className={styles.labelText}>Task Name*</label>
                <input type="text" className={styles.modalInput} value={title} onChange={(e) => setTitle(e.target.value)}/>
              </div>

              <div className={styles.dateDiv}>
                <label>Due Date*</label>
                <input type="datetime-local" className={styles.modalInput} value={dueDate} onChange={(e) => setDueDate(e.target.value)}/>
              </div>
            </div>

            <div className={styles.elements}>
              <label className={styles.labelText}>Description</label>
              <textarea className={styles.modalInput} value={description} onChange={(e) => setDescription(e.target.value)}/>
            </div>

            <div className={styles.modalButtons}>
              <button className={styles.primaryButton} onClick={handleCreateTask}>
                Add Task
              </button>
              <button className={styles.closeBtn} onClick={() => setShowCreateTaskModal(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --------------- MODAL EDIT TASK --------------- */}
      {showEditTaskModal && (
        <div className={styles.modalBackdrop}>
          <div className={styles.modalBox}>
            <h2 className={styles.modalHeading}>EDIT TASK</h2>

            <div className={`${styles.elements} ${styles.titleDate}`}>
              <div className={styles.titleDiv}>
                <label className={styles.labelText}>Task Name*</label>
                <input type="text" className={styles.modalInput} value={editTitle} onChange={(e) => setEditTitle(e.target.value)}/>
              </div>

              <div className={styles.dateDiv}>
                <label className={styles.labelText}>Due Date*</label>
                <input type="datetime-local" className={styles.modalInput} value={editDueDate} onChange={(e) => setEditDueDate(e.target.value)}/>
              </div>
            </div>

            <div className={styles.elements}>
              <label className={styles.labelText}>Description</label>
              <textarea className={styles.modalInput} value={editDescription} onChange={(e) => setEditDescription(e.target.value)}/>
            </div>

            <div className={styles.modalButtons}>
              <button className={styles.primaryButton} onClick={handleUpdateTask}>
                Save Changes
              </button>
              <button className={styles.closeBtn} onClick={() => setShowEditTaskModal(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --------------- MODAL DELETE TASK --------------- */}
      {showDeleteTaskModal && deleteTask && (
        <div className={styles.modalBackdrop}>
          <div className={styles.modalBox}>
            <h2 className={styles.modalHeading}>DELETE TASK</h2>
            <p>Are you sure you want to delete "{deleteTask.title}"?</p>

            <div className={styles.modalButtons}>
              <button className={styles.primaryButton} onClick={handleDeleteTask}>
                Yes, Delete
              </button>
              <button className={styles.closeBtn} onClick={() => setShowDeleteTaskModal(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}