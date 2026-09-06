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

Screenshots
<img width="1530" height="827" alt="image" src="https://github.com/user-attachments/assets/22298271-3afe-4c9a-ae72-1839afef3968" />
<img width="1531" height="824" alt="image" src="https://github.com/user-attachments/assets/daa76e65-0df3-4294-b3a3-a1611a9602fd" />
<img width="1535" height="814" alt="image" src="https://github.com/user-attachments/assets/caf0e77c-bdd2-4445-be28-48026b09fa91" />
<img width="1526" height="824" alt="image" src="https://github.com/user-attachments/assets/657f9351-45d4-4e05-b20d-ed89e8673e07" />
<img width="977" height="722" alt="image" src="https://github.com/user-attachments/assets/5beaeb07-9385-4420-aa50-d997d218452b" />
<img width="953" height="614" alt="image" src="https://github.com/user-attachments/assets/28a53255-51f3-470b-8911-b9b931eb42aa" />







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
