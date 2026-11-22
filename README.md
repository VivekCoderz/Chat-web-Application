# 💬 NexaChat

A real-time social chat app: one-to-one messaging, short video reels and a built-in storefront, all in one place.

🔗 **Live:** [nexachat-virid.vercel.app](https://nexachat-virid.vercel.app)

## Features

- Real-time messaging with **Socket.io** (authenticated sockets)
- Sign up and log in with JWT stored in cookies
- User profiles with avatars
- Reels section for short videos
- Storefront catalogue and shopping cart
- Media uploads to Cloudinary

## Tech stack

| Part | Tech |
| --- | --- |
| Frontend | React, Vite, Redux Toolkit, Tailwind CSS, Socket.io client, Axios |
| Backend | Node.js, Express, Socket.io, MongoDB (Mongoose), JWT, bcrypt |
| Media | Cloudinary (Multer) |
| Hosting | Vercel (frontend), Render (backend) |

## Run locally

```bash
# API + sockets
cd backend
npm install
# create backend/.env with DB_URL, JWT_SECRET and CLOUDINARY_CLOUD_NAME / CLOUDINARY_API_KEY / CLOUDINARY_API_SECRET
npm start          # http://localhost:4000

# Client
cd ../frontend
npm install
npm run dev        # dev build talks to http://localhost:4000
```

## About

Built by [Vivek Garg](https://vivekgarg.vercel.app).
