# 2D Playable Runner Creative

High-performance 2D Playable Ad Runner creative built from scratch using **PixiJS v8**, **TypeScript**, and **Vite**.

## ✨ Features

- **Built from scratch on PixiJS v8**: 2D WebGL/Canvas rendering pipeline with 60 FPS performance and low memory footprint.
- **Flexible Rope Physics Finish Line**: Dynamic cloth/rope simulation (`MeshRope` with mass-spring/verlet points) that stretches realistically upon contact and severs into two elastic swinging ribbon halves with gravity and damping.
- **Multi-layered Parallax World**: Responsive parallax background with distant skyline, trees, lamps, bushes, and asphalt road scrolling at differentiated depth speeds.
- **Character Controller**: Smooth animation states (Idle, Run, Jump, Hurt), responsive tap/swipe-up jumping physics, invincibility frames with visual flashing.
- **Game Objects & Enemies**: Dynamic enemy chasing, pulsating glowing obstacles, floating collectible dollar bills and PayPal cards with collection FX.
- **Rich Audio System**: Howler.js audio manager with BGM loop, jump sound, hurt sound, collectible sound, and victory fanfare with user gesture unlock.
- **Universal Ad Network & MRAID Adapter**: Compatible with MRAID 2.0/3.0, Google Play Store, iOS App Store, SuperHTML, Liftoff, and AppLovin.
- **Single-File HTML Bundle (< 5 MB)**: Bundles all scripts, textures, spritesheets, audio, fonts, and styles into one portable HTML file (~2.5 MB).
- **Responsive Layout**: Adapts dynamically across portrait (9:16), landscape (16:9), and tablet (4:3) screen ratios.

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm / pnpm / yarn

### Installation
```bash
npm install
```

### Development Server
```bash
npm run dev
```

### Production Build (Single HTML File)
```bash
npm run build
```
The output file is generated at `dist/index.html` (~2.55 MB).

---

## 🎮 Controls

- **Desktop**: Click / Space / Arrow Up / W to Jump
- **Mobile**: Tap screen or Swipe Up to Jump

---

## 📦 Deployment (Vercel)

The project is pre-configured with `vercel.json` for zero-config Vercel deployment:
```bash
vercel deploy
```
