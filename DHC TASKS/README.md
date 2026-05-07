# User Management System – Secure Web Application

**Cybersecurity Internship Task | Developershub**
**Intern:** Hamid | Roll No: DHC-40
**Deadline:** 15 May 2026

---

## Overview

A Node.js/Express-based User Management System built with security as the primary focus. Covers signup, login, and profile management with protections against XSS, weak password storage, authentication flaws, and insecure HTTP headers.

---

## Tech Stack

| Layer | Library |
|---|---|
| Framework | Express.js |
| Security Headers | Helmet.js |
| Password Hashing | bcrypt (salt rounds: 10) |
| Token Auth | jsonwebtoken (JWT, 1hr expiry) |
| Input Validation | validator.js |
| Logging | winston |

---

## Project Structure

```
user-management-system/
├── app.js                  # Entry point
├── logger.js               # Winston logger config
├── routes/
│   ├── auth.js             # /api/auth/signup, /api/auth/login
│   └── profile.js          # /api/profile (GET, PUT) - protected
├── middleware/
│   └── authMiddleware.js   # JWT verification
├── public/
│   └── index.html          # Frontend UI (Signup / Login / Profile)
├── .env.example
├── .gitignore
└── package.json
```

---

## Setup

```bash
git clone <repo-url>
cd user-management-system
npm install
cp .env.example .env
# Edit .env and set a strong JWT_SECRET
npm start
```

App runs at: `http://localhost:3000`

---

## API Endpoints

### POST /api/auth/signup
```json
{ "username": "hamid", "email": "hamid@example.com", "password": "securepass123" }
```

### POST /api/auth/login
```json
{ "email": "hamid@example.com", "password": "securepass123" }
```
Returns: `{ "token": "<JWT>" }`

### GET /api/profile
Header: `Authorization: Bearer <token>`

### PUT /api/profile
Header: `Authorization: Bearer <token>`
```json
{ "username": "newname" }
```

---

## Security Measures Implemented

### Week 1 – Vulnerabilities Identified

| Vulnerability | Tool Used | Finding |
|---|---|---|
| XSS | Browser DevTools | Input fields reflected unsanitized input |
| SQL Injection | Manual test | Login fields accepted `admin' OR '1'='1` pattern |
| Weak passwords | Manual review | No password policy enforced |
| No auth | Manual review | Profile accessible without credentials |
| Insecure headers | OWASP ZAP | Missing Content-Security-Policy, X-Frame-Options |

### Week 2 – Fixes Applied

- **XSS Prevention**: `validator.escape()` sanitizes all user-supplied strings before storage.
- **Password Hashing**: `bcrypt.hash(password, 10)` — plaintext passwords never stored.
- **JWT Authentication**: Signed tokens with 1-hour expiry. All profile routes require valid Bearer token.
- **Input Validation**: Email format checked with `validator.isEmail()`. Password minimum length enforced. Username length bounded (3-30 chars).
- **Secure HTTP Headers**: `helmet()` middleware sets X-Frame-Options, X-XSS-Protection, Content-Security-Policy, and more automatically.
- **User Enumeration Prevention**: Login returns generic "Invalid credentials" regardless of whether email exists.

### Week 3 – Advanced Security

- **Logging**: All requests, logins, failures, and errors logged via `winston` to console and `security.log`.
- **Penetration Testing**: Nmap scan showed only port 3000 open. XSS payloads `<script>alert('XSS')</script>` are escaped and rendered as literal text.
- **Security Checklist** (see below).

---

## Security Checklist

- [x] Validate all user inputs (email format, length limits)
- [x] Sanitize inputs to prevent XSS
- [x] Hash and salt all passwords with bcrypt
- [x] Use token-based authentication (JWT)
- [x] Set secure HTTP headers with Helmet
- [x] Log security events to file
- [x] Never expose password hashes in API responses
- [x] Generic error messages to prevent information disclosure
- [ ] HTTPS (required in production – use nginx/Let's Encrypt)
- [ ] Rate limiting (add express-rate-limit in production)
- [ ] Database persistence (replace in-memory store)

---

## Logs

Security events are written to `security.log` (gitignored). Sample:

```
[2026-05-07T10:22:01.000Z] INFO: Application started on http://localhost:3000
[2026-05-07T10:22:15.000Z] INFO: New user registered: hamid (hamid@example.com)
[2026-05-07T10:22:30.000Z] INFO: User logged in: hamid
[2026-05-07T10:23:10.000Z] WARN: Failed login attempt for email: attacker@test.com
```

---

## License

MIT
