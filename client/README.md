# 🖥️ Phantom Client Dashboard

A high-performance, premium web dashboard built with React 19 and Next.js 15. The client offers real-time visualization, campaign management, lead tracking, and fine-grained agent configuration interfaces.

---

## 🎨 Design Philosophy & Aesthetics

The interface is engineered to match the highest industry standards of modern SaaS:
- **Harmony & Contrast:** Dark-mode primary layout accented with deep glassmorphism and subtle gradients (violet, indigo, emerald).
- **Vibrant Interactive States:** Framer Motion Micro-animations for page transitions, tab switches, and hover actions.
- **Data Denseness:** A dashboard designed for execution, summarizing complex pipeline states (discovered → qualified → contacted → replied) without visual fatigue.

---

## 📂 Key Features & Pages

- **📈 Overview Dashboard (`app/dashboard/page.tsx`):**
  A high-level view showing active campaigns, critical pipeline health, outbound send volume graphs, and booked calls tracking.

- **🤖 Agent Monitor (`app/dashboard/agents/page.tsx`):**
  Real-time logging and status monitor displaying what the `Strategist`, `Hunter`, `Researcher`, `Outreacher`, and `Reply` agents are executing at any given moment.

- **🎯 Campaign Manager (`app/dashboard/campaigns/page.tsx`):**
  Interface for creating and editing target industry segments, location scopes, keyword modifiers, daily limits, sending hours, and custom instructions.

- **👥 Lead CRM (`app/dashboard/leads/page.tsx`):**
  Interactive table showing leads discovered, contact details, company description, qualification score (0-100), and enrichment signals. Allows manual lead approval/disapproval.

- **✉️ Outreach Templates (`app/dashboard/outreach/page.tsx`):**
  Drafting interface for email templates, follow-up sequencing intervals, and personalized variables.

- **📥 Inbox & Reply Manager (`app/dashboard/replies/page.tsx`):**
  Reviewing inbound emails, AI sentiment tagging (interested, neutral, has questions), objection classification, and draft review.

- **⚙️ Agency Settings (`app/dashboard/settings/page.tsx`):**
  Managing agency profiles, services list, unique value propositions, case studies (used by Outreacher), email SMTP/IMAP configurations, and Calendly hooks.

---

## 🛠️ Technology Stack

- **Framework:** Next.js 15 (App Router)
- **Runtime:** Node.js
- **State Management:** React Hooks & Context API
- **Animations:** `framer-motion`
- **Icons:** `lucide-react`
- **Styling:** CSS Modules / Tailwind CSS

---

## ⚡ Development & Scripts

### Installation

```bash
pnpm install
```

### Run Local Development Server

```bash
pnpm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application in the browser.

### Build Production Bundle

```bash
pnpm run build
```

---

## 🔌 API Integration

The client communicates with the Express backend located in the `server/` directory. Ensure the backend is running at the configured port (default `8080`) and the `NEXT_PUBLIC_API_URL` environment variable is correctly set in your `.env` file:

```env
NEXT_PUBLIC_API_URL=http://localhost:8080/api
```
