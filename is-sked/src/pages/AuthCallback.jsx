import { useEffect } from "react";
import { supabase } from "../lib/supabaseClient";
import { useNavigate } from "react-router-dom";

export default function AuthCallback() {
  const navigate = useNavigate();

  // ---------------- EFFECTS ----------------
  useEffect(() => {
    async function handleCallback() {
      // Gets user session
      const { data: { session } } = await supabase.auth.getSession();

      // Checks if user hasn't confirmed their email in Supabase
      if (!session) {
        navigate("/login");
        return;
      }

      // Fetches user profile data
      const { data: profile, error } = await supabase
        .from("student")
        .select("*")
        .eq("user_id", session.user.id)
        .single();

      // Checks if user account is newly created: for profile setup purposes
      if (!profile) {
        navigate("/set_profile");
      } else if (!profile.degree_program_id) {
        navigate("/set_profile");
      } else {
        localStorage.setItem("student_id", profile.student_id);
        localStorage.setItem("email", session.user.email);
        localStorage.setItem("display_name", profile.display_name ?? "");
        localStorage.setItem("degree_program_id", profile.degree_program_id);

        navigate("/main_dashboard");
      }
    }

    handleCallback();
  }, [navigate]);

  return <div>Verifying email...</div>;
}