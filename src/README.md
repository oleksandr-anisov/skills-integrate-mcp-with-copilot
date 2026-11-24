# Mergington High School Activities API

A super simple FastAPI application that allows students to view and sign up for extracurricular activities.

## Features

- View all activities and their current participants without logging in
- Allow teachers to sign in before registering or unregistering students
- Keep teacher credentials in a local JSON file with salted password hashes

## Getting Started

1. Install the dependencies:

   ```
   pip install fastapi uvicorn
   ```

2. Run the application:

   ```
   python app.py
   ```

3. Open your browser and go to:
   - API documentation: http://localhost:8000/docs
   - Alternative documentation: http://localhost:8000/redoc

## Configure teacher accounts

Create a teacher account from the repository root:

```sh
python src/manage_teachers.py teacher-username
```

The script prompts for a password and stores only a salted PBKDF2 hash in
`src/teachers.json`. That file is ignored by Git. To use a different file,
set `TEACHER_CREDENTIALS_FILE` to the same path when managing accounts and
running the application.

Teacher sessions use an HTTP-only cookie and expire after eight hours. Sessions
are held in memory and are cleared when the server restarts.

## API Endpoints

| Method | Endpoint                                                          | Description                                                          |
| ------ | ----------------------------------------------------------------- | -------------------------------------------------------------------- |
| GET    | `/activities`                                                     | Public list of activities and current participant counts             |
| GET    | `/auth/status`                                                    | Check whether the current browser has a teacher session               |
| POST   | `/auth/login`                                                      | Sign in with a teacher username and password                           |
| POST   | `/auth/logout`                                                     | End the current teacher session                                        |
| POST   | `/activities/{activity_name}/signup?email=student@mergington.edu` | Teacher-only: sign up a student                                        |
| DELETE | `/activities/{activity_name}/unregister?email=student@mergington.edu` | Teacher-only: unregister a student                                 |

## Data Model

The application uses a simple data model with meaningful identifiers:

1. **Activities** - Uses activity name as identifier:

   - Description
   - Schedule
   - Maximum number of participants allowed
   - List of student emails who are signed up

2. **Students** - Uses email as identifier:
   - Name
   - Grade level

All data is stored in memory, which means data will be reset when the server restarts.
