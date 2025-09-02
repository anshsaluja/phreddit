import React, { useState } from "react";
import Post from "./Post";
import "../stylesheets/App.css";

function commentContainsTerm(comment, searchTerms, allComments) {
  const content = (comment.content || "").toLowerCase();
  if (searchTerms.some(term => content.includes(term))) return true;

  if (comment.commentIDs && comment.commentIDs.length > 0) {
    const childComments = comment.commentIDs
      .map(ref => (typeof ref === "object" ? ref : allComments.find(c =>
        c.commentID === ref || c._id?.toString() === ref?.toString())))
      .filter(Boolean);

    return childComments.some(child => commentContainsTerm(child, searchTerms, allComments));
  }

  return false;
}

const SearchResults = ({ searchQuery, posts, comments, setCurrentView, loggedInUser = null }) => {
  const [sortOrder, setSortOrder] = useState("newest");

  if (!searchQuery.trim()) {
    return (
      <div className="search-results-container">
        <h2 className="search-results-header">No Results Found</h2>
        <p className="search-results-count"><strong>0 Posts</strong></p>
        <hr className="header-divider" />
      </div>
    );
  }

  const searchTerms = searchQuery.toLowerCase().split(/\s+/);

  const matchingPosts = posts.filter(post => {
    const title = (post.title || "").toLowerCase();
    const content = (post.content || "").toLowerCase();
    const titleMatch = searchTerms.some(term => title.includes(term));
    const contentMatch = searchTerms.some(term => content.includes(term));
    if (titleMatch || contentMatch) return true;

    const topLevelComments = (post.commentIDs || []).map(ref =>
      typeof ref === "object" ? ref : comments.find(c =>
        c.commentID === ref || c._id?.toString() === ref?.toString())
    ).filter(Boolean);

    return topLevelComments.some(comment =>
      commentContainsTerm(comment, searchTerms, comments));
  });

  const getActivityTime = (post) => {
    const times = comments
      .filter(c => c.postID?.toString() === post._id?.toString())
      .map(c => new Date(c.commentedDate).getTime());
    return times.length > 0 ? Math.max(...times) : new Date(post.postedDate).getTime();
  };

  let inJoined = [], inOthers = [];

  if (loggedInUser?.joinedCommunityIDs?.length > 0) {
    const joinedSet = new Set(loggedInUser.joinedCommunityIDs.map(String));
    for (const post of matchingPosts) {
      (joinedSet.has(post.communityID?._id?.toString()) ? inJoined : inOthers).push(post);
    }
  } else {
    inOthers = matchingPosts; 
  }



  const sortFns = {
    newest: (a, b) => new Date(b.postedDate) - new Date(a.postedDate),
    oldest: (a, b) => new Date(a.postedDate) - new Date(b.postedDate),
    active: (a, b) => getActivityTime(b) - getActivityTime(a),
  };

  const sorter = sortFns[sortOrder];
  inJoined.sort(sorter);
  inOthers.sort(sorter);
  const combined = [...inJoined, ...inOthers];


  return (
    <div className="search-results-container">
      <h2 className="search-results-header">
        {combined.length > 0
          ? `Results for: "${searchQuery}"`
          : `No Results Found for: "${searchQuery}"`}
      </h2>

      <p className="search-results-count">
        <strong>{combined.length} {combined.length === 1 ? "Post" : "Posts"}</strong>
      </p>
      <hr className="header-divider" />

      {combined.length > 0 && (
        <div className="sort-buttons">
          <button onClick={() => setSortOrder("newest")} className={sortOrder === "newest" ? "active-sort" : ""}>Newest</button>
          <button onClick={() => setSortOrder("oldest")} className={sortOrder === "oldest" ? "active-sort" : ""}>Oldest</button>
          <button onClick={() => setSortOrder("active")} className={sortOrder === "active" ? "active-sort" : ""}>Active</button>
        </div>
      )}

      <div className="post-list">
        {combined.map((post, index) => (
          <React.Fragment key={post._id?.toString() || post.postID}>
            {loggedInUser?.joinedCommunityIDs?.length > 0 &&
              index === inJoined.length &&
              inOthers.length > 0 && (
                <div className="joined-other-separator">
                  <hr className="separator-line" />
                  <h4 className="separator-label">Posts from other communities</h4>
                  <hr className="separator-line" />
                </div>
              )}
            <Post
              post={post}
              hideCommunityName
              communities={[]} 
              onPostClick={() => setCurrentView("post-" + post._id)}
            />
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

export default SearchResults;
