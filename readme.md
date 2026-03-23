# Qatar Visa Appointment Bot

An automated Playwright monitoring script that continuously checks the Qatar Visa Center (QVC) calendar for available appointment slots and sends real-time Telegram alerts.

## Overview
This bot is designed to handle the entire QVC flow automatically:
- Navigating the site and selecting specific visa centers (e.g., Islamabad).
- Managing promotions, notifications, and active session dialogs.
- Solving the alphanumeric image captchas natively using a local Python machine learning model (`ddddocr`).
- Cycling through upcoming calendar months to explicitly detect open green slots.
- Bypassing server rate limits and WAF blocks by intercepting network requests and spoofing human Chrome `User-Agent` strings.
- Storing subscriber IDs in MongoDB and broadcasting instantaneous notifications via Telegraf.

> **Note on Live Hosting:** We are not providing a live, publicly hosted version of this bot because we do not currently have a dedicated 24/7 cloud server available to keep it running. You will need to deploy and run it yourself using the instructions below.

## Prerequisites

If running manually:
- Node.js (v18+)
- Python (v3.10+)

If running via Docker:
- Docker and Docker-Compose

## Environment Configuration
Create a `.env` file in the root directory and add your unique database and bot tokens:
```env
BOT_TOKEN=your_telegram_bot_token_here
MONGODB_URI=your_mongodb_connection_string_here
```

---

## Deployment Option 1: Docker (Recommended)
Because the project requires a hybrid environment (Node.js for Playwright + Python for the CNN Captcha solver), utilizing the provided Docker setup avoids cross-platform dependency issues.

Simply launch the stack:
```bash
docker-compose up -d --build
```
This handles downloading Playwright Chromium, bridging the Python virtual environment paths, and launching the monitoring loop in the background.

---

## Deployment Option 2: Local Installation (Native)
If you prefer running it directly on your laptop or server terminal:

**1. Install Node Dependencies:**
```bash
npm install
npx playwright install chromium
```

**2. Setup Python Captcha Engine:**
The Node script strictly expects a local Python virtual environment named `.venv` in the project root.
```bash
# Create the environment
python -m venv .venv

# Install ddddocr into the virtual environment (Windows)
.venv\Scripts\pip install ddddocr

# Install ddddocr into the virtual environment (Linux/Mac)
.venv/bin/pip install ddddocr
```

**3. Start the Bot:**
```bash
node index.js
```

---

## Telegram Commands
Once the server process is alive, message your bot on Telegram:
- `/start` - Adds you to the MongoDB database to receive instant availability alerts.
- `/status` - Checks if the internal Python/Playwright loop is actively monitoring.
- `/stop` - Removes you from the broadcast list.
