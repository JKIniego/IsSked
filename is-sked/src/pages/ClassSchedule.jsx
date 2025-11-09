import { useState, useEffect } from "react";

export default function ClassSchedule() {
  useEffect(() => {
    document.title = "Class Schedule | IsSked";
  }, []);

  return <h1>Class Schedule</h1>;
}