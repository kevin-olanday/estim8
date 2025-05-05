# 🚧 Work in Progress: Not prod ready - still undergoing development

# EstiM8

A real-time, minimal, and collaborative Planning Poker tool for agile teams. EstiM8 helps teams estimate stories, vote, and reach consensus with ease—featuring live updates, host controls, and a sleek UI.

---

## 📦 Features

- Real-time story voting and estimation
- Host controls: reveal/hide votes, reset, skip, and complete stories
- Supports multiple decks (Fibonacci, T-Shirt, custom, etc.)
- Add, edit, and manage stories in a session
- Player presence and role management (host/participant)
- Animated feedback and confetti for revealed votes
- Export story history to CSV
- Keyboard shortcuts for fast voting
- Responsive, minimal UI with theme support

---

## 🌐 Live Demo

Coming soon!

---

## 🚀 Getting Started

### Prerequisites

- Node.js >= 18
- Docker (optional, for containerized deployment)
- A PostgreSQL database (see `.env.example` for connection string)

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
- **Deployment**: Docker, DigitalOcean (or any cloud)
- **CI/CD**: GitHub Actions
- **Other Tools**: ESLint, Prettier

---

## 📂 Project Structure

```
app/                       # Next.js app directory (App Router)
│
├── actions/               # Server actions (room, story, etc.)
├── components/            # Reusable UI and room components
│   ├── room/              # Room-specific components (header, voting, etc.)
│   └── ui/                # UI primitives (button, input, etc.)
├── context/               # React context providers (current story, pusher, etc.)
├── hooks/                 # Custom React hooks
├── room/                  # Room pages and logic
├── globals.css            # Global styles
├── layout.tsx             # Root layout for the app
├── page.tsx               # Main entry page
components/                # Shared components (theme provider, etc.)
lib/                       # Utility libraries
prisma/                    # Prisma schema and migrations
public/                    # Static assets (favicons, images)
styles/                    # Additional global styles
types/                     # TypeScript types
.env.local                 # Environment variables
.gitignore                 # Git ignore rules
package.json               # Project metadata and dependencies
pnpm-lock.yaml             # Dependency lock file
tsconfig.json              # TypeScript configuration
```

---

## 🧑‍💻 Contributing

1. Fork the repo
2. Create your feature branch: `git checkout -b feature/feature-name`
3. Commit your changes: `git commit -m 'Add feature'`
4. Push to the branch: `git push origin feature/feature-name`
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

Developed and maintained by [Your Name or Team]

## 📬 Contact

For support or feedback, open an issue or email [your@email.com](mailto:your@email.com)