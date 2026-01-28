import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "./firebaseConfig";
import { collection, getDocs, query, where } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import "./Comb.css";

const Comb = () => {
  const navigate = useNavigate();
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        // 1) Student’s joined classes
        const classesRef = collection(db, "students", user.uid, "classes");
        const classesSnap = await getDocs(classesRef);

        // Use a Map to avoid duplicates
        const uniqueClasses = new Map();

        // 2) For each joined class, try to refresh with teacher’s latest data via classCode
        for (const docSnap of classesSnap.docs) {
          const sc = docSnap.data();
          let merged = { id: docSnap.id, ...sc };

          if (sc.code) {
            const qByCode = query(
              collection(db, "classrooms"),
              where("classCode", "==", sc.code)
            );
            const matchSnap = await getDocs(qByCode);
            if (!matchSnap.empty) {
              const tDoc = matchSnap.docs[0];
              const tData = tDoc.data();
              merged = {
                ...merged,
                // teacher canonical data
                subject: tData.subject || merged.subject || "",
                professorName: tData.professorName || merged.professorName || "",
                collegeName: tData.collegeName || merged.collegeName || "",
                degree: tData.degree || merged.degree || "",
                semester: tData.semester || merged.semester || "",
                link: merged.link || tData.shareLink || "",
                classroomId: tDoc.id,
                id: tDoc.id, // use teacher doc id for /view/:id routes
              };
            }
          }

          // ✅ Deduplicate by class code
          if (merged.code) {
            uniqueClasses.set(merged.code, merged);
          }
        }

        setClasses(Array.from(uniqueClasses.values()));
      } catch (err) {
        console.error("Error fetching classes:", err);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  if (loading) return <p>Loading...</p>;

  return (
    <div className="comb-container">
      <h2 className="comb-title">Choose Your Classroom</h2>
      <div className="comb-list">
        {classes.length === 0 ? (
          <p>No classrooms joined yet.</p>
        ) : (
          classes.map((cls) => (
            <div
              key={cls.id}
              className="class-card"
              onClick={() => navigate(`/view/${cls.id}`)}
            >
              <h3 className="class-name">
                {cls.subject || cls.classroom || `Class ${cls.id}`}
              </h3>
              <p><strong>Professor:</strong> {cls.professorName || "N/A"}</p>
              <p><strong>College:</strong> {cls.collegeName || "N/A"}</p>
              <p><strong>Degree:</strong> {cls.degree || "N/A"}</p>
              <p><strong>Semester:</strong> {cls.semester || "N/A"}</p>
              {cls.link && (
                <p>
                  <strong>Link:</strong>{" "}
                  <a href={cls.link} target="_blank" rel="noreferrer">
                    {cls.link}
                  </a>
                </p>
              )}
              {cls.code && (
                <p>
                  <strong>Class Code:</strong> {cls.code}
                </p>
              )}
            </div>
          ))
        )}
      </div>

      <button className="join-btn" onClick={() => navigate("/sea")}>
        Join new Classroom
      </button>
    </div>
  );
};

export default Comb;
