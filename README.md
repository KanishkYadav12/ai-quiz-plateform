# QuizAI Platform

QuizAI is a real-time multiplayer quiz platform where AI generates questions on any topic instantly. Players compete live in virtual rooms, climb global leaderboards, and earn unique achievement badges.

> **One Line Summary:** Type a topic → AI generates quiz → share code → compete live → win coins → climb global ranks.

---

## 🚀 Features

### 🤖 AI-Powered Generation
- Instant question generation using **Groq AI (Llama 3.3 70B)**.
- Tailored difficulty (Easy, Medium, Hard) and adaptive explanations.
- Automatic validation of JSON structures and answer consistency.

### 🎮 Real-time Multiplayer
- Live synchronized gameplay via **Socket.io**.
- Real-time leaderboards that update as players answer.
- Automatic question advancement and server-side timing.

### 🛡️ Anti-Cheat System
- **Tab Switch Detection**: Automatic strike system and disqualification for switching tabs.
- **Fair Play Agreement**: Mandatory integrity commitment for all participants.
- **Leave Detection**: Automatic disqualification for mid-game disconnects.

### 🏆 Progression & Community
- **Coin System**: Earn coins based on placement and stackable performance bonuses.
- **Global Leaderboards**: Compare yourself by Total Coins or Skill Ratio (min 5 games).
- **Badge Collection**: Unlock 10 unique achievements based on gameplay milestones.
- **Public Library**: Discover and play quizzes created by the community.
- **Host Analytics**: Deep insights into quiz performance and question-by-question success rates.

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | Next.js 14 (App Router), Redux Toolkit, Tailwind CSS, Lucide React, Recharts |
| **Backend** | Node.js, Express, Socket.io, Mongoose |
| **Database** | MongoDB |
| **AI** | Groq SDK (Llama 3.3 70B) |
| **Auth** | JWT, bcryptjs |

---

## ⚙️ Setup & Installation

### Prerequisites
- Node.js (>= 18.0.0)
- MongoDB account (local or Atlas)
- Groq API Key

### 1. Clone the repository
```bash
git clone <your-repo-url>
cd ai-quiz-platform
```

### 2. Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# Fill in your MONGODB_URL, JWT_SECRET, and GEMINI_API_KEY
npm run dev
```

### 3. Frontend Setup
```bash
cd frontend
npm install
cp .env.example .env.local
# Ensure NEXT_PUBLIC_API_BASE_URL and NEXT_PUBLIC_SOCKET_URL match your backend
npm run dev
```

---

## 🔑 Environment Variables

### Backend
- `MONGODB_URL`: Your MongoDB connection string.
- `JWT_SECRET`: Secret key for signing tokens.
- `GEMINI_API_KEY`: Your Groq/Google AI API Key.
- `FRONTEND_ORIGIN`: The URL of your frontend application (for CORS).

### Frontend
- `NEXT_PUBLIC_API_BASE_URL`: The backend API endpoint (e.g., `http://localhost:8000/api`).
- `NEXT_PUBLIC_SOCKET_URL`: The backend socket server (e.g., `http://localhost:8000`).

---

## 📡 API Summary

### Auth
- `POST /api/auth/register`: Create a new account.
- `POST /api/auth/login`: Authenticate user.
- `GET /api/auth/me`: Get current user session.

### Quiz
- `POST /api/quiz/generate`: Generate a new AI quiz (Rate limited).
- `GET /api/quiz/public`: List all community quizzes.
- `GET /api/quiz/:quizId/analytics`: Detailed host-only stats.
- `POST /api/quiz/:quizId/rate`: Rate a quiz (1-5 stars).

### Leaderboard
- `GET /api/leaderboard/coins`: Top 100 by Total Coins.
- `GET /api/leaderboard/ratio`: Top 100 by Skill Ratio.

---

## 📸 Screenshots
*(Placeholders for actual visuals)*
- [Dashboard View]
- [Live Gameplay Arena]
- [Global Podium]
- [Host Analytics Dashboard]

---

## 🌐 Deployment
- **Backend**: Ready for [Render](https://render.com) using the included `render.yaml`.
- **Frontend**: Ready for [Vercel](https://vercel.com) using the included `vercel.json`.
