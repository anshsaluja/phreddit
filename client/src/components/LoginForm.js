import React, { useState } from "react";
import axios from "axios";

export default function LoginForm({ setLoggedInUser, setCurrentView }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function handleLogin(e) {
    e.preventDefault();
    try {
      const res = await axios.post("http://localhost:8000/api/users/login", {
        email,
        password,
      });

      const userData = res.data;

      const enhancedUser = userData.isAdmin
        ? {
            ...userData,
            adminActingAs: false,
            adminID: userData._id,
          }
        : userData;

      setLoggedInUser(enhancedUser);
      localStorage.setItem("loggedInUser", JSON.stringify(enhancedUser)); 
      setCurrentView("home");
    } catch (err) {
      setError("Invalid credentials");
    }
  }

  return (
    <form onSubmit={handleLogin} className="auth-form">
      <h2>Login</h2>
      <input
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />
      <button type="submit">Login</button>
      {error && <p className="error">{error}</p>}
    </form>
  );
}
