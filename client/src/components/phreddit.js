import React, { useState, useEffect } from "react";
import axios from "axios";

import Header from "./Header";
import Sidebar from "./Sidebar";
import Home from "./Home";
import Community from "./Community";
import CreatePost from "./CreatePost";
import SearchResults from "./SearchResults";
import PostPage from "./PostPage";
import CreateCommunity from "./CreateCommunity";
import NewComment from "./NewComment";
import LoginForm from "./LoginForm";
import RegisterForm from "./RegisterForm";
import WelcomePage from "./WelcomePage";
import UserProfile from "./UserProfile";

import "../stylesheets/App.css";

export default function Phreddit() {
  const [communities, setCommunities] = useState([]);
  const [posts, setPosts] = useState([]);
  const [comments, setComments] = useState([]);
  const [currentView, setCurrentView] = useState("welcome");
  const [searchQuery, setSearchQuery] = useState("");
  const [adminActingAs, setAdminActingAs] = useState(false);
  const [adminOriginalUser, setAdminOriginalUser] = useState(null);
  const [homeRefreshKey, setHomeRefreshKey] = useState(Date.now());



  const [loggedInUser, setLoggedInUser] = useState(() => {
    const saved = localStorage.getItem("loggedInUser");
    return saved ? JSON.parse(saved) : null;
  });

  const updateCurrentView = (view, options = {}) => {
    if (options.adminActingAs && options.targetUser) {
      setAdminOriginalUser(loggedInUser);           
      persistUser(options.targetUser);             
      setAdminActingAs(true);
    }

    setCurrentView(view);
  };

  useEffect(() => {
    (async () => {
      const [{ data: comms }, { data: allPosts }, { data: allComments }] =
        await Promise.all([
          axios.get("http://localhost:8000/api/communities"),
          axios.get("http://localhost:8000/api/posts"),
          axios.get("http://localhost:8000/api/comments"),
        ]);

      setCommunities(comms);
      setPosts(allPosts);
      setComments(allComments);
    })().catch((err) => console.error("Initial fetch failed →", err));
  }, []);

  useEffect(() => {
    if (currentView.startsWith("community-")) {
      axios
        .get("http://localhost:8000/api/posts")
        .then(res => setPosts(res.data))
        .catch(err => console.error("Failed to refresh posts on community view:", err));
    }
  }, [currentView]);

  useEffect(() => {
    if (!loggedInUser || !communities.length) return;

    if (!loggedInUser.joinedCommunityIDs) {
      const joined = communities
        .filter((c) => c.members?.includes(loggedInUser.displayName))
        .map((c) => c._id.toString());

      const patched = { ...loggedInUser, joinedCommunityIDs: joined };
      setLoggedInUser(patched);
      localStorage.setItem("loggedInUser", JSON.stringify(patched));
    }
  }, [loggedInUser, communities]);

  const persistUser = (user) => {
    setLoggedInUser(user);
    localStorage.setItem("loggedInUser", JSON.stringify(user));
  };

  const handleLogout = async () => {
    try {
      await axios.post("/api/users/logout");
    } catch (_) { }
    setLoggedInUser(null);
    localStorage.removeItem("loggedInUser");
    setCurrentView("welcome");
  };

  const updateLocalMembership = (communityID, join) => {
    setLoggedInUser((prev) => {
      if (!prev) return prev;
      const set = new Set(prev.joinedCommunityIDs ?? []);
      join ? set.add(String(communityID)) : set.delete(String(communityID));
      const next = { ...prev, joinedCommunityIDs: [...set] };
      localStorage.setItem("loggedInUser", JSON.stringify(next));
      return next;
    });
  };

  const handleJoinCommunity = async (communityID) => {
    if (!loggedInUser?.displayName) return alert("Missing display name.");

    try {
      const { data: updated } = await axios.patch(
        `http://localhost:8000/api/communities/${communityID}/join`,
        { displayName: loggedInUser.displayName }
      );

      setCommunities((prev) =>
        prev.map((c) => (c._id === communityID ? updated : c))
      );
      updateLocalMembership(communityID, true);
    } catch (err) {
      alert("Failed to join community.");
    }
  };

  const handleLeaveCommunity = async (communityID) => {
    if (!loggedInUser?.displayName) return alert("Missing display name.");

    try {
      const { data: updated } = await axios.patch(
        `http://localhost:8000/api/communities/${communityID}/leave`,
        { displayName: loggedInUser.displayName }
      );

      setCommunities((prev) =>
        prev.map((c) => (c._id === communityID ? updated : c))
      );
      updateLocalMembership(communityID, false);
    } catch (err) {
      alert("Failed to leave community.");
    }
  };

  const refreshSinglePost = async (postID) => {
    try {
      const { data: updated } = await axios.get(`http://localhost:8000/api/posts/${postID}`);
      setPosts((prev) =>
        prev.map((p) => (p._id === postID ? updated : p))
      );
    } catch (err) {
      console.error("Failed to refresh edited post:", err);
    }
  };

  const refreshAllComments = () => {
    axios.get("http://localhost:8000/api/comments")
      .then(res => setComments(res.data))
      .catch(err => console.error("Failed to refresh comments:", err));
  };

  const selectedCommunity =
    currentView.startsWith("community-")
      ? communities.find((c) => `community-${c._id}` === currentView)
      : null;

  const isAuthPage = ["welcome", "login", "register"].includes(currentView);

  return (
    <div>
      {isAuthPage ? (
        <div className="posts-container">
          {currentView === "welcome" && (
            <WelcomePage setCurrentView={setCurrentView} setLoggedInUser={persistUser} />
          )}
          {currentView === "login" && (
            <LoginForm
              setLoggedInUser={(user) => {
                persistUser(user);
                setCurrentView("home");
              }}
              setCurrentView={setCurrentView}
            />
          )}
          {currentView === "register" && (
            <RegisterForm
              setLoggedInUser={(user) => {
                persistUser(user);
                setCurrentView("home");
              }}
              setCurrentView={setCurrentView}
            />
          )}
        </div>
      ) : (
        <>
          <Header
            setCurrentView={updateCurrentView}
            setSearchQuery={setSearchQuery}
            currentView={currentView}
            loggedInUser={loggedInUser}
            setLoggedInUser={persistUser}
            onLogout={handleLogout}
            setHomeRefreshKey={setHomeRefreshKey}
          />

          <div className="horizontal-delimiter" />

          <div
            id="main"
            className={currentView === "searchResults" ? "search-active" : "main-page"}
          >
            <Sidebar
              setCurrentView={updateCurrentView}
              setSearchQuery={setSearchQuery}
              currentView={currentView}
              communities={communities}
              loggedInUser={loggedInUser}
            />

            <div className="posts-container">
              {currentView.startsWith("post-") && (
                <PostPage
                  postID={currentView.split("-")[1]}
                  posts={posts}
                  setPosts={setPosts}
                  communities={communities}
                  comments={comments}
                  setCurrentView={updateCurrentView}
                  setComments={setComments}
                  loggedInUser={loggedInUser}
                />
              )}

              {currentView.startsWith("newComment-") && loggedInUser && (
                <div className="form-wrapper">
                  <NewComment
                    parentID={currentView.split("-")[1]}
                    comments={comments}
                    posts={posts}
                    setComments={setComments}
                    setPosts={setPosts}
                    setCurrentView={updateCurrentView}
                    loggedInUser={adminActingAs ? adminOriginalUser : loggedInUser}
                  />
                </div>
              )}

              {currentView === "searchResults" && (
                <SearchResults
                  searchQuery={searchQuery}
                  posts={posts}
                  comments={comments}
                  setCurrentView={updateCurrentView}
                  loggedInUser={loggedInUser}
                />
              )}

              {currentView === "home" && (
                <Home
                  posts={posts}
                  setPosts={setPosts}
                  comments={comments}
                  communities={communities}
                  setCurrentView={updateCurrentView}
                  joinedCommunityIDs={loggedInUser?.joinedCommunityIDs ?? []}
                  homeRefreshKey={homeRefreshKey}              
                  setHomeRefreshKey={setHomeRefreshKey}  
                />
              )}

              {currentView === "createPost" && loggedInUser && (
                <CreatePost
                  communities={communities}
                  setPosts={setPosts}
                  setCommunities={setCommunities}
                  setCurrentView={updateCurrentView}
                  loggedInUser={loggedInUser}
                />
              )}

              {currentView === "createCommunity" && loggedInUser && (
                <CreateCommunity
                  setLoggedInUser={persistUser}
                  setCommunities={setCommunities}
                  setCurrentView={updateCurrentView}
                  loggedInUser={loggedInUser}
                />
              )}

              {selectedCommunity && (
                <Community
                  community={selectedCommunity}
                  posts={posts}
                  comments={comments}
                  setCurrentView={updateCurrentView}
                  loggedInUser={loggedInUser}
                  handleJoinCommunity={handleJoinCommunity}
                  handleLeaveCommunity={handleLeaveCommunity}
                />
              )}

              {currentView.startsWith("profile-") && (
                <UserProfile
                  userID={currentView.split("-")[1]}
                  loggedInUser={loggedInUser}
                  setCurrentView={updateCurrentView}
                  setPosts={setPosts}
                  setCommunities={setCommunities}
                  comments={comments}
                  setComments={setComments}
                  refreshAllComments={refreshAllComments}
                  isAdminView={loggedInUser?.isAdmin === true && !adminActingAs}
                  adminActingAs={adminActingAs}
                  exitActingAs={() => {
                    persistUser(adminOriginalUser); 
                    setAdminActingAs(false);
                    setCurrentView(`profile-${adminOriginalUser._id}`);
                  }}
                />

              )}
            </div>

            {currentView.startsWith("editPost-") && loggedInUser && (
              <div className="form-wrapper">
                <CreatePost
                  editMode={true}
                  existingPost={posts.find(p => p._id === currentView.split("-")[1])}
                  communities={communities}
                  setPosts={setPosts}
                  setCommunities={setCommunities}
                  setCurrentView={updateCurrentView}
                  loggedInUser={loggedInUser}
                  onPostUpdated={refreshSinglePost}
                />
              </div>
            )}

            {currentView.startsWith("editCommunity-") && loggedInUser && (
              <div className="form-wrapper">
                <CreateCommunity
                  editMode={true}
                  existingCommunity={communities.find(c => c._id === currentView.split("-")[1])}
                  setCommunities={setCommunities}
                  setCurrentView={updateCurrentView}
                  loggedInUser={loggedInUser}
                />
              </div>
            )}

            {currentView.startsWith("editComment-") && loggedInUser && (
              <div className="form-wrapper">
                <NewComment
                  editMode={true}
                  existingComment={comments.find(c => c._id === currentView.split("-")[1])}
                  setComments={setComments}
                  setPosts={setPosts}
                  setCurrentView={updateCurrentView}
                  loggedInUser={loggedInUser}
                />
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
