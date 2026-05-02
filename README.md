# 🎯 Object Hunt — Real-Time Vision-Based Object Recognition Game

A browser-based multiplayer (same device) game where players must find real-world objects using a webcam within a time limit. Powered by **YOLOv8** for real-time object detection.

![Tech Stack](https://img.shields.io/badge/React-19-blue) ![Tech Stack](https://img.shields.io/badge/FastAPI-0.115-green) ![Tech Stack](https://img.shields.io/badge/YOLOv8-Nano-purple) ![Tech Stack](https://img.shields.io/badge/TailwindCSS-3.4-cyan)

---

## 🎮 How It Works

1. **Setup** — Add player names, choose difficulty and number of rounds
2. **Play** — Each player gets a turn with a random prompt (e.g. "Find a bottle")
3. **Detect** — The webcam captures frames and sends them to the YOLOv8 backend
4. **Score** — If the object is found before the timer runs out → +1 point!
5. **Win** — Final leaderboard shows the champion 🏆

---

## 📁 Project Structure

```
CV_mini_project/
├── backend/                  # FastAPI + YOLOv8
│   ├── main.py              # App entry point
│   ├── model.py             # YOLOv8 model + color detection
│   ├── requirements.txt     # Python dependencies
│   ├── routes/
│   │   └── detect.py        # POST /detect endpoint
│   └── utils/
│       └── prompts.py       # Prompt definitions + matching
│
├── frontend/                 # React + Vite + Tailwind
│   ├── src/
│   │   ├── components/      # CameraFeed, Timer, ScoreBoard, etc.
│   │   ├── pages/           # PlayerSetup, Game, Leaderboard
│   │   ├── hooks/           # useCamera, useGameLogic
│   │   ├── utils/           # API calls, prompts, sounds
│   │   ├── App.jsx          # Root component with routing
│   │   └── index.css        # Tailwind + custom styles
│   └── package.json
│
└── README.md
```

---

## 🚀 Setup Instructions

### Prerequisites
- **Python 3.9+**
- **Node.js 18+**
- A working webcam

### 1. Backend Setup

```bash
# Navigate to backend
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# macOS/Linux:
# source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run the server
python main.py
```

The backend will start at **http://localhost:8000**.

> ⚡ On first run, YOLOv8n model weights (~6MB) will be automatically downloaded.

### 2. Frontend Setup

```bash
# Navigate to frontend
cd frontend

# Install dependencies
npm install

# Start dev server
npm run dev
```

The frontend will start at **http://localhost:5173**.

---

## 📡 API Endpoints

### `POST /detect`
Send an image frame for object detection.

**Form Data:**
| Field | Type | Description |
|-------|------|-------------|
| `image` | File | Image file upload |
| `image_base64` | String | Base64-encoded image (alternative) |
| `detect_color_name` | String | Optional: color name for color detection |

**Response:**
```json
{
  "detections": [
    {
      "label": "bottle",
      "confidence": 0.87,
      "bbox": [120, 45, 200, 350]
    }
  ]
}
```

### `GET /health`
Returns `{"status": "ok"}` when the server is running.

---

## 🎯 Game Features

| Feature | Description |
|---------|-------------|
| 🎮 Multiplayer | Up to 6 players on the same device |
| 📷 Live Camera | Real-time webcam feed with detection overlay |
| 🤖 YOLOv8 Detection | 80 COCO object classes |
| 🎨 Color Detection | HSV-based color filtering for "find something red" prompts |
| ⏱️ Adaptive Timer | Timer shortens each round (30s → 20s) |
| 🔊 Sound Effects | Web Audio API generated sounds (no files) |
| 🏆 Leaderboard | Confetti animation, medals, stats |
| 🌙 Dark Mode | Premium dark UI with glassmorphism |
| ⚡ Difficulty Levels | Easy (objects), Hard (colors), Mixed |

---

## ⚙️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Vite, Tailwind CSS |
| Backend | Python FastAPI, Uvicorn |
| CV Model | YOLOv8n (Ultralytics) |
| Image Processing | OpenCV |
| Routing | React Router v7 |

---

## 🧪 Performance

- YOLOv8**n** (nano) model for fastest inference
- Frames resized to 640×480 before sending
- Frame capture every **500ms** (not every frame)
- Async FastAPI endpoints
- Model loaded once at startup (singleton)
