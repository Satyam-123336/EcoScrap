# EcoScrap Pickup — AI & Autonomous Drone E-Waste Recycling Platform

[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.0-61dafb.svg)](https://reactjs.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38bdf8.svg)](https://tailwindcss.com/)
[![Express](https://img.shields.io/badge/Express-4.21-000000.svg)](https://expressjs.com/)

**EcoScrap Pickup** is a next-generation, AI-powered electronic waste recycling ecosystem. Designed to bridge the gap between autonomous robotics simulation and gamified environmental sustainability, EcoScrap makes recycling electronic devices effortless, transparent, and rewarding.

---

## ✨ Key Features

* 🤖 **Instant AI Vision Classification:** Upload images of damaged or obsolete electronics. Powered by Google Gemini Vision models, the platform automatically detects device categories, estimates weight, and calculates recycling tiers.
* 🚁 **Autonomous Drone Dispatch Logistics:** Integrated with CoppeliaSim telemetry simulation for contactless, rapid waypoint collection and dynamic route optimization.
* 🏆 **Gamified EcoPoints & Tier Ranks:** Earn **50 EcoPoints per kilogram** of e-waste recycled. Progress through Champion tiers (*Eco Beginner*, *Eco Champion*, *Eco Legend*, and *Eco Master*) and unlock exclusive rewards.
* 🌍 **Verified Carbon Offset Tracking:** Every kilogram of recycled electronic waste saves approximately **0.4 kg of CO₂ emissions**. Users can generate and download personalized **Eco Champion Certificates**.
* 💬 **24/7 EcoBot AI Assistant:** An intelligent built-in virtual assistant offering real-time guidance on recycling guidelines, item acceptability, and scheduling.
* 👥 **Dedicated Creators Showcase:** Meet the visionaries and engineering architects driving the mission behind EcoScrap Pickup.

---

## 🛠️ Technology Stack

### **Frontend Architecture**
* **Framework:** React 18 with TypeScript & Vite
* **Styling & UI:** Vanilla Tailwind CSS, Radix UI Primitives, Glassmorphism design tokens
* **State & Data Fetching:** TanStack React Query v5
* **Routing:** Wouter lightweight client-side router
* **Icons & Assets:** Lucide React

### **Backend & Database**
* **Runtime & Server:** Node.js, Express.js (RESTful architecture)
* **Database & ORM:** PostgreSQL (Neon Serverless) with Drizzle ORM
* **Authentication:** Express Session with secure persistence

### **AI & Simulation Engines**
* **Vision & NLP:** Google Gemini Generative AI SDK (`@google/generative-ai`)
* **Robotics Simulation:** Python TCP/IP server interfacing with CoppeliaSim (`ai_model/` & `simulation/`)

---

## 🚀 Getting Started (Local Development)

Follow these steps to set up the project locally on your machine.

### 1. Clone the Repository
```bash
git clone https://github.com/Satyam-123336/EcoScrap.git
cd EcoScrap/EcoScrapPickup
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Create a `.env` file in the root directory (`EcoScrapPickup/.env`) and add the following keys:
```env
NODE_ENV=development
DATABASE_URL=postgresql://user:password@your-neon-hostname.neon.tech/dbname?sslmode=require
SESSION_SECRET=your_super_secret_random_string
GEMINI_API_KEY=your_google_gemini_api_key
```

### 4. Synchronize Database Schema
Push the Drizzle ORM schema to your PostgreSQL database:
```bash
npm run db:push
```

### 5. Start the Development Server
Launch both the Express backend server and the Vite React development server simultaneously:
```bash
npm run dev:full
```
*Alternatively, run `npm run dev` to start the monolithic full-stack server on `http://localhost:5000`.*

---

## 📦 Production Deployment

The project is pre-configured for seamless deployment across cloud platforms such as **Render, Railway, Fly.io, Heroku, or AWS**.

### Build Verification
Compile TypeScript and bundle optimized client assets:
```bash
npm run build
```

### Production Start
Run the production bundle (serves both API endpoints and the static client UI from `/dist`):
```bash
npm start
```

---

## 👥 Meet the Inventors

EcoScrap Pickup was conceptualized and engineered by a dedicated multidisciplinary engineering team:
* **Satyam Samanta** — *Lead Inventor & Full-Stack AI Engineer*
* **Dr. Kriti Taneja** — *Research Supervisor & AI/ML Advisor*
* **Shivang Verma** — *Drone Hardware & Embedded Systems Engineer*

Visit the **[About Us / Meet the Creators](/creators)** section within the live application to read our complete engineering philosophy and technical breakdowns.

---

## 📄 License & Legal

This project is licensed under a License. See the **Terms of Service**, **Privacy Policy**, and **Cookie Policy** pages within the application for compliance and data handling disclosures.
