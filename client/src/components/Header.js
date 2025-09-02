import React from "react";
import SearchBar from "./SearchBar";
import axios from "axios";

const Header = ({
  setCurrentView,
  setSearchQuery,
  currentView,
  setHomeRefreshKey,
  loggedInUser,
  onLogout,
}) => {
  const isGuest = !loggedInUser || !loggedInUser.displayName;

  return (
    <header className="header">
      <div className="header-left">
        <button
          className="logo-button"
          onClick={() => {
            setSearchQuery("");
            setCurrentView(isGuest ? "welcome" : "home");
            setHomeRefreshKey((prev) => prev + 1);
          }}
        >
          Phreddit
        </button>

        <div className="search-box">
          <SearchBar setSearchQuery={setSearchQuery} setCurrentView={setCurrentView} />
        </div>
      </div>

      <div className="header-right">
        <button
          className={`create-post-button ${isGuest ? "disabled" : ""} ${currentView === "createPost" ? "active" : ""}`}
          onClick={() => !isGuest && setCurrentView("createPost")}
          disabled={isGuest}
          title={isGuest ? "Login to create posts" : ""}
        >
          Create Post
        </button>

        {isGuest ? (
          <span className="user-profile guest">Guest</span>
        ) : (
          <button
            className="user-display-box"
            onClick={() => {
              if (loggedInUser.adminActingAs && loggedInUser.adminID) {
                setCurrentView(`profile-${loggedInUser.adminID}`);
              } else {
                setCurrentView(`profile-${loggedInUser._id}`);
              }
            }}
          >
            {loggedInUser.displayName}
          </button>
        )}

        {loggedInUser ? (
          <button
            onClick={async () => {
              try {
                await axios.post("/api/users/logout");
                onLogout();
              } catch (err) {
                alert("Logout failed: Unable to contact server.");
              }
            }}
          >
            Logout
          </button>
        ) : (
          <>
            <button onClick={() => setCurrentView("login")}>Login</button>
            <button onClick={() => setCurrentView("register")}>Register</button>
          </>
        )}
      </div>
    </header>
  );
};

export default Header;
