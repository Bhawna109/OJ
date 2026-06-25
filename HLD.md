# BhawnaOJ — High Level Design Document

## 1. System Overview
BhawnaOJ is a competitive programming platform where users can solve coding problems, participate in contests, submit solutions in multiple languages, and get AI-powered code reviews.

---

## 2. Architecture

```
User (Browser)
     |
     ▼
Vercel (Frontend - React + Vite)
     |
     ▼
Nginx (Reverse Proxy - algouoj.online)
     |
     ▼
Docker Container (Node.js/Express Backend)
     |
     ├── MongoDB Atlas (Database)
     ├── Groq API (AI Code Review)
     └── Gmail/Nodemailer (Email Verification)
```

---

## 3. Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React, Vite, Tailwind CSS v4 |
| Backend | Node.js, Express.js |
| Database | MongoDB Atlas + Mongoose |
| Auth | JWT + httpOnly Cookies |
| Code Execution | child_process (g++, python3, openjdk21) |
| AI Review | Groq API (LLaMA 3.3 70B) |
| Email | Nodemailer + Gmail |
| Hosting | AWS EC2 (t3.micro) + Vercel |
| Containerization | Docker |
| SSL | Let's Encrypt (Certbot) |

---

## 4. Core Modules

### 4.1 Authentication
- Register → Email verification → Login
- JWT token stored in httpOnly cookie
- Roles: `user`, `admin`

### 4.2 Code Execution Engine
- Supports C++, Java, Python
- 5-second timeout → TLE detection
- 50KB code size limit
- Isolated file-based execution per submission

### 4.3 Problem & Submission System
- Problems stored in MongoDB with test cases
- Submit → run against all test cases → verdict
- Verdicts: Accepted, Wrong Answer, TLE, Runtime Error, Compilation Error

### 4.4 AI Code Review
- Sends code to Groq (LLaMA 3.3 70B)
- Returns feedback on correctness, efficiency, style

### 4.5 Leaderboard
- MongoDB aggregation pipeline
- Ranks users by number of accepted submissions

### 4.6 Contests
- Live, upcoming, ended contests
- Real-time countdown timers on frontend

---

## 5. Database Collections

| Collection | Purpose |
|---|---|
| users | Auth, profile, verification |
| problems | Problem statements, difficulty |
| testcases | Input/output per problem |
| submissions | Code, language, verdict, time |
| contests | Start/end time, problems list |

---

## 6. Security
- httpOnly cookies (XSS protection)
- sameSite: none + secure (HTTPS only)
- bcrypt password hashing
- Email verification before login
- Code execution timeout (TLE)
- Code size limit (50KB)
- Admin-only middleware for protected routes

---

## 7. Deployment Flow

```
Local Development
     |
     ▼
Git Push → GitHub (main branch)
     |
     ├── Frontend → Vercel (auto-deploy)
     └── Backend → Docker build → Docker Hub → EC2 pull & run
```

## 8. API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | /api/auth/register | Register new user |
| GET | /api/auth/verify-email | Verify email token |
| POST | /api/auth/login | Login |
| POST | /api/auth/logout | Logout |
| GET | /api/auth/me | Get current user |
| GET | /api/problems | List all problems |
| GET | /api/problems/:id | Get problem detail |
| POST | /api/submit | Submit solution |
| POST | /run | Run code (guest allowed) |
| POST | /ai-review | AI code review |
| GET | /api/submissions | Get submissions |
| GET | /api/leaderboard | Get leaderboard |
| GET | /api/contests | Get contests |
| GET | /api/stats | Get platform stats |
