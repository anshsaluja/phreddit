import React, { useState, useEffect } from "react";
import axios from "axios";

const UserProfile = ({
  userID,
  loggedInUser,
  setCurrentView,
  setPosts,
  setCommunities: updateGlobalCommunities,
  refreshAllComments,
  isAdminView = false,
  adminActingAs = false,
  exitActingAs = null
}) => {
  const [userData, setUserData] = useState(null);
  const [activeTab, setActiveTab] = useState(isAdminView ? "users" : "posts");
  const [communities, setCommunities] = useState([]);
  const [userPosts, setUserPosts] = useState([]);
  const [comments, setComments] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [error, setError] = useState("");
  const [pendingDelete, setPendingDelete] = useState(null);

  const reloadData = (displayName) => {
    Promise.all([
      axios.get(`http://localhost:8000/api/communities/creator/${displayName}`),
      axios.get(`http://localhost:8000/api/posts/user/${displayName}`),
      axios.get(`http://localhost:8000/api/comments/user/${displayName}`)
    ])
      .then(([comRes, postRes, comtRes]) => {
        setCommunities(comRes.data);
        setUserPosts(postRes.data);
        setComments(comtRes.data);
      })
      .catch(() => setError("Failed to refresh listings."));
  };

  useEffect(() => {
    if (isAdminView) {
      setActiveTab("users");
    } else {
      setActiveTab("posts");
    }
  }, [isAdminView]);
  

  useEffect(() => {
    if (adminActingAs && loggedInUser?.displayName) {
      reloadData(loggedInUser.displayName);
    }
  }, [loggedInUser, adminActingAs]);

  useEffect(() => {
    if (!userID) return;

    axios.get(`http://localhost:8000/api/users/${userID}`)
      .then(res => {
        setUserData(res.data);
        reloadData(res.data.displayName);
      })
      .catch(() => setError("Failed to load profile."));

    if (isAdminView) {
      axios.get("http://localhost:8000/api/users")
        .then(res => setAllUsers(res.data))
        .catch(() => setError("Failed to load all users."));
    }
  }, [userID, isAdminView]); 

  const confirmDelete = () => {
    if (!pendingDelete) return;

    const { type, id } = pendingDelete;
    const endpointMap = {
      communities: "communities",
      posts: "posts",
      comments: "comments",
      users: "users"
    };

    axios.delete(`http://localhost:8000/api/${endpointMap[type]}/${id}`)
      .then(() => {
        if (type === "communities") {
          setCommunities(prev => prev.filter(c => c._id !== id));
          updateGlobalCommunities(prev => prev.filter(c => c._id !== id));

          if (userData?.displayName) reloadData(userData.displayName);
          if (typeof refreshAllComments === "function") refreshAllComments();

          axios.get("http://localhost:8000/api/posts")
            .then(res => setPosts(res.data))
            .catch(err => console.error("Failed to refresh posts:", err));
        } else if (type === "posts") {
          setUserPosts(prev => prev.filter(p => p._id !== id));
          setPosts(prev => prev.filter(p => p._id !== id));
          setComments(prev => prev.filter(c => c.postID?.toString() !== id.toString()));

          if (typeof refreshAllComments === "function") refreshAllComments();
          if (userData?.displayName) reloadData(userData.displayName);
        } else if (type === "comments") {
          const toDelete = new Set();
          const collectNested = (targetID) => {
            toDelete.add(targetID);
            comments.forEach((c) => {
              if (c.parentID?.toString() === targetID) collectNested(c._id.toString());
            });
          };
          collectNested(id);

          setComments(prev => {
            const updated = prev.filter(c => !toDelete.has(c._id.toString()));
            return updated.map(c => ({
              ...c,
              commentIDs: (c.commentIDs || []).filter(id => !toDelete.has(id.toString()))
            }));
          });

          if (typeof refreshAllComments === "function") refreshAllComments();
          if (userData?.displayName) reloadData(userData.displayName);
        } else if (type === "users") {
          setAllUsers(prev => prev.filter(u => u._id !== id));
        
 
          axios.get("http://localhost:8000/api/communities")
            .then(res => updateGlobalCommunities(res.data))
            .catch(err => console.error("Failed to refresh communities:", err));
        
    
          axios.get("http://localhost:8000/api/posts")
            .then(res => setPosts(res.data))
            .catch(err => console.error("Failed to refresh posts after user delete:", err));
        
      
          axios.get("http://localhost:8000/api/comments")
            .then(res => {
              if (typeof refreshAllComments === "function") {
                refreshAllComments(res.data);
              } else {
                setComments(res.data);
              }
            })
            .catch(err => console.error("Failed to refresh comments after user delete:", err));
        }

        setPendingDelete(null);
      });
  };

  const renderListing = () => {
    const renderItem = (item, type, label) => (
      <div key={item._id} className="list-item">
        <button onClick={() => {
          if (type === "users") {
            setCurrentView(`profile-${item._id}`, {
              adminActingAs: true,
              targetUser: item
            });          } else {
            setCurrentView(`edit${label}-${item._id}`);
          }
        }}>
          {type === "comments"
            ? `On post: ${item.postID?.title || "Unknown"} – ${item.content.slice(0, 20)}...`
            : type === "users"
              ? `${item.displayName} (${item.email}) – Rep: ${item.reputation}`
              : item.name || item.title}
        </button>
        <button onClick={() => setPendingDelete({ type, id: item._id })}>Delete</button>
        {pendingDelete?.id === item._id && pendingDelete?.type === type && (
          <div className="delete-confirm">
            <span>Confirm delete?</span>
            <button onClick={confirmDelete}>Yes</button>
            <button onClick={() => setPendingDelete(null)}>No</button>
          </div>
        )}
      </div>
    );

    if (activeTab === "users") {
      const nonAdminUsers = allUsers.filter(u => u._id !== loggedInUser._id);
      if (!nonAdminUsers.length) return <p>No users found.</p>;
      return nonAdminUsers.map(u => renderItem(u, "users", "User"));
    }
    

    if (activeTab === "communities") {
      if (!communities.length) return <p>No communities created.</p>;
      return communities.map(c => renderItem(c, "communities", "Community"));
    }

    if (activeTab === "posts") {
      if (!userPosts.length) return <p>No posts created.</p>;
      return userPosts.map(p => renderItem(p, "posts", "Post"));
    }

    if (activeTab === "comments") {
      if (!comments.length) return <p>No comments created.</p>;
      return comments.map(c => renderItem(c, "comments", "Comment"));
    }

    return null;
  };

  if (!loggedInUser) return <div>You must be logged in to view your profile.</div>;
  if (error) return <div style={{ color: "red" }}>{error}</div>;
  if (!userData) return <div>Loading profile...</div>;

  return (
    <div className="user-profile-wrapper">
      <h1 className="user-profile-title">
        {adminActingAs ? `Acting as ${userData.displayName}` : "User Page"}
      </h1>

      <div className="user-card">
        <h1 className="user-display">{userData.displayName}</h1>
        <p><strong>Email:</strong> {userData.email}</p>
        <p><strong>Member since:</strong> {new Date(userData.createdAt).toLocaleString()}</p>
        <p><strong>Reputation:</strong> {userData.reputation}</p>
        {adminActingAs && (
          <button onClick={exitActingAs}>Back to My Profile</button>
        )}
      </div>

      <div className="user-tabs">
        {isAdminView && (
          <button className={activeTab === "users" ? "active-tab" : ""} onClick={() => setActiveTab("users")}>Users</button>
        )}
        <button className={activeTab === "communities" ? "active-tab" : ""} onClick={() => setActiveTab("communities")}>Communities</button>
        <button className={activeTab === "posts" ? "active-tab" : ""} onClick={() => setActiveTab("posts")}>Posts</button>
        <button className={activeTab === "comments" ? "active-tab" : ""} onClick={() => setActiveTab("comments")}>Comments</button>
      </div>

      <div className="user-listings">
        {renderListing()}
      </div>
    </div>
  );
};

export default UserProfile;
