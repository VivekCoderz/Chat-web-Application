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
| Hosting | Vercel |

## Run locally

```bash
# API + sockets
cd backend
npm install
# create backend/.env with MONGO_URI, JWT_SECRET and Cloudinary keys
npm start

# Client
cd ../frontend
npm install
npm run dev
```

## About

Built by [Vivek Garg](https://vivekgarg.vercel.app).
