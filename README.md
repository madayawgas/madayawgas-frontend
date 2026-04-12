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
├── assets/          # Static files such as images (hero.png, logo.svg) and global SVGs.
├── components/      # Reusable UI components categorized by feature or utility:
│   ├── dashboard/   # Components specific to the dashboard (e.g., SalesGraph, StatCard).
│   ├── fleet/       # Fleet management components (e.g., TruckCard, MaintenanceStatus, Modals).
│   ├── layout/      # Layout-specific components like navigation bars and sidebars.
│   └── elements/    # Generic, reusable atoms or small UI elements.
├── context/         # React Context providers (e.g., DataContext.jsx) for global state management.
├── data/            # Local mock data files (trucks, users, dashboard stats) used for development and testing.
├── pages/           # High-level route components representing different views:
│   ├── Dashboard/   # The main analytics and overview page.
│   ├── Fleet/       # Fleet monitoring and management view.
│   ├── Login/       # User authentication and entry point.
│   └── Users/       # User management and permissions view.
├── App.jsx          # Root component that defines the application's routing and main structure.
├── index.css        # Global CSS, including Tailwind CSS imports and custom resets.
└── main.jsx         # Entry point for the React application that renders the App component.
```

## Available Scripts
- `npm run dev`: Starts the development server.
- `npm run build`: Builds the app for production.
- `npm run lint`: Runs ESLint for code quality.
- `npm run preview`: Previews the production build locally.
