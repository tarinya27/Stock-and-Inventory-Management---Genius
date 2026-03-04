# How to Run the Stock Management System

## First time (one-time setup)

### 1. Install dependencies

Open a terminal in the project folder and run:

```bash
cd frontend
npm install
```

### 2. Configure Firebase

- Make sure `frontend/src/config/firebase.ts` has your Firebase config (apiKey, projectId, etc.).
- If you haven’t set up Firebase yet, follow **NEXT_STEPS.md** or **QUICK_START.md**.

### 3. Create an admin user (if needed)

- Create a user in Firebase Console → **Authentication** → **Users** → Add user.
- Add a matching document in Firestore → **users** collection (see **NEXT_STEPS.md** Step 4).

---

## Run the application

From the project root:

```bash
cd frontend
npm start
```

Or from inside the `frontend` folder:

```bash
npm start
```

- The app will open in your browser at **http://localhost:3000**.
- If it doesn’t open automatically, go to that URL manually.
- Log in with your admin email and password.

---

## Other useful commands

| Command           | What it does                    |
|-------------------|---------------------------------|
| `npm start`       | Run the app (development)       |
| `npm run build`   | Build for production            |
| `npm test`        | Run tests                       |

---

## If something goes wrong

- **Port 3000 in use:**  
  Stop the other app using port 3000, or run on another port:
  - Windows: `set PORT=3001 && npm start`
  - Mac/Linux: `PORT=3001 npm start`

- **“Module not found” or build errors:**  
  From `frontend` run:  
  `npm install`  
  then `npm start` again.

- **Login / Firebase errors:**  
  Check **NEXT_STEPS.md** and **TROUBLESHOOTING.md**.
