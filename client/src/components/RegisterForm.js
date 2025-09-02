import React, { useState } from "react";
import axios from "axios";

export default function RegisterForm({ setLoggedInUser, setCurrentView }) {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    displayName: "",
    password: "",
    password2: "",
  });

  const [errors, setErrors] = useState({});

  function handleChange(e) {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: "" });
  }

  async function handleRegister(e) {
    e.preventDefault();

    const newErrors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const loweredPassword = formData.password.toLowerCase();

    if (!formData.firstName) newErrors.firstName = "First name is required";
    if (!formData.lastName) newErrors.lastName = "Last name is required";
    if (!formData.email) newErrors.email = "Email is required";
    else if (!emailRegex.test(formData.email))
      newErrors.email = "Please enter a valid email address";

    if (!formData.displayName) newErrors.displayName = "Display name is required";

    if (!formData.password) newErrors.password = "Password is required";
    else if (
      loweredPassword.includes(formData.firstName.toLowerCase()) ||
      loweredPassword.includes(formData.lastName.toLowerCase()) ||
      loweredPassword.includes(formData.displayName.toLowerCase()) ||
      loweredPassword.includes(formData.email.toLowerCase())
    ) {
      newErrors.password = "Password must not include personal info";
    }

    if (!formData.password2) newErrors.password2 = "Please confirm your password";
    else if (formData.password !== formData.password2)
      newErrors.password2 = "Passwords do not match";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      const res = await axios.post("/api/users/register", formData);

      const userData = {
        displayName: res.data.displayName,
        joinedCommunityIDs: [],
      };

      setLoggedInUser(userData);
      localStorage.setItem("loggedInUser", JSON.stringify(userData));
      setCurrentView("welcome");
    } catch (err) {
      setErrors({
        general: err.response?.data?.message || "Registration failed",
      });
    }
  }

  return (
    <form onSubmit={handleRegister} className="auth-form">
      <h2>Register</h2>

      <input
        name="firstName"
        placeholder="First Name"
        value={formData.firstName}
        onChange={handleChange}
      />
      {errors.firstName && <p className="error">{errors.firstName}</p>}

      <input
        name="lastName"
        placeholder="Last Name"
        value={formData.lastName}
        onChange={handleChange}
      />
      {errors.lastName && <p className="error">{errors.lastName}</p>}

      <input
        name="email"
        type="text"
        placeholder="Email"
        value={formData.email}
        onChange={handleChange}
      />
      {errors.email && <p className="error">{errors.email}</p>}

      <input
        name="displayName"
        placeholder="Display Name"
        value={formData.displayName}
        onChange={handleChange}
      />
      {errors.displayName && <p className="error">{errors.displayName}</p>}

      <input
        name="password"
        type="password"
        placeholder="Password"
        value={formData.password}
        onChange={handleChange}
      />
      {errors.password && <p className="error">{errors.password}</p>}

      <input
        name="password2"
        type="password"
        placeholder="Confirm Password"
        value={formData.password2}
        onChange={handleChange}
      />
      {errors.password2 && <p className="error">{errors.password2}</p>}

      <button type="submit">Register</button>
      {errors.general && <p className="error">{errors.general}</p>}
    </form>
  );
}
  