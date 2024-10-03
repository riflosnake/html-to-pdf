FROM node:18

WORKDIR /app

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true

COPY package*.json ./
RUN npm install

COPY . .

# Install Chromium
RUN apt-get update && apt-get install -y --fix-missing chromium

# Set an environment variable to point Puppeteer to the Chromium binary
ENV PUPPETEER_EXECUTABLE_PATH="/usr/bin/chromium"

EXPOSE 3000

CMD ["npm", "start"]
