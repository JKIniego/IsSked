import { useState, useEffect } from "react";

export default function Notifications() {
  useEffect(() => {
    document.title = "Notifications | IsSked";
  }, []);
  
  return <h1>Notifications</h1>;
}