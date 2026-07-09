# CalorieAI 🥗🤖

### AI-Powered Hands-Free Calorie Tracker & Nutrition Assistant

**CalorieAI** is a premium, modern, responsive full-stack web application that allows users to track their nutrition goals using text, voice transcripts, or meal photo uploads. Using Google Gemini AI and the USDA FoodData Central database, the system parses meals in natural language, logs daily nutrients, tracks hydration, and provides personalized recommendations to help users reach their target weight goals.

---

## 🌟 Key Features

1. **AI Meal Log (Text)**: Describe what you ate in natural language (e.g. _"I had a cup of dal, 2 rotis and a banana"_), and Gemini will extract food items and portion sizes to log nutrients.
2. **AI Hands-Free Log (Voice)**: Tap the mic to record your voice using the **Browser Web Speech API**, transcriptions are automatically analyzed.
3. **AI Food Recognition (Vision)**: Upload a picture of your food, and Gemini Vision analyzes the items, estimates servings, calories, and macros.
4. **USDA & Gemini Fallback**: Checks cached values, queries USDA database, and falls back to Gemini AI nutrient estimation if USDA yields no results.
5. **Interactive Dashboard**: Track calories remaining, protein/carb/fat macro progress bars, and cumulative daily water logs featuring animated liquid wave states.
6. **Chronological Weight Trend & Analytics**: Visual charts for weekly calories, protein intake, and body weight logs using Recharts.
7. **Personalized AI Recommendations**: Gemini compiles customized breakfast, lunch, dinner, and healthy snack suggestions based on your remaining macro budget.
8. **Dark / Light Mode**: System-wide theme settings with glassmorphic visuals and smooth micro-animations.

---

## 🛠️ Technology Stack

- **Frontend**: React.js, Tailwind CSS (v4), React Router, Axios, Lucide Icons, Recharts
- **Backend**: Python FastAPI, SQLAlchemy (ORM), Pydantic (data validation), SQLite (development database)
- **AI Models**: Google Gemini API (`gemini-2.0-flash` for multimodal vision, text parsing, and recommendations)
- **Database**: PostgreSQL (recommended), SQLite (for quickstart)

---

## 🚀 Setup & Local Execution

Follow these steps to run both the FastAPI backend and Vite React frontend locally.

### Prerequisites

- Node.js (v18+)
- Python (v3.10+)

---

### Step 1: Backend Setup

1. Open a terminal and navigate to the `backend/` directory:

   ```bash
   cd backend
   ```

2. Create a Python virtual environment:

   ```bash
   python -m venv venv
   ```

3. Activate the virtual environment:
   - **Windows (PowerShell)**:
     ```powershell
     .\venv\Scripts\activate
     ```
   - **macOS/Linux**:
     ```bash
     source venv/bin/activate
     ```

4. Install the backend dependencies:

   ```bash
   pip install -r requirements.txt
   ```

5. Configure your environmental keys in `backend/.env`:
   - Open `backend/.env` in your editor.
   - Insert your API keys:
     ```env
     # Example for PostgreSQL
     DATABASE_URL=postgresql://user:password@localhost/calorie_ai

     SECRET_KEY=supersecretkeycalorieai12354!@#
     GEMINI_API_KEY=YOUR_GOOGLE_GEMINI_API_KEY
     USDA_API_KEY=YOUR_USDA_FOODDATA_CENTRAL_KEY
     ```
     _(Note: You will need to install `psycopg2-binary` if you are using PostgreSQL. If `USDA_API_KEY` is omitted, the backend automatically defaults to Gemini AI estimations. If `GEMINI_API_KEY` is omitted, the backend runs in a safe mock mode.)_

6. Run the FastAPI server:
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```
   The backend server will run on: **`http://localhost:8000`**

---

### Step 2: Frontend Setup

1. Open a new terminal and navigate to the `frontend/` directory:

   ```bash
   cd frontend
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Run the development build:
   ```bash
   npm run dev
   ```
   The React frontend server will run on: **`http://localhost:5173`**

---

## 📁 Folder Structure

### Backend

- `/app/models`: SQLAlchemy definitions (`User`, `Meal`, `WaterLog`, `WeightHistory`, `Recommendation`).
- `/app/schemas`: Pydantic input/output serializers.
- `/app/routes`: API endpoints grouped by controller (`auth`, `profile`, `meal`, `water`, `dashboard`, `recommendations`).
- `/app/services`: Integrations for `GeminiService` and `USDAService`.
- `/app/utils`: JWT helpers and password hashing functions.

### Frontend

- `/src/context`: State providers (`AuthContext`, `ThemeContext`, `ToastContext`).
- `/src/hooks`: Custom hooks (`useSpeechToText`, `useToast`).
- `/src/components`: UI layout containers, SVG rings, animated wave meters, and charts.
- `/src/pages`: Auth screens, Profile onboardings, Dashboard dashboards, Recommendations, and History filters.
- `/src/services`: Axios client instances configured with JWT interceptors.

---

## 🧪 Verification & Testing

### Automated Checks

Run compiling checks to confirm everything is configured:

- **Frontend build**: Run `npm run build` in `frontend/` directory.
- **Backend check**: Ensure FastAPI starts successfully on port 8000 without import warnings.

### Manual Walks

1. **Onboarding**: Register a new account. You'll be redirected to the **Profile** screen.
2. **Setup Goals**: Fill in weight, age, height, activity level, and targets. BMR, BMI, and calorie splits calculate instantly.
3. **Log a Meal**: Return to the dashboard, click **Log Meal**, describe a breakfast (e.g. _"2 scrambled eggs and toast"_). Watch it fetch details.
4. **Water Logs**: Log hydration using the cup or bottle quick-logs. See the animated wave level rise.
5. **AI Advisor**: Go to **AI Recommendations**, select your diet, and view meal recommendations generated by Gemini based on your remaining macro limits.
