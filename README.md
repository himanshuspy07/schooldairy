# School Diary 📓

A mobile-first, 100% offline Progressive Web App (PWA) designed for students to track their daily attendance, fee payments, and exam marks with zero clutter and native app ergonomics.

---

## 🎨 Theme & Aesthetic Discipline

- **Strictly NO BLUE**: No blue, indigo, sky, cyan, teal, or violet anywhere in the application.
- **Warm Natural Palette**:
  - Background: Warm off-white (`#FAF7F2`)
  - Primary: Deep forest green (`#2E7D4F`)
  - Accent: Warm amber (`#D97706`)
  - Danger / Absence: Soft cardinal red (`#DC2626`)
  - Text: Charcoal stone (`#1C1917`)
- **Native Ergonomics**:
  - Full-screen standalone feel with no browser chrome when installed.
  - Fixed 4-tab bottom navigation (Attendance, Fees, Marks, Profile).
  - Bottom sheets (not centered popups) for all inputs and actions.
  - Touch targets of $\ge 44$px with safe-area insets (`env(safe-area-inset-top)` and `env(safe-area-inset-bottom)`).
  - Pull-to-refresh and rubber-band overscroll disabled.

---

## 🚀 Getting Started & Local Development

### 1. Install Dependencies
```bash
npm install
```

### 2. Run the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your mobile browser or desktop browser mobile inspection view.

### 3. Build for Production
```bash
npm run build
npm run start
```

---

## 📦 Deployment Guides

### Deploying to Vercel
1. Push your code to GitHub / GitLab / Bitbucket.
2. Go to [Vercel Dashboard](https://vercel.com) and click **Add New Project**.
3. Import the repository. Vercel automatically detects Next.js.
4. Deploy!

### Deploying to Netlify
1. Connect your repository in [Netlify](https://netlify.com).
2. Set the build command to `npm run build`.
3. Set the publish directory to `.next`.
4. Add the `@netlify/plugin-nextjs` essential plugin.

### Static Export Hosting (GitHub Pages, Cloudflare Pages)
To export static assets, set `output: 'export'` in `next.config.ts`, run `npm run build`, and serve the generated `out/` folder.

---

## 📱 How to Install on a Mobile Phone

### On Android (Chrome / Edge / Samsung Internet)
1. Open the deployed School Diary URL in Google Chrome.
2. Tap the in-app **"Install App"** button located in the top header, or tap the browser menu (⋮) and select **"Add to Home screen"** / **"Install app"**.
3. School Diary will be installed as a standalone app with its green diary icon and splash screen.

### On iOS (iPhone & iPad - Safari)
1. Open the deployed School Diary URL in **Safari**.
2. Tap the **Share** button (the square with an arrow pointing upward) in the bottom toolbar.
3. Scroll down in the sheet and tap **Add to Home Screen**.
4. Confirm by tapping **Add** in the top right.
5. School Diary will launch in full-screen standalone mode with no Safari address bar or navigation buttons.

---

## 🏗️ Architecture & Data Model

All data is stored directly on the student's device using **IndexedDB via Dexie**. No external APIs, logins, or cloud backends are required.

### 1. Student Profiles (`profiles`)
```ts
interface StudentProfile {
  id?: number;              // Auto-increment primary key
  name: string;             // Student full name
  grade: string;            // Class / Grade (e.g., "10th")
  section?: string;         // Section (e.g., "A")
  rollNo?: string;          // Roll number
  school: string;           // School name
  sessionStart: string;     // YYYY-MM-DD (e.g., "2026-04-01")
  sessionEnd: string;       // YYYY-MM-DD (e.g., "2027-03-31")
  weeklyOffDays: number[];  // 0 = Sunday, 1 = Monday, etc. Default [0]
  photoUrl?: string;        // Optional photo base64
  currency: string;         // Currency symbol (default: "₹")
  createdAt: number;
  updatedAt: number;
}
```

### 2. Attendance (`attendance`)
```ts
interface AttendanceRecord {
  id?: number;
  studentId: number;
  date: string;             // YYYY-MM-DD (local date, no UTC skew)
  status: 'present' | 'absent' | 'holiday';
  note?: string;
  createdAt?: number;
}
```
- **Percentage Formula**: $\text{Attendance } \% = \frac{\text{Present}}{\text{Present} + \text{Absent}} \times 100$. Holidays and unmarked days are excluded.
- Handled edge cases: If working days equal 0, shows `—` instead of `NaN`.

### 3. Fees (`fees`)
```ts
interface FeePayment {
  id?: number;
  studentId: number;
  amount: number;
  date: string;             // YYYY-MM-DD
  note?: string;
  createdAt?: number;
}
```

### 4. Exams & Marks (`exams`)
```ts
interface ExamRecord {
  id?: number;
  studentId: number;
  name: string;             // e.g. "Unit Test 1"
  date: string;             // YYYY-MM-DD
  subjects: {
    name: string;
    obtained: number;
    maxMarks: number;
  }[];
  createdAt?: number;
}
```
- Real-time subject validation: `obtained <= maxMarks` and `maxMarks > 0`.
- Includes **Compare Mode** for multi-exam subject-by-subject comparison using non-blue series colors.

---

## 🛡️ Edge Cases Tested & Verified

1. **No Profiles on First Launch**: Automatically opens the "Create Student Profile" bottom sheet. Once completed, switches immediately to the Attendance tab.
2. **Division by Zero Handling**: Empty attendance ranges or exams with 0 marks safely yield `—` rather than `NaN` or crashes.
3. **Editing & Deleting Records**: Confirmation dialogs for deleting profiles, exams, and fee payments with automatic cascade deletion of linked child records.
4. **Switching Profiles**: Completely isolates attendance, fees, and marks per student with instant reactive UI updates.
5. **Offline Use**: Pre-cached service worker app shell (`/sw.js`), full IndexedDB persistence, offline indicator banner, and `navigator.storage.persist()` registration.
