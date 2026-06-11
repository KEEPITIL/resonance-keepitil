# RESONANCE — Deployment Guide

## Step 1 — MongoDB Atlas
1. Go to https://cloud.mongodb.com and create a free account
2. Create a **Free Tier (M0)** cluster
3. Create a database user (username + password)
4. Under Network Access → Add IP Address → **Allow Access from Anywhere** (0.0.0.0/0)
5. Click **Connect** → **Drivers** → copy the connection string
6. Replace `<password>` with your db user password and set database name to `resonance_db`

---

## Step 2 — AWS S3 Bucket
1. Go to https://aws.amazon.com and sign in (or create account)
2. S3 → Create Bucket → Name: `resonance-uploads` → Region: `us-west-1`
3. **Uncheck** "Block all public access"
4. Add this bucket policy (Permissions tab → Bucket Policy):
```json
{
  "Version": "2012-10-17",
  "Statement": [{
    "Sid": "PublicRead",
    "Effect": "Allow",
    "Principal": "*",
    "Action": "s3:GetObject",
    "Resource": "arn:aws:s3:::resonance-uploads/*"
  }]
}
```
5. Add CORS configuration:
```json
[{
  "AllowedHeaders": ["*"],
  "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
  "AllowedOrigins": ["*"],
  "ExposeHeaders": []
}]
```
6. IAM → Create User → Attach `AmazonS3FullAccess` → Generate Access Keys → copy `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY`

---

## Step 3 — SendGrid
1. Go to https://sendgrid.com → create free account
2. Settings → API Keys → Create API Key (Full Access)
3. Copy the `SG.xxxx` key as `SENDGRID_API_KEY`
4. Sender Authentication → verify your email as sender

---

## Step 4 — Stripe
1. Log into https://dashboard.stripe.com
2. Developers → API Keys → copy `sk_test_` and `pk_test_`
3. For webhooks: Developers → Webhooks → Add endpoint
   - URL: `https://your-railway-app.up.railway.app/api/tickets/webhook`
   - Events to listen: `payment_intent.succeeded`, `payment_intent.payment_failed`
   - Copy the `whsec_` signing secret

---

## Step 5 — Deploy Backend to Railway
1. Go to https://railway.app → create account → New Project → **Deploy from GitHub**
2. Push the `resonance/backend` folder to a GitHub repo first, or use Railway CLI:
   ```bash
   cd resonance/backend
   npm install
   railway login
   railway init
   railway up
   ```
3. In Railway dashboard → Variables, add ALL values from `.env.example`:
   ```
   NODE_ENV=production
   PORT=5000
   MONGODB_URI=...
   JWT_SECRET=...  (use a 32+ character random string)
   STRIPE_SECRET_KEY=sk_test_...
   STRIPE_WEBHOOK_SECRET=whsec_...
   PLATFORM_FEE_PERCENT=2.5
   AWS_ACCESS_KEY_ID=...
   AWS_SECRET_ACCESS_KEY=...
   AWS_REGION=us-west-1
   AWS_S3_BUCKET=resonance-uploads
   SENDGRID_API_KEY=SG....
   SENDGRID_FROM_EMAIL=noreply@yourdomain.com
   CLIENT_URL=https://your-vercel-app.vercel.app
   ```
4. Copy the Railway public URL (e.g. `https://resonance-backend-production.up.railway.app`)

---

## Step 6 — Deploy Frontend to Vercel
1. Go to https://vercel.com → create account → New Project → **Import from GitHub**
2. Or use Vercel CLI:
   ```bash
   cd resonance/frontend
   npm install
   npm run build
   npx vercel --prod
   ```
3. In Vercel dashboard → Settings → Environment Variables, add:
   ```
   REACT_APP_API_URL=https://your-railway-url.up.railway.app/api
   REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_test_...
   ```
4. Redeploy after adding env vars

---

## Step 7 — Update CORS
In Railway, update `CLIENT_URL` to your Vercel URL once deployed.

---

## Step 8 — Go Live (Stripe)
1. Stripe Dashboard → toggle **Live Mode**
2. Replace `sk_test_` → `sk_live_` and `pk_test_` → `pk_live_` in all env vars
3. Create a new live webhook endpoint pointing to Railway URL
4. Redeploy both Railway and Vercel

---

## Local Development
```bash
# Terminal 1 — Backend
cd resonance/backend
cp .env.example .env
# Fill in .env values
npm install
npm run dev

# Terminal 2 — Frontend
cd resonance/frontend
cp .env.example .env
# Set REACT_APP_API_URL=http://localhost:5000/api
npm install
npm start
```

---

## Generate a secure JWT_SECRET
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```
