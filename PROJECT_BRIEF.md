# QR HEALTH VAULT: MASTER PROJECT BRIEF

Save this entire message as PROJECT_BRIEF.md in the repo root. Re-read it at the start of every phase. It overrides anything I say later unless I write "change the brief".

## 1. MISSION
Build a working, demo-ready web app in 9 hours for a hackathon. A working live demo beats extra features. Priority: (1) the demo flow works, (2) simple enough for non-technical users, (3) safe, (4) clean looking, (5) extras.

## 2. HOW YOU MUST WORK
- Build ONE phase at a time (section 12). After finishing a phase, STOP and wait for me to type "NEXT". Never start the next phase on your own.
- Before coding each phase: write a plan of at most 8 lines (files to create or change, assumptions).
- Build in small steps. After each step, run it and fix errors before continuing.
- On any failure: find the ROOT CAUSE first, explain it in 2 lines, fix it, rerun the same test. Never repeat the same failed fix twice. After 2 failed attempts, change approach.
- Do not ask me questions unless truly blocked (for example, a missing key). Otherwise choose the simplest option, list it under ASSUMPTIONS, and continue.
- Do not add features I did not ask for. Do not rewrite or reformat working code. Do not rename files or endpoints defined here.
- Verify before saying "done": run both servers, call the endpoints, and (if you can) open the UI at phone width and desktop width.
- Keep replies short. Do not print whole files. Never paste secrets.
- After each phase, make a git commit named "phase N: <name>".
- END EVERY PHASE with exactly this format:
  WORKS: ...
  TESTED BY: ...
  ASSUMPTIONS: ...
  NOT DONE / RISKS: ...
  NEXT: (the next phase name; wait for my "NEXT")

## 3. PRODUCT
QR Health Vault. Patients upload medical reports and prescriptions. AI extracts the data and explains it in simple language (English, Hindi, Kannada). A Prescription Corner shows current medicines with dose and timing. A personal QR lets a doctor request access; the patient approves for 24 hours; the doctor then sees the records. A separate Emergency QR shows only critical info with no login.
Roles: patient, doctor, public emergency viewer (no login).
Login: Google and phone OTP (Firebase Authentication), plus a Demo login and a mock mode.
Problem it solves: in India, patients carry paper files between hospitals; in emergencies doctors cannot see allergies, medicines or past reports; patients forget their medicines and cannot understand their reports.

## 4. TECH STACK (fixed, do not change)
- Frontend: Next.js (App Router), TypeScript, Tailwind CSS, Recharts. Mobile-first.
- Backend: Python 3.11+, FastAPI, SQLAlchemy, SQLite (backend/app.db), Pydantic, JWT sessions, firebase-admin for token verification.
- Files: local folder backend/uploads, served only through authenticated endpoints.
- QR: Python "qrcode" library, PNG output.
- AI: backend/ai_service.py, switchable with AI_MODE=mock|live. Live uses the Gemini API (GOOGLE_API_KEY). Mock returns realistic canned data in the exact JSON shape of section 8. On any live failure, fall back to mock and log the error.
- Repo layout: /frontend, /backend, /demo-files, PROJECT_BRIEF.md, README.md. Provide .env.example in both apps and one command or script that starts both servers.
- Design: Dark & Light mode support, inspired by modern biometric/health dashboards with vibrant accents (deep indigo/slate dark background, clean crisp light background, neon lime / energetic teal accents, glassmorphic cards, large accessible typography, readable and high contrast).

## 5. ENVIRONMENT VARIABLES (keep this list current in README)
Backend: AUTH_MODE=firebase|mock, DEMO_MODE=true|false, AI_MODE=mock|live, GOOGLE_API_KEY, FIREBASE_SERVICE_ACCOUNT_PATH, JWT_SECRET, FRONTEND_URL.
Frontend: NEXT_PUBLIC_API_URL, NEXT_PUBLIC_FIREBASE_* (web config).
Mock rules: AUTH_MODE=mock means phone OTP is always 123456 and no Firebase call is made. DEMO_MODE=true shows a one-tap Demo login for the seeded patient and doctor.

## 6. DATA MODEL (create exactly these tables, with timestamps and foreign keys)
- users: id, role(patient|doctor), full_name, email(null), phone(null, unique), auth_provider(google|phone|demo), firebase_uid(null, unique), preferred_language(en|hi|kn), doctor_reg_no(null)
- patient_profiles: user_id, age, gender, blood_group, allergies, conditions, emergency_contact_name, emergency_contact_phone, emergency_contact_relation, emergency_enabled(bool, default true)
- reports: id, patient_id, category(prescription|lab|scan|other), file_path, original_name, status(processing|done|failed), error_message(null), extracted_text, explanation(JSON: en/hi/kn), created_at
- lab_results: id, report_id, test_name, value, unit, normal_min, normal_max, is_abnormal, test_date
- medicines: id, patient_id, report_id(null), name, dose, frequency, timing(JSON list of morning|afternoon|night), food_instruction(before|after|any), doctor_name, start_date, duration_days, status(active|stopped|completed), plain_explanation
- intake_log: id, medicine_id, taken_at
- qr_tokens: id, patient_id, kind(doctor|emergency), token(random, 32+ bytes, url-safe), is_active
- access_requests: id, patient_id, doctor_id, status(pending|approved|declined|expired), requested_at, expires_at
- access_log: id, patient_id, doctor_id(null), action, created_at

