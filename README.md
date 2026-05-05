# Hackmate

## Project overview

Hackmate is a React Native app built with Expo and TypeScript. This repository contains the initial scaffold for the project — a clean foundation with an organized `src/` directory ready for screens, components, API layers, and utilities to be added in subsequent steps.

## Setup

Prerequisites: Node.js 18+ and the [Expo Go](https://expo.dev/client) app on your phone (or an iOS Simulator / Android Emulator).

```bash
cd hackmate
npm install
npm start
```

Then scan the QR code printed in the terminal with Expo Go (Android) or the Camera app (iOS).

## Folder structure

```
hackmate/
├── App.tsx                 # Root component — renders HelloScreen
├── index.ts                # Expo entry point
├── app.json                # Expo configuration
├── assets/                 # Static assets (icons, splash, images)
└── src/
    ├── screens/            # Screen components
    ├── components/         # Reusable UI components
    ├── api/                # Supabase queries (added later)
    ├── lib/                # Utilities and clients
    ├── hooks/              # Custom React hooks
    ├── types/              # TypeScript type definitions
    └── constants/          # Colors, spacing, and other constants
```

## Tech stack

- **Expo** (~54) — React Native toolchain and runtime
- **React Native** (0.81) — Mobile UI framework
- **React** (19) — Component library
- **TypeScript** (~5.9) — Static typing
- **Prettier** — Code formatting
