FROM node:20-bookworm-slim

RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    python3-venv \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install

RUN npx playwright install chromium
RUN npx playwright install-deps chromium

COPY . .

RUN python3 -m venv /usr/src/app/.venv
RUN /usr/src/app/.venv/bin/pip install --no-cache-dir ddddocr

ENV PORT=8000
EXPOSE 8000

CMD ["node", "index.js"]
