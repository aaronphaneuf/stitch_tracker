#  <img src="frontend/src/assets/logo.svg" width="50" align="left"> StitchTracker

![Docker](https://img.shields.io/badge/Docker-ready-blue?logo=docker)
![Django](https://img.shields.io/badge/Django-4.x-092E20?logo=django&logoColor=white)
![React](https://img.shields.io/badge/React-18.x-61DAFB?logo=react&logoColor=black)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.x-38B2AC?logo=tailwindcss&logoColor=white)
![DaisyUI](https://img.shields.io/badge/DaisyUI-4.x-5A0EF8?logo=daisyui)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-blue?logo=postgresql)
![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)
![Status](https://img.shields.io/badge/Status-Under_Development-orange)

---

**StitchTracker** is a cozy little app for knitters and crocheters who love keeping their projects organized. Create, track, and celebrate your progress all in one place.

<img src="screenshots/yarn_stash.gif" align="center">

---

## Overview

StitchTracker lets you manage your knitting and crochet projects from start to finish. You can add materials, pattern links, and notes, and log your progress over time (with optional progress photos).

It’s mobile-first, runs anywhere via Docker, and has both light and dark themes (32 in total!) so it always looks great - whether you’re working in bright sunlight or a late-night stitch session.

---

## Features

### Projects

- Create projects with:
  - Name, type (knit or crochet), tags, start and end dates
  - Materials (yarn, hook/needle size)
  - Pattern links or custom text input
  - General notes
- Track rows, stitches, and notes over time
- Add optional progress photos for each log

### Stash (Yarn Organization)
- Log and organize your yarn by brand, colour, fiber, weight, yardage, and status
- **Relaxing “stash tidy” mode**: a calm, drag‑and‑drop shelf for sorting skeins into bins

### Progress & Insights
- **GitHub‑style heatmap** of your stitching activity by day
- Project timeline view with photo snippets

### Personalization & Access
- Choose a theme to suit your style (light/dark + DaisyUI themes)
- **User management** with secure authentication (JWT)

## Tech Stack

**Frontend:** React + DaisyUI (TailwindCSS)  
**Backend:** Django + Django REST Framework  
**Database:** PostgreSQL  
**Containerization:** Docker + docker-compose  

---

## Getting Started

### Clone the repo
```bash
git clone https://github.com/aaronphaneuf/stitchtracker.git
cd stitchtracker
```

### Set up your environment
Create a `.env.public` file in the root folder. Use the included .env.example as your baseline.

###  Run with Docker
```bash
docker compose up --build
```

Once everything spins up:
- Frontend → http://localhost:8082
- Backend Admin → http://localhost:8082/admin  

---

## Project Structure

```
stitchtracker/
├── backend/
│   ├── api/
│   ├── stitchtracker_backend/
│   ├── media/
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── lib/
│   │   └── assets/
│   ├── public/
│   ├── package.json
│   └── Dockerfile
├── deploy/
│   └── nginx/
│       └── default.conf
├── docker-compose.yml
├── .env.example 
└── README.md
```

---

## Development Tips

- React components live under `/frontend/src/pages` and `/frontend/src/components`
- The Django REST API handles projects, progress logs, and authentication
- Media uploads (patterns & progress images) are stored in `/media`
- You can use `http://localhost:8000/admin` for Django’s admin panel

---

## Screenshots

<img src="screenshots/screenshot1.png">
<img src="screenshots/screenshot2.png">
<img src="screenshots/screenshot3.png">

---

## Contributing

This is a personal side project, but friendly pull requests are always welcome. If you’ve got ideas, feedback, or yarn-related puns, open an issue!

---

## License

This project is licensed under the MIT License — feel free to fork, remix, and make it your own.

---

**StitchTracker** — built with ❤️, tea, and probably a few tangled skeins.
