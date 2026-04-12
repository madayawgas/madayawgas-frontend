# MadayawGas Frontend

A React-based dashboard for managing fleet operations for MadayawGas.

## Tech Stack
- **Framework:** React 19 (Vite)
- **Styling:** Tailwind CSS 4
- **Routing:** React Router 7
- **Charts:** Recharts
- **Icons:** Lucide React

## Getting Started

### 1. Clone the repository
```bash
git clone <repository-url>
cd madayawgas-frontend
```

### 2. Install dependencies
```bash
npm install
```

### 3. Start development server
```bash
npm run dev
```

## Project Structure
```text
src/
├── assets/      # Static assets (images, svgs)
├── components/  # Reusable UI components
│   ├── dashboard/
│   ├── fleet/
│   ├── layout/
│   └── elements/
├── context/     # React Context (State Management)
├── data/        # Mock data for development
├── pages/       # Route-level components
│   ├── Dashboard/
│   ├── Fleet/
│   ├── Login/
│   └── Users/
└── App.jsx      # Main application component & routes
```

## Available Scripts
- `npm run dev`: Starts the development server.
- `npm run build`: Builds the app for production.
- `npm run lint`: Runs ESLint for code quality.
- `npm run preview`: Previews the production build locally.
