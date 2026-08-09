# InterviewPrep

**Version: 1.2.0**

InterviewPrep is a full-stack web application for practicing interview questions, tracking user progress, and managing users through an admin dashboard. It provides secure authentication, AI-powered answer feedback, and a responsive interface for both candidates and administrators.

## Main Features

- User registration and email/password login
- OTP verification for authentication
- Forgot password and password reset
- Protected routes and role-based access control (admin/user)
- Admin dashboard: view, create, update, and delete users
- Question search, filtering, pagination, and grading
- AI-powered feedback on interview answers
- Model answer and score comparison
- User progress tracking with local storage persistence
- Responsive UI with custom styling

## Tech Stack

### Frontend

- React
- Axios
- React Router
- CSS

### Backend

- Node.js
- Express.js
- MongoDB
- Mongoose
- JWT
- bcrypt
- express-validator
- dotenv
- cors
- Google APIs for email/OTP
- Google Gemini API for AI-powered answer feedback

## Setup

- See [frontend/README.md](./frontend/README.md) for frontend setup instructions
- See [backend/README.md](./backend/README.md) for backend setup instructions

## Environment Variables

The application requires environment variables for authentication, email services, database connection, and AI functionality.

Please refer to the frontend and backend README files for the required environment variables and configuration.

## Project Structure

```text
InterviewPrep/
├── frontend/
│   └── React application
├── backend/
│   └── Node.js / Express API
└── README.md
```

## Version History

- **1.0.0**: Initial release
- **1.1.0**: Added AI-powered answer feedback
- **1.2.0**: Added Forgot Password and password reset functionality

## Authors

- An Trinh
- Ema Maeda
