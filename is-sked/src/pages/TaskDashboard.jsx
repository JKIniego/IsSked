import { useState, useEffect } from "react";

export default function TaskDashboard() {
  useEffect(() => {
    document.title = "Task Dashboard | IsSked";
  }, []);
  
  return <h1>Task Dashboard</h1>;
}