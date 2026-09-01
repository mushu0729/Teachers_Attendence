# Teacher Attendance System

Geo-verified teacher attendance — geofence check, photo capture with watermark,
KGID-based lookup, admin dashboard, Excel export. Free deploy on Vercel + Supabase.

---

## Step 1: Supabase Setup (Database + Photo Storage)

1. [supabase.com](https://supabase.com) pe GitHub se sign up karo, **New Project** banao.
2. Project khulne ke baad **left sidebar -> SQL Editor -> New query** kholo.
3. Is repo ki `schema.sql` file ka pura content copy-paste karo aur **Run** dabao.
   (Ye 3 tables banayega: `teachers`, `attendance`, `settings`)
4. **Left sidebar -> Storage -> New bucket**. Naam do: `attendance-photos`.
   Bucket banate waqt **Public bucket** toggle ON kar do (taaki photo links direct khul sakein).
5. **Left sidebar -> Table Editor -> teachers** table kholo -> upar right mein
   **Insert -> Import data from CSV** -> is repo ki `teachers.csv` file upload karo.
   (540 teachers already isme hain tumhari list se)
6. **Left sidebar -> Project Settings -> API** pe jao. Yahan se 2 cheezein copy karo:
   - **Project URL** -> `SUPABASE_URL`
   - **service_role key** (secret wala, anon wala nahi) -> `SUPABASE_SERVICE_ROLE_KEY`

---

## Step 2: Local Setup (Laptop pe)

```bash
cd teacher-attendance
npm install
cp .env.local.example .env.local
```

Ab `.env.local` file kholo aur values bharo:
- `SUPABASE_URL` aur `SUPABASE_SERVICE_ROLE_KEY` — Step 1.6 se
- `ADMIN_PASSWORD` — apna koi strong password socho
- School location/radius already fill hai (change kar sakte ho)

Test karo local pe:
```bash
npm run dev
```
Browser mein `http://localhost:3000` kholo (teacher form) aur
`http://localhost:3000/admin` (admin dashboard).

> Note: geolocation zyada browsers mein sirf HTTPS ya localhost pe kaam karta hai,
> local testing ke liye localhost theek hai.

---

## Step 3: GitHub pe Push

```bash
git init
git add .
git commit -m "Initial commit"
```
GitHub.com pe naya empty repository banao, phir:
```bash
git remote add origin https://github.com/<your-username>/<repo-name>.git
git branch -M main
git push -u origin main
```

---

## Step 4: Vercel pe Deploy (Free)

1. [vercel.com](https://vercel.com) pe GitHub se sign up karo.
2. **Add New -> Project** -> apna GitHub repo select karo -> **Import**.
3. Deploy hone se pehle **Environment Variables** section mein `.env.local`
   ki saari 6 values daal do (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY,
   ADMIN_PASSWORD, NEXT_PUBLIC_SCHOOL_LAT, NEXT_PUBLIC_SCHOOL_LNG,
   NEXT_PUBLIC_ALLOWED_RADIUS_METERS).
4. **Deploy** dabao. 1-2 minute mein live ho jayega, ek `.vercel.app` link milega.

Ye link hi tumhe teachers ko circulate karna hai. `/admin` add karke apna
admin dashboard access kar sakte ho (e.g. `https://your-app.vercel.app/admin`).

---

## Kaise kaam karta hai

- **Teacher link (`/`)**: Location check -> geofence ke andar hai toh KGID form
  khulta hai -> KGID dalte hi Name auto-fill -> camera se photo (watermark ke saath)
  -> submit. Server dobara se geofence + time window + duplicate check karta hai
  (client-side checks sirf UX ke liye hain, security server pe hai).
- **Admin (`/admin`)**: Password se login -> saari entries table mein -> time
  window kabhi bhi change kar sakte ho -> "Download Excel" button se poora
  data `.xlsx` file mein.

## Important Notes

- Same KGID se ek din mein sirf ek hi attendance mark ho sakti hai (duplicate block).
- "Capture" attribute camera force karta hai zyada phones pe, lekin 100% gallery-upload
  block guarantee nahi karta — kuch purane/custom browsers ismein bypass allow kar sakte hain.
- Time window ab admin panel se change hoti hai (fixed nahi hai) — IST timezone use hoti hai.
- Agar teachers list mein koi naya add/remove karna ho, Supabase Table Editor mein
  `teachers` table se seedha edit kar sakte ho — code change nahi karna padega.
