# 🚀 Phreddit

Phreddit is a Reddit-style social platform built as part of coursework for **CSE316 (Web Development)** at Stony Brook University.  
It supports posts, nested comments, voting, user authentication, and basic moderation features, showcasing a full-stack implementation of a community-driven web application.

**🎥 Demo Video → Coming soon 🚀**

---

## ✨ Features
📝 **Posts & Comments** — Create posts, reply with nested comments, and engage in threaded discussions  
👍 **Voting System** — Upvote and downvote posts/comments with dynamic score ranking  
👤 **User Authentication** — Register, log in, and manage user sessions  
🛡️ **Moderation Tools** — Lock posts, remove content, and manage community activity  
📱 **Responsive UI** — Clean and functional interface accessible across devices  

---

## 🧱 Tech Stack
- **Frontend:** React (with JSX/JS), Babel, Jest (for testing)  
- **Backend:** Node.js, Express.js  
- **Database:** MongoDB (Mongoose models)  
- **Styling:** Basic CSS + responsive layouts  
- **Tooling:** ESLint, Babel  

---

## 📂 Project Structure
```
/
├── client/              # React frontend
│   ├── public/          # Static assets
│   ├── src/             # React components & views
│   ├── package.json     # Frontend dependencies
│
├── server/              # Node/Express backend
│   ├── models/          # Mongoose schemas
│   ├── routes/          # API routes
│   ├── server.js        # Express entry point
│   ├── package.json     # Backend dependencies
│
├── images/              # UML diagrams & coursework design artifacts
│
└── README.md            # Project overview
```

---

## ⚙️ Getting Started

### 1. Clone the repo
```bash
git clone https://github.com/anshsaluja/phreddit.git
cd phreddit
```

### 2. Install dependencies
Frontend:
```bash
cd client
npm install
npm start
```

Backend:
```bash
cd ../server
npm install
npm start
```

### 3. Environment Setup
Create a `.env` file in `/server` with your MongoDB URI and any session secrets:
```
MONGO_URI=your-mongodb-uri
SESSION_SECRET=your-secret-key
```

---

## 📦 Deployment
- Designed for local development and coursework demo purposes  
- Can be deployed on Heroku/Render with separate frontend & backend builds  
- Not optimized for production use  

---

## 📄 License
This project is covered by a **custom coursework license**.  
See the [LICENSE](LICENSE) file for details.  
⚠️ **Note:** This project is not open source. Unauthorized use, copying, or distribution is prohibited.  

---

## 👤 Author
Built with ❤️ by **Ansh Saluja**  
_Coursework Project — Stony Brook University, 2025_
