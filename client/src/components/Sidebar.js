import React from "react";
import "../stylesheets/App.css";

const Sidebar = ({
  setCurrentView,
  setSearchQuery,
  currentView,
  communities,
  loggedInUser,
}) => {

  const navigate = (view) => {
    setSearchQuery("");
    setCurrentView(view);
  };

  const userName = (loggedInUser?.displayName || "").toLowerCase();

  const sortedCommunities = [...communities].sort((a, b) => {

    const isJoined = (comm) =>
      comm.members?.some(
        (m) => typeof m === "string" && m.toLowerCase() === userName
      );

    const aJoined = isJoined(a);
    const bJoined = isJoined(b);

    if (aJoined && !bJoined) return -1;
    if (!aJoined && bJoined) return 1;
    return a.name.localeCompare(b.name);
  });

  return (
    <nav className="navbar">
      <button
        className={`navbar-item home-button ${
          currentView === "home" ? "active-link" : ""
        }`}
        onClick={() => navigate("home")}
      >
        Home
      </button>

      <div className="navbar-delimiter" />

      <h3 className="communities-header">Communities</h3>

      <button
        className={`create-community ${
          !loggedInUser ? "disabled" : ""
        } ${currentView === "createCommunity" ? "active-button" : ""}`}
        onClick={() => loggedInUser && navigate("createCommunity")}
        disabled={!loggedInUser}
        title={!loggedInUser ? "Login to create a community" : ""}
      >
        Create Community
      </button>

      <ul className="community-list">
        {sortedCommunities.map((comm) => (
          <li key={comm._id}>
            <button
              className={`community-link ${
                currentView === `community-${comm._id}`
                  ? "active-community"
                  : ""
              }`}
              onClick={() => navigate(`community-${comm._id}`)}
            >
              {comm.name}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
};

export default Sidebar;
