import React, { useEffect, useState } from "react";
import axios from "axios";
import { parseMarkdownLinks } from "../utils/parseMarkdownLinks";
import "../stylesheets/App.css";

const CreatePost = ({
  communities,
  setPosts,
  setCommunities,
  setCurrentView,
  loggedInUser,
  editMode = false,
  existingPost = null,
  onPostUpdated = null,
}) => {
  const [linkFlairs, setLinkFlairs] = useState([]);
  const [selectedCommunity, setSelectedCommunity] = useState("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [selectedFlair, setSelectedFlair] = useState("");
  const [newFlair, setNewFlair] = useState("");

  const [communityError, setCommunityError] = useState("");
  const [titleError, setTitleError] = useState("");
  const [contentError, setContentError] = useState("");
  const [flairError, setFlairError] = useState("");

  useEffect(() => {
    axios
      .get("http://localhost:8000/api/flairs")
      .then((res) => setLinkFlairs(res.data))
      .catch((err) => console.error("Failed to fetch flairs:", err));
  }, []);

  useEffect(() => {
    if (editMode && existingPost) {
      setSelectedCommunity(existingPost.communityID?._id || existingPost.communityID);
      setTitle(existingPost.title || "");
      setContent(existingPost.content || "");
      setSelectedFlair(existingPost.linkFlairID?._id || existingPost.linkFlairID || "");
    }
  }, [editMode, existingPost]);

  if (!loggedInUser) {
    return (
      <div style={{ backgroundColor: "red", color: "white", padding: "10px" }}>
        You must be logged in to {editMode ? "edit this" : "create a new"} post.
      </div>
    );
  }

  const validateInputs = () => {
    let valid = true;
    setCommunityError("");
    setTitleError("");
    setContentError("");
    setFlairError("");

    if (!selectedCommunity) {
      setCommunityError("Please select a community.");
      valid = false;
    }

    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setTitleError("Post title is required.");
      valid = false;
    } else if (trimmedTitle.length > 100) {
      setTitleError("Post title must be 100 characters or fewer.");
      valid = false;
    }

    const trimmedContent = content.trim();
    const { isValid, errors } = parseMarkdownLinks(trimmedContent);
    if (!trimmedContent) {
      setContentError("Post content cannot be empty.");
      valid = false;
    } else if (!isValid) {
      setContentError(errors.join(" "));
      valid = false;
    }

    if (selectedFlair && newFlair.trim()) {
      setFlairError("Please choose either an existing flair or create a new one, not both.");
      valid = false;
    }

    if (newFlair.trim().length > 30) {
      setFlairError("New flair must be 30 characters or fewer.");
      valid = false;
    }

    return valid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateInputs()) return;

    try {
      let finalFlairID = "";

      if (newFlair.trim()) {
        const flairRes = await axios.post("http://localhost:8000/api/flairs", {
          content: newFlair.trim(),
        });
        finalFlairID = flairRes.data._id;
      } else if (selectedFlair) {
        finalFlairID = selectedFlair;
      }

      const payload = {
        title: title.trim(),
        content: parseMarkdownLinks(content.trim()).parsedText,
        linkFlairID: finalFlairID || null,
        postedBy: loggedInUser.displayName,
        communityID: selectedCommunity,
      };

      if (editMode && existingPost?._id) {
        await axios.patch(`http://localhost:8000/api/posts/${existingPost._id}`, payload);
        const updated = await axios.get(`http://localhost:8000/api/posts/${existingPost._id}`);
        setPosts((prev) => prev.map((p) => (p._id === existingPost._id ? updated.data : p)));
        if (typeof onPostUpdated === "function") onPostUpdated(updated.data);
      } else {
        const postRes = await axios.post("http://localhost:8000/api/posts", {
          ...payload,
          creatorID: loggedInUser._id,
        });
        setPosts((prev) => [...prev, postRes.data]);
      }

      const updated = await axios.get("http://localhost:8000/api/communities");
      setCommunities(updated.data);
      setCurrentView("home");
    } catch (err) {
      console.error("Error submitting post:", err.message);
      setTitleError("Failed to submit post. Try again.");
    }
  };

  const joinedIDs = new Set(loggedInUser.joinedCommunityIDs?.map(String));
  const sortedCommunities = [...communities].sort((a, b) => {
    const aJoined = joinedIDs.has(a._id.toString());
    const bJoined = joinedIDs.has(b._id.toString());
    return aJoined === bJoined ? 0 : aJoined ? -1 : 1;
  });

  return (
    <div className="create-post-container">
      <h2 className="create-post-heading">{editMode ? "Edit Post" : "Create a New Post"}</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="communitySelect">Select Community (required):</label>
          <select
            id="communitySelect"
            value={selectedCommunity}
            onChange={(e) => setSelectedCommunity(e.target.value)}
          >
            <option value="">-- Select a Community --</option>
            {sortedCommunities.map((comm) => (
              <option key={comm._id} value={comm._id}>
                {comm.name}
              </option>
            ))}
          </select>
          {communityError && <div className="error-message">{communityError}</div>}
        </div>

        <div className="form-group">
          <label htmlFor="postTitleInput">Title (required, max 100 characters):</label>
          <input
            type="text"
            id="postTitleInput"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={100}
          />
          {titleError && <div className="error-message">{titleError}</div>}
        </div>

        <div className="form-group">
          <label htmlFor="postFlairSelect">Select Existing Flair (optional):</label>
          <select
            id="postFlairSelect"
            value={selectedFlair}
            onChange={(e) => setSelectedFlair(e.target.value)}
          >
            <option value="">-- No Flair --</option>
            {linkFlairs.map((flair) => (
              <option key={flair._id} value={flair._id}>
                {flair.content}
              </option>
            ))}
          </select>
          <label htmlFor="newFlairInput" style={{ marginTop: "10px", display: "block" }}>
            Or Create a New Flair (max 30 chars):
          </label>
          <input
            type="text"
            id="newFlairInput"
            value={newFlair}
            onChange={(e) => setNewFlair(e.target.value)}
            maxLength={30}
          />
          {flairError && <div className="error-message">{flairError}</div>}
        </div>

        <div className="form-group">
          <label htmlFor="postContentInput">Content (required):</label>
          <textarea
            id="postContentInput"
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
          {contentError && <div className="error-message">{contentError}</div>}
        </div>

        <button className="submit-post-btn" type="submit">
          {editMode ? "Update Post" : "Submit Post"}
        </button>
      </form>
    </div>
  );
};

export default CreatePost;
