# HTML to PDF Conversion Service

A scalable and efficient service for converting HTML content to PDF using Puppeteer and Node.js.

## Features

- **Concurrent Processing**: Handles multiple requests simultaneously with controlled resource usage.
- **Browser Pooling**: Reuses browser instances and pages for optimal performance.
- **REST API**: Simple API endpoint for HTML to PDF conversion.
- **Dockerized**: Easy deployment with Docker.
- **Monitoring and Logging**: Integrated logging and metrics for observability.

## Getting Started

### Prerequisites

- **Node.js** (>=16.x)
- **Docker** 
- **npm** or **yarn**

### Installation

1. **Clone the Repository**

   ```bash
   git clone https://github.com/riflosnake/html-to-pdf.git
   cd html-to-pdf

### Usage

1. **npm install**
2. **npm run build**
3. **npm start**

### Config example

```env
PORT=3000
MAX_BROWSERS=5
MAX_PAGES_PER_BROWSER=10
PUPPETEER_EXECUTABLE_PATH=C:\Program Files\Google\Chrome\Application\chrome.exe
TIMEOUT_MS=30000
```
