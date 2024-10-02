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
MIN_BROWSERS=2
MAX_BROWSERS=5
MAX_PAGES_PER_BROWSER=10
SCALE_CAPACITY_IN_PERCENTAGE=80
PUPPETEER_EXECUTABLE_PATH=C:\Program Files\Google\Chrome\Application\chrome.exe
TIMEOUT_MS=30000
HOSTNAME=localhost
```
### Custom Styles

You can customize the PDF output by passing any of the following properties as query parameters in the URL:

- customCSS
- format
- landscape
- margin-top
- margin-right
- margin-bottom
- margin-left
- printBackground
- preferCSSPageSize
- width
- height
- scale
- displayHeaderFooter
- headerTemplate
- footerTemplate
- pageRanges

## Examples

**Set format, orientation and customer css styles**
/convert/html?format=A4&landscape=true&customCSS=.my-class%7Bcolor%3Ared%3B%7D&scale=1.5

**Custom margins and background printing**
/convert/html?format=Letter&margin-top=20px&margin-bottom=20px&printBackground=true

**Landscape mode with custom scale and CSS**
/convert/html?landscape=true&scale=1.2&customCSS=.header%7Bbackground-color%3Ablue%3B%7D

**Set custom width and height**
/convert/url?width=800px&height=1200px

**Specific page ranges**
/convert/url?pageRanges=1-5,8

**Display header and footer with templates**
/convert/url?displayHeaderFooter=true&headerTemplate=<h1>Title</h1>&footerTemplate=<p>Page %25%25pageNumber%25%25 of %25%25totalPages%25%25</p>