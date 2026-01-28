import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db, storage } from "./firebaseConfig";
import {
  collection,
  addDoc,
  getDocs,
  doc,
  getDoc,
  deleteDoc,
  query,
  orderBy,
  serverTimestamp
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { onAuthStateChanged } from "firebase/auth";
import { Home, BookOpen, Users, Trash2, X } from "lucide-react";
import "./Notes.css";

export default function Notes() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [role, setRole] = useState("");
  const [units, setUnits] = useState([]);
  const [newUnit, setNewUnit] = useState("");
  const [showAddInput, setShowAddInput] = useState(false);
  const [activeUnit, setActiveUnit] = useState(null);
  const [resources, setResources] = useState([]);
  const [showManager, setShowManager] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) return navigate("/logs");

      setUser(u);
      const snap = await getDoc(doc(db, "users", u.uid));
      if (snap.exists()) setRole(snap.data().role);

      fetchUnits();
    });
    return () => unsub();
  }, []);

  const fetchUnits = async () => {
    const q = query(collection(db, "notes"), orderBy("createdAt", "asc"));
    const snap = await getDocs(q);
    setUnits(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  };

  const handleAddUnit = async () => {
    if (!newUnit.trim()) return alert("Enter unit name");

    await addDoc(collection(db, "notes"), {
      name: newUnit.trim(),
      createdBy: user.email,
      createdAt: serverTimestamp()
    });

    setNewUnit("");
    setShowAddInput(false);
    fetchUnits();
  };

  const deleteUnit = async (unitId) => {
    if (!window.confirm("Delete this unit and all resources?")) return;

    const resSnap = await getDocs(collection(db, "notes", unitId, "resources"));
    for (let d of resSnap.docs) {
      await deleteDoc(d.ref);
    }

    await deleteDoc(doc(db, "notes", unitId));
    fetchUnits();
  };

  const openUnit = async (unit) => {
    setActiveUnit(unit);
    const snap = await getDocs(
      query(collection(db, "notes", unit.id, "resources"), orderBy("createdAt"))
    );
    setResources(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    setShowManager(true);
  };

  const deleteResource = async (id) => {
    await deleteDoc(doc(db, "notes", activeUnit.id, "resources", id));
    openUnit(activeUnit);
  };

  return (
    <div className="notes-page">
      <header className="notes-topbar">
        <h2 className="top-title">Dashboard</h2>
        <hr className="big-line" />
      </header>

      <div className="notes-tabs">
        <span>Recent</span>
        <span className="active">Notes</span>
        <span onClick={() => navigate("/links")}>Links</span>
        <span onClick={() => navigate("/notices")}>Notices</span>
      </div>
      <hr className="tabs-line" />

      <main className="notes-main">
        <h3 className="notes-section-title">Notes</h3>

        <div className="syllabus-section">
          {units.map(unit => (
            <div key={unit.id} className="unit-row">
              <button className="unit-btn" onClick={() => openUnit(unit)}>
                <span>{unit.name}</span>

                {role === "teacher" && (
                  <Trash2
                    size={16}
                    className="unit-delete"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteUnit(unit.id);
                    }}
                  />
                )}
              </button>
            </div>
          ))}

          {role === "teacher" && (
            !showAddInput ? (
              <button className="add-column-btn" onClick={() => setShowAddInput(true)}>
                + Add Columns
              </button>
            ) : (
              <div className="add-column-input">
                <input
                  value={newUnit}
                  onChange={e => setNewUnit(e.target.value)}
                />
                <div className="add-input-buttons">
                  <button onClick={handleAddUnit}>Save</button>
                  <button onClick={() => setShowAddInput(false)}>Cancel</button>
                </div>
              </div>
            )
          )}
        </div>
      </main>

      {showManager && activeUnit && (
        <div className="overlay">
          <div className="add-sheet-popup">
            <button className="close-btn" onClick={() => setShowManager(false)}>
              <X />
            </button>

            <h3>{activeUnit.name}</h3>

            <ResourceForm
              unit={activeUnit}
              onSaved={() => {
                openUnit(activeUnit);
                setShowManager(false);
              }}
            />

            <div className="resource-list">
              {resources.map(res => (
                <div key={res.id} className="resource-item">
                  {res.type === "pdf" && (
                    <a href={res.url} target="_blank" rel="noreferrer">📄 PDF</a>
                  )}
                  {res.type === "image" && (
                    <img
                      src={res.url}
                      alt="uploaded"
                      style={{ maxWidth: "100%", borderRadius: "8px" }}
                    />
                  )}
                  {res.type === "link" && (
                    <a href={res.url} target="_blank" rel="noreferrer">🔗 Link</a>
                  )}
                  {res.type === "text" && <p>📝 {res.text}</p>}

                  <Trash2 size={16} onClick={() => deleteResource(res.id)} />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <footer className="notes-bottom-nav">
        <div onClick={() => navigate("/dashboard")}><Home size={20} /><span>Dashboard</span></div>
        <div onClick={() => navigate("/assignment")}><BookOpen size={20} /><span>Assignment</span></div>
        <div onClick={() => navigate("/classroom")}><Users size={20} /><span>Classroom</span></div>
      </footer>
    </div>
  );
}

function ResourceForm({ unit, onSaved }) {
  const [link, setLink] = useState("");
  const [text, setText] = useState("");
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const saveResource = async () => {
    try {
      setUploading(true);

      if (link.trim()) {
        await addDoc(collection(db, "notes", unit.id, "resources"), {
          type: "link",
          url: link,
          createdAt: serverTimestamp()
        });
      }

      if (text.trim()) {
        await addDoc(collection(db, "notes", unit.id, "resources"), {
          type: "text",
          text,
          createdAt: serverTimestamp()
        });
      }

      if (file) {
        const fileType = file.type.startsWith("image/")
          ? "image"
          : "pdf";

        const fileRef = ref(
          storage,
          `notes/${unit.id}/${Date.now()}_${file.name}`
        );

        await uploadBytes(fileRef, file);
        const url = await getDownloadURL(fileRef);

        await addDoc(collection(db, "notes", unit.id, "resources"), {
          type: fileType,
          url,
          name: file.name,
          createdAt: serverTimestamp()
        });
      }

      setLink("");
      setText("");
      setFile(null);
      onSaved();
    } catch (err) {
      console.error(err);
      alert("Upload failed. Check Firebase Storage rules.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="add-form">
      <input
        placeholder="Paste link"
        value={link}
        onChange={e => setLink(e.target.value)}
      />
      <textarea
        placeholder="Write text note"
        value={text}
        onChange={e => setText(e.target.value)}
      />
      <input
        type="file"
        accept="application/pdf,image/*"
        onChange={e => setFile(e.target.files[0])}
      />
      <button
        className="upload-btn"
        disabled={uploading}
        onClick={saveResource}
      >
        {uploading ? "Uploading..." : "Save"}
      </button>
    </div>
  );
}
