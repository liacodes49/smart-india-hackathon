# 🧊 Antarctic Digital Twin

Welcome to the **Antarctic Digital Twin** project repository! This platform is being built for the Smart India Hackathon (SIH). It serves as a comprehensive digital twin for Antarctic research stations, enabling real-time telemetry monitoring, predictive maintenance, 3D visualization, and automated alerts.

## 🎯 Problem Statement (PS)
Operating in Antarctica presents extreme logistical and environmental challenges. Research stations need constant monitoring, and equipment failure can be life-threatening. 

**Our Solution:** We are building a *Digital Twin*—a virtual replica of the physical Antarctic research stations. This platform will:
- Monitor live telemetry from sensors (temperature, wind, power usage).
- Predict equipment failures using AI before they happen.
- Provide a full 3D visual interface of the stations.
- Allow seamless coordination, reporting, and resource management.

---

## 📂 Quick Folder Structure

We are using a **Monorepo** architecture powered by [Turborepo](https://turbo.build/). This means our Frontend, Backend, and shared code all live in this single repository to make development faster and keep everything in sync.

```text
smart-india-hackathon/
├── apps/
│   ├── web/               # 🖥️ Frontend: Next.js 16 + React + Tailwind + 3D
│   └── api/               # ⚙️ Backend: Express + Drizzle ORM + PostgreSQL
│
├── packages/              # 📦 Shared Code (Used by both Frontend & Backend)
│   ├── api-client/        # HTTP Client to make API requests easily
│   ├── schemas/           # Zod validation rules (Data Contracts)
│   ├── shared/            # Shared Typescript types, enums, constants
│   ├── ui/                # Shared UI Components (shadcn/ui)
│   ├── eslint-config/     # Code linting rules
│   └── typescript-config/ # Typescript settings
│
├── infrastructure/        # 🏗️ Docker & Database configs (Supabase)
├── docs/                  # 📚 Detailed documentation & guides
└── package.json           # 📦 Root configuration (pnpm)
```

## 🚀 Getting Started

1. **Install Dependencies:**
   ```bash
   pnpm install
   ```

2. **Run the Project Locally:**
   ```bash
   pnpm dev
   ```
   *This starts both the Next.js Frontend and the Express API Backend at the same time.*

3. **Check Code Health:**
   ```bash
   pnpm lint
   pnpm typecheck
   ```

## 📖 For the Team!
Please read the highly detailed layman's guide inside the docs folder to understand exactly how our code is structured and the rules we must follow.

👉 **[Read the Team Onboarding Guide](./docs/TEAM_ONBOARDING.md)**