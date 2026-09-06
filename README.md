RehabPlay 🖐️

AI-powered stroke rehabilitation gaming platform featuring real-time hand tracking, personalized therapy plans, and progress analytics — built to make hand rehabilitation feel less like a chore and more like a game.

Developed during a 2-week internship at Tech4Rehab.

About

RehabPlay turns repetitive hand physiotherapy exercises into engaging, playable games. Patients recovering from stroke perform therapeutic hand movements — which are tracked live through the webcam — to play, while a dashboard tracks their recovery progress over time.

Features
🎥 Real-time hand tracking using MediaPipe Hands — no external sensors or wearables needed, just a webcam

🎮 Four therapeutic game modes:
Fruit Catcher
Balloon Pop
Traffic Signal
Finger Match

🧑‍⚕️ Personalized therapy profiles — sessions adapt based on the patient's affected hand, stroke severity, and difficulty level
📊 Progress dashboard — session history, accuracy trends, streaks, and daily goal tracking
🔐 Simple sign-up/login flow to save and track individual patient progress

Tech Stack

Frontend: React 19, TypeScript, Vite
Styling: Tailwind CSS
Hand Tracking: MediaPipe Hands
Charts: Recharts
Icons/Animation: Lucide React, Motion

Screenshots & Demo
<!-- Add screenshots and/or a demo GIF/video here -->

Getting Started

Prerequisites: Node.js

Clone the repo

bash
   git clone <your-repo-url>
   cd rehabplay
   
Install dependencies

bash
   npm install
   
Set up environment variables — copy .env.example to .env.local and add your Gemini API key

bash
   cp .env.example .env.local
   
Run the app

bash
   npm run dev
   
Open http://localhost:3000 and allow camera access to start playing

How It Works
The patient sets up a profile with their affected hand, stroke severity, and therapy goals.
MediaPipe detects hand landmarks from the webcam feed in real time and classifies gestures (open palm, closed fist, wrist rotation, finger position).
These gestures drive gameplay across the four game modes — turning wrist rotation, finger extension, and hand movement into game controls.
Each session's score, accuracy, and duration are logged and visualized on the dashboard to track recovery over time.
Team

Built by Neha S and Miruthula R during a 2-week internship at Tech4Rehab.
