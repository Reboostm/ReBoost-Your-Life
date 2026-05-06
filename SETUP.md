# ReBoost Your Life — Setup Guide

## Firebase Setup (5 minutes)

### 1. Create Firebase Project
1. Go to https://console.firebase.google.com
2. Click **Add project** → name it "ReBoost Your Life"
3. Disable Google Analytics (not needed) → Create project

### 2. Enable Authentication
1. In Firebase Console → **Authentication** → **Get started**
2. Click **Email/Password** → Enable it → Save

### 3. Enable Firestore
1. In Firebase Console → **Firestore Database** → **Create database**
2. Choose **Start in production mode** → Select your region → Enable

### 4. Set Firestore Security Rules
1. In Firestore → **Rules** tab
2. Replace the default rules with the contents of `firestore.rules` in this project
3. Click **Publish**

### 5. Create Firestore Indexes
1. In Firestore → **Indexes** tab
2. You can create them manually, OR let the app auto-create them (first few queries will fail then prompt you with a link to create the index)
3. OR deploy with Firebase CLI: `firebase deploy --only firestore:indexes`

### 6. Get Your Config
1. In Firebase Console → **Project Settings** (gear icon)
2. Scroll to **Your apps** → Click **Web** (</> icon)
3. Register app (any nickname) → Copy the firebaseConfig values

### 7. Add Environment Variables
1. Copy `.env.local.example` to `.env.local`
2. Fill in your Firebase values:

```
NEXT_PUBLIC_FIREBASE_API_KEY=AIza...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456:web:abc123
```

---

## Local Development

```bash
npm install
npm run dev
```

Open http://localhost:3000

---

## Deploy to Vercel

1. Push this repo to GitHub
2. Go to https://vercel.com → Import your GitHub repo
3. In Vercel project settings → **Environment Variables** → Add all 6 `NEXT_PUBLIC_FIREBASE_*` vars
4. Deploy!

---

## How to Use

### First Time
1. Open the app → **Sign Up** with your email, name, and pick a color
2. Create a family group (you'll get a 6-letter invite code)
3. Share the invite code with family members so they can join

### Family Members Join
1. Sign up → tap **Join** → enter the invite code

### Add Your Exercise
1. Go to **Settings** → **Exercise Presets** → **Add**
2. Enter name (e.g. "Stairs at the Park"), steps (258), and whether to count both directions
3. Save it — your whole family can now use this preset

### Log a Workout
1. Tap the big **+** button in the middle of the nav
2. Select your exercise
3. Set how many sets (1 set = did it once, 2 = did it twice, etc.)
4. Enter your time (format: 4:03 or 4m3s)
5. Hit **Log It!**

### React to Family Workouts
- In the Feed, tap **React** on any family member's workout
- Pick 👍 🔥 💪 ⭐

### Check Rankings
- Tap **Rank** to see family leaderboard
- Filter by Today / Week / Month / All Time
- Rank by Steps, Workout Count, Best Time, or Streak

---

## Up vs Down Steps — How It Works

When you create an exercise preset:
- **Count both directions ON** → 258 steps × 2 = 516 steps per set
- **Count both directions OFF** → 258 steps per set

This is set per exercise. For stairs, most people count both ways since going down still takes effort and time. You can always change this setting.
