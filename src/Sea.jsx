import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { auth, db } from "./firebaseConfig";
import {
  doc,
  setDoc,
  collection,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import "./Sea.css";

const Sea = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [formData, setFormData] = useState({
    name: "",
    enrollment: "",
    classroom: "",
    semester: "",
    code: "",
    link: "",
  });
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Track logged-in user
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Prefill from ?code=&link= (if provided)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const inviteCode = params.get("code") || "";
    const inviteLinkRaw = params.get("link") || "";

    // decode link param if URL-encoded
    let inviteLink = inviteLinkRaw;
    try {
      inviteLink = decodeURIComponent(inviteLinkRaw);
    } catch (_) {
      // ignore decode errors; use raw
    }

    if (inviteCode || inviteLink) {
      setFormData((prev) => ({
        ...prev,
        code: inviteCode,
        link: inviteLink,
      }));
    }
  }, [location]);

  const handleChange = (e) => {
    setFormData((s) => ({ ...s, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Basic validation
    if (
      !formData.name ||
      !formData.enrollment ||
      !formData.classroom ||
      !formData.semester ||
      !formData.code
    ) {
      alert("⚠️ Please fill all fields (including Class Code).");
      return;
    }
    if (!user) {
      alert("⚠️ You must be logged in to join a class.");
      return;
    }

    // Normalize inputs
    const code = formData.code.trim().toUpperCase();
    let linkInput = (formData.link || "").trim();
    try {
      linkInput = decodeURIComponent(linkInput);
    } catch (_) {
      // ignore
    }

    try {
      // 1) Find classroom by CLASS CODE (most reliable)
      const classroomsRef = collection(db, "classrooms");
      const qByCode = query(classroomsRef, where("classCode", "==", code));
      const codeSnap = await getDocs(qByCode);

      if (codeSnap.empty) {
        alert("❌ No class found with this Code. Please check again.");
        return;
      }

      // If multiple docs somehow share a code, pick the first (codes should be unique)
      const classDoc = codeSnap.docs[0];
      const teacherData = classDoc.data();

      // 2) If user also entered a link, validate it matches exactly
      if (linkInput) {
        const expected = (teacherData.shareLink || "").trim();
        if (!expected) {
          alert("❌ This class does not have a share link set by the teacher.");
          return;
        }
        if (linkInput !== expected) {
          // Show a precise, actionable error so you can see what's wrong
          console.error("Link mismatch:", { entered: linkInput, expected });
          alert("❌ Link does not match the class share link for this code.");
          return;
        }
      }

      // 3) Upsert student profile
      const studentRef = doc(db, "students", user.uid);
      await setDoc(
        studentRef,
        {
          name: formData.name.trim(),
          enrollment: formData.enrollment.trim(),
          classroom: formData.classroom.trim(),
          semester: formData.semester.toString().trim(),
          email: user.email,
        },
        { merge: true }
      );

      // 4) Save the joined class under student.
      // Use the normalized CODE as the doc id for quick lookups.
      // Also store canonical teacher fields so Comb can render even offline.
      const joinedRef = doc(db, "students", user.uid, "classes", code);
      await setDoc(joinedRef, {
        code,
        link: teacherData.shareLink || "",
        subject: teacherData.subject || "",
        professorName: teacherData.professorName || "",
        collegeName: teacherData.collegeName || "",
        degree: teacherData.degree || "",
        semester: teacherData.semester || "",
        classroomId: classDoc.id, // keep a pointer to teacher doc
        joinedAt: new Date(),
      });

      navigate("/comb");
    } catch (err) {
      console.error("Error joining class:", err);
      alert("❌ Failed to join class. Check console for details.");
    }
  };

  if (loading) return <p>Loading...</p>;

  return (
    <div className="sea-container">
      <h2 className="sea-title">Joining as a Student</h2>
      <form className="sea-form" onSubmit={handleSubmit}>
        <input
          type="text"
          name="name"
          placeholder="Name"
          value={formData.name}
          onChange={handleChange}
          className="sea-input"
        />
        <input
          type="text"
          name="enrollment"
          placeholder="Enrollment Number"
          value={formData.enrollment}
          onChange={handleChange}
          className="sea-input"
        />
        <input
          type="text"
          name="classroom"
          placeholder="Classroom and Section"
          value={formData.classroom}
          onChange={handleChange}
          className="sea-input"
        />
        <input
          type="text"
          name="semester"
          placeholder="Semester"
          value={formData.semester}
          onChange={handleChange}
          className="sea-input"
        />
        <input
          type="text"
          name="code"
          placeholder="Classroom Code"
          value={formData.code}
          onChange={(e) =>
            setFormData((s) => ({ ...s, code: e.target.value.toUpperCase() }))
          }
          className="sea-input"
          readOnly={!!new URLSearchParams(location.search).get("code")}
        />
        <input
          type="text"
          name="link"
          placeholder="Classroom Link (paste exactly as given)"
          value={formData.link}
          onChange={handleChange}
          className="sea-input"
          readOnly={!!new URLSearchParams(location.search).get("link")}
        />
        <button type="submit" className="sea-btn">
          Submit
        </button>
      </form>
    </div>
  );
};

export default Sea;
