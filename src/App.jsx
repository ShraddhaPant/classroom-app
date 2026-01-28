// src/App.jsx
import { Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "./firebaseConfig";

import Frunt from "./Frunt.jsx";
import FruntTot from "./FruntTot.jsx";
import Logs from "./logs.jsx";
import Regi from "./regi.jsx";
import Tea from "./Tea.jsx";
import Sea from "./Sea.jsx";
import Comb from "./Comb.jsx";
import GeneralInfo from "./GeneralInfo.jsx";
import CodeCreate from "./CodeCreate.jsx";
import ViewPage from "./ViewPage.jsx";

import Notes from "./Notes.jsx";
import Links from "./Links.jsx";
import Notices from "./Notices.jsx";
import Assignment from "./Assignment.jsx";
import Classroom from "./Classroom.jsx";

import Attendance from "./Attendance.jsx";

export default function App() {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);

      if (currentUser) {
        const snap = await getDoc(doc(db, "users", currentUser.uid));
        if (snap.exists()) {
          setRole(snap.data().role);
        }
      } else {
        setRole(null);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return <p>Loading...</p>;
  }

  return (
    <Routes>
      {/* Default → Frunt */}
      <Route path="/" element={<Navigate to="/frunt" replace />} />

      {/* Front pages */}
      <Route path="/frunt" element={<Frunt />} />
      <Route path="/frunttot" element={<FruntTot />} />

      {/* Auth */}
      {/* ✅ Always show Logs page first */}
      <Route path="/logs" element={<Logs />} />

      <Route
        path="/regi"
        element={user ? <Navigate to="/logs" replace /> : <Regi />}
      />

      {/* Teacher flow */}
      <Route
        path="/tea"
        element={
          user && role === "teacher"
            ? <Tea />
            : <Navigate to="/logs" replace />
        }
      />

      <Route
        path="/general-info"
        element={
          user && role === "teacher"
            ? <GeneralInfo />
            : <Navigate to="/logs" replace />
        }
      />

      <Route
        path="/code-create"
        element={
          user && role === "teacher"
            ? <CodeCreate />
            : <Navigate to="/logs" replace />
        }
      />

      {/* Student flow */}
      <Route
        path="/sea"
        element={
          user && role === "student"
            ? <Sea />
            : <Navigate to="/logs" replace />
        }
      />

      <Route
        path="/comb"
        element={
          user && role === "student"
            ? <Comb />
            : <Navigate to="/logs" replace />
        }
      />

      {/* Shared classroom */}
      <Route path="/view/:classId" element={<ViewPage />} />
      <Route path="/viewpage" element={<ViewPage />} />

      {/* ViewPage buttons */}
      <Route path="/notes" element={<Notes />} />
      <Route path="/links" element={<Links />} />
      <Route path="/notices" element={<Notices />} />
      <Route path="/assignment" element={<Assignment />} />
      <Route path="/classroom" element={<Classroom />} />

      {/* Attendance */}
      <Route path="/attendance" element={<Attendance />} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/frunt" replace />} />
    </Routes>
  );
}
