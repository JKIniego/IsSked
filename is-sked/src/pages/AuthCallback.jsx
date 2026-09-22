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
      if(!session) {
        navigate("/");
        return;
      }

      let { data: profile, error } = await supabase
        .from("student")
        .select("*")
        .eq("user_id", session.user.id)
        .maybeSingle();

      if (error && error.code !== "PGRST116") {
        console.error("Error loading student profile:", error.message);
      }

      if (!profile) {
        const newProfile = {
          user_id: session.user.id,
          student_id: session.user.user_metadata?.student_id ?? "",
          display_name: session.user.user_metadata?.display_name ?? session.user.email ?? "",
          degree_program_id: null,
        };

        const { data: createdProfile, error: insertError } = await supabase
          .from("student")
          .insert([newProfile])
          .select()
          .single();

        if (insertError) {
          console.error("Failed to create student profile:", insertError.message);
        }

        profile = createdProfile;
      }

      const studentId = profile?.student_id ?? session.user.user_metadata?.student_id ?? "";
      const displayName = profile?.display_name ?? session.user.user_metadata?.display_name ?? session.user.email ?? "";
      const degreeProgramId = profile?.degree_program_id ?? "";

      localStorage.setItem("student_id", studentId);
      localStorage.setItem("email", session.user.email);
      localStorage.setItem("display_name", displayName);
      localStorage.setItem("degree_program_id", degreeProgramId ?? "");

      navigate("/main_dashboard", { replace: true });
    }

    handleCallback();
  }, [navigate]);

  return <div>Verifying email...</div>;
}