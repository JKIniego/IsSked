import { Routes, Route } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import MainDashboard from './pages/MainDashboard'
import ClassSchedule from './pages/ClassSchedule'
import TaskDashboard from './pages/TaskDashboard'
import Notifications from "./pages/Notifications";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />
      <Route path="/main_dashboard" element={<MainDashboard />} />
      <Route path="/class_schedule" element={<ClassSchedule />} />
      <Route path="/task_dashboard" element={<TaskDashboard />} />
      <Route path="/notifications" element={<Notifications />} />
    </Routes>
  );
}