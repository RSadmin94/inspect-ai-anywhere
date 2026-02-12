# 365inspectAI Website & App Update Guide

**Author:** Manus AI
**Date:** February 11, 2026

## 1. Project Overview

This document provides a comprehensive guide to updating the **365inspectAI** digital properties. It is essential to distinguish between the two primary assets:

| Asset               | URL                          | Description                                      |
| ------------------- | ---------------------------- | ------------------------------------------------ |
| **Marketing Website** | `https://365inspectai.com`     | The public-facing promotional and marketing site.    |
| **Web Application**   | `https://app.365inspectai.com` | The professional home inspection software itself. |

This distinction is critical, as updates to messaging and content will typically target one or the other, but not both.

## 2. Deployment Workflow

Both the marketing website and the web application are hosted on **Netlify** and configured for **Git-connected deployments**. This means that any changes pushed to the `main` branch of the corresponding GitHub repository will automatically trigger a new build and deployment on Netlify.

**The deployment process is as follows:**

1.  **Make changes** to the code in the appropriate GitHub repository.
2.  **Commit and push** the changes to the `main` branch.
3.  **Netlify automatically detects** the push and begins a new build.
4.  The **live site is updated** within minutes (typically 2-5 minutes).

There is no need for manual uploads or direct intervention in Netlify. All updates are managed through the GitHub workflow.

## 3. Messaging Update History (February 11, 2026)

On February 11, 2026, a request was made to update the website messaging to reflect a new, more direct and driven tone.

### 3.1. Requested Changes

The following messaging was requested:

-   **Headline:** "Inspect First. Deliver Fast."
-   **Sub-headline:** "AI helps you deliver reports in as little as 45 minutes — not hours. Capture offline. AI analyzes when connected. Reports ready fast — often same-day."

### 3.2. Initial Update & Correction

Initially, there was a misunderstanding, and these changes were applied to the **web application** (`app.365inspectai.com`) instead of the marketing website.

-   **File Modified:** `/src/components/WelcomePage.tsx`
-   **Git Commit (Update):** `adaeb88` - "Update hero messaging to 'Inspect First. Deliver Fast.' positioning"

Upon clarification, the changes to the web application were reverted, and the marketing website was inspected.

-   **Git Commit (Revert):** `d0ca1b5` - "Revert \"Update hero messaging to 'Inspect First. Deliver Fast.' positioning\""

### 3.3. Final Resolution

After inspecting the marketing website (`365inspectai.com`), it was discovered that the requested messaging was **already live and in place**. No further changes were needed for the marketing site.

## 4. Key Files & Locations

| Asset               | GitHub Repository                     | Key File for Hero Messaging        |
| ------------------- | ------------------------------------- | ---------------------------------- |
| **Web Application**   | `RSadmin94/inspect-ai-anywhere`       | `src/components/WelcomePage.tsx`   |
| **Marketing Website** | (To be confirmed)                      | (To be confirmed)                  |

## 5. Troubleshooting

### 5.1. Service Worker Caching (PWA)

During the initial (incorrect) update to the web application, the changes were not immediately visible in the browser even after a hard refresh (`Control+Shift+R`). This was due to **service worker caching**, as the application is a Progressive Web App (PWA).

**Resolution:**

-   **Clear service worker cache:** In Chrome DevTools > Application > Service Workers, unregister the service worker and refresh the page.
-   **Use an incognito/private window:** This bypasses the service worker cache.
-   **Wait:** The service worker will automatically update for all users within 24 hours.

This is an important consideration for any future updates to the web application.
