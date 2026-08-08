import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { questionAPI } from "../services/api";
import { gradeAnswers } from "../utils/grading";
import { addCompletedQuestion } from "../utils/localStorage";
import "../styles/Results.css";

function Results() {
  const location = useLocation();
  const navigate = useNavigate();
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [answers, setAnswers] = useState({});
  const [gradingResults, setGradingResults] = useState(null);
  const [aiFeedback, setAiFeedback] = useState({});
  const [aiLoading, setAiLoading] = useState({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);

  // Get category and difficulty fro form page
  const selectedCategories = location.state?.selectedSubs || [];
  const selectedDifficulty = location.state?.selectedDifficulty || [];

  useEffect(() => {
    fetchQuestions(page);
  }, [page]);

  const fetchQuestions = async (currentPage) => {
    try {
      setLoading(true);
      const params = {
        category: selectedCategories.join(","), // Configure route
        difficulty: selectedDifficulty.join(","), // Configure route
        limit: 5, // else limit to 10 questions (set in backend model)
        page: currentPage,
      };
      const response = await questionAPI.search(params);
      setQuestions(response.data.questions);
      setPagination(response.data.pagination);
      setError(null);

      // Reset answers and grading when changing pages
      setAnswers({});
      setGradingResults(null);
      setIsSubmitted(false);

      // Reset AI feedback
      setAiFeedback({});
      setAiLoading({});
    } catch (err) {
      setError("Failed to load questions");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerChange = (questionId, value) => {
    setAnswers({
      ...answers,
      [questionId]: value,
    });
  };

  // AI Feedback Function
  const handleAIFeedback = async (question) => {
    const answer = answers[question._id];

    if (!answer || answer.trim() === "") {
      alert("Please answer the question first.");
      return;
    }

    try {
      setAiLoading({
        ...aiLoading,
        [question._id]: true,
      });

      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/ai/evaluate`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            question: question.Question,
            answer: answer,
          }),
        },
      );

      const data = await response.json();
      const parsedFeedback = JSON.parse(data.feedback);
      console.log("AI Response: ", parsedFeedback);
      setAiFeedback({
        ...aiFeedback,
        [question._id]: parsedFeedback,
      });
      // Save AI score to progress
      addCompletedQuestion({
        id: question._id,
        main: question.main || "Uncategorized",
        category: question.Category,
        difficulty: question.Difficulty,
        percentage: parsedFeedback.score,
      });
    } catch (error) {
      console.error("AI Feedback Error:", error);
      alert("AI evaluation failed.");
    } finally {
      setAiLoading({
        ...aiLoading,
        [question._id]: false,
      });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Check if at least one question is answered
    const answeredQuestions = Object.values(answers).filter(
      (answer) => answer.trim() !== "",
    );
    if (answeredQuestions.length === 0) {
      alert("Please answer at least one question before submitting.");
      return;
    }

    // Grade the answers
    const results = gradeAnswers(answers, questions);
    setGradingResults(results);
    setIsSubmitted(true);

    // Save completed questions to localStorage
    Object.keys(results.questionResults).forEach((questionId) => {
      const question = questions.find((q) => q._id === questionId);
      const result = results.questionResults[questionId];
      if (question) {
        addCompletedQuestion({
          id: questionId,
          main: question.main || "Uncategorized",
          category: question.Category,
          difficulty: question.Difficulty,
          percentage: result.percentage,
        });
      }
    });
    console.log("Grading Results:", results);
  };

  const handleRetry = (questionId) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: "",
    }));

    setAiFeedback((prev) => {
      const updated = { ...prev };
      delete updated[questionId];
      return updated;
    });

    setAiLoading((prev) => ({
      ...prev,
      [questionId]: false,
    }));
  };

  const handlePreviousPage = () => {
    if (page > 1) {
      const hasAnswers = Object.keys(answers).length > 0;
      // Check if user has answered any questions but hasn't submitted
      if (hasAnswers && !isSubmitted) {
        const confirmed = window.confirm(
          "You have unsubmitted answers. Your answers will be reset if you navigate to another page. Continue?",
        );
        if (!confirmed) return;
      }
      setPage(page - 1);
      window.scrollTo(0, 0);
    }
  };

  const handleNextPage = () => {
    if (pagination && page < pagination.total_pages) {
      const hasAnswers = Object.keys(answers).length > 0;
      // Check if user has answered any questions but hasn't submitted
      if (hasAnswers && !isSubmitted) {
        const confirmed = window.confirm(
          "You have unsubmitted answers. Your answers will be reset if you navigate to another page. Continue?",
        );
        if (!confirmed) return;
      }
      setPage(page + 1);
      window.scrollTo(0, 0);
    }
  };

  if (loading) return <div>Loading questions...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="results-container">
      {/* <div>
        <button onClick={() => navigate('/home')}>Home</button>
        <button onClick={() => navigate('/search')}>Search</button>
      </div> */}
      <h2>
        {selectedCategories.join(", ")}
        <br />
        <span>[{selectedDifficulty.join(", ")}]</span>
      </h2>

      {pagination && questions.length > 0 && (
        <div className="pagination">
          <button onClick={handlePreviousPage} disabled={page === 1}>
            ← Previous
          </button>

          <span>
            Page {page} of {pagination.total_pages}
          </span>

          <button
            onClick={handleNextPage}
            disabled={page === pagination.total_pages}
          >
            Next →
          </button>
        </div>
      )}

      {questions.length === 0 ? (
        <p>No questions found.</p>
      ) : (
        <>
          <form onSubmit={handleSubmit}>
            {questions.map((question, index) => {
              const result = gradingResults?.questionResults[question._id];
              return (
                <div key={question._id} className="question-card">
                  <h3>
                    {(page - 1) * 5 + (index + 1)}. {question.Question}
                  </h3>
                  <textarea
                    type="text"
                    value={answers[question._id] || ""}
                    onChange={(e) =>
                      handleAnswerChange(question._id, e.target.value)
                    }
                    placeholder="Your answer..."
                    disabled={isSubmitted}
                  />
                  <button
                    className="submit-button"
                    type="button"
                    onClick={() => handleAIFeedback(question)}
                  >
                    {aiLoading[question._id] ? "Checking..." : "AI Feedback"}
                  </button>
                  {aiFeedback[question._id] && (
                    <>
                      <div className="ai-feedback">
                        <h4>AI Feedback</h4>

                        <p>Score: {aiFeedback[question._id].score}/10</p>

                        <h5>Strengths</h5>
                        <ul>
                          {aiFeedback[question._id].strengths.map(
                            (item, index) => (
                              <li key={index}>{item}</li>
                            ),
                          )}
                        </ul>

                        <h5>Improvements</h5>
                        <ul>
                          {aiFeedback[question._id].improvements.map(
                            (item, index) => (
                              <li key={index}>{item}</li>
                            ),
                          )}
                        </ul>

                        <h5>Better Answer</h5>
                        <p>{aiFeedback[question._id].betterAnswer}</p>
                      </div>

                      <button
                        className="submit-button"
                        style={{ marginTop: "20px" }}
                        onClick={() => handleRetry(question._id)}
                      >
                        Retry
                      </button>
                    </>
                  )}
                  {result && (
                    <div className="grading-result">
                      <p>Score: {result.percentage}%</p>
                      <details>
                        <summary>View Correct Answer</summary>
                        <p>{result.correctAnswer}</p>
                      </details>
                    </div>
                  )}
                </div>
              );
            })}
            {/* {!isSubmitted && (
              <button type="submit" className="submit-button">
                Submit Answers
              </button>
            )} */}
          </form>
          {/* {isSubmitted && (
            <button
              className="submit-button"
              style={{ marginTop: "20px" }}
              onClick={handleRetry}
            >
              Retry
            </button>
          )} */}
        </>
      )}

      {pagination && questions.length > 0 && (
        <div className="pagination">
          <button onClick={handlePreviousPage} disabled={page === 1}>
            ← Previous
          </button>

          <span>
            Page {page} of {pagination.total_pages}
          </span>

          <button
            onClick={handleNextPage}
            disabled={page === pagination.total_pages}
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}

export default Results;
