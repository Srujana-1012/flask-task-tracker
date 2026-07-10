from flask import Flask, render_template, request, jsonify
import sqlite3
from datetime import datetime
22
app = Flask(__name__)

def get_db():
    conn = sqlite3.connect("database.db")
    conn.row_factory = sqlite3.Row
    return conn

# Create enhanced table
with get_db() as con:
    con.execute("""
        CREATE TABLE IF NOT EXISTS tasks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            description TEXT,
            priority TEXT DEFAULT 'Medium',
            status TEXT DEFAULT 'Not Started',
            category TEXT DEFAULT 'General',
            due_date TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            completed_at TIMESTAMP
        )
    """)
    con.commit()


@app.route("/")
def index():
    return render_template("index.html")

@app.route("/tasks", methods=["GET"])
def get_tasks():
    con = get_db()
    status_filter = request.args.get("status")
    priority_filter = request.args.get("priority")
    
    query = "SELECT * FROM tasks"
    params = []
    
    if status_filter:
        query += " WHERE status = ?"
        params.append(status_filter)
    if priority_filter:
        if status_filter:
            query += " AND priority = ?"
        else:
            query += " WHERE priority = ?"
        params.append(priority_filter)
    
    query += " ORDER BY priority DESC, due_date ASC"
    
    tasks = con.execute(query, params).fetchall()
    con.close()
    return jsonify([dict(task) for task in tasks])

@app.route("/tasks", methods=["POST"])
def add_task():
    data = request.json
    con = get_db()
    con.execute("""
        INSERT INTO tasks (title, description, priority, status, category, due_date)
        VALUES (?, ?, ?, ?, ?, ?)
    """, (
        data.get("title", ""),
        data.get("description", ""),
        data.get("priority", "Medium"),
        data.get("status", "Not Started"),
        data.get("category", "General"),
        data.get("due_date", "")
    ))
    con.commit()
    con.close()
    return jsonify({"message": "Task added"}), 201

@app.route("/tasks/<int:id>", methods=["PUT"])
def update_task(id):
    data = request.json
    con = get_db()
    
    completed_at = None
    if data.get("status") == "Completed":
        completed_at = datetime.now().isoformat()
    
    con.execute("""
        UPDATE tasks SET title=?, description=?, priority=?, status=?, category=?, due_date=?, completed_at=?
        WHERE id=?
    """, (
        data.get("title"),
        data.get("description"),
        data.get("priority"),
        data.get("status"),
        data.get("category"),
        data.get("due_date"),
        completed_at,
        id
    ))
    con.commit()
    con.close()
    return jsonify({"message": "Task updated"})

@app.route("/tasks/<int:id>", methods=["DELETE"])
def delete_task(id):
    con = get_db()
    con.execute("DELETE FROM tasks WHERE id=?", (id,))
    con.commit()
    con.close()
    return jsonify({"message": "Task deleted"})

@app.route("/tasks/<int:id>/status/<status>", methods=["PATCH"])
def update_status(id, status):
    con = get_db()
    completed_at = None
    if status == "Completed":
        completed_at = datetime.now().isoformat()
    
    con.execute("UPDATE tasks SET status=?, completed_at=? WHERE id=?", (status, completed_at, id))
    con.commit()
    con.close()
    return jsonify({"message": "Status updated"})

@app.route("/stats", methods=["GET"])
def get_stats():
    con = get_db()
    total = con.execute("SELECT COUNT(*) as count FROM tasks").fetchone()[0]
    completed = con.execute("SELECT COUNT(*) as count FROM tasks WHERE status='Completed'").fetchone()[0]
    in_progress = con.execute("SELECT COUNT(*) as count FROM tasks WHERE status='In Progress'").fetchone()[0]
    not_started = con.execute("SELECT COUNT(*) as count FROM tasks WHERE status='Not Started'").fetchone()[0]
    
    progress = (completed / total * 100) if total > 0 else 0
    
    con.close()
    return jsonify({
        "total": total,
        "completed": completed,
        "in_progress": in_progress,
        "not_started": not_started,
        "progress": round(progress, 2)
    })


if __name__ == "__main__":
    app.run(debug=True)
