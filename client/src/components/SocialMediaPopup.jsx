import React from 'react';

function SocialMediaPopup({ platform, setIsPopupOpen, setIsAuthenticated }) {
  const handleFacebookLogin = () => {
    if (platform !== 'facebook') {
      alert(`Authentication for ${platform} not implemented yet.`);
      setIsPopupOpen(false);
      return;
    }

    window.FB.login(
      (response) => {
        if (response.authResponse) {
          setIsAuthenticated(true);
          alert('Successfully connected to Facebook!');
          setIsPopupOpen(false);
        } else {
          alert('Facebook authentication failed.');
        }
      },
      { scope: 'pages_manage_posts,pages_read_engagement,pages_show_list' } // Required permissions
    );
  };

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">
        Connect to {platform ? platform.charAt(0).toUpperCase() + platform.slice(1) : 'Platform'}
      </h2>
      <p className="mb-4">Please authenticate to connect your {platform} account.</p>
      <div className="flex justify-end gap-2">
        <button
          onClick={() => setIsPopupOpen(false)}
          className="bg-gray-500 text-white py-2 px-4 rounded hover:bg-gray-600"
        >
          Cancel
        </button>
        <button
          onClick={handleFacebookLogin}
          className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
        >
          Connect with {platform.charAt(0).toUpperCase() + platform.slice(1)}
        </button>
      </div>
    </div>
  );
}

export default SocialMediaPopup;