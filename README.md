# WebVIco (webvico) 🎬✨

[![npm version](https://img.shields.io/npm/v/webvico.svg?style=flat-square)](https://www.npmjs.com/package/webvico)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square)](LICENSE)
[![WebGL 2.0](https://img.shields.io/badge/WebGL-2.0-orange?style=flat-square)](https://www.khronos.org/registry/webgl/specs/latest/2.0/)
[![React 18](https://img.shields.io/badge/React-18-blue?style=flat-square)](https://react.dev/)
[![Tailwind CSS v4](https://img.shields.io/badge/Tailwind-v4-38bdf8?style=flat-square)](https://tailwindcss.com/)

> **In-Browser AI Video Color Grading Tool.** Fully client-side, zero-backend web application that lets you grade video footage in real time with a WebGL2 shader pipeline, custom 3D `.cube` LUTs, and an autonomous AI Colorist Agent powered by your own API keys.

---

## ⚡ Quick Start

### Option 1: Install Globally via npm

```bash
npm install -g webvico
webvico
```

That's it! `webvico` starts a local server and instantly opens the color grading studio in your default browser.

---

### Option 2: Instant Run via npx (Zero Install)

```bash
npx webvico
```

---

### Option 3: Clone & Develop Locally

```bash
git clone https://github.com/your-username/webvico.git
cd webvico

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Test CLI locally
npm start
```

---

## 🚀 Key Features

- **🎮 Raw WebGL 2.0 Shader Pipeline**: 
  - Zero Three.js overhead. Ultra-fast hardware-accelerated 2D quad and 3D texture sampling via `twgl.js`.
  - Real-time uniforms: **Exposure** (EV stops), **Contrast**, **Saturation**, **Temperature**, **Tint**, **Shadows RGB tint**, and **Highlights RGB tint**.
- **🧊 Custom 3D `.cube` LUT Parser**: 
  - Written completely from scratch in ~50 lines without external libraries.
  - Full support for Adobe & DaVinci Resolve 3D LUT specifications (`TITLE`, `LUT_3D_SIZE`, row-major RGB float samples).
  - Half-texel offset correction to prevent edge clamping artifacts.
- **🎨 Built-in Cinematic Presets**:
  - `Warm Film`: Golden-hour warmth with lifted film blacks.
  - `Teal & Orange`: Classic Hollywood blockbuster contrast.
  - `Black & White Film`: High-contrast Kodak Tri-X monochrome grade.
  - `Bleach Bypass`: Silver-retention look with desaturated highlights and punchy shadows.
  - `Neutral / None`: 1:1 passthrough calibration.
- **📂 Bring Your Own LUT**:
  - Drag and drop or upload any custom `.cube` 3D LUT file to apply it instantly.
- **🤖 Autonomous AI Colorist Agent (BYOK)**:
  - Supports **Anthropic** (`claude-3-5-sonnet`), **OpenAI** (`gpt-4o`), and **Google** (`gemini-2.5-flash`) via native browser `fetch()` (zero SDK bloat).
  - **Auto-Grade**: Extracts 3–4 keyframes across the footage, analyzes lighting/skin tones/genre cues, and automatically sets the grading sliders.
  - **Refine**: Re-analyzes the graded result against professional standards and refines parameters (capped at 2 calls to protect API spend).
  - **100% Privacy**: Keys are stored strictly in `sessionStorage` (cleared on tab close, never sent to any server).
- **🪟 Interactive Split-Screen & Hold Compare**:
  - Draggable split-screen divider line to compare original vs. graded footage in real time.
  - "Hold to Compare" button for instantaneous before/after inspection.
- **📼 Video Export with Audio**:
  - Uses native `canvas.captureStream()` and `MediaRecorder` API with Web Audio API routing to export downloadable `.webm` / `.mp4` video files with sound.
- **🧪 Out-of-the-Box Synthetic Test Footage**:
  - Includes a built-in animated Macbeth 24-patch color calibration target, sunset gradients, and moving specular highlights—ready to test immediately without uploading a file.

---

## 🛠️ Tech Stack

| Technology | Purpose |
| :--- | :--- |
| **Vite** | Lightning-fast bundler and development environment |
| **React 18 + TypeScript** | Component architecture with full type safety |
| **Tailwind CSS v4** | Modern styling with dark studio aesthetic |
| **Zustand** | Single global state store for grading parameters and video state |
| **twgl.js** | Thin wrapper over raw WebGL2 for programs, buffers, and textures |
| **react-dropzone** | Accessible drag-and-drop file handling |
| **lucide-react** | Clean, modern UI icons |
| **framer-motion** | Subtle slider feedback and panel transitions |

---

## 📁 Repository Structure

```
webvico/
├── bin/
│   └── webvico.js             # Global CLI launcher (serves app & opens browser)
├── public/
│   └── luts/                  # 3D .cube preset LUTs
├── src/
│   ├── components/
│   │   ├── UploadScreen.tsx   # Video dropzone & test footage selector
│   │   ├── CanvasPreview.tsx  # WebGL2 viewport & playback scrubber
│   │   ├── GradingPanel.tsx   # Manual primary & split-toning sliders
│   │   ├── LutPresetPicker.tsx# 4 built-in LUT presets
│   │   ├── LutUpload.tsx      # Custom .cube file uploader
│   │   ├── AiColoristPanel.tsx# BYOK AI Colorist agent panel
│   │   ├── BeforeAfterToggle.tsx # Split-screen & hold-to-compare
│   │   └── ExportButton.tsx   # MediaRecorder canvas export
│   ├── lib/
│   │   ├── webgl/
│   │   │   ├── shader.ts      # Standalone GLSL shaders
│   │   │   └── renderer.ts    # WebGL2 engine & twgl setup
│   │   ├── lut/
│   │   │   └── parseCubeFile.ts # Custom 50-line .cube parser
│   │   ├── ai/
│   │   │   ├── providers.ts   # Direct REST fetch wrappers for Claude, GPT-4o, Gemini
│   │   │   ├── prompts.ts     # Analysis and refinement prompts
│   │   │   └── types.ts       # GradeParams & AgentResponse types
│   │   ├── export/
│   │   │   └── recordCanvas.ts# Canvas stream recorder with audio
│   │   └── video/
│   │       └── sampleVideo.ts # Synthetic Macbeth test footage generator
│   ├── store/
│   │   └── gradeStore.ts      # Zustand global store
│   ├── App.tsx                # Studio layout orchestrator
│   ├── main.tsx               # React entry
│   └── index.css              # Tailwind v4 styles & custom sliders
├── package.json
├── tsconfig.json
├── vite.config.ts
└── LICENSE                    # MIT License
```

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

Distributed under the MIT License. See [`LICENSE`](LICENSE) for more information.
