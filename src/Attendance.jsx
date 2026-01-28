import React, { useEffect, useState } from "react";
import {
  collection,
  addDoc,
  onSnapshot,
  serverTimestamp,
  query,
  where,
  orderBy,
  getDocs,
  deleteDoc,
  doc,
  updateDoc
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { auth, db, storage } from "./firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { Home, BookOpen, Users, Trash2 } from "lucide-react";
import "./Attendance.css";

export default function Attendance() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState("");
  const [attendanceList, setAttendanceList] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);

  const [selectedSheet, setSelectedSheet] = useState(null);
  const [showResourceForm, setShowResourceForm] = useState(false);

  /* ===== AUTH + ROLE ===== */
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) {
        navigate("/logs");
        return;
      }
      setUser(u);

      const snap = await getDocs(collection(db, "users"));
      snap.forEach((d) => {
        if (d.data().email === u.email) {
          setUserRole(d.data().role);
        }
      });
    });
    return () => unsub();
  }, [navigate]);

  /* ===== FETCH MONTH SHEETS ===== */
  useEffect(() => {
    const q = query(
      collection(db, "attendanceMonths"),
      orderBy("createdAt", "desc")
    );
    const unsub = onSnapshot(q, (snap) => {
      setAttendanceList(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, []);

  /* ===== DELETE MONTH ===== */
  const handleDelete = async (id) => {
    if (!window.confirm("Delete this attendance sheet?")) return;
    await deleteDoc(doc(db, "attendanceMonths", id));
  };

  /* ===== UPDATED MONTH CLICK HANDLER (FIXED) ===== */
  const handleMonthClick = (sheet) => {
    // If resource already exists → open directly (teacher + student)
    if (sheet.resourceLink) {
      window.open(sheet.resourceLink, "_blank");
      return;
    }

    if (sheet.fileURL) {
      window.open(sheet.fileURL, "_blank");
      return;
    }

    // No resource exists yet
    if (userRole === "teacher") {
      setSelectedSheet(sheet);
      setShowResourceForm(true);
    } else {
      alert("No resource uploaded yet");
    }
  };

  return (
    <div className="attendance-page">
      <header className="attendance-header">
        <h2>Attendance</h2>
        {userRole === "teacher" && (
          <button
            className="add-sheet-btn"
            onClick={() => setShowAddForm(true)}
          >
            +
          </button>
        )}
      </header>

      <div className="attendance-tabs">
        <span className="clickable" onClick={() => navigate("/classroom")}>
          Classroom
        </span>
        <span className="active">Attendance</span>
      </div>

      <main className="attendance-main">
        <div className="dates-list">
          {attendanceList.length === 0 ? (
            <p>No attendance yet.</p>
          ) : (
            attendanceList.map((sheet) => (
              <div
                key={sheet.id}
                className="date-card"
                onClick={() => handleMonthClick(sheet)}
              >
                <span>
                  {new Date(sheet.year, sheet.month - 1).toLocaleString("en", {
                    month: "long",
                  })}{" "}
                  {sheet.year}
                </span>

                {userRole === "teacher" && (
                  <Trash2
                    size={16}
                    style={{ cursor: "pointer", color: "#dc2626" }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(sheet.id);
                    }}
                  />
                )}
              </div>
            ))
          )}
        </div>

        {/* CREATE MONTH */}
        {showAddForm && userRole === "teacher" && (
          <div className="overlay">
            <div className="add-sheet-popup">
              <button
                className="close-btn"
                onClick={() => setShowAddForm(false)}
              >
                ×
              </button>
              <AddAttendanceForm
                user={user}
                onClose={() => setShowAddForm(false)}
              />
            </div>
          </div>
        )}

        {/* RESOURCE FORM (ONLY OPENS IF NO RESOURCE EXISTS) */}
        {showResourceForm && selectedSheet && userRole === "teacher" && (
          <div className="overlay">
            <div className="add-sheet-popup">
              <button
                className="close-btn"
                onClick={() => setShowResourceForm(false)}
              >
                ×
              </button>
              <AttendanceResourceForm
                sheet={selectedSheet}
                onClose={() => setShowResourceForm(false)}
              />
            </div>
          </div>
        )}
      </main>

      <footer className="bottom-nav">
        <div onClick={() => navigate("/viewpage")}>
          <Home size={20} />
          <span>Dashboard</span>
        </div>
        <div onClick={() => navigate("/assignment")}>
          <BookOpen size={20} />
          <span>Assignment</span>
        </div>
        <div className="active-nav">
          <Users size={20} />
          <span>Classroom</span>
        </div>
      </footer>
    </div>
  );
}

/* ===== CREATE MONTH FORM ===== */
function AddAttendanceForm({ user, onClose }) {
  const [month, setMonth] = useState("");
  const [year, setYear] = useState(new Date().getFullYear().toString());

  const handleCreate = async () => {
    if (!month || !year) return alert("Select month and year");

    const monthKey = `${year}-${String(month).padStart(2, "0")}`;

    const snap = await getDocs(
      query(
        collection(db, "attendanceMonths"),
        where("monthKey", "==", monthKey)
      )
    );
    if (!snap.empty) return alert("Sheet already exists");

    await addDoc(collection(db, "attendanceMonths"), {
      month: Number(month),
      year: Number(year),
      monthKey,
      createdBy: user.email,
      createdAt: serverTimestamp(),
      resourceLink: "",
      fileURL: "",
      fileType: ""
    });

    onClose();
  };

  return (
    <div className="add-form">
      <select onChange={(e) => setMonth(e.target.value)}>
        <option value="">Select Month</option>
        {[...Array(12)].map((_, i) => (
          <option key={i} value={i + 1}>
            {new Date(0, i).toLocaleString("en", { month: "long" })}
          </option>
        ))}
      </select>

      <input
        type="text"
        value={year}
        onChange={(e) => setYear(e.target.value.replace(/\D/g, ""))}
        placeholder="Year"
      />

      <button className="upload-btn" onClick={handleCreate}>
        Create Sheet
      </button>
    </div>
  );
}

/* ===== RESOURCE UPLOAD FORM ===== */
function AttendanceResourceForm({ sheet, onClose }) {
  const [link, setLink] = useState(sheet.resourceLink || "");
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);

    let fileURL = sheet.fileURL || "";
    let fileType = sheet.fileType || "";

    if (file) {
      const fileRef = ref(
        storage,
        `attendance/${sheet.monthKey}-${Date.now()}`
      );
      await uploadBytes(fileRef, file);
      fileURL = await getDownloadURL(fileRef);
      fileType = file.type.includes("pdf") ? "pdf" : "image";
    }

    await updateDoc(doc(db, "attendanceMonths", sheet.id), {
      resourceLink: link,
      fileURL,
      fileType
    });

    setLoading(false);
    onClose();
  };

  return (
    <div className="add-form">
      <h3>Attendance Resource</h3>

      <input
        type="text"
        placeholder="Paste Excel / Google Sheet / Drive link"
        value={link}
        onChange={(e) => setLink(e.target.value)}
      />

      <input
        type="file"
        accept=".pdf,image/*"
        onChange={(e) => setFile(e.target.files[0])}
      />

      <button className="upload-btn" onClick={handleSave} disabled={loading}>
        {loading ? "Saving..." : "Save"}
      </button>
    </div>
  );
}
