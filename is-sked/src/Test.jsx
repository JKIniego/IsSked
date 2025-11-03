import { useEffect } from "react";
import { supabase } from "./lib/supabaseClient";

export default function Test() {
  useEffect(() => {
    async function testConnection() {
      console.log("Testing Supabase connection...");

      const { data, error } = await supabase.from("todos").select("*").limit(1);

      if (error) {
        console.error("Supabase Error:", error.message);
      } else {
        console.log("Supabase Connected ✅", data);
      }
    }

    testConnection();
  }, []);

  return (
    <div>
      <h1>Supabase Test</h1>
      <p>Check the browser console for results.</p>
    </div>
  );
}
