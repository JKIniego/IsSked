import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import styles from "../css/LoginPage.module.css";

export default function LoginPage() {
  const navigate = useNavigate();

  // ---------------- STATE ----------------
  // Modal state
  const [showModalForgotPassword, setShowModalForgotPassword] = useState(false);
  const [showModalCreateAccount, setShowModalCreateAccount] = useState(false);

  // Reset form state
  const [resetEmail, setResetEmail] = useState("");

  // Signup form state
  const [signupEmail, setSignupEmail] = useState("");
  const [signupStudentID, setSignupStudentID] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupUsername, setSignupUsername] = useState("");

  // ---------------- EFFECTS ----------------
  useEffect(() => {
    document.title = "Log In | IsSked";
    document.body.classList.add(styles.loginBody);
    return () => {
      document.body.classList.remove(styles.loginBody);
    };
  }, []);

  // ---------------- LOGIN ----------------
  // Handles user login
  async function handleLogin() {
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    // Checks if user did not enter email, password, or both
    if (!email || !password) {
      alert("Please enter both email and password.");
      return;
    }

    let loginSuccess = false;
    let user = null;

    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({email, password});

      if (authError) throw authError;

      user = authData.user;

      // Checks if the user is not found in the database
      if (!user) {
        alert("Login failed: user not found.");
        return;
      }

      // Fetches student info
      const { data: studentProfile, error: profileError } = await supabase
        .from("student")
        .select("student_id, display_name, degree_program_id")
        .eq("user_id", user.id)
        .single();

      // Checks if the user does not have a profile created
      if (profileError || !studentProfile) {
        alert("You cannot log in: no student profile found.");
        return;
      }

      loginSuccess = true;

      localStorage.setItem("student_id", studentProfile.student_id);
      localStorage.setItem("email", user.email);
      localStorage.setItem("display_name", studentProfile.display_name ?? "");
      localStorage.setItem("degree_program_id", studentProfile.degree_program_id ?? "");

      // Audits login from user
      await supabase.from("login_audit").insert([{
        audit_id: crypto.randomUUID(),
        student_id: studentProfile.student_id,
        success: loginSuccess
      }]);

      navigate("/main_dashboard", { replace: true });
    } catch (error) {
      console.error("Login failed:", error.message);
      alert("Login failed: " + error.message);
    }
  };

  // ---------------- FORGOT PASSWORD ----------------
  // Shows modal for reset password
  function forgotPassword() {
    setShowModalForgotPassword(true);
    setResetEmail("");
  };

  // Handles reset password for user
  async function handleSendReset() {
    setShowModalForgotPassword(false);    // No reset form was made for now
  };

  // ---------------- CREATE ACCOUNT ----------------
  // Shows modal for creating account
  function createNewAccount() {
    setShowModalCreateAccount(true);
    setSignupUsername("");
    setSignupEmail("");
    setSignupStudentID("");
    setSignupPassword("");
  };

  // Handles user sign up
  // Note: There is no code or function yet for handling invalid inputs
  async function handleSignup() {
    // Checks if all fields are filled in
    if (!signupEmail || !signupPassword || !signupUsername) {
      alert("Please fill in all fields.");
      return;
    }

    // Registers user info into Supabase
    const { data, error } = await supabase.auth.signUp({
      email: signupEmail,
      password: signupPassword,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        data: {
          display_name: signupUsername,
          student_id: signupStudentID,
        },
      },
    });

    if (error) {
      alert("Signup failed: " + error.message);
      return;
    }

    const user = data.user;
    if (!user) {
      alert("Unexpected signup issue");
      return;
    }

    // Alerts when new account is successfully created
    alert("Account created! Check your email for verification.");
    setShowModalCreateAccount(false);
  };

  // ---------------- UI COMPONENT ----------------
  return (
    <>
      <div className={styles.loginContainer}>
        <h1 className={styles.heading}>LOG IN</h1>

        <div className={styles.elements}>
          <label className={styles.labelText}>Email</label>
          <input type="email" id="email" placeholder="your@email.com" className={styles.inputField}/>
        </div>

        <div className={styles.elements}>
          <label className={styles.labelText}>Password</label>
          <input type="password" id="password" placeholder="••••••••" className={styles.inputField}/>
        </div>

        <div className={styles.elements}>
          <div className={styles.parent}>
            <div className={`${styles.child} ${styles.left}`}>
              <span className={styles.linkText} onClick={forgotPassword}>
                Forgot Password?
              </span>
            </div>
            <div className={`${styles.child} ${styles.right}`}>
              <button className={styles.primaryButton} onClick={handleLogin}>
                SIGN IN
              </button>
            </div>
          </div>
        </div>

        <div className={styles.row}>
          <span>Don't have an account? </span>
          <span className={styles.linkText} onClick={createNewAccount}>
            Sign up
          </span>
        </div>
      </div>

      {/* --------------- MODAL FORGOT PASSWORD --------------- */}
      {showModalForgotPassword && (
        <div className={styles.modalBackdrop}>
          <div className={styles.modalBox}>
            <h2 className={styles.modalHeading}>RESET PASSWORD</h2>

            <div className={styles.elements}>
              <label className={styles.labelText}>Username</label>
              <input type="email" placeholder="your@email.com" className={styles.modalInput} value={resetEmail} onChange={(e) => setResetEmail(e.target.value)}/>
            </div>

            <div className={styles.modalButtons}>
              <button className={styles.primaryButton} onClick={handleSendReset}>
                Send Reset Link
              </button>
              <button className={styles.closeBtn} onClick={() => setShowModalForgotPassword(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --------------- MODAL CREATE ACCOUNT --------------- */}
      {showModalCreateAccount && (
        <div className={styles.modalBackdrop}>
          <div className={styles.modalBox}>
            <h2 className={styles.modalHeading}>CREATE ACCOUNT</h2>

            <div className={`${styles.elements} ${styles.userAndPass}`}>
              <div>
                <label className={styles.labelText}>Username</label>
                <input type="text" placeholder="Juan dela Cruz" className={styles.modalInput} value={signupUsername} onChange={(e) => setSignupUsername(e.target.value)}/>
              </div>
              <div>
                <label className={styles.labelText}>Student ID</label>
                <input type="text" placeholder="XXXX-XXXXX" className={styles.modalInput} value={signupStudentID} onChange={(e) => setSignupStudentID(e.target.value)}/>
              </div>
            </div>

            <div className={styles.elements}>
              <label className={styles.labelText}>Email</label>
              <input type="email" placeholder="your@email.com" className={styles.modalInput} value={signupEmail} onChange={(e) => setSignupEmail(e.target.value)}/>
            </div>

            <div className={styles.elements}>
              <label className={styles.labelText}>Password</label>
              <input type="password" placeholder="••••••••" className={styles.modalInput} value={signupPassword} onChange={(e) => setSignupPassword(e.target.value)}/>
            </div>

            <div className={styles.modalButtons}>
              <button className={styles.primaryButton} onClick={handleSignup}>
                Create Account
              </button>
              <button className={styles.closeBtn} onClick={() => setShowModalCreateAccount(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}