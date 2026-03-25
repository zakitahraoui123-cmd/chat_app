# Social DB — Feed & Messages

A full-stack learning project: a simple social-style feed with posts (text, images, and video), profile photos, user search, real-time messaging over **Socket.IO**, and optional WebRTC video calls. The goal is to practice **React**, **Node.js**, **PostgreSQL**, and file uploads in a cohesive app.

---

## Features

- **Authentication** — Register and sign in (passwords hashed with bcrypt).
- **Dashboard** — Create posts with status text, photos, or videos; delete your own posts; upload or remove a profile picture with immediate UI feedback.
- **Messaging** — Search users, send messages (persisted via the API and delivered live over sockets).
- **Media** — Multer stores uploads under `back/multer/` and the API serves them under `/multer`.

---

## Tech Stack

| Layer    | Technologies                                      |
| -------- | ------------------------------------------------- |
| Frontend | React 18, Vite, React Router, Axios, Socket.IO client |
| Backend  | Express 5, PostgreSQL (`pg`), Multer, Socket.IO, bcrypt, cookie-parser, CORS |
| Database | PostgreSQL (custom schema & SQL functions, e.g. `get_user_posts`, `delete_avatar`) |

---

## Prerequisites

- [Node.js](https://nodejs.org/) (LTS recommended)
- [PostgreSQL](https://www.postgresql.org/) running locally or remotely
- A database created for this project, with tables and functions matching your migrations or SQL scripts

---

## Project Structure

```
├── back/          # Express API, Socket.IO server, Multer uploads
│   ├── database/  # PostgreSQL pool configuration
│   ├── multer/    # Upload config; files saved under multer/avatar, image, video
│   └── routers/   # REST routes (auth, posts, chat, etc.)
├── front/         # Vite + React SPA
└── README.md
```

---

## Environment Variables

### Backend (`back/.env`)

Create `back/.env` (do **not** commit secrets). Example:

```env
DB_USER=your_user
DB_HOST=localhost
DB_PASSWORD=your_password
DB_DATABASE=your_database
DB_PORT=5432
```

Adjust names and values to match your PostgreSQL setup.

### Frontend (`front/.env.local`)

Optional. Copy from `front/.env.example` if the API is not on `http://localhost:5000`:

```env
VITE_API_URL=http://localhost:5000
```

---

## Getting Started

### 1. Install dependencies

From the **backend** folder:

```bash
cd back
npm install
```

From the **frontend** folder:

```bash
cd front
npm install
```

### 2. Prepare the database

Apply your SQL schema (tables such as `user_info`, `user_post_video_pic`, `profile_picture`, `user_message`, etc., plus functions like `get_user_posts` and `delete_avatar`) to your PostgreSQL database. The exact scripts depend on how you initialized the project.

### 3. Run the API

From `back/`:

```bash
npm start
```

The server listens on **port 5000** by default (see `server.js`). Uploaded files are exposed at `/multer`.

### 4. Run the frontend

From `front/`:

```bash
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173`). Ensure the API is running and CORS/credentials match your setup.

### Production build (frontend)

```bash
cd front
npm run build
npm run preview
```

---

## Notes

- This repository is intended for **learning and portfolio** use. Security hardening (rate limiting, stricter validation, HTTPS-only cookies in production, etc.) would be appropriate before any real deployment.
- WebRTC signaling is handled through Socket.IO; production use would typically require TURN/STUN configuration and additional safeguards.

---

## License

This project is provided as-is for educational purposes. If you reuse or adapt it, a short credit or link back is appreciated but not required.

---

## Acknowledgments

Thank you to the open-source communities behind React, Vite, Express, PostgreSQL, and Socket.IO for the tools that make projects like this possible.

If you find issues or have suggestions, feel free to open an issue or a pull request in the spirit of respectful collaboration.
