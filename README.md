# TornVault

⚡ A customizable and user-friendly faction analytics and management dashboard for Torn.com

![](https://i.imgur.com/0GUBkvq.png)

![](https://i.imgur.com/I46ZwLp.png)

![](https://i.imgur.com/Lm2XBfz.png)

![](https://i.imgur.com/AXUqBVA.png)

![](https://i.imgur.com/9KlKbh3.png)

![](https://i.imgur.com/NSN9Z8i.png)

![](https://i.imgur.com/cBheik1.png)

## Project Structure

```text
torn-vault/
├── backend/                 # Express API server
│   ├── src/
│   │   ├── middleware/      # Authentication & subscription middleware
│   │   ├── routes/          # API endpoints (auth, user, faction, analytics, armory, admin)
│   │   ├── services/        # Torn API client & subscription storage
│   │   └── utils/           # Payout calculators
│   └── tests/               # Backend test suite
├── frontend/                # Next.js frontend
│   ├── src/
│   │   ├── app/             # App Router pages (dashboard, crimes, armory, war)
│   │   ├── components/      # UI components & tables
│   │   ├── contexts/        # Auth & application state providers
│   │   └── lib/             # API helpers & export utilities
│   └── __tests__/           # Frontend test suite
└── shared/                  # Code shared across frontend and backend
    ├── constants.ts         # Item database & static constants
    └── types.ts             # TypeScript interfaces
```

## Getting Started

### Prerequisites
- Node.js 18+
- npm

### 1. Backend

```bash
cd backend
cp .env.example .env
npm install
npm run dev
```

The API server runs on `http://localhost:5000` by default.

### 2. Frontend

```bash
cd frontend
cp .env.example .env.local
npm install
npm run dev
```

Open `http://localhost:3000` in your browser.

## License

MIT
