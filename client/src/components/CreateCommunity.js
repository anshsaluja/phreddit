import React, { useState, useEffect } from "react";
import axios from "axios";
import { parseMarkdownLinks } from "../utils/parseMarkdownLinks";
import "../stylesheets/App.css";

const CreateCommunity = ({
  setCurrentView,
  setCommunities,
  setLoggedInUser,
  loggedInUser,
  editMode = false,
  existingCommunity = null,
}) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const [nameError, setNameError] = useState("");
  const [descError, setDescError] = useState("");

  useEffect(() => {
    if (editMode && existingCommunity) {
      setName(existingCommunity.name || "");
      setDescription(existingCommunity.description || "");
    }
  }, [editMode, existingCommunity, loggedInUser]);

  if (!loggedInUser) {
    return (
      <div style={{ backgroundColor: "red", color: "white", padding: "10px" }}>
        You must be logged in to {editMode ? "edit this" : "create a new"} community.
      </div>
    );
  }

  const validateInputs = () => {
    let valid = true;
    setNameError("");
    setDescError("");

    if (!name.trim()) {
      setNameError("Community name is required.");
      valid = false;
    } else if (name.trim().length > 100) {
      setNameError("Community name must be 100 characters or fewer.");
      valid = false;
    }

    if (!description.trim()) {
      setDescError("Community description is required.");
      valid = false;
    } else if (description.trim().length > 500) {
      setDescError("Community description must be 500 characters or fewer.");
      valid = false;
    } else {
      const { isValid, errors } = parseMarkdownLinks(description.trim());
      if (!isValid) {
        setDescError(errors.join(" "));
        valid = false;
      }
    }

    return valid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateInputs()) return;

    try {
      const payload = {
        name: name.trim(),
        description: parseMarkdownLinks(description.trim()).parsedText,
      };

      let updatedCommunity;

      if (editMode && existingCommunity?._id) {
        if (!loggedInUser.displayName?.trim()) {
          setNameError("User display name missing. Please log in again.");
          return;
        }

        const res = await axios.patch(`http://localhost:8000/api/communities/${existingCommunity._id}`, payload);
        updatedCommunity = res.data;

        setCommunities((prev) =>
          prev.map((c) => (c._id === existingCommunity._id ? updatedCommunity : c))
        );
      } else {
        const fullPayload = {
          ...payload,
          members: [loggedInUser.displayName],
          createdBy: loggedInUser.displayName,
        };

        const response = await axios.post("http://localhost:8000/api/communities", fullPayload);
        updatedCommunity = response.data;
        setCommunities((prev) => [...prev, updatedCommunity]);
        if (updatedCommunity?._id) {
          const updatedIDs = new Set(loggedInUser.joinedCommunityIDs ?? []);
          updatedIDs.add(updatedCommunity._id.toString());
        
          const patchedUser = { ...loggedInUser, joinedCommunityIDs: [...updatedIDs] };
          localStorage.setItem("loggedInUser", JSON.stringify(patchedUser));
          setLoggedInUser(patchedUser);
        } 
      }

      setCurrentView(`community-${updatedCommunity._id}`);
    } catch (err) {
      console.error("Axios error →", err);
      const msg = err.response?.data?.message || "Failed to submit community.";
      setNameError(msg);
    }
  };

  return (
    <div className="create-community-container">
      <h2 className="create-community-heading">
        {editMode ? "Edit Community" : "Create a New Community"}
      </h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="communityNameInput">
            Community Name (required, max 100 characters):
          </label>
          <input
            type="text"
            id="communityNameInput"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={100}
          />
          {nameError && <div className="error-message">{nameError}</div>}
        </div>

        <div className="form-group">
          <label htmlFor="communityDescriptionInput">
            Community Description (required, max 500 characters):
          </label>
          <textarea
            id="communityDescriptionInput"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={500}
          />
          {descError && <div className="error-message">{descError}</div>}
        </div>

        <button className="engender-btn" type="submit">
          {editMode ? "Update Community" : "Create Community"}
        </button>
      </form>
    </div>
  );
};

export default CreateCommunity;
