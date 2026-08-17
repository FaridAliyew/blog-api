# 🚀 Fullstack Blog Platform & API

A modern, responsive, and production-ready Fullstack Blog application built with **React (Vite)**, **Express.js**, **MongoDB Atlas**, **Docker / Nginx**, and deployable on **Vercel Serverless**.

---

## 🌟 Key Features

- 🔐 **Authentication & Authorization (JWT):**
  - Secure User Registration and Login
  - Role-Based Access Control (Admin vs. Standard User)
  - Password hashing with `bcryptjs`

- 📝 **Post Management (CRUD):**
  - Admins can create, edit, and delete blog articles
  - Custom author attribution support for each article
  - Real-time search filter (searches across title, content, and author)

- 💬 **Interactive Comment & Like System (Instagram-Style):**
  - Comment Like / Unlike toggle with real-time counters
  - Nested Replies (thread-based replies under comments)
  - Smart reply guard (users cannot reply to their own comments)
  - Ownership-based deletion rules (users can delete their own comments/replies, admins can delete any)

- 🧪 **Automated Testing & CI/CD Quality Gate:**
  - Automated integration and API test suite powered by **Vitest** and **Supertest**
  - Docker multi-stage build quality gate: tests run automatically before production images are built

- 🐳 **Docker & Nginx Architecture:**
  - Multi-stage Docker build for lightweight production images
  - Nginx Reverse Proxy serving the SPA and forwarding `/api` traffic
  - 1-command startup via `docker-compose`

- ⚡ **Vercel Fullstack Deployment:**
  - Serverless Express API handler (`api/index.js`)
  - Auto-reconnecting MongoDB connection pool for serverless environments

---

## 🛠️ Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 19, Vite, Vanilla CSS (Native Nesting), Lucide React |
| **Backend** | Node.js, Express.js, JWT, Bcryptjs, Cors, Dotenv |
| **Database** | MongoDB Atlas |
| **Testing** | Vitest, Supertest |
| **DevOps / Hosting** | Docker, Docker Compose, Nginx, Vercel |

---

## 🚀 Quick Start with Docker (Recommended)

### 1. Clone the repository:
```bash
git clone https://github.com/USERNAME/blog-api.git
cd blog-api
```

### 2. Configure Environment Variables:
Copy the example environment file into `server/.env`:
```bash
cp server/.env.example server/.env
```

Ensure `server/.env` contains your MongoDB credentials:
```env
MONGODB_URI=mongodb+srv://<db_user>:<db_password>@cluster.mongodb.net/blog_api?retryWrites=true&w=majority
MONGODB_DATABASE=blog_api
PORT=5000
JWT_SECRET=your_super_secret_jwt_key
```

### 3. Build & Launch Containers:
```bash
docker compose up --build -d
```

Open your browser:
- 🌐 **Frontend (Web App):** [http://localhost](http://localhost) (Port 80)
- 🔌 **Backend API:** [http://localhost:5000](http://localhost:5000)

---

## 💻 Local Development (Without Docker)

### 1. Install dependencies:
```bash
npm install
```

### 2. Start the Backend server:
```bash
npm run server
```

### 3. Start the Frontend dev server:
```bash
npm run dev
```

---

## 🧪 Running Tests

Execute the automated test suite with Vitest:
```bash
npm test
```

---

## 👑 Default Admin Credentials

Upon the first database connection, a default admin account is automatically seeded:


## 📡 API Reference

### Authentication
- `POST /api/auth/register` — Register a new user
- `POST /api/auth/login` — Login and receive JWT token
- `GET /api/auth/me` — Get current logged-in user profile

### Articles / Posts
- `GET /api/posts` — Get all published posts
- `POST /api/posts` — Create a new post *(Admin Only)*
- `PUT /api/posts/:id` — Update an existing post *(Admin Only)*
- `DELETE /api/posts/:id` — Delete a post *(Admin Only)*

### Comments, Likes & Replies
- `POST /api/posts/:id/comments` — Add a comment to a post
- `DELETE /api/posts/:postId/comments/:commentId` — Delete a comment
- `POST /api/posts/:postId/comments/:commentId/like` — Toggle Like/Unlike on a comment
- `POST /api/posts/:postId/comments/:commentId/replies` — Add a nested reply to a comment
- `DELETE /api/posts/:postId/comments/:commentId/replies/:replyId` — Delete a nested reply

---

## 📄 License

This project is open-source and available under the [MIT License](LICENSE).
