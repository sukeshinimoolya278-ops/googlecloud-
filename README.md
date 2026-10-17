# QR Health Vault

> **"Your entire medical history, one scan away, explained in your language."**

QR Health Vault is a mobile-first digital health record solution built for patients and emergency responders in India. It replaces paper files and vulnerable WhatsApp sharing with encrypted, consent-gated QR tokens, rule-based biological validation, and plain-language multi-lingual AI explanations.

---

## ⚡ Quick Start (Setup in under 5 minutes)

### Prerequisites
- Python 3.10+
- Node.js 18+ & npm

### One-Click Launch (Windows)
Double-click [start.bat](file:///c:/Users/Anivesh/OneDrive/Desktop/google/start.bat) or run in PowerShell:
```powershell
.\start.ps1
```

### Manual Launch
1. **Backend (FastAPI)**
   ```bash
   cd backend
   pip install -r requirements.txt
   python main.py
   ```
   *Runs on `http://localhost:8000` (API docs at `http://localhost:8000/docs`)*

2. **Frontend (Next.js)**
   ```bash
   cd frontend
   npm run dev
   ```
   *Runs on `http://localhost:3000`*

---

## 🔐 Auth & Demo Mode
- **Test Phone OTP**: `123456`
- **Demo Patient**: Ramesh Sharma (62M, Type 2 Diabetes, Hypertension, Penicillin & Sulfa allergy)
- **Preloaded Records**: 3 Lab reports over 6 months showing glycemic trajectory (HbA1c 8.8% → 7.2%), 4 prescriptions, and active doctor consent sessions.

---

## 🛠️ Architecture & Tech Stack

```
               [ Mobile Browser (Next.js 14 App Router) ]
                  /               |              \
           (Hindi/Kannada/Tamil)  |               \
          [Web Speech API TTS]    |                \
                                  v                 v
                        [ FastAPI Async API ]   [ Supabase Auth & RLS ]
                          /        |        \
                         /         |         \
           [ Biological / Flag     |      [ qrcode + PIL ]
             Validators (Code) ]   |      (Doctor & Emergency PNGs)
                                   v
                         [ ai_client Adapter ]
                         - Gemini 2.5 Flash Vision
                         - Pydantic Schema Validation
                         - Tesseract OCR Fallback
```

- **Frontend**: Next.js 14 App Router, Tailwind CSS, Lucide Icons, Web Speech API text-to-speech.
- **Backend**: Python FastAPI (async), Pydantic v2 models, SlowAPI rate limiting.
- **Security & Database**: Supabase PostgreSQL with Row Level Security (RLS) policies and SHA-256 duplicate file hashing.
- **AI Vision**: `ai_client.py` adapter with Gemini 2.5 Flash and offline demo fallback.

---

## 🛡️ Security Implementation
1. **No Medical Data in QR Codes**: QR codes encode **ONLY** a random, unguessable cryptographic token (`secrets.token_urlsafe(32)`).
2. **Consent-Gated Doctor Portal**: Doctors scanning the QR see a pending authorization screen. The patient must approve the request (for 1 hour, 24 hours, or 7 days).
3. **Strict Automatic Expiration**: Checked on every backend request against `expires_at`, not just in the client UI.
4. **Token Regeneration & Revocation**: Patients can revoke any token instantly; old QR codes cease working immediately.
5. **Private Storage & SHA-256 Deduplication**: Exact duplicate uploads for the same patient are rejected before storage.
6. **Zero-Login Emergency Lifeline**: Separate emergency QR displays only critical allergies, blood group, and tap-to-call emergency contacts without granting access to historical clinical documents.
7. **Patient Audit Trail**: All scans, doctor views, and emergency lookups are recorded in `access_logs`.

---

## 🧪 Unit Tests

Run the core test suite:
```bash
python tests/test_validators_standalone.py
```
Tests:
- Biological boundary checking (rejects impossible hemoglobin, glucose, negative numbers)
- Rule-based abnormal flagging (`normal`, `low`, `high`, `critical_high`)
- Fuzzy matching of Indian drug names (e.g., `metforrmin` → `Metformin`)
- Allergy and drug-drug interaction warnings (Penicillin cross-reactivity)
- Token expiration calculations.

---

## 🎤 2-Minute Hackathon Demo Script

1. **The Hook (15s)**:
   > "In India, patients carry bags of wrinkled paper reports between hospitals. In emergencies, doctors can't see allergies or current medicines. Sharing over WhatsApp has zero privacy control. We built **QR Health Vault**."

2. **Upload & AI Extraction (30s)**:
   > "Upload a messy prescription or lab test. In the background, our vision AI extracts the exact tests and dosages. Notice the **Verification Screen**: fields below 80% confidence are highlighted yellow. The patient reviews, edits, and taps 'Confirm'. No raw AI hallucinations ever enter the permanent vault without patient sign-off."

3. **Multi-lingual Plain Explanation (25s)**:
   > "Switch to **Hindi**, **Kannada**, or **Tamil**. Notice how the report is explained in plain, jargon-free language with a prominent medical disclaimer. Tap **'Read Aloud'** — our Web Speech integration speaks the explanation directly to elderly patients."

4. **Doctor QR & Consent Flow (30s)**:
   > "Show the Doctor QR. When the doctor scans it, they cannot see records immediately. The patient gets a consent notification and taps **'Allow for 24 Hours'**. Now the doctor sees a clean clinical timeline, active medicines, and an AI summary. The access expires automatically."

5. **Emergency Lifeline Card (20s)**:
   > "Switch to Emergency QR. It works without login, showing Blood Group B+, Penicillin allergies in high contrast, and a one-tap phone call button to daughter Pooja. Download the lockscreen card to keep it on your phone lock screen."
