[![Review Assignment Due Date](https://classroom.github.com/assets/deadline-readme-button-22041afd0340ce965d47ae6ef1cefeee28c7c493a6346c4f15d667ab976d596c.svg)](https://classroom.github.com/a/2tEDYwzN)
# Team Project

Add design docs in *images/*

----

Phreddit Setup Instructions

This guide walks you through setting up and running the full Phreddit app (MongoDB backend + React frontend).

Prerequisites

Make sure the following are installed:

- Node.js and npm  
  node -v  
  npm -v

- MongoDB running locally on the default port  
  mongod


Steps to Run the Application

1. Clone the Repository

2. Setup the Backend
   cd server  
   npm install

3. Initialize the Database  
   Run this script to seed the DB and create the initial admin account:
   node init.js mongodb://127.0.0.1:27017/phreddit admin@example.com adminUser SecureAdminPassword123

4. Start the Backend Server  
   node server.js

   You should see:
   Connected to MongoDB  
   Server listening on port 8000...

5. Setup the Frontend  
   Open a new terminal tab/window and run:  
   cd client  
   npm install  
   npm start

   The frontend will launch in your browser at:
   http://localhost:3000

---

You're Done! You can now browse Phreddit.

In the sections below, list and describe each contribution briefly.

## Team Member 1 Contribution
<Team Member 1 Name>

## Team Member 2 Contribution
<Team Member 2 Name>
