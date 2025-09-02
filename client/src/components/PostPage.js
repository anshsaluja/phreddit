import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { formatTimestamp } from "../utils/formatTimestamp";
import "../stylesheets/App.css";

const PostPage = ({
  postID,
  posts,
  setPosts,
  communities,
  comments = [],
  setComments,
  setCurrentView,
  loggedInUser = null,
}) => {
  const isGuest = !loggedInUser;
  const actualID =
    typeof postID === "string" && postID.startsWith("post-")
      ? postID.substring(5)
      : postID;

  const [post, setPost] = useState(null);
  const [views, setViews] = useState(0);
  const hasPatched = useRef(false);

  useEffect(() => {
    if (!actualID) return;

    axios
      .get(`http://localhost:8000/api/posts/${actualID}`)
      .then((res) => {
        setPost(res.data);
        setViews(res.data.views ?? 0);
      })
      .catch((err) => {
        console.error("Failed to fetch post:", err);
      });
  }, [actualID]);

  useEffect(() => {
    if (!actualID || hasPatched.current) return;
    hasPatched.current = true;

    axios
      .patch(`http://localhost:8000/api/posts/${actualID}/view`)
      .then((res) => {
        setViews(res.data.views);
        setPosts((prev) =>
          prev.map((p) =>
            p._id === actualID ? { ...p, views: res.data.views } : p
          )
        );
      })
      .catch(() => {});
  }, [actualID, setPosts]);

  if (!post) {
    return (
      <div className="error-message">
        <p>Post not found or failed to load.</p>
        <button onClick={() => setCurrentView("welcome")}>← Back to Welcome</button>
      </div>
    );
  }

  const community = communities.find((c) =>
    c.postIDs.some((id) => id.toString() === post._id.toString())
  );
  const commentCount = post.commentIDs?.length || 0;

  const handleVote = async (type) => {
    if (!loggedInUser || loggedInUser.reputation < 50) {
      alert("You must be logged in with 50+ reputation to vote.");
      return;
    }
    if (post.votedBy?.includes(loggedInUser.displayName)) {
      alert("You already voted on this post.");
      return;
    }

    try {
      await axios.patch(`http://localhost:8000/api/posts/${post._id}/vote`, {
        voteType: type,
        voterDisplayName: loggedInUser.displayName,
      });

      const { data: refreshed } = await axios.get(
        `http://localhost:8000/api/posts/${post._id}`
      );
      setPost(refreshed);
      setPosts((prev) =>
        prev.map((p) => (p._id === post._id ? refreshed : p))
      );
    } catch (err) {
      alert(err?.response?.data?.message || "Vote failed.");
    }
  };

  return (
    <div className="post-page">
      <div className="post-page-header">
        <span className="post-community-name">
          {community ? community.name : "Unknown Community"}
        </span>
        <span className="post-separator">|</span>
        <span className="post-timestamp">{formatTimestamp(post.postedDate)}</span>
      </div>

      <div className="post-user">Posted by: {post.postedBy}</div>
      <h1 className="post-title">{post.title}</h1>

      {post.linkFlairID && (
        <div className="post-flair">
          {typeof post.linkFlairID === "object"
            ? post.linkFlairID.content
            : post.linkFlairID}
        </div>
      )}

      <p
        className="post-content"
        dangerouslySetInnerHTML={{ __html: post.content }}
      />

      <div className="post-footer">
        <div className="vote-section">
          <button
            className={`vote-button upvote ${
              isGuest ||
              post.votedBy?.includes(loggedInUser?.displayName) ||
              loggedInUser?.reputation < 50
                ? "disabled"
                : ""
            }`}
            onClick={() => handleVote("up")}
            disabled={
              isGuest ||
              post.votedBy?.includes(loggedInUser?.displayName) ||
              loggedInUser?.reputation < 50
            }
          >
            ↑
          </button>

          <button
            className={`vote-button downvote ${
              isGuest ||
              post.votedBy?.includes(loggedInUser?.displayName) ||
              loggedInUser?.reputation < 50
                ? "disabled"
                : ""
            }`}
            onClick={() => handleVote("down")}
            disabled={
              isGuest ||
              post.votedBy?.includes(loggedInUser?.displayName) ||
              loggedInUser?.reputation < 50
            }
          >
            ↓
          </button>
        </div>

        <span className="post-votes">Votes: {post.voteCount ?? 0}</span>
        <span className="post-views">Views: {views}</span>
        <span className="post-comments">Comments: {commentCount}</span>
      </div>

      <button
        className={`add-comment-button ${isGuest ? "disabled" : ""}`}
        onClick={!isGuest ? () => setCurrentView(`newComment-${post._id}`) : undefined}
        disabled={isGuest}
      >
        Add a comment
      </button>

      <hr className="post-comments-delimiter" />

      <div className="comments-section">
        {renderComments(
          post.commentIDs,
          comments,
          setCurrentView,
          loggedInUser,
          isGuest,
          0,
          setComments
        )}
      </div>
    </div>
  );
};

