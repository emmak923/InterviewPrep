import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { questionAPI } from "../services/api";
import {
  getCompletionStats,
  clearCompletedQuestions,
} from "../utils/localStorage";
import CircularProgress from "./CircularProgress";
import "../styles/Home.css";

function Home() {
  const navigate = useNavigate();
  // const user = JSON.parse(localStorage.getItem('user') || '{}');
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await questionAPI.getAll({ limit: 200 });
      const allQuestions = response.data.questions || [];

      const completionStats = getCompletionStats(allQuestions);
      setStats(completionStats);
      setError(null);
    } catch (err) {
      setError("Failed to load statistics");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleClearProgress = () => {
    if (
      window.confirm(
        "Are you sure you want to clear all your progress? This cannot be undone.",
      )
    ) {
      clearCompletedQuestions(); // Clear local storage
      fetchStats();
    }
  };

  // const handleLogout = () => {
  //   // Clear authentication data
  //   localStorage.removeItem("token");
  //   localStorage.removeItem("user");

  //   // Redirect to login
  //   navigate("/login");
  // };

  if (loading) return <div>Loading statistics...</div>;
  if (error) return <div>Error: {error}</div>;

  const mainCategories = Object.keys(stats);

  return (
    <div className="home-container">
      <h1 className="home-title">Progress by Category</h1>

      {/* {user.role === "admin" && (
        <button onClick={() => navigate("/admin/dashboard")}>
          Admin Dashboard
        </button>
      )} */}

      {/* <button
        onClick={handleLogout}
        style={{
          marginLeft: "10px",
          backgroundColor: "#dc3545",
          color: "white",
        }}
      >
        Logout
      </button> */}

      {mainCategories.length === 0 ? (
        <p>No questions available. Please check your backend connection.</p>
      ) : (
        <div className="categories-grid">
          {mainCategories.map((category) => (
            <div key={category} className="category-card">
              <h3>{category}</h3>

              {/* circular progress bar */}
              <CircularProgress
                percentage={stats[category].percentage}
                size={120}
              />

              <p className="category-info">
                {stats[category].answered} / {stats[category].total} answered -{" "}
                {stats[category].percentage}%
              </p>
            </div>
          ))}
        </div>
      )}

      <div className="home-actions">
        <button onClick={() => navigate("/search")}>Start Practicing</button>

        <button onClick={handleClearProgress}>Clear Progress</button>
      </div>
    </div>
  );
}

export default Home;
