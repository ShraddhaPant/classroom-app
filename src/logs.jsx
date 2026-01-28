import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail,
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "./firebaseConfig";
import "./logs.css";

const Logs = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const navigate = useNavigate();
  const location = useLocation();

  // role passed from FruntTot
  const roleFromNav = location.state?.role; // "teacher" | "student"

  // ================= EMAIL LOGIN =================
  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const userCred = await signInWithEmailAndPassword(auth, email, password);
      const user = userCred.user;

      const userRef = doc(db, "users", user.uid);
      const snap = await getDoc(userRef);

      let userRole;

      if (roleFromNav) {
        // Role explicitly chosen from FruntTot takes priority
        userRole = roleFromNav;
        // Save/update Firestore to reflect this choice
        await setDoc(
          userRef,
          {
            ...snap.data(),
            role: roleFromNav,
          },
          { merge: true }
        );
      } else if (snap.exists()) {
        userRole = snap.data().role;
      } else {
        // Edge case: first login, no role from FruntTot
        userRole = "student";
        await setDoc(userRef, {
          email: user.email,
          role: userRole,
          createdAt: new Date(),
        });
      }

      localStorage.setItem("role", userRole);

      if (userRole === "teacher") navigate("/tea");
      else navigate("/sea");
    } catch (err) {
      setError(err.message);
    }
  };

  // ================= GOOGLE LOGIN =================
  const handleGoogleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      const userRef = doc(db, "users", user.uid);
      const snap = await getDoc(userRef);

      let userRole;

      if (roleFromNav) {
        // Role explicitly chosen from FruntTot takes priority
        userRole = roleFromNav;
        await setDoc(
          userRef,
          {
            ...snap.data(),
            email: user.email,
            name: user.displayName || "",
            role: userRole,
            createdAt: new Date(),
          },
          { merge: true }
        );
      } else if (!snap.exists()) {
        userRole = "student";
        await setDoc(userRef, {
          email: user.email,
          name: user.displayName || "",
          role: userRole,
          createdAt: new Date(),
        });
      } else {
        userRole = snap.data().role;
      }

      localStorage.setItem("role", userRole);

      if (userRole === "teacher") navigate("/tea");
      else navigate("/sea");
    } catch (err) {
      setError(err.message);
    }
  };

  // ================= FORGOT PASSWORD =================
  const handleForgotPassword = async () => {
    if (!email) {
      setError("Enter your email first.");
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email);
      alert("Password reset email sent!");
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="login-page">
      <div className="login-box">
        <h2 className="login-heading">Login</h2>
        <p className="login-subtitle">
          Hi there! Sign in to join your Class Hive
        </p>

        {error && <p className="error-text">{error}</p>}

        <button onClick={handleGoogleLogin} className="google-btn">
          <img
            src="https://www.svgrepo.com/show/475656/google-color.svg"
            alt="Google"
            className="google-icon"
          />
          Login with Google
        </button>

        <div className="divider">
          <span></span> or Login with Email <span></span>
        </div>

        <form onSubmit={handleLogin}>
          <label className="input-label">Username</label>
          <input
            type="email"
            placeholder="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <label className="input-label">Password</label>
          <div className="password-wrapper">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="at least 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <p className="forgot" onClick={handleForgotPassword}>
            Forgotten your password?
          </p>

          <button type="submit" className="login-btn">
            Login
          </button>
        </form>

        <p className="signup-text">
          don’t have an account?{" "}
          <span
            className="signup-link"
            onClick={() =>
              navigate("/regi", { state: { role: roleFromNav } })
            }
          >
            Sign Up
          </span>
        </p>
      </div>
    </div>
  );
};

export default Logs;
