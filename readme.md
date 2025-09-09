# Full-Stack URL Shortener Microservice

This repository contains a robust, full-stack URL shortener application built with a modern technology stack. It features a **React frontend**, an **Express.js backend**, and a **reusable logging middleware**, all managed within a **monorepo structure using npm workspaces**. The application provides core URL shortening functionality, analytics, and extensive logging as per the project requirements.

---

## Table of Contents

* [Features](#features)
* [Tech Stack](#tech-stack)
* [Project Structure](#project-structure)
* [Setup and Installation](#setup-and-installation)
* [Configuration](#configuration)
* [API Endpoints](#api-endpoints)
* [Live Demo (Placeholder)](#live-demo-placeholder)

---

## Features

* **Shorten Multiple URLs**: Concurrently shorten up to 5 long URLs.
* **Custom Shortcodes**: Optionally provide a preferred shortcode for your link.
* **Link Expiration**: Set a custom validity period (in minutes) for each shortened link (defaults to 30 minutes).
* **URL Analytics**: View detailed statistics including click counts and timestamps for each link.
* **Redirect Service**: The backend handles redirection from the short URL to the original long URL and logs the click.
* **Mandatory Logging**: A reusable logging middleware sends detailed logs from both frontend and backend to a specified evaluation server.
* **Minimalist UI**: A clean, professional, and responsive interface built with **Material-UI**, using a **white and violet** theme.

---

## Tech Stack

**Frontend**

* React.js
* TypeScript
* Material-UI (styling & components)
* Axios (API communication)

**Backend**

* Node.js with Express.js
* TypeScript
* MongoDB with Mongoose
* nanoid (unique shortcode generation)

**Shared**

* Middleware Logger: Reusable TypeScript package for logging.
* Monorepo Management: npm Workspaces.

---

## Project Structure

```
/2201641530201
├── /backend/               # Express.js microservice
├── /frontend/              # React.js web application
└── /middleware-logger/     # Reusable logging package
```

* **middleware-logger**: Self-contained, buildable package usable in both frontend and backend.
* **backend**: Express server exposing REST APIs for URL creation, redirection, and analytics.
* **frontend**: React SPA that provides the user interface to interact with the backend.

---

## Setup and Installation

### Prerequisites

* Node.js (v16 or higher)
* npm (v7 or higher, with workspace support)
* MongoDB instance (local or cloud e.g., MongoDB Atlas)

### Steps

1. **Clone the Repository**

   ```bash
   git clone https://github.com/harshsrivastava05/2201641530201.git
   cd 2201641530201
   ```

2. **Install All Dependencies**

   ```bash
   cd middleware-logger
   npm install
   cd ..

   cd backend
   npm install
   cd ..

   cd frontend
   npm install
   cd ..
   ```

3. **Build the Logger Middleware**

   ```bash
   cd middleware-logger
   npm run build
   cd ..
   ```

4. **Configure Environment Variables**

   * Navigate to `/backend` and create a `.env` file.
   * Copy from `.env.example` (if available) or use the structure below.

   ```env
   # MongoDB Connection String
   DATABASE_URL="mongodb+srv://<user>:<password>@<cluster-url>/shortener?retryWrites=true&w=majority"

   # Server Configuration
   PORT=8000
   APP_URL="http://localhost:8000"

   # Evaluation Server Credentials
   EVALUATION_SERVER_URL="http://20.244.56.144/evaluation-service"
   ```

5. **Run the Application**

   * **Backend**:

     ```bash
     cd backend
     npm run dev
     ```

     Runs on: [http://localhost:8000](http://localhost:8000)

   * **Frontend**:

     ```bash
     cd frontend
     npm start
     ```

     Runs on: [http://localhost:3000](http://localhost:3000)

---

## Configuration

The backend requires the following environment variables:

* `DATABASE_URL`: Full MongoDB connection string.
* `PORT`: Backend server port (default: 8000).
* `APP_URL`: Base URL of the backend (used in short link generation).
* `EVALUATION_SERVER_URL`: URL of the evaluation server.

---

## API Endpoints

### Create Short URL

* **POST** `/api/shorturls`
* **Request Body**:

  ```json
  { "url": "string", "validity": int, "shortcode": "string" }
  ```
* **Response**:

  ```json
  { "shortlink": "string", "expiry": "string" }
  ```

### Redirect to Original URL

* **GET** `/:shortcode`
* Redirects to original long URL with HTTP **302 Found**.

### Fetch URL Statistics

* **GET** `/api/stats`
* **Response**:

  ```json
  [
    { "url": "string", "clicks": int, "timestamps": ["string"] }
  ]
  ```

---

