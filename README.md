# DermaValue

A Value-Based Dermatology Health Care System built with **Express.js**, **Prisma ORM** (PostgreSQL), **Google Calendar API**, and **Cloudinary** for media management.

---

## ✅ Features

- 🔐 Authentication using JWT
- 📅 Appointment booking with Google Calendar sync
- 📸 Profile image upload to Cloudinary
- 🩺 Value-Based Healthcare with PROM scoring (via PostgreSQL + Prisma)
- ⚙️ Clean project structure for scalability

---

## 📦 Tech Stack

- **Backend Framework**: Express.js
- **Database**: PostgreSQL (via Prisma ORM)
- **Cloud Media Storage**: Cloudinary
- **Calendar Integration**: Google Calendar API
- **Language**: TypeScript

---

## 🛠 Installation & Setup

### 1. Clone the Repository

```bash
git clone https://github.com/chanphil2002/DermaValue-FYP.git
cd DermaValue-FYP
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Setup Environment Variables

Create a `.env` file in the root directory and configure the following:

```env
# Port
PORT = 3000

# JWT
JWT_SECRET=your_jwt_secret

# PostgreSQL
DATABASE_URL="postgresql://user:password@localhost:5432/dermavalue"

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_KEY=your_api_key
CLOUDINARY_SECRETS=your_api_secret

# Google OAuth (Calendar API)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:3000/google-calendar/oauth2callback

```

### 4. Prisma Setup

Generate Prisma client and migrate database:

```bash
npx prisma install         # if needed to ensure packages
npx prisma generate        # regenerate Prisma client
npx prisma migrate dev     # applies existing migrations to local DB
```

### 5. Run the Application

```bash
npm run dev
```

The server should now be running on `http://localhost:3000`.

---

## 🌐 Google Calendar Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project > Enable **Google Calendar API**
3. Create OAuth 2.0 Credentials and download the JSON
4. Set up the redirect URI (e.g., `http://localhost:3000/google-calendar/oauth2callback`)
5. Add credentials to your `.env` file

---

## ☁️ Cloudinary Setup

1. Sign up at [cloudinary.com](https://cloudinary.com/)
2. Get your **cloud name**, **API key**, and **API secret**
3. Add credentials to `.env`

---

## 👨‍💻 Author

Developed by Chan Phil(https://github.com/chanphil2002)
