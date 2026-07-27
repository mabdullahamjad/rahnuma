#  Rahnuma Pakistan

> **Smart Public Transport Navigation for Islamabad & Rawalpindi**

**Live Website:** https://rahnumapakistan.vercel.app/  
**GitHub Repository:** https://github.com/mabdullahamjad/rahnuma

---

#  Overview

Rahnuma is an AI-powered public transport navigation platform designed for commuters in **Islamabad and Rawalpindi**.

Finding the correct Metro Bus or feeder route can be confusing, especially for first-time users, students, tourists, and daily commuters. Information is often scattered across multiple sources, route maps are difficult to understand, and many people don't know which station is closest to them.

Rahnuma solves this problem by combining route planning, station information, location awareness, and AI assistance into one modern web application.

Instead of manually searching maps or asking people for directions, users can simply enter where they want to travel and Rahnuma generates the most suitable journey.

---

#  Problem Statement

Public transport information in Islamabad and Rawalpindi suffers from several issues:

- No simple journey planner
- Difficult-to-understand route maps
- Users don't know their nearest station
- Multiple transport lines require transfers
- Tourists and new commuters struggle to navigate the system

Rahnuma provides a single platform that simplifies public transport for everyone.

---

#  Target Users

- Daily commuters
- University students
- Office workers
- Tourists
- First-time Metro Bus users
- Residents of Islamabad & Rawalpindi

---

#  Features

## Journey Planner

- Select origin station
- Select destination station
- Calculates the optimal route
- Shows transfers when required
- Supports Metro Bus and feeder routes

---

##  Nearest Station Detection

Uses the browser's Geolocation API to determine the user's current location and identifies the nearest public transport station automatically.
(note: works for BRT only at the moment)

---

##  Route Information

- Metro Bus stations
- Feeder routes
- Route names
- Connected stations
- Transfer stations

---

##  AI Transit Assistant

Users can ask natural language questions such as:

- "How do I get to Faiz Ahmed Faiz?"
- "Which station is closest to me?"
- "Which feeder route should I take?"
- "How can I reach Secretariat?"
- "What's the quickest route?"

The AI understands the user's request and responds with transport-specific guidance.

---

##  Travel Summary

Displays journey information including:

- Route used
- Transfers
- Estimated distance
- Estimated travel information

---

##  Responsive Design

Works across:

- Desktop
- Laptop
- Tablet
- Mobile devices

---

##  Fast Search

Optimised React interface with instant route lookup.

---

#  AI Feature

Rahnuma integrates **Groq AI** to provide conversational assistance for users.

Unlike a general-purpose chatbot, the assistant is designed specifically for Islamabad and Rawalpindi public transport.

It can:

- Answer journey questions
- Explain routes
- Recommend stations
- Help users understand transfers
- Guide first-time commuters

## AI Model

- **Llama 3 (served via Groq API)**

## System Prompt (Summary)

The AI is instructed to:

- Act as a public transport assistant.
- Answer only transport-related questions.
- Use available station and route data.
- Recommend the nearest station whenever user location is available.
- Keep answers concise and practical.
- Avoid generating unsupported routes or stations.
- Guide users step-by-step when transfers are required.
- Respond politely and clearly.

---

#  Technologies Used

## Frontend

- React
- TypeScript
- Vite
- Tailwind CSS

## Backend

- Supabase
- PostgreSQL

## APIs & Services

- Groq API
- OpenStreetMap
- Browser Geolocation API

## Deployment

- Vercel

## Version Control

- Git
- GitHub

---

#  Screenshots

> Replace these with screenshots from your application.

## Home Page

<img width="1919" height="917" alt="image" src="https://github.com/user-attachments/assets/cf31c0c9-06d8-4af6-8c99-501c5cddd108" />

---

## Schedules

<img width="1919" height="920" alt="image" src="https://github.com/user-attachments/assets/68558bea-d74e-4aaf-b74c-c5310dbf3df7" />

---

## AI Assistant

<img width="1919" height="916" alt="image" src="https://github.com/user-attachments/assets/297fea04-b95d-44f8-8afe-500abe02b7d1" />

---

## Route Results

<img width="984" height="814" alt="image" src="https://github.com/user-attachments/assets/e819b656-3bd6-4bc2-ab28-6cc4a1cf80ef" />

---

#  How It Works

1. User selects an origin station.
2. User selects a destination.
3. Rahnuma computes the best available route.
4. If location permission is granted, the nearest station is automatically identified.
5. The AI assistant answers additional questions and explains the journey.

---

#  Running Locally

## Clone the repository

```bash
git clone https://github.com/mabdullahamjad/rahnuma.git
```

Move into the project folder.

```bash
cd rahnuma
```

Install dependencies.

```bash
npm install
```

Create a `.env` file.

```env
VITE_SUPABASE_URL=YOUR_SUPABASE_URL
VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
VITE_GROQ_API_KEY=YOUR_GROQ_API_KEY
```

Start the development server.

```bash
npm run dev
```

Open:

```
http://localhost:5173
```

---

#  Project Structure

```
src
│
├── components
├── data
├── hooks
├── lib
├── pages
├── services
├── utils
│
├── App.tsx
└── main.tsx
```

---

#  Future Improvements

- Live Metro Bus tracking
- Real-time arrival predictions
- Service disruption alerts
- Fare estimation
- Favourite journeys
- Voice assistant
- Urdu language support
- Offline mode
- Interactive transport map

---

#  Testing

The application was manually tested for:

- Route planning (Still under work)
- Journey calculations
- Station lookup
- Nearest station detection
- AI responses
- Mobile responsiveness
- Browser compatibility

---

#  License

This project is licensed under the **MIT License**.

---

#  Author

**Muhammad Abdullah Amjad**

Computer Games Development Student  
Air University Islamabad

GitHub:
https://github.com/mabdullahamjad

---

#  Acknowledgements

Special thanks to:

- Government Of Pakistan
- Capital Development Authority
- My fellow Hamza

---

## Live Demo

👉 https://rahnumapakistan.vercel.app/
