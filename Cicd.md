## 📘 README — CI/CD with GitHub Actions + Vercel (Zero → Hero)

### 🧩 Overview

This guide explains how to set up **Continuous Integration & Continuous Deployment (CI/CD)** using **GitHub Actions** to deploy a Node.js or frontend app automatically to **Vercel** whenever you push or merge code into the `main` branch.

It also covers:

* Vercel linking
* Environment setup
* GitHub secrets
* Preventing new domain creation
* Full workflow automation

---

## 🚀 1. Prerequisites

Before you start, ensure you have:

* A **GitHub repository** for your project
* A **Vercel account** → [https://vercel.com/signup](https://vercel.com/signup)
* Node.js installed → [https://nodejs.org](https://nodejs.org)
* Basic project setup (React, Next.js, Express, etc.)

---

## 🧠 2. Initialize Your Project

```bash
mkdir my-project
cd my-project
npm init -y
```

Then push your code to a **GitHub repo**:

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/<your-username>/<repo-name>.git
git push -u origin main
```

---

## 🌐 3. Connect to Vercel

1. Install the Vercel CLI globally:

   ```bash
   npm install -g vercel
   ```

2. Log in to Vercel:

   ```bash
   vercel login
   ```

3. Link your project:

   ```bash
   vercel link
   ```

   Follow the prompts:

   * Select your team/org (e.g. `code's projects`)
   * Link to the existing project or create a new one

   ✅ You’ll see something like:

   ```
   Linked to codes-projects/cicd
   ```

4. This creates a `.vercel/project.json` file in your repo:

   ```json
   {
     "orgId": "team_abc123xyz",
     "projectId": "prj_35trqw1quabcdefghijk"
   }
   ```

---

## 🧱 4. Configure `.gitignore`

Open your `.gitignore` and ensure this section exists:

```bash
# Ignore everything in .vercel except project.json
.vercel/*
!.vercel/project.json
```

Then commit:

```bash
git add .vercel/project.json .gitignore
git commit -m "Track .vercel/project.json for CI/CD"
git push origin main
```

---

## 🔑 5. Generate a Vercel Token

1. Go to [https://vercel.com/account/tokens](https://vercel.com/account/tokens)
2. Click **“Create Token”**, name it something like `github-cicd`
3. Copy it — you’ll need this for GitHub secrets

---

## 🧩 6. Add Secrets to GitHub

In your GitHub repository:

1. Go to
   **Settings → Secrets and Variables → Actions → New Repository Secret**
2. Add the following secret:

| Name           | Value                       |
| -------------- | --------------------------- |
| `VERCEL_TOKEN` | your generated Vercel token |

---

## ⚙️ 7. Create GitHub Actions Workflow

Create the file:

```
.github/workflows/deploy.yml
```

Paste this configuration:

```yaml
name: Deploy to Vercel (Constant Domain)

on:
  push:
    branches:
      - main

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 18
          cache: npm

      - name: Install dependencies
        run: npm ci

      - name: Build project
        run: npm run build --if-present

      - name: Deploy to Vercel
        env:
          VERCEL_TOKEN: ${{ secrets.VERCEL_TOKEN }}
        run: |
          npm install -g vercel
          vercel pull --yes --environment=production --token=$VERCEL_TOKEN
          vercel deploy --prebuilt --prod --yes --token=$VERCEL_TOKEN \
            --scope <YOUR_TEAM_ORG_ID> \
            --project <YOUR_PROJECT_ID>
```

> ⚠️ Replace:
>
> * `<YOUR_TEAM_ORG_ID>` → from `.vercel/project.json` → `"orgId"`
> * `<YOUR_PROJECT_ID>` → from `.vercel/project.json` → `"projectId"`

Example:

```bash
--scope team_abc123xyz \
--project prj_35trqw1quabcdefghijk
```

---

## 🧪 8. Test the Workflow

1. Push a commit to `main`:

   ```bash
   git add .
   git commit -m "Trigger deploy"
   git push origin main
   ```
2. Open your **GitHub → Actions tab**
3. You’ll see the job **“Deploy to Vercel (Constant Domain)”** running
4. Once completed, check your live production domain:

   👉 [https://cicd-35trqw1qu-codes-projects.vercel.app/](https://cicd-35trqw1qu-codes-projects.vercel.app/)

✅ It will now update this same URL on every push to `main` (no new domain creation).

---

## 🧰 9. Optional: Separate PR Builds from Production Deploys

If you also want to run tests or preview builds for pull requests **without deploying**,
update your workflow:

```yaml
on:
  push:
    branches: [ "main" ]
  pull_request:
    branches: [ "main" ]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 18
          cache: npm
      - run: npm ci
      - run: npm test

  deploy:
    if: github.event_name == 'push'
    needs: build
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 18
          cache: npm
      - run: npm ci
      - run: npm run build --if-present
      - env:
          VERCEL_TOKEN: ${{ secrets.VERCEL_TOKEN }}
        run: |
          npm install -g vercel
          vercel pull --yes --environment=production --token=$VERCEL_TOKEN
          vercel deploy --prebuilt --prod --yes --token=$VERCEL_TOKEN \
            --scope team_abc123xyz \
            --project prj_35trqw1quabcdefghijk
```

✅ This ensures:

* PRs only build/test
* Only merges to `main` trigger production deployment

---

## 🧠 10. Advanced Tips

### 🔄 Force Re-deploy (Manually)

```bash
vercel deploy --prod --token=YOUR_TOKEN --scope team_abc123xyz --project prj_35trqw1quabcdefghijk
```

### 🔍 View Deployment Logs

```bash
vercel logs <deployment-url>
```

### 🔐 Environment Variables

Manage environment variables via:

```bash
vercel env add
```

or in Vercel Dashboard → Project → Settings → Environment Variables.

---

## ✅ Final Summary

| Step | Description                                    |
| ---- | ---------------------------------------------- |
| 1    | Link local project with Vercel (`vercel link`) |
| 2    | Track `.vercel/project.json`                   |
| 3    | Create `VERCEL_TOKEN` secret in GitHub         |
| 4    | Add GitHub Actions workflow (`deploy.yml`)     |
| 5    | Push to `main` → Auto deployment               |
| 6    | Enjoy one constant production domain 🚀        |

---

## 📍 Result

Your project now has **fully automated CI/CD**:

* ✅ Every commit to `main` auto-deploys to production
* ✅ Same constant domain every time
* ✅ No manual deploys
* ✅ Tests & build checks integrated
