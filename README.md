# Html to PDF

Production-grade HTML to PDF conversion service powered by headless Chromium via Playwright.

Built for reliability under load, this service has been designed, stress-tested, and hardened for real-world, concurrent server-side environments.

## Features

* High-fidelity HTML → PDF rendering using Chromium
* Fully configurable output (page format, orientation, scale, background rendering)
* Supports both inline preview and attachment download responses
* Engineered for high concurrency and sustained throughput
* Stable browser/context lifecycle management for long-running workloads
* Deterministic rendering with consistent results across environments

## How to Run

### Docker (Recommended)

Build the image:

```bash
docker build -t htmltopdf .
````

Run the container:

```bash
docker run -p 8080:8080 htmltopdf
```

The service will be available at:

```
http://localhost:8080/swagger
```

Fully containerized. No additional setup required.

### Local Runtime (.NET 8)

After building the application, install Playwright dependencies manually:

From the project root, navigate to:

```
/bin/Debug/net8.0
```

Then run:

```powershell
powershell ./playwright.ps1 install
```

This installs the required Chromium binaries and drivers for local execution.
