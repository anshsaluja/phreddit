import React from "react";

export default function WelcomePage({ setCurrentView, setLoggedInUser }) {
  return (
    <div className="welcome-page">
      <h1>Welcome to Phreddit!</h1>
      <p>A fake Reddit clone for CSE 316.</p>

      <div className="welcome-buttons">
        <button onClick={() => setCurrentView("register")}>Register</button>
        <button onClick={() => setCurrentView("login")}>Login</button>
        <button
          onClick={() => {
            setLoggedInUser(null); 
            setCurrentView("home"); 
          }}
        >
          Continue as Guest
        </button>
      </div>
    </div>
  );
}
