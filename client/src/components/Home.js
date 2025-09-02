import React, { useState, useMemo, useEffect } from "react";
import axios from "axios";
import Post from "./Post";
import "../stylesheets/App.css";

export default function Home({
  posts = [],
  setPosts,
  communities = [],
  comments = [],
  setCurrentView,
  joinedCommunityIDs = [],
  homeRefreshKey, 
  setHomeRefreshKey 
}) {
  const [sortOrder, setSortOrder] = useState("newest");

  useEffect(() => {
    axios
      .get("http://localhost:8000/api/posts")
      .then((res) => setPosts(res.data))
      .catch((err) => console.error("Failed to fetch posts:", err));
  }, [setPosts, homeRefreshKey]); 
  

  const joinedSet = useMemo(
    () => new Set(joinedCommunityIDs.map(String)),
    [joinedCommunityIDs]
  );

  const postIsJoined = useMemo(() => {
    const map = new Map();

    posts.forEach((p) => {
      if (p.communityID) {
        const joined = joinedSet.has(p.communityID?._id?.toString());
        map.set(p._id.toString(), joined);
      }
    });

    communities.forEach((comm) => {
      const isJoined = joinedSet.has(comm._id?.toString());
      comm.postIDs?.forEach((pid) => {
        const key = pid.toString();
        if (!map.has(key)) {
          map.set(key, isJoined);
        }
      });
    });

    return map;
  }, [posts, communities, joinedSet]);

  const activityCache = useMemo(() => {
    const m = new Map();
    comments.forEach((c) => {
      const id = c.postID?.toString();
      const t = new Date(c.commentedDate).getTime();
      if (!m.has(id) || t > m.get(id)) m.set(id, t);
    });
    return m;
  }, [comments]);

  const { joinedPosts, otherPosts } = useMemo(() => {
    const sortPosts = (arr) =>
      [...arr].sort((a, b) => {
        switch (sortOrder) {
          case "oldest":
            return new Date(a.postedDate) - new Date(b.postedDate);
          case "active": {
            const ta =
              activityCache.get(a._id?.toString()) ?? new Date(a.postedDate).getTime();
            const tb =
              activityCache.get(b._id?.toString()) ?? new Date(b.postedDate).getTime();
            return tb - ta;
          }
          default:
            return new Date(b.postedDate) - new Date(a.postedDate);
        }
      });

    if (postIsJoined.size === 0) {
      return { joinedPosts: sortPosts(posts), otherPosts: [] };
    }

    const joined = [];
    const others = [];

    posts.forEach((p) =>
      postIsJoined.get(p._id.toString()) ? joined.push(p) : others.push(p)
    );

    return { joinedPosts: sortPosts(joined), otherPosts: sortPosts(others) };
  }, [posts, postIsJoined, sortOrder, activityCache]);

  const combined = [...joinedPosts, ...otherPosts];

  const handlePostClick = (id) => {
    setCurrentView(`post-${id}`);
  };

  const btn = (k) => `sort-button ${sortOrder === k ? "active-sort" : ""}`;

  return (
    <div className="home-container">
      <div className="home-header">
        <h2 className="all-posts-header">All Posts</h2>
        <div className="sort-buttons">
          {["newest", "oldest", "active"].map((k) => (
            <button key={k} className={btn(k)} onClick={() => setSortOrder(k)}>
              {k[0].toUpperCase() + k.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <p className="posts-count">{combined.length} posts</p>
      <hr className="header-divider" />

      <div className="post-list">
        {combined.map((p, i) => {
          const isLastJoined = i === joinedPosts.length - 1 && joinedPosts.length > 0;

          return (
            <React.Fragment key={p._id}>
              {joinedPosts.length > 0 &&
                otherPosts.length > 0 &&
                i === joinedPosts.length && (
                  <div className="joined-other-separator">
                    <hr className="separator-line" />
                    <h4 className="separator-label">Posts from other communities</h4>
                    <hr className="separator-line" />
                  </div>
                )}

              <Post
                key={p._id}
                post={p}
                communities={communities}
                comments={comments}
                isLastJoined={isLastJoined}
                onPostClick={(id) => {
                  const idStr = typeof id === "object" ? id.toString() : String(id);
                  handlePostClick(idStr);
                }}
              />
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
