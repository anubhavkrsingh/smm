import React, { useState, useEffect } from "react";
import SocialMediaPopup from "./SocialMediaPopup.jsx";

function Dashboard() {
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState("facebook"); // default
  const [prompt, setPrompt] = useState("");
  const [generatedContents, setGeneratedContents] = useState([]); // array of { text, hashtags, mediaUrl?, mediaType?, mediaDescription? }
  const [selectedContent, setSelectedContent] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false); // based on localStorage creds
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [scheduleTime, setScheduleTime] = useState("");

  // --- Helpers ---
  const getFbCreds = () => {
    const accessToken = localStorage.getItem("fb_page_access_token") || "";
    const pageId = localStorage.getItem("fb_page_id") || "";
    return { accessToken, pageId };
  };

  // On mount, mark connected if creds exist
  useEffect(() => {
    const { accessToken, pageId } = getFbCreds();
    if (accessToken && pageId) setIsAuthenticated(true);
  }, []);

  // Open the connect popup
  const handleConnectPlatform = (platform) => {
    setSelectedPlatform(platform);
    setIsPopupOpen(true);
  };

  // Generate content (calls your backend genAI)
  const handlePromptSubmit = async () => {
    if (!prompt.trim()) {
      setError("Please enter a prompt.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setGeneratedContents([]);
    setSelectedContent(null);

    try {
      const response = await fetch("http://localhost:5000/api/generate-content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, platform: selectedPlatform || "facebook" }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to generate content");
      }

      const data = await response.json();
      // expecting array of objects; adjust if your service returns differently
      setGeneratedContents(Array.isArray(data) ? data : [data]);
    } catch (err) {
      setError("Error generating content: " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // OPTIONAL: Post now (if you keep the immediate publish route)
  const handlePostNow = async () => {
    if (!selectedContent) return;
    setIsLoading(true);
    setError(null);

    try {
      const { accessToken, pageId } = getFbCreds();
      if (!accessToken || !pageId) throw new Error("Connect Facebook first.");

      const response = await fetch("http://localhost:5000/api/post-to-facebook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accessToken,
          pageId,
          content: selectedContent,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to post to Facebook");
      }

      alert("Post successfully published to Facebook!");
      setGeneratedContents([]);
      setSelectedContent(null);
    } catch (err) {
      setError("Error posting to Facebook: " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Schedule post: send to backend to SAVE in SQL (no FB publish here)
  const handleSchedulePost = async () => {
    if (!selectedContent || !scheduleTime) return;
    setIsLoading(true);
    setError(null);

    try {
      const { accessToken, pageId } = getFbCreds();
      if (!accessToken || !pageId) throw new Error("Connect Facebook first.");

      const response = await fetch("http://localhost:5000/api/schedule-post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accessToken,
          pageId,
          content: selectedContent,
          scheduleTime, // e.g. "2025-10-29T16:00"
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to schedule post");
      }

      const saved = await response.json();
      alert(
        `Saved to SQL as ${saved.status} for ${new Date(saved.scheduledAt).toLocaleString()}`
      );
      setGeneratedContents([]);
      setSelectedContent(null);
      setScheduleTime("");
    } catch (err) {
      setError("Error scheduling post: " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-black text-white">
      {/* Sidebar */}
      <div className="fixed top-0 left-0 h-full w-20 bg-gray-900 shadow-lg p-4 z-50">
        <h2 className="text-lg font-bold mb-4 text-white text-center">Connect</h2>
        <nav className="flex flex-col items-center gap-4">
          <button
            onClick={() => handleConnectPlatform("facebook")}
            className="p-2 text-white rounded hover:bg-gray-700"
            title="Connect Facebook"
          >
            <svg
              className="w-6 h-6"
              fill="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M9.198 21.5h4v-8.01h3.604l.54-3.98H13.8v-2.53c0-1.15.325-1.94 2-1.94h2.14V1.5h-3.46c-3.22 0-5.48 1.92-5.48 5.44v3.06H6.5v3.98h2.698V21.5z" />
            </svg>
          </button>

          {/* placeholders for future platforms */}
          <button
            onClick={() => handleConnectPlatform("instagram")}
            className="p-2 text-white rounded hover:bg-gray-700"
            title="Connect Instagram"
          >
            <svg
              className="w-6 h-6"
              fill="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M12 2.16c3.21 0 3.58.01 4.84.07 1.17.05 1.8.24 2.22.4.56.22.97.48 1.39.9.42.42.68.83.9 1.39.16.42.35 1.05.4 2.22.06 1.26.07 1.63.07 4.84s-.01 3.58-.07 4.84c-.05 1.17-.24 1.8-.4 2.22-.22.56-.48.97-.9 1.39-.42.42-.83.68-1.39.9-.42.16-1.05.35-2.22.4-1.26.06-1.63.07-4.84.07s-3.58-.01-4.84-.07c-1.17-.05-1.8-.24-2.22-.4-.56-.22-.97-.48-1.39-.9-.42-.42-.68-.83-.9-1.39-.16-.42-.35-1.05-.4-2.22-.06-1.26-.07-1.63-.07-4.84s.01-3.58.07-4.84c.05-1.17.24-1.8.4-2.22.22-.56.48-.97.9-1.39.42-.42.83-.68 1.39-.9.42-.16 1.05-.35 2.22-.4 1.26-.06 1.63-.07 4.84-.07zm0-2.16C8.74 0 8.33.01 7.05.07 5.78.13 4.76.36 3.92.67c-.86.32-1.59.74-2.32 1.47S.58 3.88.26 4.74c-.31.84-.54 1.86-.6 3.13C-.01 8.33 0 8.74 0 12s.01 3.67.07 4.94c.06 1.27.29 2.29.6 3.13.32.86.74 1.59 1.47 2.32s1.46 1.15 2.32 1.47c.84.31 1.86.54 3.13.6 1.27.06 1.68.07 4.94.07s3.67-.01 4.94-.07c1.27-.06 2.29-.29 3.13-.6.86-.32 1.59-.74 2.32-1.47s1.15-1.46 1.47-2.32c.31-.84.54-1.86.6-3.13.06-1.27.07-1.68.07-4.94s-.01-3.67-.07-4.94c-.06-1.27-.29-2.29-.6-3.13-.32-.86-.74-1.59-1.47-2.32s-1.46-1.15-2.32-1.47c-.84-.31-1.86-.54-3.13-.6C15.67-.01 15.26 0 12 0z" />
              <path d="M12 5.84a6.16 6.16 0 100 12.32 6.16 6.16 0 000-12.32zm0 10.16a4 4 0 110-8 4 4 0 010 8z" />
              <circle cx="18.41" cy="5.59" r="1.44" />
            </svg>
          </button>

          <button
            onClick={() => handleConnectPlatform("linkedin")}
            className="p-2 text-white rounded hover:bg-gray-700"
            title="Connect LinkedIn"
          >
            <svg
              className="w-6 h-6"
              fill="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M4.98 3.5c0 1.38-1.12 2.5-2.5 2.5S0 4.88 0 3.5 1.12 1 2.5 1s2.5 1.12 2.5 2.5zm.02 4.5h-5v16h5v-16zm7.98 0h-5v16h5v-6.5c0-2.48 2.02-4.5 4.5-4.5s4.5 2.02 4.5 4.5v6.5h5v-8.5c0-4.97-4.03-9-9-9-2.13 0-4.08.74-5.63 1.97l-.37-.47h-.5v16z" />
            </svg>
          </button>

          <button
            className="p-2 text-white rounded hover:bg-gray-700"
            onClick={() => alert("View History")}
            title="History"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </button>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col p-4 ml-20">
        <h1 className="text-3xl font-bold mb-6 text-center text-white">
          Social Media Manager Dashboard
        </h1>

        {/* Authentication Status */}
        <div className="mb-4 text-center">
          {isAuthenticated ? (
            <p className="text-green-500">Connected to Facebook</p>
          ) : (
            <p className="text-red-500">Not connected to Facebook</p>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 p-3 bg-red-600 text-white rounded-lg text-center">
            {error}
          </div>
        )}

        {/* Generated Content Preview */}
        {generatedContents.length > 0 && (
          <div className="mb-6 p-6 bg-gray-900 rounded-lg shadow-lg max-w-[90vw] mx-auto border border-gray-700">
            <h2 className="text-xl font-bold mb-4">Generated Post Previews</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {generatedContents.map((content, index) => (
                <div
                  key={index}
                  className={`p-4 bg-gray-800 rounded-lg cursor-pointer border ${
                    selectedContent === content ? "border-blue-500" : "border-gray-700"
                  }`}
                  onClick={() => setSelectedContent(content)}
                >
                  <p className="mb-2 whitespace-pre-wrap">{content.text}</p>
                  <p className="mb-2 text-blue-400">{content.hashtags}</p>

                  {content.mediaUrl && (
                    <div className="mb-2">
                      {content.mediaType === "image" ? (
                        <img
                          src={content.mediaUrl}
                          alt={`Generated Media ${index + 1}`}
                          className="max-w-full h-auto rounded-lg"
                          onError={() =>
                            setError(`Failed to load media for option ${index + 1}`)
                          }
                        />
                      ) : (
                        <video
                          src={content.mediaUrl}
                          controls
                          className="max-w-full h-auto rounded-lg"
                          onError={() =>
                            setError(`Failed to load media for option ${index + 1}`)
                          }
                        />
                      )}
                    </div>
                  )}
                  <p className="text-gray-400 text-sm">{content.mediaDescription}</p>
                </div>
              ))}
            </div>

            {selectedContent && (
              <div className="mt-4 flex flex-col gap-3">
                <div className="flex gap-4">
                  <button
                    onClick={handlePostNow}
                    disabled={isLoading}
                    className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:bg-gray-500"
                  >
                    {isLoading ? "Posting..." : "Post Selected Now"}
                  </button>

                  <div className="flex items-center gap-2">
                    <input
                      type="datetime-local"
                      value={scheduleTime}
                      onChange={(e) => setScheduleTime(e.target.value)}
                      className="p-2 bg-gray-800 text-white rounded-lg"
                    />
                    <button
                      onClick={handleSchedulePost}
                      disabled={isLoading || !scheduleTime}
                      className="bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700 disabled:bg-gray-500"
                    >
                      {isLoading ? "Scheduling..." : "Schedule Selected Post"}
                    </button>
                  </div>
                </div>

                <p className="text-xs text-gray-400">
                  Tip: Click a card to select it. Schedule stores the post in SQL as
                  <span className="px-1 font-semibold"> SCHEDULED</span> with your chosen time.
                </p>
              </div>
            )}
          </div>
        )}

        <div className="flex-1" /> {/* Spacer */}

        {/* Prompt Section */}
        <div className="p-6 bg-black text-white rounded-lg shadow-lg min-w-[400px] max-w-[90vw] mx-auto overflow-hidden border border-gray-700">
          <div className="flex items-center gap-2">
            <textarea
              className="w-full p-3 bg-gray-800 text-white rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows="3"
              placeholder="Enter your prompt here (e.g., 'Generate a happy Diwali wishing pic with caption and hashtags')..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handlePromptSubmit();
                }
              }}
            />
            <button
              className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:bg-gray-500"
              onClick={handlePromptSubmit}
              disabled={isLoading || !prompt.trim()}
            >
              {isLoading ? (
                "Generating..."
              ) : (
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                  />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Popup */}
      {isPopupOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-gray-900 p-6 rounded-lg shadow-lg max-w-md w-full text-white">
            <SocialMediaPopup
              platform={selectedPlatform}
              setIsPopupOpen={setIsPopupOpen}
              setIsAuthenticated={setIsAuthenticated}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