const renderComments = (
  commentIDs,
  allComments,
  setCurrentView,
  loggedInUser,
  isGuest,
  depth = 0,
  setComments
) => {
  if (!commentIDs || commentIDs.length === 0) return null;

  const normalizeID = (id) =>
    typeof id === "object" && id !== null && "_id" in id
      ? id._id.toString()
      : id.toString();

  const normalizedCommentIDs = commentIDs.map(normalizeID);

  const handleVote = async (commentID, type) => {
    if (!loggedInUser || loggedInUser.reputation < 50) {
      alert("You must be logged in with 50+ reputation to vote.");
      return;
    }

    try {
      const { data } = await axios.patch(
        `http://localhost:8000/api/comments/${commentID}/vote`,
        {
          voteType: type,
          voterDisplayName: loggedInUser.displayName,
        }
      );

      if (typeof setComments === "function") {
        setComments((prev) =>
          prev.map((c) =>
            c._id.toString() === commentID
              ? {
                  ...c,
                  voteCount: data.voteCount,
                  votedBy: [...(c.votedBy || []), loggedInUser.displayName],
                }
              : c
          )
        );
      }
    } catch (err) {
      alert(err?.response?.data?.message || "Vote failed.");
    }
  };

  

  return normalizedCommentIDs.map((cid) => {
    const comment = allComments.find(
      (c) => c._id?.toString() === cid || c.commentID?.toString() === cid
      
    );
    if (!comment || !comment.content?.trim()) return null;

    const hasVoted = comment.votedBy?.includes(loggedInUser?.displayName);
    const votingDisabled = isGuest || (loggedInUser?.reputation ?? 0) < 50 || hasVoted;

    return (
      <div
        key={comment._id || comment.commentID}
        className="comment"
        style={{ marginLeft: `${depth * 20}px` }}
      >
        <div className="comment-header">
          <span className="comment-user">{comment.commentedBy}</span>
          <span className="comment-separator">|</span>
          <span className="comment-timestamp">{formatTimestamp(comment.commentedDate)}</span>
          <span className="comment-separator">|</span>
          <span className="comment-votes">Votes: {comment.voteCount ?? 0}</span>
        </div>

        <p className="comment-content" dangerouslySetInnerHTML={{ __html: comment.content }} />

        <div className="comment-actions">
          <button
            className={`vote-button upvote ${votingDisabled ? "disabled" : ""}`}
            onClick={() => handleVote(comment._id, "up")}
            disabled={votingDisabled}
          >
            ↑
          </button>
          <button
            className={`vote-button downvote ${votingDisabled ? "disabled" : ""}`}
            onClick={() => handleVote(comment._id, "down")}
            disabled={votingDisabled}
          >
            ↓
          </button>
          <button
            className={`reply-button ${isGuest ? "disabled" : ""}`}
            onClick={!isGuest ? () => setCurrentView(`newComment-${comment._id}`) : undefined}
            disabled={isGuest}
          >
            Reply
          </button>
        
        </div>

        <div className="nested-comments">
          {renderComments(
            comment.commentIDs,
            allComments,
            setCurrentView,
            loggedInUser,
            isGuest,
            depth + 1,
            setComments
          )}
        </div>
      </div>
    );
  });
};

export default PostPage;
