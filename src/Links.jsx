import React, { useState, useEffect } from "react";
import {
  collection,
  addDoc,
  onSnapshot,
  serverTimestamp,
  query,
  orderBy,
  getDocs,
  deleteDoc,
  doc
} from "firebase/firestore";
import { auth, db } from "./firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { Home, BookOpen, Users, Trash2 } from "lucide-react";
import "./Links.css";

export default function Links() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(""); // teacher or student
  const [showAddForm, setShowAddForm] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [url, setUrl] = useState("");
  const [links, setLinks] = useState([]);

  // ---------- Fetch user & role ----------
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        navigate("/logs");
        return;
      }
      setUser(currentUser);

      // Fetch user role from "users" collection
      const q = query(collection(db, "users"));
      const snapshot = await getDocs(q);
      snapshot.forEach((docu) => {
        if (docu.data().email === currentUser.email) {
          setUserRole(docu.data().role);
        }
      });
    });

    return () => unsubscribe();
  }, [navigate]);

  // ---------- Fetch links in real-time ----------
  useEffect(() => {
    const q = query(collection(db, "links"), orderBy("timestamp", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((docu) => ({ id: docu.id, ...docu.data() }));
      setLinks(data);
    });
    return () => unsubscribe();
  }, []);

  // ---------- Upload new link ----------
  const handleUpload = async (e) => {
    e.preventDefault();
    if (!title || !url) return alert("Please fill all required fields!");

    try {
      await addDoc(collection(db, "links"), {
        title,
        description,
        url,
        createdBy: user?.email,
        timestamp: serverTimestamp(),
      });
      alert("✅ Link added successfully!");
      setTitle("");
      setDescription("");
      setUrl("");
      setShowAddForm(false);
    } catch (err) {
      console.error("Error adding link:", err);
    }
  };

  // ---------- Delete link ----------
  const handleDeleteLink = async (id) => {
    if (!window.confirm("Delete this link?")) return;

    try {
      await deleteDoc(doc(db, "links", id));
    } catch (err) {
      console.error("Error deleting link:", err);
      alert("Failed to delete link");
    }
  };

  return (
    <div className="links-page">
      {/* ===== TOP HEADER ===== */}
      <header className="links-topbar">
        <h2 className="top-title">Dashboard</h2>
        <hr className="big-line" />
      </header>

      {/* ===== TABS ===== */}
      <div className="links-tabs">
        <span onClick={() => navigate("/viewpage")}>Recent</span>
        <span onClick={() => navigate("/notes")}>Notes</span>
        <span className="active">Links</span>
        <span onClick={() => navigate("/notices")}>Notices</span>
      </div>

      <hr className="tabs-line" />

      {/* ===== MAIN CONTENT ===== */}
      <main className="links-main">
        <h3 className="links-section-title">Links</h3>

        {/* Only teachers can add links */}
        {userRole === "teacher" && !showAddForm && (
          <button
            className="add-link-btn"
            onClick={() => setShowAddForm(true)}
          >
            + Add Link
          </button>
        )}

        {/* Add Form (only visible for teachers) */}
        {showAddForm && (
          <div className="addlink-form">
            <div className="form-header">
              <button
                className="close-btn"
                onClick={() => setShowAddForm(false)}
              >
                ×
              </button>
              <h3>Add Link</h3>
            </div>

            <form onSubmit={handleUpload}>
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
              ></textarea>

              <div className="attachments">
                <h4>Attachments</h4>
                <div className="add-link">
                  <span role="img" aria-label="link-icon">
                    🔗
                  </span>
                  <input
                    type="text"
                    placeholder="Add Link"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                  />
                </div>
              </div>

              <button type="submit" className="upload-btn">
                Upload
              </button>
            </form>
          </div>
        )}

        {/* ===== LINKS LIST ===== */}
        {!showAddForm && (
          <div className="links-list">
            {links.length === 0 ? (
              <p className="empty-text">No links added yet.</p>
            ) : (
              links.map((link) => (
                <div className="link-card" key={link.id}>

                  <div className="link-header">
                    <h4>{link.title}</h4>

                    {userRole === "teacher" && (
                      <Trash2
                        size={16}
                        className="delete-icon"
                        onClick={() => handleDeleteLink(link.id)}
                      />
                    )}
                  </div>

                  {link.description && <p>{link.description}</p>}
                  <p>
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Open Link
                    </a>
                  </p>
                  {link.createdBy && (
                    <p className="posted-by">
                      <small>Posted by: {link.createdBy}</small>
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </main>

      {/* ===== BOTTOM NAVBAR ===== */}
      <footer className="links-bottom-nav">
        <div onClick={() => navigate("/viewpage")}>
          <Home size={20} />
          <span>Dashboard</span>
        </div>
        <div onClick={() => navigate("/assignment")}>
          <BookOpen size={20} />
          <span>Assignment</span>
        </div>
        <div onClick={() => navigate("/classroom")}>
          <Users size={20} />
          <span>Classroom</span>
        </div>              
      </footer>
    </div>
  );
}
