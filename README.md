# 🚀 Blog Web Platform & API

Müasir, sürətli və tam funksional Blog tətbiqi. Layihə **React (Vite)** frontend, **Express.js** backend, **MongoDB Atlas** verilənlər bazası və **Docker / Nginx** arxitekturası üzərində qurulub.

---

## 🌟 Əsas Xüsusiyyətlər

- 🔐 **Autentifikasiya və Səlahiyyətlər (JWT):**
  - Qeydiyyat və Giriş sistemi
  - Rol əsaslı giriş (Admin və İstifadəçi)
  - Şifrələrin təhlükəsiz `bcryptjs` heşlənməsi

- 📝 **Məqalə İdarəetməsi (CRUD):**
  - Admin tərəfindən yeni məqalə yaratmaq, redaktə etmək və silmək
  - Məqalə müəllifinin adını təyin etmə imkanı
  - Real-vaxt axtarış filteri (başlıq, məzmun və müəllifə görə)

- 💬 **İnteraktiv Şərh və Bəyənmə Sistemi (Instagram Style):**
  - Şərhləri bəyənmək (❤️ Like / Unlike)
  - Şərhlərə iç-içə cavab yazmaq (Nested Replies)
  - İstifadəçilər yalnız digər istifadəçilərin şərhlərinə cavab yaza bilər
  - İstifadəçi yalnız öz şərhini, Admin isə istənilən şərhi silə bilər

- 🐳 **Docker & Nginx Arxitekturası:**
  - Multi-stage Docker build ilə yüngül Nginx container
  - Nginx Reverse Proxy ilə tək portdan (80) həm Frontend, həm də `/api` idarəetməsi
  - `docker-compose` ilə tək əmrlə bütün layihəni ayağa qaldırmaq

---

## 🛠️ İstifadə Olunan Texnologiyalar

| Sahə | Texnologiyalar |
|---|---|
| **Frontend** | React 19, Vite, Vanilla CSS (Modern Nesting), Lucide React |
| **Backend** | Node.js, Express.js, JWT, Bcryptjs, Cors, Dotenv |
| **Database** | MongoDB Atlas |
| **DevOps / Server** | Docker, Docker Compose, Nginx |

---

## 🚀 Layihəni İşə Salmaq (Docker ilə - Tövsiyə olunan)

### 1. Repozitoriyanı klonlayın:
```bash
git clone https://github.com/USERNAME/blog-api.git
cd blog-api
```

### 2. Environment (.env) faylını hazırlayın:
`server` qovluğunda `.env` faylı yaradın (və ya `.env.example`-dən kopyalayın):
```bash
cp server/.env.example server/.env
```

`server/.env` faylının tərkibi:
```env
MONGODB_URI=mongodb+srv://<db_user>:<db_password>@cluster.mongodb.net/blog_api?retryWrites=true&w=majority
MONGODB_DATABASE=blog_api
PORT=5000
JWT_SECRET=supersecret_blog_api_key_2026
```

### 3. Container-ləri ayağa qaldırın:
```bash
docker compose up --build -d
```

Brauzerdə açın:
- 🌐 **Frontend (Sayt):** [http://localhost](http://localhost) (Port 80)
- 🔌 **Backend API:** [http://localhost:5000](http://localhost:5000)

---

## 💻 Lokal İşə Salma (Docker olmadan)

### 1. Asılılıqları quraşdırın:
```bash
# Əsas qovluqda
npm install
```

### 2. Backend serverini başladın:
```bash
node server/server.js
```

### 3. Frontend-i başladın:
```bash
npm run dev
```

---

## 👑 Defolt Admin Məlumatları

Sistem ilk dəfə işə düşdükdə avtomatik olaraq ilkin Admin hesabı yaradılır:

- **Email:** `admin@blog.com`
- **Şifrə:** `admin123`

---

## 📡 API Endpoint-lər

### Autentifikasiya
- `POST /api/auth/register` — Yeni istifadəçi qeydiyyatı
- `POST /api/auth/login` — Giriş və JWT token əldə etmə
- `GET /api/auth/me` — Cari daxil olmuş istifadəçi məlumatları

### Məqalələr
- `GET /api/posts` — Bütün məqalələri əldə etmək
- `POST /api/posts` — Yeni məqalə yaratmaq *(Admin)*
- `PUT /api/posts/:id` — Məqaləni redaktə etmək *(Admin)*
- `DELETE /api/posts/:id` — Məqaləni silmək *(Admin)*

### Şərhlər, Bəyənmələr və Cavablar
- `POST /api/posts/:id/comments` — Şərh yazmaq
- `DELETE /api/posts/:postId/comments/:commentId` — Şərhi silmək
- `POST /api/posts/:postId/comments/:commentId/like` — Şərhi bəyənmək / bəyənməni geri çəkmək
- `POST /api/posts/:postId/comments/:commentId/replies` — Şərhə cavab yazmaq
- `DELETE /api/posts/:postId/comments/:commentId/replies/:replyId` — Cavabı silmək
