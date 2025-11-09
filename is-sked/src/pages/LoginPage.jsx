import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import styles from "../css/LoginPage.module.css";

export default function LoginPage() {
  useEffect(() => {
    document.title = "Log In | IsSked";
    document.body.classList.add(styles.loginBody);
    return () => {
      document.body.classList.remove(styles.loginBody);
    };
  }, []);

  const navigate = useNavigate();

  const [showModalForgotPassword, setShowModalForgotPassword] = useState(false);
  const [showModalCreateAccount, setShowModalCreateAccount] = useState(false);

  const [resetEmail, setResetEmail] = useState("");

  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupUsername, setSignupUsername] = useState("");

  // ---------------- LOGIN ----------------
  const handleLogin = async () => {
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    if (!email || !password) {
      alert("Please enter both email and password.");
      return;
    }

    let loginSuccess = false;
    let user = null;

    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) throw authError;

      user = authData.user;
      loginSuccess = true;

      const { data: studentProfile, error: profileError } = await supabase
        .from("student")
        .select("display_name, degree_program_id")
        .eq("student_id", user.id)
        .single();

      if (profileError) {
        console.warn("Profile not found or error:", profileError.message);
      }

      localStorage.setItem("student_id", user.id);
      localStorage.setItem("email", user.email);
      localStorage.setItem("display_name", studentProfile?.display_name ?? "");
      localStorage.setItem("degree_program_id", studentProfile?.degree_program_id ?? "");

      navigate("/main_dashboard", { replace: true });
    } catch (error) {
      console.error("Login failed:", error.message);
    } finally {
      if (user) {
        await supabase.from("login_audit").insert([{
          audit_id: crypto.randomUUID(),
          student_id: user.id,
          success: loginSuccess
        }]);
      }
    }
  };

  // ---------------- FORGOT PASSWORD ----------------
  const forgotPassword = () => {
    setShowModalForgotPassword(true);
    setResetEmail("");
  };

  const handleSendReset = () => {
    setShowModalForgotPassword(false);
  };

  // ---------------- CREATE ACCOUNT ----------------
  const createNewAccount = () => {
    setShowModalCreateAccount(true);
    setSignupUsername("");
    setSignupEmail("");
    setSignupPassword("");
  };

  const handleSignup = async () => {
    if (!signupEmail || !signupPassword || !signupUsername) {
      alert("Please fill in all fields.");
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      email: signupEmail,
      password: signupPassword,
      options: {
        data: {
          display_name: signupUsername,
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

    // Optional: store local data for later use
    localStorage.setItem("student_id", user.id);
    localStorage.setItem("email", user.email);
    localStorage.setItem("display_name", signupUsername);

    alert("Account created! Check your email for verification.");
    setShowModalCreateAccount(false);
  };

  // ---------------- JSX ----------------
  return (
    <>
      <div className={styles.loginContainer}>
        <h1 className={styles.heading}>LOG IN</h1>

        <div className={styles.elements}>
          <label className={styles.labelText}>Email</label>
          <input
            type="email"
            id="email"
            placeholder="your@email.com"
            className={styles.inputField}
          />
        </div>

        <div className={styles.elements}>
          <label className={styles.labelText}>Password</label>
          <input
            type="password"
            id="password"
            placeholder="••••••••"
            className={styles.inputField}
          />
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
              <input
                type="email"
                placeholder="your@email.com"
                className={styles.modalInput}
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
              />
            </div>

            <div className={styles.modalButtons}>
              <button className={styles.primaryButton} onClick={handleSendReset}>
                Send Reset Link
              </button>
              <button
                className={styles.closeBtn}
                onClick={() => setShowModalForgotPassword(false)}
              >
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

            <div className={styles.elements}>
              <label className={styles.labelText}>Username</label>
              <input
                type="text"
                placeholder="Juan dela Cruz"
                className={styles.modalInput}
                value={signupUsername}
                onChange={(e) => setSignupUsername(e.target.value)}
              />
            </div>

            <div className={styles.elements}>
              <label className={styles.labelText}>Email</label>
              <input
                type="email"
                placeholder="your@email.com"
                className={styles.modalInput}
                value={signupEmail}
                onChange={(e) => setSignupEmail(e.target.value)}
              />
            </div>

            <div className={styles.elements}>
              <label className={styles.labelText}>Password</label>
              <input
                type="password"
                placeholder="••••••••"
                className={styles.modalInput}
                value={signupPassword}
                onChange={(e) => setSignupPassword(e.target.value)}
              />
            </div>

            <div className={styles.modalButtons}>
              <button className={styles.primaryButton} onClick={handleSignup}>
                Create Account
              </button>
              <button
                className={styles.closeBtn}
                onClick={() => setShowModalCreateAccount(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}