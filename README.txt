Social Media App (MERN + 2FA + Chat) - Quick Setup

BACKEND
-------
cd backend
copy .env.example to .env and update values (at least MONGO_URI, JWT_SECRET)
npm install
npm run dev   (or npm start)

FRONTEND
--------
cd frontend
npx create-react-app .   (only once, to setup React)
Then overwrite src/ with provided src folder contents and package.json with provided one if needed.
npm install
npm start

Open: http://localhost:3000