## 7. API (prefix /api, JSON, clear error messages, CORS for FRONTEND_URL)
- Auth: POST /auth/session (exchange Firebase token or mock OTP or demo for a session), GET /auth/me, POST /auth/role
- Profile: GET/PUT /patient/profile
- Reports: POST /reports (multipart), GET /reports, GET /reports/{id}, PUT /reports/{id}/extracted, GET /reports/{id}/file
- Medicines: GET /medicines?status=active|history, PATCH /medicines/{id}, POST /medicines/{id}/taken
- QR: GET /qr/doctor, GET /qr/emergency (PNG + link), POST /qr/regenerate, PATCH /qr/emergency (enable/disable)
- Emergency (public): GET /emergency/{token}
- Access: POST /access/request/{token} (doctor), GET /access/requests, POST /access/{id}/approve, POST /access/{id}/decline, GET /access/log
- Doctor: GET /doctor/patient/{patient_id}, GET /doctor/patient/{patient_id}/summary
- Trends: GET /trends

## 8. AI JSON CONTRACT (mock and live must return exactly this)
Lab report: {"category":"lab","test_date":"YYYY-MM-DD","results":[{"test_name":"","value":0,"unit":"","normal_min":0,"normal_max":0}],"explanation":{"en":"","hi":"","kn":""}}
Prescription: {"category":"prescription","doctor_name":"","date":"YYYY-MM-DD","medicines":[{"name":"","dose":"","frequency":"","timing":["morning"],"food_instruction":"before|after|any","duration_days":0,"plain_explanation":""}],"explanation":{"en":"","hi":"","kn":""}}
Rules: validate the JSON, retry live once on bad output. is_abnormal is computed by code (value outside normal_min/normal_max), never by the AI. The AI never diagnoses or prescribes.

## 9. SAFETY AND SECURITY (non-negotiable)
- The QR contains only a URL with a random token, never medical data. Tokens are revocable and regenerable.
- Doctor access needs patient approval, expires after 24 hours, is enforced on every request, and every view is logged.
- Emergency endpoint returns ONLY: blood group, allergies, conditions, current medicines, emergency contact. Nothing else. Respect emergency_enabled.
- Uploads: PDF/JPG/PNG only, max 10 MB, random filenames, private storage, no public file URLs.
- No secrets in code or logs. Patients can only access their own data (check on every endpoint).
- Show this on every AI-generated screen: "This is an AI explanation to help you understand your report. It is not medical advice. Please consult your doctor."

## 10. UX RULES (simple enough for anyone, including elderly and low-literacy users)
- Mobile-first. Bottom navigation (4 items with icons and labels): Home, Upload, Medicines, My QR. Settings and Access under "More".
- Patient Home: 4 large cards (Upload a report, My medicines, My QR code, Emergency card) plus a small Recent reports list. One main task per screen. Cards, not dense tables.
- Base font 18px, headings 24px+, high contrast, plain words. Buttons at least 52px tall, with icon and clear label ("Upload report", not "Submit").
- Status = color + icon + word, never color alone. A+/A- text size control, remembered.
- Language chooser (English, Hindi, Kannada) on the first screen and in the header, using one i18n JSON file per language. Speaker icon on explanations and medicine lists (Web Speech API read-aloud).
- Number-pad keyboards for phone and OTP. Friendly errors, empty states with one big button, loading messages like "Reading your report...".
- Style: white background, one teal primary color, rounded cards, generous spacing, max 2 fonts. (With dark mode toggle matching deep indigo aesthetic and neon lime accent).
- Doctor screens equally simple: big "Scan QR / Enter code" button, then one clean patient summary with current medicines and allergies at the top.

## 11. SEED DATA (idempotent seed script)
Demo patient and demo doctor (auth_provider=demo) with a full profile; 2 lab reports (one with abnormal values); 3 medicines (2 active, 1 completed). Put 3 sample report files in /demo-files.

## 12. BUILD PLAN (do one phase at a time; stop after each)
PHASE 1: Setup (folder structure, database schema, environments, and seed script)
PHASE 2: Auth & Role Selection (Demo login, Mock OTP, Role handling)
PHASE 3: Patient Profile & Emergency Card
PHASE 4: Document Upload & AI Processing (Gemini Live & Mock fallback)
PHASE 5: Prescription Corner & Intake Log
PHASE 6: QR Code System (Doctor Access & Emergency Public QR)
PHASE 7: Doctor Portal (QR Scan, Request & View Patient Summary)
PHASE 8: Lab Trends & Multilingual/Accessibility Polish
