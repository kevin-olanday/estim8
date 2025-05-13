# 🚧 Work in Progress: Not prod ready - still undergoing development

# EstiM8

A real-time, minimal, and collaborative Planning Poker tool for agile teams. EstiM8 helps teams estimate stories, vote, and reach consensus with ease—featuring live updates, host controls, and a sleek UI.

---

## 📦 Features

- Real-time story voting and estimation with Pusher
- Host controls: reveal/hide votes, reset, skip, and complete stories
- Multiple voting scales: Fibonacci, T-Shirt sizes, and custom scales
- Anonymous voting mode (hide votes until everyone has voted)
- Add, edit, and manage stories in a session
- Player presence and role management (host/participant)
- Animated feedback and confetti for revealed votes
- Export story history to CSV
- Keyboard shortcuts for fast voting
- Room management with sharing functionality
- No account required - just create and join rooms

---

## 🌐 Live Demo

[estim8.kevinolanday.com](https://estim8.kevinolanday.com/)

---

## 🚀 Getting Started

### Prerequisites

- Node.js >= 18
- Docker (optional, for containerized deployment)
- A PostgreSQL database (see `.env.example` for connection string)
- Pusher account for real-time functionality


### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/yourusername/estim8.git
   cd estim8
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   - Copy `.env.example` to `.env.local` and fill in your `DATABASE_URL` and any other required secrets.

   ```bash
   cp .env.example .env.local
   # Then edit .env.local in your editor
   ```

4. **Set up the database:**
   ```bash
   npx prisma migrate deploy
   ```

---

### Running Locally

```bash
npm run dev
```

---

## 🧲 Running Tests

```bash
npm test
```

---

## ⚙️ Configuration

| Variable           | Description                   | Default     |
|--------------------|-------------------------------|-------------|
| `DATABASE_URL`     | Database connection string    | -           |
| `PUSHER_APP_ID`    | Pusher app ID (for realtime)  | -           |
| `PUSHER_KEY`       | Pusher key                    | -           |
| `PUSHER_SECRET`    | Pusher secret                 | -           |
| `PUSHER_CLUSTER`   | Pusher cluster                | -           |

---

## 🛠️ Tech Stack

- **Frontend**: React, Next.js (App Router), Tailwind CSS, Lucide Icons
- **Backend**: Next.js API Routes, Prisma ORM, PostgreSQL
- **Realtime**: Pusher Channels
- **State Management**: React Hooks, Context API
- **Styling**: Tailwind CSS, Custom Animations
- **UI Components**: Radix UI
- **CI/CD**: GitHub Actions
- **Deployment**: Vercel
- **Other Tools**: ESLint, Prettier

---

## 📂 Project Structure

```
app/                       # Next.js app directory (App Router)
│
├── actions/               # Server actions
│   ├── room-actions.ts    # Room management actions
│   ├── story-actions.ts   # Story management actions
│   └── vote-actions.ts    # Voting actions
├── api/                   # API routes
│   └── pusher/            # Pusher authentication
├── components/            # React components
│   ├── room/              # Room components
│   └── ui/                # UI components
├── context/               # React contexts
├── hooks/                 # Custom React hooks
├── room/                  # Room pages
│   ├── [id]/              # Dynamic room route
│   └── create/            # Room creation page
├── layout.tsx             # Root layout
└── page.tsx               # Home page
lib/                       # Utility functions
prisma/                    # Prisma database configuration
public/                    # Static assets
components/                # Shared components
types/                     # TypeScript type definitions
```

---


## 🛠️ Database Schema

- **Room**: Represents a planning poker session
- **Player**: Users participating in a room
- **Story**: Items to be estimated in a planning session
- **Vote**: Individual estimations by players

---


## 🧑‍💻 Contributing

1. Fork the repo
2. Create your feature branch: `git checkout -b feature/feature-name`
3. Commit your changes: `git commit -m 'Add feature'`
4. Push to the branch: `git push origin feature/feature-name`
5. Open a Pull Request

---

## 📄 License

This project is licensed under a custom NonCommercial Attribution License.

- ✅ You MAY use this code for personal, non-profit projects WITH attribution
- ❌ You MAY NOT use this code for commercial purposes
- ❌ You MAY NOT redistribute without proper attribution

See the [LICENSE](LICENSE) file for full details.

---

Developed and maintained by [Kevin Olanday](kevinolanday.com)

## 📬 Contact

For support or feedback, open an issue or email [kevin.olanday@gmail.com](mailto:kevin.olanday@gmail.com)
