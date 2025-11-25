import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import AuthCallback from "./pages/AuthCallback";
import SetProfile from "./pages/SetProfile";
import ResetPassword from "./pages/ResetPassword";
import MainDashboard from "./pages/MainDashboard";
import AccountProfile from "./pages/AccountProfile";
import ClassSchedule from "./pages/ClassSchedule";
import TaskDashboard from "./pages/TaskDashboard";
import Notifications from "./pages/Notifications";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />
      <Route path="/auth/callback" element={<AuthCallback />} />
      <Route path="/set_profile" element={<SetProfile />} />
      <Route path="/reset_password" element={<ResetPassword />} />
      <Route path="/main_dashboard" element={<MainDashboard />} />
      <Route path="/account_profile" element={<AccountProfile />} />
      <Route path="/class_schedule/:id" element={<ClassSchedule />} />
      <Route path="/task_dashboard" element={<TaskDashboard />} />
      <Route path="/notifications" element={<Notifications />} />
    </Routes>
  );
}