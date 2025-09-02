import React, { useState, useEffect } from "react";
import axios from "axios";
import { parseMarkdownLinks } from "../utils/parseMarkdownLinks";
import "../stylesheets/App.css";

const NewComment = ({
  parentID,
  posts = [],
  comments = [],
  setComments,
  setPosts,
  setCurrentView,
  loggedInUser,
  editMode = false,
  existingComment = null,
}) => {
  const [content, setContent] = useState("");
  const [contentError, setContentError] = useState("");

  useEffect(() => {
    if (editMode && existingComment) {
      setContent(existingComment.content || "");
    }
  }, [editMode, existingComment]);

  if (!loggedInUser?.displayName) {
    return (
      <div style={{ backgroundColor: "red", color: "white", padding: "10px" }}>
        Your user session is incomplete. Please log in again.
      </div>
    );
  }

  const validateInputs = () => {
    let valid = true;
    setContentError("");

    if (!content.trim()) {
      setContentError("Comment content is required.");
      valid = false;
    } else if (content.trim().length > 500) {
      setContentError("Comment content must be 500 characters or fewer.");
      valid = false;
    } else {
      const { isValid, errors } = parseMarkdownLinks(content.trim());
      if (!isValid) {
        setContentError(errors.join(" "));
        valid = false;
      }
    }

    return valid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateInputs()) return;

    try {
      const parsedContent = parseMarkdownLinks(content.trim()).parsedText;

      if (editMode && existingComment?._id) {
        await axios.patch(`http://localhost:8000/api/comments/${existingComment._id}`, {
          content: parsedContent,
        });

        setComments((prev) =>
          prev.map((c) =>
            c._id === existingComment._id ? { ...c, content: parsedContent } : c
          )
        );
        setCurrentView(`post-${existingComment.postID}`);
        return;
      }

      const isReplyToPost = posts.some((p) => p._id === parentID);
      const res = await axios.post("http://localhost:8000/api/comments", {
        content: parsedContent,
        commentedBy: loggedInUser.displayName,
        parentType: isReplyToPost ? "post" : "comment",
        parentID,
      });

      const newComment = res.data;
      setComments((prev) => [...prev, newComment]);

      if (isReplyToPost) {
        setPosts((prev) =>
          prev.map((p) =>
            p._id === parentID
              ? { ...p, commentIDs: [...(p.commentIDs || []), newComment._id] }
              : p
          )
        );
      } else {
        setComments((prev) =>
          prev.map((c) =>
            c._id === parentID
              ? { ...c, commentIDs: [...(c.commentIDs || []), newComment._id] }
              : c
          )
        );
      }

      const [updatedCommentsRes, updatedPostsRes] = await Promise.all([
        axios.get("http://localhost:8000/api/comments"),
        axios.get("http://localhost:8000/api/posts"),
      ]);

      setComments(updatedCommentsRes.data);
      setPosts(updatedPostsRes.data);

      const postID =
        newComment.postID ||
        updatedCommentsRes.data.find((c) => c._id === parentID)?.postID ||
        updatedPostsRes.data.find((p) =>
          p.commentIDs?.some((cid) => cid.toString() === parentID.toString())
        )?._id ||
        "";

      if (postID) {
        setCurrentView("home");
        setTimeout(() => setCurrentView(`post-${postID}`), 0);
      } else {
        alert("Comment posted, but unable to locate the original post.");
      }
    } catch (err) {
      setContentError("Failed to submit comment. Try again.");
    }
  };

  return (
    <div className="new-comment-container">
      <h2 className="new-comment-heading">
        {editMode ? "Edit Comment" : "Add a Comment"}
      </h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="commentContentInput">
            Comment Content (required, max 500 chars):
          </label>
          <textarea
            id="commentContentInput"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            maxLength={500}
          />
          {contentError && <div className="error-message">{contentError}</div>}
        </div>
        <button className="submit-comment-btn" type="submit">
          {editMode ? "Update Comment" : "Submit Comment"}
        </button>
      </form>
    </div>
  );
};

export default NewComment;
