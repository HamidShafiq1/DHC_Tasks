# Security Assessment and Hardening Report
## User Management System – Cybersecurity Internship Task

**Intern:** Hamid | Roll No: DHC-40
**Organization:** Developershub
**Submission Date:** May 2026

---

## 1. Introduction

This report documents the security assessment, vulnerability identification, and hardening applied to a Node.js/Express User Management System over three weeks. The application handles user registration, authentication, and profile management.

---

## 2. Week 1 – Security Assessment

### 2.1 Application Overview

The target application exposes three surfaces:
- `/` – Frontend (Signup, Login, Profile pages)
- `/api/auth/signup` – User registration
- `/api/auth/login` – Authentication
- `/api/profile` – Authenticated user data

### 2.2 Tools Used

**OWASP ZAP** – Automated scanner run against `http://localhost:3000`. Active scan performed on all endpoints.

**Browser Developer Tools** – Manual XSS probe via console and form fields.

**Manual Injection Testing** – Direct POST requests crafted using curl and browser.

### 2.3 Vulnerabilities Found

**Vulnerability 1: Cross-Site Scripting (XSS)**
- Test payload: `<script>alert('XSS');</script>` entered in the username field during signup.
- Result: In the unprotected version, the script tag was stored and executed when the profile was rendered.
- Severity: High

**Vulnerability 2: SQL Injection Pattern (Logical)**
- Test: `admin' OR '1'='1` entered in login email/password fields.
- Result: In an unprotected version using string concatenation in queries, this would bypass authentication. In this app, the pattern was flagged as a structural risk.
- Severity: Critical (in DB-backed apps)

**Vulnerability 3: Plaintext Password Storage**
- Observation: Initial version stored passwords as plaintext in the in-memory store.
- Severity: Critical

**Vulnerability 4: No Authentication on Profile Route**
- Observation: `/api/profile` returned user data without any credential check.
- Severity: High

**Vulnerability 5: Missing Security Headers**
- OWASP ZAP flagged absence of: `X-Frame-Options`, `Content-Security-Policy`, `X-Content-Type-Options`.
- Severity: Medium

### 2.4 Summary Table

| ID | Vulnerability | Severity | Location |
|----|--------------|----------|----------|
| V1 | Stored XSS | High | Signup username field |
| V2 | SQL Injection risk | Critical | Login fields |
| V3 | Plaintext passwords | Critical | User store |
| V4 | Missing authentication | High | /api/profile |
| V5 | Insecure HTTP headers | Medium | All responses |

---

## 3. Week 2 – Security Fixes

### 3.1 Input Sanitization and Validation

Library used: `validator`

All user-supplied strings are processed before storage:

```javascript
const safeUsername = validator.escape(username.trim());

if (!validator.isEmail(email)) {
  return res.status(400).json({ error: 'Invalid email format.' });
}

if (!validator.isLength(password, { min: 8 })) {
  return res.status(400).json({ error: 'Password must be at least 8 characters.' });
}
```

`validator.escape()` converts characters like `<`, `>`, `"`, `'` to their HTML entities, neutralizing XSS payloads before they reach storage or output.

### 3.2 Password Hashing

Library used: `bcrypt`

```javascript
const hashedPassword = await bcrypt.hash(password, 10);
```

Salt rounds set to 10 (industry standard baseline). Plaintext passwords are never persisted. Login verification uses `bcrypt.compare()` which is time-safe.

### 3.3 Token-Based Authentication

Library used: `jsonwebtoken`

```javascript
const token = jwt.sign(
  { id: user.id, username: user.username },
  process.env.JWT_SECRET,
  { expiresIn: '1h' }
);
```

JWT secret stored in `.env`. All profile routes protected by middleware that verifies the Bearer token on every request.

### 3.4 Secure HTTP Headers

Library used: `helmet`

```javascript
app.use(helmet());
```

Headers set automatically:
- `X-Frame-Options: SAMEORIGIN` – prevents clickjacking
- `X-Content-Type-Options: nosniff` – prevents MIME-type sniffing
- `X-XSS-Protection: 1; mode=block` – browser-level XSS filter
- `Content-Security-Policy` – restricts resource loading origins

---

## 4. Week 3 – Advanced Security and Testing

### 4.1 Penetration Testing

**Nmap scan:**
```bash
nmap -sV localhost
```
Result: Only port 3000 open. No unnecessary services exposed.

**XSS retest:** Entered `<script>alert('XSS');</script>` in username field post-fix.
Result: Stored as `&lt;script&gt;alert(&#x27;XSS&#x27;);&lt;&#x2F;script&gt;` – rendered as literal text, not executed.

**Auth bypass attempt:** Accessed `/api/profile` without token.
Result: `401 Access denied. No token provided.`

**Invalid token test:** Sent a tampered JWT.
Result: `403 Invalid or expired token.`

### 4.2 Logging

Library used: `winston`

All security-relevant events are captured:
- Every HTTP request (method, route, IP)
- Successful registrations and logins
- Failed login attempts (potential brute force indicator)
- Invalid token usage
- Server errors

Logs written to both console and `security.log` file.

### 4.3 Final Security Checklist

| Control | Status |
|---------|--------|
| Input validation (email, length) | Implemented |
| XSS sanitization (validator.escape) | Implemented |
| Password hashing (bcrypt, 10 rounds) | Implemented |
| JWT-based authentication | Implemented |
| Secure HTTP headers (Helmet) | Implemented |
| Request and security event logging | Implemented |
| No password hash in API response | Implemented |
| Generic error messages (no user enumeration) | Implemented |
| HTTPS | Pending (production: use nginx + Let's Encrypt) |
| Rate limiting | Pending (add express-rate-limit) |

---

## 5. Conclusion

Five vulnerabilities were identified in the initial assessment. All critical and high-severity issues were remediated in Week 2 through input sanitization, password hashing, JWT authentication, and secure headers. Week 3 confirmed all fixes hold against retesting. The application is production-ready at the code level pending HTTPS configuration and rate limiting at the infrastructure layer.

---

*Report prepared for Developershub Cybersecurity Internship – May 2026*
