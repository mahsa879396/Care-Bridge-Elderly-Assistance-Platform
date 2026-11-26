# CareBridge – Elderly Assistance Platform

CareBridge is a responsive web application that connects seniors in Finland with local volunteers for everyday help: grocery shopping, getting around, or simply some company. Seniors (or their family members) post a request, verified volunteers nearby filter and accept it, and both sides see the status and each other's contact details to agree on the details by phone.

**Team:** Maryam Dangchi (backend) · Mahsa Esmaeilnia (frontend)

**Live demo:** https://carebridge-lake-eight.vercel.app · **API:** https://carebridge-api-054k.onrender.com

---

## Features

### Seniors
- Register and log in
- Ask for help: choose a category, describe the task, pick day, time, language and city
- See all their requests with status: Waiting, Accepted, Done
- See the volunteer's name and phone number once a request is accepted
- Cancel a request while it is still waiting
- Mark help as done and rate the volunteer (1–5 stars and an optional comment)

### Family members
- Add a parent or relative who does not use the internet (with their consent)
- Post requests on their behalf and follow every step
- See who accepted and how to reach them
- Mark the help as done and rate the volunteer

### Volunteers
- Register; an admin verifies their identity **once**, after that they can accept requests without further checks
- Browse open requests near them, filtered by city, language and type of help
- Accept a request; the senior's contact details then appear in **My tasks**
- Mark a task as done

### Admin
- Overview of the platform (number of seniors, family members, volunteers, requests)
- Volunteer verification queue: verify or reject new volunteers
- Read-only list of all requests (admins do not approve requests; seniors and volunteers arrange help directly)

---

## Tech stack

| Part | Technology |
| --- | --- |
| Frontend | React 19, Vite, React Router |
| Backend | Node.js, Express (MVC structure) |
| Database | MongoDB Atlas with Mongoose |
| Authentication | JWT (JSON Web Tokens), passwords hashed with bcrypt |
| Hosting | Vercel (frontend), Render (backend), MongoDB Atlas (database) |

### Architecture

```
React (browser)  <—— HTTP + JSON ——>  Express API  <——>  MongoDB Atlas
                    Authorization: Bearer <JWT>
```

- The frontend never talks to the database directly; every action goes through the REST API.
- After login the server returns a signed JWT containing the user's id and role. The frontend sends it with every request.
- Two middleware "guards" protect the API: `protect` checks the token (401 if missing or invalid) and `requireRole` checks the role (403 if not allowed).

---

## Project structure

```
CareBridge/
├── carebridge-frontend/        React app
│   └── src/
│       ├── components/         Layout (header)
│       ├── pages/              One file per page (+ its CSS)
│       └── services/api.js     All calls to the backend
└── carebridge-backend/         Express API
    └── src/
        ├── config/db.js        MongoDB connection
        ├── models/             User, Request
        ├── controllers/        Logic for each route group
        ├── routes/             URL definitions
        ├── middleware/auth.js  protect and requireRole
        └── scripts/            createAdmin.js
```

---

## Running the project locally

You need **Node.js 18 or newer** and a **MongoDB Atlas** connection string.

### 1. Backend

```bash
cd carebridge-backend
npm install
```

Create a file `carebridge-backend/.env` (copy `.env.example`) and fill in:

| Variable | Meaning |
| --- | --- |
| `PORT` | Port of the API, default `5000` |
| `MONGODB_URI` | Your MongoDB Atlas connection string, ending with `/carebridge` |
| `JWT_SECRET` | A long random string used to sign tokens |
| `CLIENT_URL` | Address of the frontend, default `http://localhost:5173` |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_FIRST_NAME`, `ADMIN_LAST_NAME` | Used once by the admin script |

Create the admin account (there is no admin registration form, on purpose):

```bash
npm run create-admin
```

Start the API:

```bash
npm run dev
```

Check it works: open `http://localhost:5000/api/health`; it should answer `{"status":"ok","database":"connected"}`.

### 2. Frontend

```bash
cd carebridge-frontend
npm install
```

Create `carebridge-frontend/.env.local` with:

```
VITE_API_URL=http://localhost:5000
```

Then:

```bash
npm run dev
```

Open `http://localhost:5173`.

> If `VITE_API_URL` is left empty, the frontend runs in **mock mode** with sample data. We used this to build the pages before the backend was ready.

---

## API overview

All responses are JSON. Errors always have the shape `{"message": "..."}`.

| Method | Route | Who |
| --- | --- | --- |
| GET | `/api/health` | Public |
| POST | `/api/auth/register` | Public (role: senior, family or volunteer) |
| POST | `/api/auth/login` | Public |
| GET | `/api/auth/me` | Logged in |
| POST | `/api/requests` | Senior, or family member for a senior they manage |
| GET | `/api/requests?city=&language=&category=` | Verified volunteer: open requests |
| GET | `/api/requests/mine` | Senior, family member or volunteer: their own requests |
| GET | `/api/requests/:id` | Request's senior, its volunteer, or any verified volunteer while open |
| PATCH | `/api/requests/:id/accept` | Verified volunteer |
| PATCH | `/api/requests/:id/complete` | Request's senior, family member or volunteer |
| PATCH | `/api/requests/:id/rate` | Request's senior or family member |
| DELETE | `/api/requests/:id` | Request's senior or family member, only while waiting |
| GET | `/api/volunteers/:id/rating` | Logged in |
| GET / POST | `/api/family/seniors` | Family member |
| GET | `/api/admin/stats` | Admin |
| GET | `/api/admin/volunteers?status=` | Admin |
| PATCH | `/api/admin/volunteers/:id/verify` and `/reject` | Admin |
| GET | `/api/admin/users?role=` and `/api/admin/requests?status=` | Admin |

Status codes used: `200` OK, `201` Created, `400` invalid input, `401` not logged in or bad token, `403` not allowed, `404` not found, `409` conflict (for example the request was already accepted).

---

## Accessibility

Most users are seniors, so accessibility was a main goal (as suggested in the proposal feedback):

- Large base font (18px) and the **Atkinson Hyperlegible** typeface, designed for low-vision readers
- Buttons and inputs at least 48px high
- High-contrast text and button colors
- Every input has a visible label; error messages are linked to their inputs for screen readers
- Clear focus outline when moving with the Tab key
- Responsive layout: two columns on desktop, one column on phones
- Icons are inline SVG and hidden from screen readers; no emoji

## Privacy

- Passwords are stored only as bcrypt hashes and are never returned by the API
- Phone numbers are shown only to the senior and the volunteer of an accepted request, never in the open list
- A family member must confirm the senior's consent before adding them
- We collect only the data needed to arrange help (GDPR data minimisation)
- Secrets live in `.env` files, which are never committed to GitHub

---

## How we built it

We planned the architecture, data model, API contract and UI design ourselves before writing code, and designed every screen for each role first. We then worked on separate branches (one feature per branch). Every pull request was reviewed and approved by the other team member before merging into `main`, which is protected.

We built the project incrementally, one small step at a time, using AI tools (Trae and Claude) as a coding assistant. Along the way, we relied on AI to clarify unfamiliar concepts and help debug errors when issues came up. Every feature was tested manually—verifying the backend with PowerShell requests and testing the frontend in the browser, starting in mock mode before connecting to the real API.

## Future work

- In-app notifications for volunteers when a new matching request is posted
- Linking a family member to a senior who has their own account
- Finnish and Swedish versions of the interface
- Municipality accounts for city welfare departments
- Password reset by email
- Monthly community events (optional birth month, with consent)

