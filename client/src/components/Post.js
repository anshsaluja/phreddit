import React from "react";
import { parseMarkdownLinks } from "../utils/parseMarkdownLinks";
import { formatTimestamp } from "../utils/formatTimestamp";

function Post({
  post,
  communities = [],
  onPostClick,
  hideCommunityName = false,
  isLastJoined = false, 
}) {
  const community = !hideCommunityName
    ? communities.find((c) => c.postIDs?.some((id) => id.toString() === post._id.toString()))
    : null;

  const communityName = community?.name ?? "UnknownCommunity";

  const handleClick = () => {
    if (onPostClick) onPostClick(post._id);
  };

  const displayedTimestamp =
    formatTimestamp?.(post.postedDate) || new Date(post.postedDate).toLocaleString();

  const content = post.content ?? "";
  const snippetRaw = content.length > 80 ? content.slice(0, 80) + "..." : content;
  const snippet = parseMarkdownLinks(snippetRaw).parsedText;

  return (
    <div className={`post ${isLastJoined ? "no-border" : ""}`} onClick={handleClick}>
      <div className="post-top">
        {!hideCommunityName && (
          <>
            <span className="post-community">{communityName}</span>
            <span className="post-separator">|</span>
          </>
        )}
        <span className="post-author">{post.postedBy}</span>
        <span className="post-separator">|</span>
        <span className="post-timestamp">{displayedTimestamp}</span>
      </div>

      <div className="post-title">{post.title}</div>

      {post.linkFlairID && (
        <div className="post-flair">
          {typeof post.linkFlairID === "object"
            ? post.linkFlairID.content
            : post.linkFlairID}
        </div>
      )}

      <div
        className="post-snippet"
        dangerouslySetInnerHTML={{ __html: snippet }}
      />

      <div className="post-stats">
        <span className="vote-count">Votes: {post.voteCount ?? 0}</span>
        <span className="comment-count">Comments: {post.commentIDs?.length ?? 0}</span>
        <span className="view-count">Views: {post.views ?? 0}</span>
      </div>
    </div>
  );
}

export default Post;
