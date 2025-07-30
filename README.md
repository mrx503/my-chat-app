# Firebase Studio - Duck Chat App

This guide provides instructions on how to deploy the latest changes to Vercel from your local machine using both the Vercel CLI and the standard Git workflow.

---

## Setting Up Environment Variables on Vercel

Before deploying, you **MUST** add your secret keys (API keys) to your Vercel project settings. This is a one-time setup for your project.

**Step 1: Go to your Vercel Dashboard**
Navigate to `https://vercel.com/dashboard` and click on your project.

**Step 2: Go to Project Settings**
Click on the "Settings" tab in the main navigation menu of your project.

![Project Settings Tab](https://placehold.co/800x150.png?text=Vercel+Project+Settings+Tab)
<p align="center" style="font-size: small; color: grey;">(Find the 'Settings' tab at the top of your project page)</p>

**Step 3: Find Environment Variables**
In the left-hand sidebar, click on "Environment Variables".

![Environment Variables Menu](https://placehold.co/800x300.png?text=Vercel+Environment+Variables+Menu)
<p align="center" style="font-size: small; color: grey;">(Select 'Environment Variables' from the side menu)</p>

**Step 4: Paste Your Keys**
You will see an input area. Paste the following block of text directly into it. Make sure to replace the placeholder for `GEMINI_API_KEY` with your actual key if you have one.

```env
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=dqgchsg6k
NEXT_PUBLIC_VAPID_PUBLIC_KEY=BAe28C-5u_g5XF7I-IUNYRvoacPc_5sdeM2Eg7Luv9CiCC5QzaVlda78APTJj2JkDbCuh8VExmBXxqtOBL1NpW0
VAPID_PRIVATE_KEY=lshWxt50OSk1wOWG7xBGyIacskhnd7x6q4op1Y77b-8
GEMINI_API_KEY=YOUR_GEMINI_API_KEY_HERE
```

**Step 5: Save and Redeploy**
Click the "Save" button. After saving, you must **redeploy** your project for the changes to take effect. Go to the "Deployments" tab, find the latest deployment, click the menu (...) and select "Redeploy".


---

## Option 1: Deploying with Vercel CLI (Recommended)

This is the standard method for deploying directly from your local machine to Vercel.

### Prerequisites
1.  **Node.js:** Make sure you have Node.js (version 18 or later) installed.
2.  **Vercel CLI:** Install by running: `npm i -g vercel`.
3.  **Vercel Account:** You must have a Vercel account.

### Step-by-Step Deployment
1.  **Log in to Vercel:** `vercel login`
2.  **Link the Project:** `vercel link`
3.  **Deploy to Production:** `vercel --prod`

---

## Option 2: Deploying with Git (Standard Workflow)

If your project is connected to a Git repository, you can deploy by pushing your changes.

### Git Commands
1.  **Stage Your Changes:**
    ```bash
    git add .
    ```
2.  **Commit Your Changes:**
    ```bash
    git commit -m "Describe your changes here"
    ```
3.  **Push Your Changes:**
    ```bash
    git push
    ```

Vercel will automatically detect this push and start a new deployment.
