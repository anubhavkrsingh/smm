// SocialMediaPopup.jsx
import React, { useState, useEffect } from "react";

export default function SocialMediaPopup({ platform, setIsPopupOpen, setIsAuthenticated }) {
  const [pageAccessToken, setPageAccessToken] = useState("");
  const [pageId, setPageId] = useState("");

  useEffect(() => {
    // Pre-fill from localStorage if available
    const savedToken = localStorage.getItem("fb_page_access_token") || "";
    const savedPageId = localStorage.getItem("fb_page_id") || "";
    if (savedToken) setPageAccessToken(savedToken);
    if (savedPageId) setPageId(savedPageId);
  }, []);

  const handleSave = () => {
    if (!pageAccessToken.trim() || !pageId.trim()) {
      alert("Please enter both Page Access Token and Page ID.");
      return;
    }
    localStorage.setItem("fb_page_access_token", pageAccessToken.trim());
    localStorage.setItem("fb_page_id", pageId.trim());
    setIsAuthenticated(true);
    setIsPopupOpen(false);
  };

  return (
    <div className="text-white">
      <h3 className="text-xl font-semibold mb-4">
        Connect {platform === "facebook" ? "Facebook Page" : platform}
      </h3>

      <label className="block text-sm mb-1">Facebook Page Access Token</label>
      <input
        type="text"
        className="w-full p-2 mb-4 rounded bg-gray-800 border border-gray-700"
        placeholder="Paste Page Access Token from Graph API Explorer"
        value={pageAccessToken}
        onChange={(e) => setPageAccessToken(e.target.value)}
      />

      <label className="block text-sm mb-1">Facebook Page ID</label>
      <input
        type="text"
        className="w-full p-2 mb-6 rounded bg-gray-800 border border-gray-700"
        placeholder="e.g. 123456789012345"
        value={pageId}
        onChange={(e) => setPageId(e.target.value)}
      />

      <div className="flex gap-2 justify-end">
        <button
          className="px-3 py-2 rounded bg-gray-700 hover:bg-gray-600"
          onClick={() => setIsPopupOpen(false)}
        >
          Cancel
        </button>
        <button
          className="px-3 py-2 rounded bg-blue-600 hover:bg-blue-700"
          onClick={handleSave}
        >
          Save & Connect
        </button>
      </div>
    </div>
  );
}
