# BloomCare AI

### Pregnancy Health Risk Prediction System

BloomCare AI is a full-stack maternal healthcare platform that uses Machine Learning to predict pregnancy health risks based on vital signs. The system also includes wellness tracking tools such as a journal, medicine reminders, AI chat support, and goal management.

---

# Features

* User Authentication with JWT
* Pregnancy Risk Prediction using Machine Learning
* Vital Sign Trend Charts
* AI Pregnancy Chat Assistant
* Daily Mood Journal
* Medicine Reminder & Tracker
* Goal & Wellness Tracking
* PDF Health Report Generation
* Admin Dashboard for User Management

---

# System Architecture

```text
React Frontend
       │
 REST API / SSE
       │
Flask Backend
       │
 ├── MySQL Database
 └── ML Model (Random Forest)
```

---

# Machine Learning Model

## Dataset

* Maternal Health Risk Dataset (UCI Repository)
* 1,014 patient records
* 6 health-related input features
* 3 prediction classes:

  * Low Risk
  * Mid Risk
  * High Risk

## Input Features

| Feature          | Unit   |
| ---------------- | ------ |
| Age              | Years  |
| Systolic BP      | mmHg   |
| Diastolic BP     | mmHg   |
| Blood Glucose    | mmol/L |
| Body Temperature | °F     |
| Heart Rate       | bpm    |

## Model Pipeline

```text
Data Preprocessing
        ↓
Feature Scaling
        ↓
Train/Test Split
        ↓
Model Comparison
        ↓
Random Forest Selected
        ↓
Hyperparameter Tuning
        ↓
Final Model (~88% Accuracy)
```

## Performance

| Metric           | Score |
| ---------------- | ----- |
| Accuracy         | ~88%  |
| F1 Score         | ~86%  |
| High Risk Recall | ~93%  |

---

# Tech Stack

## Backend

* Python 3.11
* Flask
* Flask-SQLAlchemy
* Flask-JWT-Extended
* scikit-learn
* XGBoost
* ReportLab

## Frontend

* React 18
* Recharts
* Context API
* Fetch API + SSE

## Database

* MySQL 8.0

---

# Project Structure

```text
bloomcare_ai/
│
├── app/                # Flask backend
├── frontend/           # React frontend
├── models/             # Trained ML models
├── notebooks/          # Jupyter notebooks
├── data/               # Dataset
└── README.md
```

---

# Getting Started

## Prerequisites

* Python 3.11+
* Node.js 18+
* MySQL 8+
* Git

---

## 1. Clone Repository

```bash
git clone https://github.com/YOUR_USERNAME/bloomcare-ai.git
cd bloomcare-ai
```

---

## 2. Backend Setup

```bash
python -m venv venv

# Windows
venv\Scripts\activate

# Linux / Mac
source venv/bin/activate

cd app
pip install -r requirements.txt
```

---

## 3. Configure Environment Variables

Create a `.env` file:

```env
SECRET_KEY=your_secret_key
JWT_SECRET_KEY=your_jwt_secret

MYSQL_USER=root
MYSQL_PASSWORD=your_password
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_DB=babybloom

GROQ_API_KEY=your_key
GEMINI_API_KEY=your_key
```

---

## 4. Create Database

```sql
CREATE DATABASE babybloom;
```

---

## 5. Run Backend

```bash
cd app
python app.py
```

Backend runs on:

```text
http://localhost:5000
```

---

## 6. Run Frontend

```bash
cd frontend
npm install
npm start
```

Frontend runs on:

```text
http://localhost:3000
```

---

# Main API Endpoints

| Method   | Endpoint           | Description            |
| -------- | ------------------ | ---------------------- |
| POST     | `/auth/register`   | Register user          |
| POST     | `/auth/login`      | User login             |
| POST     | `/api/predict`     | Predict pregnancy risk |
| GET      | `/api/history`     | Prediction history     |
| GET/POST | `/journal/entries` | Journal management     |
| GET/POST | `/medicines/`      | Medicine tracker       |
| GET/POST | `/goals/`          | Goal tracker           |
| GET      | `/reports/my`      | Download PDF report    |

---

# Dataset Information

| Property | Details               |
| -------- | --------------------- |
| Source   | UCI ML Repository     |
| Records  | 1,014                 |
| Features | 6                     |
| Classes  | Low / Mid / High Risk |

---

# Environment Variables

| Variable         | Description      |
| ---------------- | ---------------- |
| `SECRET_KEY`     | Flask secret key |
| `JWT_SECRET_KEY` | JWT signing key  |
| `MYSQL_USER`     | MySQL username   |
| `MYSQL_PASSWORD` | MySQL password   |
| `MYSQL_HOST`     | Database host    |
| `MYSQL_PORT`     | Database port    |
| `MYSQL_DB`       | Database name    |
| `GROQ_API_KEY`   | Groq API key     |
| `GEMINI_API_KEY` | Gemini API key   |

---

# Disclaimer

BloomCare AI is an educational project. Predictions are generated using a machine learning model and should not replace professional medical advice or diagnosis.

---

# License

This project is licensed under the MIT License.

---

<div align="center">

Built using React, Flask, and Machine Learning

</div>
