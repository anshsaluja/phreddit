import React, { useState } from "react";
import Post from "./Post";
import { formatTimestamp } from "../utils/formatTimestamp";
import "../stylesheets/App.css";

const Community = ({
  community,
  posts,
  comments,
  setCurrentView,
  loggedInUser,
  handleJoinCommunity,
  handleLeaveCommunity,
}) => {
  
  const [sortOrder, setSortOrder] = useState("newest");

  if (!community) return <h1>Community Not Found</h1>;

  const communityPosts = posts.filter((post) =>
    community.postIDs.some((id) => id.toString() === post._id.toString())
  );

  const sortedPosts = [...communityPosts].sort((a, b) => {
    if (sortOrder === "active") {
      const getLatestCommentTime = (post) => {
        const times = comments
          .filter((c) => c.postID?.toString() === post._id?.toString())
          .map((c) => new Date(c.commentedDate).getTime());

        return times.length > 0 ? Math.max(...times) : null;
      };

      const aTime = getLatestCommentTime(a);
      const bTime = getLatestCommentTime(b);

      if (aTime !== null && bTime !== null) return bTime - aTime;
      if (aTime !== null) return -1;
      if (bTime !== null) return 1;
      return new Date(b.postedDate) - new Date(a.postedDate);
    }

    if (sortOrder === "newest") {
      return new Date(b.postedDate) - new Date(a.postedDate);
    }

    if (sortOrder === "oldest") {
      return new Date(a.postedDate) - new Date(b.postedDate);
    }

    return 0;
  });

  const handlePostClick = (postID) => {
    setCurrentView("post-" + postID);
  };

  const isMember = loggedInUser?.joinedCommunityIDs?.includes(community._id);

  return (
    <div className="community-container">
      <h2 className="community-name">{community.name}</h2>

      <p
        className="community-description"
        dangerouslySetInnerHTML={{ __html: community.description }}
      />

      <p className="community-timestamp">
        Created {formatTimestamp(community.startDate)} by{" "}
        <strong>{community.createdBy || "unknown"}</strong>
      </p>

      {loggedInUser && !loggedInUser.isAdmin && (
        <div className="join-leave-buttons">
          {isMember ? (
            <button onClick={() => handleLeaveCommunity(community._id)}>
              Leave Community
            </button>
          ) : (
            <button onClick={() => handleJoinCommunity(community._id)}>
              Join Community
            </button>
          )}
        </div>
      )}

      <div className="community-stats">
        <p>
          <strong>Posts:</strong> {communityPosts.length}
        </p>
        <p>
          <strong>Members:</strong> {community.members?.length || 0}
        </p>
      </div>

      <div className="sort-buttons">
        <button
          className={sortOrder === "newest" ? "active-sort" : ""}
          onClick={() => setSortOrder("newest")}
        >
          Newest
        </button>
        <button
          className={sortOrder === "oldest" ? "active-sort" : ""}
          onClick={() => setSortOrder("oldest")}
        >
          Oldest
        </button>
        <button
          className={sortOrder === "active" ? "active-sort" : ""}
          onClick={() => setSortOrder("active")}
        >
          Active
        </button>
      </div>

      <hr className="community-divider" />

      {sortedPosts.length > 0 ? (
        sortedPosts.map((post) => (
          <Post
            key={post._id}
            post={post}
            comments={comments} 
            communities={[community]}
            hideCommunityName
            onPostClick={() => handlePostClick(post._id)}
          />
        ))
      ) : (
        <p className="no-posts">No posts yet.</p>
      )}
    </div>
  );
};

export default Community;
