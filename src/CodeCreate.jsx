import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { db, auth } from "./firebaseConfig";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import "./CodeCreate.css";

const CodeCreate = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const formData = location.state || {};

  const [classCode, setClassCode] = useState("");
  const [shareLink, setShareLink] = useState("");
  const [loading, setLoading] = useState(false);

  // Generate random alphanumeric classroom code
  const generateClassCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  // Create classroom in Firestore
  const handleCreateClassroom = async () => {
    setLoading(true);
    const code = generateClassCode();

    try {
      // Reference with auto-ID (Firestore generates unique doc)
      const docRef = doc(db, "classrooms", crypto.randomUUID());

      // Create shareable link using classCode (not docId)
      const link = `${window.location.origin}/join/${code}`;

      await setDoc(docRef, {
        ...formData,
        classCode: code,
        createdBy: auth.currentUser?.uid || "anonymous",
        students: [],
        createdAt: serverTimestamp(),
        shareLink: link,
      });

      // Update UI
      setClassCode(code);
      setShareLink(link);

    } catch (error) {
      console.error("❌ Error creating classroom:", error);
      alert("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Copy both link and code
  const copyToClipboard = () => {
    if (!shareLink || !classCode) return;
    navigator.clipboard.writeText(`Join my class!\nLink: ${shareLink}\nCode: ${classCode}`);
    alert("Copied to clipboard!");
    navigate("/tea");
  };

  // Share via WhatsApp
  const shareWhatsApp = () => {
    if (!shareLink || !classCode) return;
    const message = encodeURIComponent(
      `Join my class!\nLink: ${shareLink}\nCode: ${classCode}`
    );
    window.open(`https://wa.me/?text=${message}`, "_blank");
    navigate("/tea");
  };

  // Share via Email
  const shareEmail = () => {
    if (!shareLink || !classCode) return;
    const subject = encodeURIComponent("Join my class");
    const body = encodeURIComponent(
      `Hi,\n\nJoin my class using the following details:\n\nLink: ${shareLink}\nClass Code: ${classCode}\n\nSee you in class!`
    );
    window.open(`mailto:?subject=${subject}&body=${body}`);
    navigate("/tea");
  };

  return (
    <div className="codecreate-container">
      <div className="codecreate-card">
        {/* Back arrow */}
        <div className="header">
          <span className="back-arrow" onClick={() => navigate(-1)}>←</span>
          <h2>Create Classroom Code</h2>
        </div>

        <p>Please create a Class Code with your student can join your classroom</p>

        {/* Input style boxes */}
        <input
          type="text"
          className="code-input"
          placeholder="Classroom Code"
          value={classCode}
          readOnly
        />
        <input
          type="text"
          className="code-input"
          placeholder="Classroom Link"
          value={shareLink}
          readOnly
        />

        {/* Share buttons (only show after creation) */}
        {classCode && shareLink && (
          <div className="share-buttons">
            <button onClick={copyToClipboard}>📋 Copy</button>
            <button onClick={shareWhatsApp}>📱 WhatsApp</button>
            <button onClick={shareEmail}>✉️ Email</button>
          </div>
        )}

        {/* Create button */}
        <button
          onClick={handleCreateClassroom}
          disabled={loading}
          className="create-btn"
        >
          {loading ? "Creating..." : "Create Classroom"}
        </button>
      </div>
    </div>
  );
};

export default CodeCreate;
