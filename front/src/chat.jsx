import { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { io } from "socket.io-client";
import { API_BASE } from "./api.js";
import { safeJsonParse } from "./utils.js";
import "./chat.css";

function threadsFromHistory(rows, myId) {
  if (myId == null || !Array.isArray(rows)) return {};
  const mid = String(myId);
  const map = {};
  for (const row of rows) {
    const sid = String(row.sender_id);
    const rid = String(row.receiver_id);
    if (sid !== mid && rid !== mid) continue;
    const partner = sid === mid ? rid : sid;
    if (!map[partner]) map[partner] = [];
    map[partner].push({
      id: row.id,
      sender_id: row.sender_id,
      receiver_id: row.receiver_id,
      message: row.message,
    });
  }
  for (const k of Object.keys(map)) {
    map[k].sort((a, b) => (Number(a.id) || 0) - (Number(b.id) || 0));
  }
  return map;
}

export default function Chat() {
  const user = safeJsonParse(localStorage.getItem("user"), null);
  const myId = user?.userid;

  const [socket, setSocket] = useState(null);
  const [search, setSearch] = useState("");
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [message, setMessage] = useState("");
  const [callError, setCallError] = useState("");

  const [messages, setMessages] = useState(() => {
    const rows = safeJsonParse(localStorage.getItem("myMessage"), []);
    return threadsFromHistory(rows, myId);
  });

  const myCameraRef = useRef(null);
  const remoteVideo = useRef(null);
  const peerRef = useRef(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, selectedUser?.id, scrollToBottom]);

  useEffect(() => {
    const rows = safeJsonParse(localStorage.getItem("myMessage"), []);
    setMessages(threadsFromHistory(rows, myId));
  }, [myId]);

  useEffect(() => {
    const s = io(API_BASE, { transports: ["websocket", "polling"] });
    setSocket(s);
    if (myId != null) s.emit("join_user", myId);
    return () => {
      s.disconnect();
    };
  }, [myId]);

  useEffect(() => {
    if (!search.trim()) {
      setUsers([]);
      return;
    }
    const t = setTimeout(() => {
      axios
        .get(`${API_BASE}/auth/searchuser`, {
          params: { search: search.trim() },
          withCredentials: true,
        })
        .then((res) => setUsers(Array.isArray(res.data) ? res.data : []))
        .catch((err) => console.error(err.response?.data ?? err));
    }, 250);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    if (!socket || myId == null) return;

    const handler = (data) => {
      const from = String(data.sender_id);
      setMessages((prev) => ({
        ...prev,
        [from]: [...(prev[from] || []), data],
      }));
    };

    socket.on("receive_message", handler);
    return () => socket.off("receive_message", handler);
  }, [socket, myId]);

  async function sendChat() {
    const trimmed = message.trim();
    if (!trimmed || !selectedUser || !socket || myId == null) return;

    const payload = {
      sender_id: myId,
      receiver_id: selectedUser.id,
      message: trimmed,
    };

    socket.emit("send_message", payload);

    try {
      await axios.post(`${API_BASE}/auth/message`, payload, {
        withCredentials: true,
      });
    } catch (error) {
      console.error(error.response?.data?.message ?? error);
    }

    const key = String(selectedUser.id);
    setMessages((prev) => ({
      ...prev,
      [key]: [...(prev[key] || []), payload],
    }));
    setMessage("");
  }

  async function startCall() {
    setCallError("");
    if (!selectedUser || !socket || myId == null) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      if (myCameraRef.current) myCameraRef.current.srcObject = stream;

      peerRef.current = new RTCPeerConnection();
      stream.getTracks().forEach((track) =>
        peerRef.current.addTrack(track, stream)
      );

      peerRef.current.ontrack = (e) => {
        if (remoteVideo.current) remoteVideo.current.srcObject = e.streams[0];
      };

      peerRef.current.onicecandidate = (e) => {
        if (e.candidate) {
          socket.emit("candidate", {
            candidate: e.candidate,
            to: selectedUser.id,
            from: myId,
          });
        }
      };

      const offer = await peerRef.current.createOffer();
      await peerRef.current.setLocalDescription(offer);

      socket.emit("offer", {
        offer,
        to: selectedUser.id,
        from: myId,
      });
    } catch (err) {
      console.error(err);
      setCallError(
        err.name === "NotAllowedError"
          ? "Camera or microphone access was denied."
          : "Could not start the call."
      );
    }
  }

  function stopCall() {
    const stream = myCameraRef.current?.srcObject;
    if (stream) stream.getTracks().forEach((t) => t.stop());

    if (peerRef.current) {
      peerRef.current.close();
      peerRef.current = null;
    }

    if (myCameraRef.current) myCameraRef.current.srcObject = null;
    if (remoteVideo.current) remoteVideo.current.srcObject = null;
  }

  useEffect(() => {
    if (!socket || myId == null) return;

    const onOffer = async (data) => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });

        if (myCameraRef.current) myCameraRef.current.srcObject = stream;

        peerRef.current = new RTCPeerConnection();
        stream.getTracks().forEach((track) =>
          peerRef.current.addTrack(track, stream)
        );

        peerRef.current.ontrack = (e) => {
          if (remoteVideo.current) remoteVideo.current.srcObject = e.streams[0];
        };

        await peerRef.current.setRemoteDescription(data.offer);

        peerRef.current.onicecandidate = (e) => {
          if (e.candidate) {
            socket.emit("candidate", {
              candidate: e.candidate,
              to: data.from,
              from: myId,
            });
          }
        };

        const answer = await peerRef.current.createAnswer();
        await peerRef.current.setLocalDescription(answer);

        socket.emit("answer", {
          answer,
          to: data.from,
          from: myId,
        });
      } catch (err) {
        console.error(err);
      }
    };

    const onAnswer = async (data) => {
      if (!peerRef.current) return;
      try {
        await peerRef.current.setRemoteDescription(data.answer);
      } catch (e) {
        console.error(e);
      }
    };

    const onCandidate = async (data) => {
      if (!peerRef.current || !data.candidate) return;
      try {
        await peerRef.current.addIceCandidate(data.candidate);
      } catch (e) {
        console.error(e);
      }
    };

    socket.on("offer", onOffer);
    socket.on("answer", onAnswer);
    socket.on("candidate", onCandidate);
    socket.on("call_end", stopCall);

    return () => {
      socket.off("offer", onOffer);
      socket.off("answer", onAnswer);
      socket.off("candidate", onCandidate);
      socket.off("call_end", stopCall);
    };
  }, [socket, myId]);

  if (!myId) {
    return (
      <div className="chat-gate">
        <p>You need to sign in first.</p>
        <Link to="/">Go to sign in</Link>
      </div>
    );
  }

  const threadKey = selectedUser ? String(selectedUser.id) : null;
  const thread = threadKey ? messages[threadKey] || [] : [];

  return (
    <div className="chat-app">
      <aside className="chat-sidebar card">
        <div className="chat-sidebar__head">
          <Link to="/dash" className="chat-back">
            ← Home
          </Link>
          <h1 className="chat-title">Messages</h1>
        </div>
        <input
          className="chat-search"
          placeholder="Search people…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Search users"
        />
        <ul className="chat-user-list">
          {users.map((u) => (
            <li key={u.id}>
              <button
                type="button"
                className={
                  selectedUser?.id === u.id
                    ? "chat-user chat-user--active"
                    : "chat-user"
                }
                onClick={() => setSelectedUser(u)}
              >
                <span className="chat-user__avatar" aria-hidden>
                  {(u.first_name || "?")[0].toUpperCase()}
                </span>
                <span className="chat-user__name">{u.first_name}</span>
              </button>
            </li>
          ))}
        </ul>
      </aside>

      <section className="chat-main card">
        {selectedUser ? (
          <>
            <header className="chat-main__header">
              <div>
                <h2 className="chat-peer-name">{selectedUser.first_name}</h2>
                <p className="chat-peer-meta">User ID {selectedUser.id}</p>
              </div>
              <div className="chat-main__actions">
                {callError ? (
                  <span className="chat-call-error" role="alert">
                    {callError}
                  </span>
                ) : null}
                <button
                  type="button"
                  className="chat-icon-btn"
                  onClick={startCall}
                  title="Start video call"
                >
                  Video
                </button>
              </div>
            </header>

            <div className="chat-messages" role="log">
              {thread.map((m, i) => (
                <div
                  key={`${m.sender_id}-${i}-${m.message?.slice(0, 12)}`}
                  className={
                    String(m.sender_id) === String(myId)
                      ? "chat-bubble chat-bubble--me"
                      : "chat-bubble chat-bubble--them"
                  }
                >
                  {m.message}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            <div className="chat-composer">
              <input
                className="chat-input"
                placeholder="Message…"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendChat();
                  }
                }}
                aria-label="Message text"
              />
              <button type="button" className="chat-send" onClick={sendChat}>
                Send
              </button>
            </div>
          </>
        ) : (
          <div className="chat-empty">
            <p>Select a conversation or search for someone.</p>
          </div>
        )}
      </section>

      <aside className="chat-video card">
        <h3 className="chat-video__title">Call</h3>
        <div className="chat-video__grid">
          <div className="chat-video__wrap">
            <video ref={remoteVideo} autoPlay playsInline className="chat-vid" />
            <span className="chat-video__label">Remote</span>
          </div>
          <div className="chat-video__wrap">
            <video
              ref={myCameraRef}
              autoPlay
              muted
              playsInline
              className="chat-vid"
            />
            <span className="chat-video__label">You</span>
          </div>
        </div>
        <button type="button" className="chat-end-call" onClick={stopCall}>
          End call
        </button>
      </aside>
    </div>
  );
}
