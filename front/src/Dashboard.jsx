import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { API_BASE, assetUrl } from "./api.js";
import { safeJsonParse } from "./utils.js";
import "./dashboard.css";

function persistUser(next) {
  localStorage.setItem("user", JSON.stringify(next));
}

export default function Dashboard() {
  const navigate = useNavigate();
  const feedTopRef = useRef(null);
  const [userProfile, setUserProfile] = useState(() =>
    safeJsonParse(localStorage.getItem("user"), null)
  );
  const [avatarKey, setAvatarKey] = useState(0);
  const [toast, setToast] = useState(null);

  const [avatar, setAvatar] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [posts, setPosts] = useState([]);
  const [text, setText] = useState("");
  const [image, setImage] = useState(null);
  const [video, setVideo] = useState(null);
  const [mediaKey, setMediaKey] = useState(0);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [postError, setPostError] = useState("");

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2000);
    return () => clearTimeout(t);
  }, [toast]);

  const refreshPosts = useCallback(async () => {
    const uid = userProfile?.userid;
    if (!uid) return;
    try {
      const res = await axios.get(`${API_BASE}/auth/posts/${uid}`, {
        withCredentials: true,
      });
      const list = res.data?.userPosts ?? [];
      setPosts(list);
      localStorage.setItem("userPosts", JSON.stringify(list));
    } catch (e) {
      console.error(e);
    }
  }, [userProfile?.userid]);

  useEffect(() => {
    const saved = safeJsonParse(localStorage.getItem("userPosts"), null);
    if (saved?.length) setPosts(saved);
    else refreshPosts();
  }, [refreshPosts]);

  const sortedPosts = useMemo(() => {
    return [...posts].sort((a, b) => Number(b.id) - Number(a.id));
  }, [posts]);

  function goHome() {
    navigate("/dash");
    requestAnimationFrame(() => {
      feedTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  async function goToChat() {
    if (!userProfile?.userid) {
      navigate("/");
      return;
    }
    navigate("/chat");
    try {
      const id = userProfile.userid;
      const res = await axios.get(`${API_BASE}/auth/getmessage/${id}`, {
        withCredentials: true,
      });
      const myMessages = res.data?.myData ?? [];
      localStorage.setItem("myMessage", JSON.stringify(myMessages));
    } catch (error) {
      console.error(error.response?.data?.message ?? error);
    }
  }

  async function logout() {
    try {
      const res = await axios.post(
        `${API_BASE}/auth/logout`,
        {},
        { withCredentials: true }
      );
      if (res.data?.message === "Logout ok") {
        localStorage.clear();
        navigate("/");
      }
    } catch (error) {
      console.error(error);
    }
  }

  async function uploadAvatar() {
    if (!avatar || !userProfile?.userid) return;
    const formData = new FormData();
    formData.append("avatar", avatar);
    formData.append("userid", userProfile.userid);
    try {
      const res = await axios.post(`${API_BASE}/auth/dash`, formData, {
        withCredentials: true,
      });
      const newPath = res.data?.avatar;
      if (avatarPreview) {
        URL.revokeObjectURL(avatarPreview);
      }
      setAvatar(null);
      setAvatarPreview(null);
      const next = {
        ...userProfile,
        avatar: newPath ?? userProfile.avatar,
      };
      setUserProfile(next);
      persistUser(next);
      setAvatarKey((k) => k + 1);
      setToast({ type: "success", text: "Profile photo updated." });
      await refreshPosts();
    } catch (error) {
      console.error(error);
      setToast({
        type: "error",
        text: error.response?.data?.message || "Could not save photo.",
      });
    }
  }

  async function deleteAvatar() {
    if (!userProfile?.userid) return;
    try {
      await axios.delete(
        `${API_BASE}/auth/dropAvatar/${userProfile.userid}`,
        { withCredentials: true }
      );
      if (avatarPreview) {
        URL.revokeObjectURL(avatarPreview);
      }
      setAvatar(null);
      setAvatarPreview(null);
      const next = { ...userProfile, avatar: null };
      setUserProfile(next);
      persistUser(next);
      setAvatarKey((k) => k + 1);
      setToast({ type: "success", text: "Profile photo removed." });
    } catch (error) {
      console.error(error);
      setToast({
        type: "error",
        text: error.response?.data?.message || "Could not remove photo.",
      });
    }
  }

  async function createPost() {
    setPostError("");
    if (!userProfile?.userid) return;
    const hasContent =
      text.trim().length > 0 || Boolean(image) || Boolean(video);
    if (!hasContent) {
      setPostError("Write something or add a photo or video.");
      return;
    }

    const formData = new FormData();
    formData.append("userId", userProfile.userid);
    formData.append("text", text.trim());
    if (image) formData.append("image", image);
    if (video) formData.append("video", video);

    try {
      await axios.post(`${API_BASE}/auth/creatpost`, formData, {
        withCredentials: true,
        onUploadProgress: (progressEvent) => {
          const total = progressEvent.total || 1;
          const percent = Math.round((progressEvent.loaded * 100) / total);
          setUploadProgress(percent);
        },
      });
      setUploadProgress(0);
      setText("");
      setImage(null);
      setVideo(null);
      setMediaKey((k) => k + 1);
      await refreshPosts();
    } catch (error) {
      console.error(error);
      const msg =
        error.response?.data?.message ||
        error.message ||
        "Could not publish. Try again.";
      setPostError(typeof msg === "string" ? msg : "Could not publish. Try again.");
    }
  }

  async function deletePost(postId) {
    try {
      await axios.delete(`${API_BASE}/auth/deletepost/${postId}`, {
        withCredentials: true,
      });
      setPosts((prev) => prev.filter((post) => post.id !== postId));
    } catch (error) {
      console.error(error);
    }
  }

  const avatarDisplayUrl = useMemo(() => {
    const base = assetUrl(userProfile?.avatar);
    if (!base) return null;
    const sep = base.includes("?") ? "&" : "?";
    return avatarKey > 0 ? `${base}${sep}v=${avatarKey}` : base;
  }, [userProfile?.avatar, avatarKey]);

  const displayName = userProfile?.userName || "You";

  return (
    <div className="dash-fb">
      {toast ? (
        <div
          className={
            toast.type === "error"
              ? "dash-toast dash-toast--error"
              : "dash-toast dash-toast--ok"
          }
          role="status"
        >
          {toast.text}
        </div>
      ) : null}
      <header className="dash-topnav">
        <div className="dash-topnav__inner">
          <button
            type="button"
            className="dash-topnav__home"
            onClick={goHome}
            title="Home — scroll to feed"
          >
            <span className="dash-topnav__home-icon" aria-hidden>
              🏠
            </span>
            Home
          </button>
          <span className="dash-topnav__logo">Feed</span>
          <div className="dash-topnav__actions">
            <button type="button" className="dash-topnav__link" onClick={goToChat}>
              Messages
            </button>
            <button type="button" className="dash-topnav__link dash-topnav__link--muted" onClick={logout}>
              Log out
            </button>
          </div>
        </div>
      </header>

      <div className="dash-layout" ref={feedTopRef}>
        <aside className="dash-sidebar">
          <div className="dash-profile card">
            <p className="dash-brand">Your profile</p>
            <label className="dash-file-label">
              <span>Update profile photo</span>
              <input
                type="file"
                accept="image/*"
                className="visually-hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  setAvatar(file);
                  setAvatarPreview(URL.createObjectURL(file));
                }}
              />
            </label>

            {avatarPreview ? (
              <img src={avatarPreview} alt="" className="dash-avatar" />
            ) : avatarDisplayUrl ? (
              <img src={avatarDisplayUrl} alt="" className="dash-avatar" />
            ) : (
              <div className="dash-avatar dash-avatar--empty" aria-hidden>
                {displayName[0]?.toUpperCase() || "?"}
              </div>
            )}

            <div className="dash-actions">
              <button type="button" className="dash-btn dash-btn--fb" onClick={uploadAvatar}>
                Save photo
              </button>
              <button type="button" className="dash-btn dash-btn--ghost-fb" onClick={deleteAvatar}>
                Remove photo
              </button>
            </div>

            <h2 className="dash-username">{displayName}</h2>
            <p className="dash-meta">ID · {userProfile?.userid}</p>
          </div>
        </aside>

        <main className="dash-feed">
          <section className="dash-composer card">
            <div className="dash-composer__head">
              <div className="dash-composer__avatar" aria-hidden>
                {avatarPreview ? (
                  <img src={avatarPreview} alt="" />
                ) : avatarDisplayUrl ? (
                  <img src={avatarDisplayUrl} alt="" />
                ) : (
                  <span>{displayName[0]?.toUpperCase()}</span>
                )}
              </div>
              <div className="dash-composer__field">
                <label className="visually-hidden" htmlFor="status-input">
                  Status
                </label>
                <textarea
                  id="status-input"
                  placeholder="What's on your mind?"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  rows={3}
                  className="dash-textarea dash-textarea--fb"
                />
              </div>
            </div>

            {postError ? (
              <p className="dash-inline-error" role="alert">
                {postError}
              </p>
            ) : null}

            <div className="dash-composer__toolbar" key={mediaKey}>
              <label className="dash-tool-btn">
                <span className="dash-tool-icon" aria-hidden>
                  🖼
                </span>
                Photo
                <input
                  type="file"
                  accept="image/*"
                  className="visually-hidden"
                  onChange={(e) => setImage(e.target.files?.[0] ?? null)}
                />
              </label>
              <label className="dash-tool-btn">
                <span className="dash-tool-icon" aria-hidden>
                  🎬
                </span>
                Video
                <input
                  type="file"
                  accept="video/*"
                  className="visually-hidden"
                  onChange={(e) => setVideo(e.target.files?.[0] ?? null)}
                />
              </label>
              <span className="dash-composer__meta">
                {image ? `Photo: ${image.name}` : ""}
                {image && video ? " · " : ""}
                {video ? `Video: ${video.name}` : ""}
              </span>
            </div>

            <button type="button" className="dash-btn dash-btn--fb dash-btn--wide" onClick={createPost}>
              Post
            </button>

            {uploadProgress > 0 ? (
              <div className="dash-progress dash-progress--fb" aria-live="polite">
                <div
                  className="dash-progress__bar"
                  style={{ width: `${uploadProgress}%` }}
                />
                <span className="dash-progress__label">Uploading {uploadProgress}%</span>
              </div>
            ) : null}
          </section>

          {sortedPosts.length === 0 ? (
            <p className="dash-feed-empty card">No posts yet. Share a status, photo, or video above.</p>
          ) : null}

          {sortedPosts.map((post) => {
            const imageUrl = assetUrl(post.image_user);
            const videoUrl = assetUrl(post.video_user);
            const hasText = Boolean(post.post_user?.trim());
            return (
              <article key={post.id} className="fb-post card">
                <header className="fb-post__header">
                  <div className="fb-post__avatar" aria-hidden>
                    {avatarDisplayUrl ? (
                      <img src={avatarDisplayUrl} alt="" />
                    ) : (
                      <span>{displayName[0]?.toUpperCase()}</span>
                    )}
                  </div>
                  <div className="fb-post__byline">
                    <span className="fb-post__name">{displayName}</span>
                    <span className="fb-post__time">Your post</span>
                  </div>
                  <button
                    type="button"
                    className="fb-post__delete"
                    onClick={() => deletePost(post.id)}
                    aria-label="Delete post"
                    title="Delete"
                  >
                    Delete
                  </button>
                </header>
                {hasText ? <p className="fb-post__text">{post.post_user}</p> : null}
                {imageUrl ? (
                  <div className="fb-post__media">
                    <img src={imageUrl} alt="" className="fb-post__img" />
                  </div>
                ) : null}
                {videoUrl ? (
                  <div className="fb-post__media">
                    <video controls className="fb-post__video" playsInline>
                      <source src={videoUrl} />
                    </video>
                  </div>
                ) : null}
              </article>
            );
          })}
        </main>

        <aside className="dash-right card">
          <h3 className="dash-section-title">Your videos</h3>
          {posts.filter((p) => p.video_user).length === 0 ? (
            <p className="dash-empty">No videos yet.</p>
          ) : (
            posts
              .filter((post) => post.video_user)
              .map((post) => {
                const videoUrl = assetUrl(post.video_user);
                return (
                  <div key={post.id} className="dash-media-item">
                    <video controls className="dash-media-video" playsInline>
                      <source src={videoUrl} />
                    </video>
                  </div>
                );
              })
          )}
        </aside>
      </div>
    </div>
  );
}
