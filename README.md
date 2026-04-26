# DermAI - Offline Diagnostic Intelligence 

DermAI is an offline-first mobile application designed specifically for rural health operators in India. The platform focuses on high-fidelity, AI-powered diagnosis of skin conditions for patients with Fitzpatrick Type V and VI skin tones. Built for environments with low literacy and intermittent internet connectivity, it ensures seamless data collection, scanning, and referral generation anywhere.

## Key Features

- **Offline-First Capabilities:** Employs async storage and a local-first architecture to operate seamlessly in deep rural areas.
- **Guided Diagnostic Workflows:** A beautifully simple, 3-step diagnostic flow (Patient Details, Symptoms History, and Camera Scan) styled with intuitive interfaces.
- **Fitzpatrick Type V & VI Optimized:** Specialized flows built to accommodate AI models specifically tailored for deeper skin tones.
- **AI Camera Integration:** Robust scanning capabilities using Expo Camera with integrated layout templates.
- **Robust Type-Safe Backend:** Node.js Express server validated end-to-end via shared Zod schemas and Drizzle ORM.

## Tech Stack

### Frontend (Mobile App / PWA)
- **Framework:** React Native with **Expo** (v54) & Expo Router
- **Language:** TypeScript 
- **Networking/State:** `@tanstack/react-query`, `@react-native-async-storage/async-storage`
- **UI & UX:** `expo-blur`, `expo-glass-effect`, `react-native-reanimated`, Lucide Icons
- **Device Integrations:** `expo-camera`, `expo-location`, `expo-speech`

### Backend (API Server)
- **Runtime:** Node.js
- **Framework:** Express.js 
- **Database / ORM:** Drizzle ORM
- **Validation:** Zod (shared bi-directionally with the frontend)
- **Media Processing:** Sharp and Multer
- **Logs:** Pino (`pino-http`)

## Getting Started

The project is structured as a robust **pnpm workspaces** monorepo containing everything from the app to the backend.

### Prerequisites

- [Node.js](https://nodejs.org/en/)
- [pnpm](https://pnpm.io/)
- Expo Go on your mobile device (or iOS Simulator/Android Emulator)

### Installation

Clone the repository and install all dependencies from the project root:
```bash
git clone https://github.com/tulippppp/DermAI-Offline-Diagnostic-Intelligence.git
cd DermAI-Offline-Diagnostic-Intelligence

# Install all monorepo dependencies
pnpm install
