import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { auth, db } from "./firebaseConfig";
import {
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import "./regi.css";

export default function Register() {
  const navigate = useNavigate();
  const location = useLocation();
  const role = location.state?.role; // "teacher" or "student"

  const provider = new GoogleAuthProvider();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [agree, setAgree] = useState(false);

  // ================= EMAIL REGISTER =================
  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      const userCred = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCred.user;

      await setDoc(doc(db, "users", user.uid), {
        name,
        username,
        email,
        role: role || "student",
        createdAt: new Date(),
      });

      localStorage.setItem("role", role || "student");

      if (role === "teacher") {
        navigate("/tea");
      } else {
        navigate("/sea");
      }
    } catch (err) {
      console.error("Error registering:", err.message);
      setError(err.message);
    }
  };

  // ================= GOOGLE REGISTER / LOGIN =================
  const handleGoogleRegister = async () => {
    try {
      const googleResult = await signInWithPopup(auth, provider);
      const user = googleResult.user;

      const userRef = doc(db, "users", user.uid);
      const snap = await getDoc(userRef);

      let userRole;

      if (!snap.exists()) {
        userRole = role || "student";

        await setDoc(userRef, {
          name: user.displayName || name,
          username: username || "",
          email: user.email,
          role: userRole,
          createdAt: new Date(),
        });
      } else {
        userRole = snap.data().role;
      }

      localStorage.setItem("role", userRole);

      if (userRole === "teacher") {
        navigate("/tea");
      } else {
        navigate("/sea");
      }
    } catch (err) {
      console.error("Google register error:", err.message);
      setError(err.message);
    }
  };

  return (
    <div className="register-container">
      <form className="register-form" onSubmit={handleRegister}>
        <h2 className="form-title">Sign Up</h2>
        {error && <p style={{ color: "red" }}>{error}</p>}

        <label>Username</label>
        <input
          type="text"
          placeholder="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />

        <label>Name</label>
        <input
          type="text"
          placeholder="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />

        <label>E-mail</label>
        <input
          type="email"
          placeholder="example@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <label>Password</label>
        <input
          type="password"
          placeholder="at least 8 characters"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <div className="checkbox-container">
          <input
            type="checkbox"
            checked={agree}
            onChange={(e) => setAgree(e.target.checked)}
            required
          />
          <span>
            I agree with <a href="#">Terms</a> and <a href="#">Privacy</a>
          </span>
        </div>

        <button type="submit" className="register-btn">
          Register
        </button>

        <button
          type="button"
          className="register-btn"
          onClick={handleGoogleRegister}
        >
          Continue with Google
        </button>

        <p className="signin-text">
          already have an account?{" "}
          <span
            className="signup-link"
            onClick={() => navigate("/logs", { state: { role } })}
          >
            Sign In
          </span>
        </p>
      </form>
    </div>
  );
}
