# Flask Task Tracker

A simple task management web application built using Python Flask and SQLite. The application helps users organize daily or work-related tasks through a clean and easy-to-use interface.

## Features

- Add new tasks
- View all tasks
- Update task status (Pending/Completed)
- Delete tasks
- Store task data using SQLite for persistence

## Technologies Used

- Python
- Flask
- HTML
- CSS
- JavaScript
- SQLite

## Project Structure

```
Flask-Task-Tracker/
├── app.py
├── database.db
├── requirements.txt
├── README.md
├── templates/
│   └── index.html
└── static/
    ├── style.css
    └── script.js
```

## How to Run

1. Install the required packages:

```bash
pip install -r requirements.txt
```

2. Start the Flask application:

```bash
python app.py
```

3. Open your browser and visit:

```
http://127.0.0.1:5001
```

## Future Enhancements

- User authentication
- Task due dates
- Task priorities
- Search and filter functionality
- Responsive UI improvements
