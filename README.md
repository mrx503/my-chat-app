# Firebase Studio - Duck Chat App

This guide provides instructions on how to deploy the latest changes to Vercel from your local machine using both the Vercel CLI and the standard Git workflow.

---

## Option 1: Deploying with Vercel CLI (Recommended for Manual Deploys)

This is the standard method for deploying directly from your local machine to Vercel without using a Git repository. It's often more reliable if you encounter Git authentication errors.

### Prerequisites

1.  **Node.js:** Make sure you have Node.js (version 18 or later) installed.
2.  **Vercel CLI:** Install the Vercel Command Line Interface by running: `npm i -g vercel`.
3.  **Vercel Account:** You must have a Vercel account.

### Step-by-Step Deployment

**Step 1: Log in to Vercel**
Open your terminal and log in to your Vercel account.
```bash
vercel login
```

**Step 2: Link the Project**
Navigate to your project's root directory in the terminal. If this is your first time, link it to your Vercel project:
```bash
vercel link
```
The CLI will guide you through connecting this local directory to a project on Vercel.

**Step 3: Deploy to Production**
To deploy all the new changes to your main URL, run:
```bash
vercel --prod
```
This command will start the build and deployment process. Once it's done, you will get the public URL for your application.

---

## Option 2: Deploying with Git (Standard Git Workflow)

If your project is connected to a Git repository (like GitHub, GitLab, etc.) and that repository is linked to Vercel, you can deploy simply by pushing your changes.

### Git Commands

After getting the latest code from Firebase Studio onto your local machine, navigate to the project directory in your terminal and use the following standard Git commands.

**Step 1: Stage Your Changes**
This command adds all new and modified files, preparing them for the next step.
```bash
git add .
```

**Step 2: Commit Your Changes**
This command saves a snapshot of your staged changes to your local Git history. Replace `"Your commit message"` with a brief description of the updates.
```bash
git commit -m "Updated UI and added new features"
```
*(Example: `git commit -m "Redesigned the main page header"`)*

**Step 3: Push Your Changes**
This command uploads your committed changes from your local machine to the remote repository (e.g., GitHub). Vercel will automatically detect this push and start a new deployment.
```bash
git push
```

That's it! After the `git push` command completes, Vercel will handle the rest. You can monitor the deployment progress on your Vercel dashboard.
