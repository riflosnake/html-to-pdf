# -------- BUILD --------
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build

WORKDIR /src

COPY ["HtmlToPdf.csproj", "./"]
RUN dotnet restore "./HtmlToPdf.csproj"

COPY . .

RUN dotnet publish "./HtmlToPdf.csproj" \
    -c Release \
    -o /app/publish \
    /p:UseAppHost=false


# -------- RUNTIME --------
FROM mcr.microsoft.com/playwright/dotnet:v1.58.0-noble

WORKDIR /app

# Copy published app
COPY --from=build /app/publish .

# Non-root user (safe for K8s) - CREATE USER FIRST
RUN addgroup --system appgroup \
 && adduser --system --ingroup appgroup appuser \
 && chown -R appuser:appgroup /app

# Switch to non-root user BEFORE installing Playwright
USER appuser

# Install Playwright drivers as appuser
RUN pwsh ./playwright.ps1 install

# Ensure ASP.NET binds correctly
ENV ASPNETCORE_URLS=http://+:8080

EXPOSE 8080

ENTRYPOINT ["dotnet", "HtmlToPdf.dll"]