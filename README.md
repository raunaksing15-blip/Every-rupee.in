# 💰 EveryRupee – AI-Powered Personal Finance Copilot

<div align="center">

### One Platform. Three Financial Control Rooms.

A modern AI-powered financial ecosystem that helps individuals, businesses, and advisors manage, understand, and grow their money with confidence.

</div>

---

## 📖 Overview

**EveryRupee** is a role-based fintech platform designed to simplify personal finance management through intelligent automation, financial planning tools, investment guidance, and AI-powered insights.

Millions of people struggle with budgeting, saving, investing, and identifying financial risks. Existing solutions are often complex, fragmented, or difficult for beginners to understand.

EveryRupee bridges this gap by combining:

* AI-powered financial assistance
* Smart budgeting tools
* Business ledger management
* Investment education
* Personalized financial planning

into a single easy-to-use platform.

---

## 🎯 Mission

Our mission is to democratize financial knowledge and empower users to make smarter financial decisions through accessible technology and intelligent guidance.

> "With EveryRupee, every rupee you earn works smarter for you."

---

## 🚀 Key Features

### 🧾 Business Ledger (Khatabook System)

Designed especially for small businesses and local entrepreneurs.

Features:

* Transaction tracking
* Cash flow management
* Debt monitoring
* Savings tracking
* Basic tax insights

---

### 📊 Smart Budget Management

Track and optimize spending behavior through:

* Income tracking
* Expense categorization
* Financial analytics
* AI-generated spending insights
* Budget recommendations

---

### 🎯 Personalized Financial Planning

Create customized financial roadmaps based on:

* Income
* Age
* Risk appetite
* Financial goals
* Investment preferences

---

### 📈 Beginner-Friendly Investment Guidance

Learn investing without complicated financial jargon.

Includes:

* Stock market basics
* Mutual fund education
* Fixed income investments
* Diversification strategies
* Risk profiling

---

### 💬 Conversational AI Assistant

Receive instant financial assistance through a natural language interface.

Capabilities:

* Financial education
* Spending analysis
* Goal recommendations
* Personalized insights

---

## 🏗️ Project Architecture

```text
┌─────────────────┐
│     User        │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Frontend (UI)   │
│ HTML/CSS/JS     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ FastAPI Backend │
└────────┬────────┘
         │
         ├────────► OCR Services
         │
         ├────────► AI APIs
         │
         └────────► Supabase
                    Authentication
                    Database
```

---

## 📂 Project Structure

```text
EveryRupee/
│
├── assets/
│   ├── images/
│   ├── icons/
│   └── videos/
│
├── frontend/
│   ├── index.html
│   ├── education.html
│   ├── planner.html
│   └── investment-assistant.html
│
├── backend/
│   ├── server.js
│   ├── routes/
│   ├── controllers/
│   └── services/
│
├── api/
│
├── styles/
│
├── scripts/
│
├── README.md
│
└── package.json
```

*(Adjust the structure to match the actual repository.)*

---

## 🛠️ Tech Stack

### Frontend

* HTML5
* CSS3
* JavaScript

### Backend

* Node.js
* FastAPI

### Database & Authentication

* Supabase

### AI & Automation

* AI APIs
* OCR Services

### Deployment

* Vercel

---

## ⚙️ Installation & Setup

### Prerequisites

Install:

* Node.js (v16+ recommended)
* npm

Download Node.js:

https://nodejs.org

---

### Clone Repository

```bash
git clone https://github.com/<repository-owner>/EveryRupee.git

cd EveryRupee
```

---

### Install Dependencies

```bash
npm install
```

---

### Configure Environment Variables

Create a `.env` file:

```env
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key

AI_API_KEY=your_ai_api_key

OCR_API_KEY=your_ocr_api_key
```

---

### Run Development Server

```bash
node server.js
```

or

```bash
npm start
```

---

### Open Application

```text
http://localhost:3000
```

---

## 🎥 Demo

### Live Demo

https://everyrupee-psi.vercel.app/education.html

### Video Demonstration

https://youtu.be/Y9z0WSJWY4s

---

## 🤝 Contributing

Contributions are welcome.

### Contribution Workflow

1. Fork the repository
2. Clone your fork

```bash
git clone <your-fork-url>
```

3. Create a feature branch

```bash
git checkout -b feature/your-feature
```

4. Commit changes

```bash
git commit -m "feat: add new feature"
```

5. Push branch

```bash
git push origin feature/your-feature
```

6. Open a Pull Request

---

## 📝 Coding Standards

Please ensure:

* Clean and readable code
* Meaningful commit messages
* Consistent formatting
* Mobile responsiveness
* No console errors

---

## 📌 Future Enhancements

* AI portfolio recommendations
* Advanced investment analytics
* Expense prediction models
* Credit score insights
* Financial scam detection
* Mobile application support

---

## 📜 License

This project is licensed under the MIT License.

See the LICENSE file for details.

---

## 👨‍💻 Maintainers

Developed and maintained by the EveryRupee Team.

For support, issues, or feature requests, please open a GitHub Issue.
