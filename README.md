# QR Health Vault

QR Health Vault is a secure, accessible, mobile-first medical records vault. Patients upload medical reports and prescriptions; AI extracts key metrics and explains them in simple language (English, Hindi, Kannada). It features:
- **Prescription Corner**: Active medications, dosages, meal instructions, timing, and direct intake tracking.
- **Doctor QR**: Patients share temporary 24-hour access with consulting physicians.
- **Emergency QR**: Publicly scannable QR code displaying only critical life-saving data (blood group, allergies, chronic conditions, emergency contacts) with zero login required.
- **Accessible & Adaptive UI**: Deep Indigo / Biometric Dark Mode + Clean Crisp Light Mode with dynamic font-scaling (`A+`/`A-`).

---

## Architecture & Tech Stack

- **Frontend**: Next.js 16 (App Router), TypeScript, Tailwind CSS v4, Recharts, Lucide Icons.
- **Backend**: Python 3.11+, FastAPI, SQLAlchemy, SQLite (`backend/app.db`), Pydantic v2.
- **AI Processing**: Google Gemini API via official `google-genai` SDK (`AI_MODE=live`), with full offline realistic mock fallback (`AI_MODE=mock`).
- **Authentication**: Firebase Authentication (Google & Phone OTP) with built-in instant Demo login (`DEMO_MODE=true`, `AUTH_MODE=mock`).
- **QR Generation**: Python `qrcode` + Pillow library.

---

## Directory Structure

```
├── backend/
│   ├── app.db                   # SQLite database (auto-generated)
│   ├── config.py                # Environment and app configuration
│   ├── database.py              # SQLAlchemy engine and session
│   ├── main.py                  # FastAPI application entrypoint
│   ├── models.py                # 9 core database models (Section 6)
│   ├── seed.py                  # Idempotent demo data seeder
│   ├── requirements.txt         # Python dependencies
│   ├── uploads/                 # Secure private file storage
│   ├── .env.example             # Backend environment template
│   └── .env                     # Local backend environment
├── frontend/
│   ├── src/                     # Next.js App Router source
│   ├── package.json             # Node dependencies (Next.js, Recharts, Lucide)
│   ├── .env.example             # Frontend environment template
│   └── .env.local               # Local frontend environment
├── demo-files/                  # Sample test reports and prescriptions
│   ├── sample_lab_report_cbc.txt
│   ├── sample_lipid_profile.txt
│   └── sample_prescription_cardiology.txt
├── tests/
│   └── test_phase1.py           # Verification tests
├── start.bat                    # One-click startup script (Windows Command Prompt)
├── start.ps1                    # One-click startup script (PowerShell)
├── PROJECT_BRIEF.md             # Master specification
└── README.md
```

---

## Environment Variables

### Backend (`backend/.env`)
| Variable | Allowed Values | Description |
|---|---|---|
| `AUTH_MODE` | `firebase` \| `mock` | `mock` allows OTP `123456` without Firebase calls |
| `DEMO_MODE` | `true` \| `false` | Enables one-tap demo login for seeded patient and doctor |
| `AI_MODE` | `mock` \| `live` | `live` calls Gemini API; `mock` returns deterministic test data |
| `GOOGLE_API_KEY` | string | Google Gemini API key (for `AI_MODE=live`) |
| `FIREBASE_SERVICE_ACCOUNT_PATH` | path | Path to Firebase admin credentials json |
| `JWT_SECRET` | string | Secret key for signing session tokens |
| `FRONTEND_URL` | url | Allowed CORS origin (default: `http://localhost:3000`) |

### Frontend (`frontend/.env.local`)
| Variable | Description |
|---|---|
| `NEXT_PUBLIC_API_URL` | Backend URL (default: `http://localhost:8000`) |
| `NEXT_PUBLIC_FIREBASE_*` | Firebase web client credentials |

---

## Quickstart: Running Both Servers

### Prerequisites
- Python 3.11+
- Node.js 18+ and npm

### One Command Startup
Run from the root directory:
```powershell
.\start.ps1
```
Or on standard Windows Command Prompt:
```cmd
start.bat
```

### Manual Commands
**Backend:**
```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python -m backend.seed
uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

The frontend will be available at `http://localhost:3000` and the API at `http://localhost:8000`.

---

## Running Automated Tests

Run the test suite with pytest:
```bash
backend\venv\Scripts\python.exe -m pytest -v
```
