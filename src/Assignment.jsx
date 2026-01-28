import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  collection,
  addDoc,
  query,
  onSnapshot,
  orderBy,
  getDocs,
  serverTimestamp,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { auth, db, storage } from "./firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";
import { Home, BookOpen, Users, Trash2 } from "lucide-react";
import "./Assignment.css";

export default function Assignment() {
  const navigate = useNavigate();
  const [assignments, setAssignments] = useState([]);
  const [user, setUser] = useState(null);

  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [link, setLink] = useState("");
  const [pdfFile, setPdfFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  // 🔐 AUTH
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u || null);
    });
    return () => unsub();
  }, []);

  // 📥 FETCH ASSIGNMENTS
  useEffect(() => {
    const q = query(collection(db, "assignments"), orderBy("dueDate", "asc"));
    const unsub = onSnapshot(q, (snap) => {
      setAssignments(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, []);

  // ❌ DELETE
  const handleDelete = async (id) => {
    if (!window.confirm("Delete this assignment?")) return;
    await deleteDoc(doc(db, "assignments", id));
  };

  // ➕ ADD
  const handleAddAssignment = async (e) => {
    e.preventDefault();
    if (!title || !dueDate) return alert("Please fill all required fields");

    setUploading(true);
    let pdfURL = "";

    try {
      if (pdfFile) {
        const pdfRef = ref(
          storage,
          `assignments/${pdfFile.name}-${Date.now()}`
        );
        await uploadBytes(pdfRef, pdfFile);
        pdfURL = await getDownloadURL(pdfRef);
      }

      await addDoc(collection(db, "assignments"), {
        title,
        description,
        dueDate,
        link: link || "",
        pdfURL,
        createdBy: user?.email || "unknown",
        createdAt: serverTimestamp(),
      });

      setTitle("");
      setDescription("");
      setDueDate("");
      setLink("");
      setPdfFile(null);
      setShowForm(false);
    } catch (err) {
      console.error(err);
      alert("Error adding assignment");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="assignment-container">
      <div className="assignment-header">
        <h2>Assignments</h2>
      </div>

      <div className="assignment-section">
        <div className="section-top">
          <h4>All Assignments</h4>

          {/* ✅ EVERYONE CAN ADD */}
          <button className="add-btn" onClick={() => setShowForm(true)}>
            + Add
          </button>
        </div>

        {assignments.length ? (
          assignments.map((a) => (
            <div key={a.id} className="assignment-card">
              <div className="card-left">
                <h3>{a.title}</h3>
                <p className="muted">Due: {a.dueDate}</p>
                {a.description && <p>{a.description}</p>}

                {a.link && (
                  <p>
                    🔗{" "}
                    <a href={a.link} target="_blank" rel="noopener noreferrer">
                      Resource Link
                    </a>
                  </p>
                )}

                {a.pdfURL && (
                  <p>
                    📄{" "}
                    <a href={a.pdfURL} target="_blank" rel="noopener noreferrer">
                      View PDF
                    </a>
                  </p>
                )}
              </div>

              {/* ✅ EVERYONE CAN DELETE */}
              <Trash2
                size={18}
                style={{ cursor: "pointer", color: "#dc2626" }}
                onClick={() => handleDelete(a.id)}
              />
            </div>
          ))
        ) : (
          <p className="no-assignments">No assignments yet</p>
        )}
      </div>

      {/* ===== BOTTOM NAV ===== */}
      <footer className="assignment-bottom-nav">
        <div onClick={() => navigate("/viewpage")}>
          <Home size={20} />
          <span>Dashboard</span>
        </div>

        <div className="active-tab">
          <BookOpen size={20} />
          <span>Assignment</span>
        </div>

        <div onClick={() => navigate("/classroom")}>
          <Users size={20} />
          <span>Classroom</span>
        </div>
      </footer>

      {/* ===== ADD FORM ===== */}
      {showForm && (
        <div className="addlink-form above-all">
          <div className="form-header">
            <button className="close-btn" onClick={() => setShowForm(false)}>
              ×
            </button>
            <h3>Add Assignment</h3>
          </div>

          <form onSubmit={handleAddAssignment}>
            <input
              className="input title-input"
              type="text"
              placeholder="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />

            <textarea
              className="input desc-input"
              placeholder="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />

            <div className="attachments">
              <h4>Attachments</h4>

              <div className="add-link">
                🔗
                <input
                  type="text"
                  placeholder="Add Resource Link"
                  value={link}
                  onChange={(e) => setLink(e.target.value)}
                />
              </div>

              <div className="add-link">
                📄
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={(e) => setPdfFile(e.target.files[0])}
                />
              </div>
            </div>

            <div className="attachments">
              <h4>Due Date</h4>
              <div className="add-link">
                📅
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </div>
            </div>

            <button type="submit" className="upload-btn" disabled={uploading}>
              {uploading ? "Uploading..." : "Save Assignment"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
