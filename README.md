# TornVault

TornVault is a full-stack analytics, management, and intelligence dashboard built for [Torn City](https://www.torn.com/) factions and players.

## Architecture & Technology Stack

- **Backend** (`/backend`): Node.js + Express + TypeScript with Axios for Torn API integration, JWT authentication, and automated caching.
- **Frontend** (`/frontend`): Next.js (App Router) + TypeScript, styled with Tailwind CSS and Lucide React icons.
- **Shared** (`/shared`): Shared TypeScript constants, types, and item databases used across both backend and frontend.

## Getting Started

### 1. Backend Setup

1. Navigate to the `backend` directory:
   ```bash
   cd backend
   ```
2. Copy the `.env.example` file to create your local environment configuration:
   ```bash
   cp .env.example .env
   ```
   Configure your secure `JWT_SECRET` and `ALLOWED_ORIGINS` in `.env`.
3. Install dependencies and start the development server:
   ```bash
   npm install
   npm run dev
   ```
   The backend server will run by default on `http://localhost:5000`.

### 2. Frontend Setup

1. Navigate to the `frontend` directory:
   ```bash
   cd frontend
   ```
2. Copy the `.env.example` file to create your local frontend environment configuration:
   ```bash
   cp .env.example .env.local
   ```
   Verify that `NEXT_PUBLIC_API_URL` points to your backend server (e.g. `http://localhost:5000`).
3. Install dependencies and start the Next.js development server:
   ```bash
   npm install
   npm run dev
   ```
4. Open [http://localhost:3000](http://localhost:3000) in your browser to access TornVault.

## License

Open Source (MIT License).
