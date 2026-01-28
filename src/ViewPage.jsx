import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { auth, db } from "./firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";
import {
  doc,
  getDoc,
  collection,
  query,
  orderBy,
  limit,
  getDocs,
} from "firebase/firestore";
import { Home, BookOpen, Users } from "lucide-react";
import "./ViewPage.css";

const HeaderBar = ({ title }) => (
  <div className="header-section">
    <h1 className="header-title">{title}</h1>
  </div>
);

const BottomNav = ({ activePage, navigate }) => (
  <div className="bottom-nav">
    <div
      className={`nav-item ${activePage === "Dashboard" ? "active" : ""}`}
      onClick={() => navigate("/viewpage")}
    >
      <Home size={20} />
      <p>Dashboard</p>
    </div>
    <div
      className={`nav-item ${activePage === "Assignment" ? "active" : ""}`}
      onClick={() => navigate("/assignment")}
    >
      <BookOpen size={20} />
      <p>Assignment</p>
    </div>
    <div
      className={`nav-item ${activePage === "Classroom" ? "active" : ""}`}
      onClick={() => navigate("/classroom")}
    >
      <Users size={20} />
      <p>Classroom</p>
    </div>
  </div>
);

export default function ViewPage() {
  const { classId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [user, setUser] = useState(null);
  const [classData, setClassData] = useState(null);
  const [recentActivities, setRecentActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  // Detect logged-in user
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) {
        navigate("/logs");
        return;
      }
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, [navigate]);

  // Fetch classroom and recent uploads
  useEffect(() => {
    const fetchData = async () => {
      if (!classId || !user) return;

      try {
        const classRef = doc(db, "classrooms", classId);
        const classSnap = await getDoc(classRef);
        if (!classSnap.exists()) {
          navigate("/comb");
          return;
        }

        const data = classSnap.data();
        setClassData(data);

        const activities = [];
        const sources = ["assignments", "links", "notices"];

        for (const src of sources) {
          const colRef = collection(db, "classrooms", classId, src);
          const q = query(colRef, orderBy("createdAt", "desc"), limit(5));
          const snap = await getDocs(q);
          snap.forEach((doc) => {
            activities.push({
              id: doc.id,
              type: src,
              ...doc.data(),
            });
          });
        }

        const sorted = activities.sort((a, b) => {
          const dateA = a.createdAt?.toDate?.() || new Date(0);
          const dateB = b.createdAt?.toDate?.() || new Date(0);
          return dateB - dateA;
        });

        setRecentActivities(sorted);
      } catch (error) {
        console.error("Error loading class:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [classId, user, navigate]);

  if (loading) return <div className="view-container">Loading...</div>;
  if (!classData) return <div className="view-container">Class not found.</div>;

  // Determine top title
  const getPageTitle = () => {
    if (location.pathname.includes("assignment")) return "Assignment";
    if (location.pathname.includes("classroom")) return "Classroom";
    return "Dashboard";
  };

  // Determine active subtab
  const getActiveSubTab = () => {
    if (location.pathname.includes("notes")) return "Notes";
    if (location.pathname.includes("links")) return "Links";
    if (location.pathname.includes("notices")) return "Notices";
    return "Recent";
  };

  const activeSubTab = getActiveSubTab();

  // Render content based on subtab
  const renderSubTabContent = () => {
    switch (activeSubTab) {
      case "Notes":
        return <p>Notes will appear here.</p>;
      case "Links":
        return <p>All shared links will appear here.</p>;
      case "Notices":
        return <p>Class notices will appear here.</p>;
      default:
        return (
          <>
            <h2 className="section-title">Recently Uploaded Resources</h2>
            {recentActivities.length === 0 ? (
              <p>No recent uploads.</p>
            ) : (
              recentActivities.map((act) => (
                <div key={act.id} className="resource-card">
                  <p>
                    <strong>
                      {act.type === "links"
                        ? "YouTube Link:"
                        : act.type.charAt(0).toUpperCase() +
                          act.type.slice(1)}
                    </strong>{" "}
                    {act.title || "Untitled"}
                  </p>
                  {act.description && <p>{act.description}</p>}
                </div>
              ))
            )}
          </>
        );
    }
  };

  return (
    <div className="view-container">
      {/* Header Bar */}
      <HeaderBar title={getPageTitle()} />

      {/* Sub-Tabs */}
      <div className="tab-bar">
        {["Recent", "Notes", "Links", "Notices"].map((tab) => (
          <div
            key={tab}
            className={`tab ${activeSubTab === tab ? "active" : ""}`}
            onClick={() => navigate(`/${tab.toLowerCase()}`)}
          >
            {tab}
          </div>
        ))}
      </div>

      {/* Main Content */}
      <div className="content-section">{renderSubTabContent()}</div>

      {/* Bottom Navigation */}
      <BottomNav activePage={getPageTitle()} navigate={navigate} />
    </div>
  );
}
