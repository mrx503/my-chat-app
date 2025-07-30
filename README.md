# Firebase Studio - Duck Chat App

This is a Next.js application built with Firebase Studio. This guide provides instructions on how to deploy the latest changes to Vercel from your local machine.

## Deploying to Vercel

Since you want to use the standard deployment method via the command line, you will need to have the project code on your local computer.

### Prerequisites

1.  **Node.js:** Make sure you have Node.js (version 18 or later) installed.
2.  **Vercel CLI:** You need to install the Vercel Command Line Interface. If you don't have it, open your terminal and run:
    ```bash
    npm i -g vercel
    ```
3.  **Vercel Account:** You must have a Vercel account. If you don't, sign up at [vercel.com](https://vercel.com).

### Step-by-Step Deployment

**Step 1: Log in to Vercel**

Open your terminal and log in to your Vercel account. It might ask you to open a browser to confirm.

```bash
vercel login
```

**Step 2: Link the Project**

Navigate to your project's root directory on your local machine in the terminal. If this is your first time deploying this project from your local machine, link it to your Vercel project:

```bash
vercel link
```

Vercel will ask you a few questions to set up the project. Since a `vercel.json` file already exists, it should detect the settings automatically.

**Step 3: Deploy the Latest Changes**

Once your project is linked, you can deploy any new changes you've pulled from Firebase Studio. To deploy to a preview environment, simply run:

```bash
vercel
```

**To deploy to production (your main URL), run the following command:**

```bash
vercel --prod
```

This command will start the build process and deploy your application. Once it's done, it will provide you with the public URL for your production deployment.

That's it! These are the standard commands you were looking for. By following these steps, you can reliably push all the new updates we've made to your live Vercel application.
