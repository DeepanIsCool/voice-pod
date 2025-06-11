# voice-pod

A modern web application built with Next.js, TypeScript, and Tailwind CSS, designed to provide a voice-based dashboard experience. This repository is organized for scalability and developer productivity, featuring modular components, custom React hooks, and a clear project structure.

---

## Table of Contents

- [Features](#features)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Development](#development)
- [Build & Production](#build--production)
- [Scripts](#scripts)
- [Configuration](#configuration)
- [Usage](#usage)
- [Contributing](#contributing)
- [Troubleshooting](#troubleshooting)
- [License](#license)

---

## Features

- Next.js App Router structure
- TypeScript support
- Tailwind CSS for rapid UI development
- Modular and reusable React components
- Custom hooks for common logic
- Dashboard with authentication, theming, and call logs
- Responsive design with mobile support
- Theming (light/dark mode)

---

## Project Structure

```
voice-pod/
├── app/               # Main application pages and root layout
│   ├── dashboard/     # Dashboard-specific pages
│   ├── globals.css    # Global styles for the app
│   ├── layout.tsx     # App root layout
│   └── page.tsx       # Home page
├── components/        # Reusable React components
│   ├── call-logs-table.tsx
│   ├── dashboard-sidebar.tsx
│   ├── login-form.tsx
│   ├── mode-toggle.tsx
│   ├── theme-provider.tsx
│   └── ui/            # Generic UI components
├── hooks/             # Custom React hooks
│   ├── use-mobile.tsx
│   └── use-toast.ts
├── lib/               # Utility and helper functions
│   ├── auth.ts
│   └── utils.ts
├── public/            # Static assets (images, icons, etc.)
├── styles/            # Additional global styles
├── package.json       # Project dependencies and scripts
├── next.config.mjs    # Next.js configuration
├── tailwind.config.ts # Tailwind CSS configuration
├── tsconfig.json      # TypeScript configuration
└── ...                # Other config and lock files
```

---

## Prerequisites

- **Node.js** (v18.x or higher recommended)
- **npm** (v9.x or higher) OR **pnpm** (if preferred)
- **Git** (to clone the repository)

---

## Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/DeepanIsCool/voice-pod.git
   cd voice-pod
   ```

2. **Install dependencies**

   Using npm:
   ```bash
   npm install
   ```

   Or using pnpm:
   ```bash
   pnpm install
   ```

---

## Development

Start the development server:

```bash
npm run dev
```
or
```bash
pnpm dev
```

- The app will run at `http://localhost:3000` by default.
- Hot-reloads on code changes.

---

## Build & Production

To build the application for production:

```bash
npm run build
```
or
```bash
pnpm build
```

To start the production server:

```bash
npm start
```
or
```bash
pnpm start
```

---

## Scripts

Available scripts (see `package.json` for the full list):

- `dev` – Start the development server
- `build` – Build the app for production
- `start` – Start the production server
- `lint` – Lint the codebase
- `format` – Format the codebase (if configured)
- `test` – Run tests (if tests are present)

---

## Configuration

- **Environment Variables:**  
  You may need to create a `.env.local` file for secrets or runtime configuration.
  Example:
  ```
  # .env.local
  NEXT_PUBLIC_API_URL=https://api.example.com
  ```
  Refer to `lib/auth.ts` or other utility files for required environment variables.

- **Tailwind CSS:**  
  Configuration in `tailwind.config.ts`.

- **TypeScript:**  
  Configuration in `tsconfig.json`.

---

## Usage

- **Authentication:**  
  The login form component (`components/login-form.tsx`) manages user authentication. Details of the backend or authentication provider should be configured in `lib/auth.ts` and environment variables.

- **Dashboard:**  
  The dashboard is accessible under `/dashboard` and provides features such as viewing call logs (`components/call-logs-table.tsx`) and navigating via the sidebar.

- **Theming:**  
  Light/dark mode is supported using the mode toggle (`components/mode-toggle.tsx`) and the theme provider.

- **Custom Hooks:**  
  - `use-mobile` detects mobile devices for responsive UI.
  - `use-toast` provides toast notifications.

---

## Contributing

1. Fork the repo and create your branch from `main`.
2. Make your changes.
3. Run linter, formatter, and tests.
4. Push your changes and open a Pull Request.

**Folder conventions:**  
- Place new components in `components/`.
- Add utility functions in `lib/`.
- Create new hooks in `hooks/`.
- Static files/images go in `public/`.

---

## Troubleshooting

- **Port issues:**  
  If port 3000 is in use, set a different port:
  ```bash
  PORT=4000 npm run dev
  ```

- **Dependency issues:**  
  Ensure Node.js and package manager versions match the prerequisites.

- **Build errors:**  
  Check configuration files and environment variables.

---

## License

[MIT](LICENSE) (or specify your license here)

---

## Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

---

## Maintainer

- [DeepanIsCool](https://github.com/DeepanIsCool)

---
