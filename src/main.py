from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional
from pydantic import BaseModel
from typing import List
import sqlite3

conn = sqlite3.connect('ToDoDatabase.db')
app = FastAPI()

origins = [
    "http://localhost:5173",
    "localhost:5173"
]

cursor = conn.cursor()
create_table_sql = '''
CREATE TABLE IF NOT EXISTS tasks (
    id TEXT PRIMARY KEY,
    uid TEXT NOT NULL,
    title TEXT NOT NULL,
    state BOOLEAN NOT NULL,
    description TEXT NOT NULL
)
'''
cursor.execute(create_table_sql)
conn.commit()
conn.close()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"], 
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["*"],
)



class Task(BaseModel):
    id: str
    uid: str
    title: str
    state: bool = False
    description: str



def get_db_connection():
    conn = sqlite3.connect('ToDoDatabase.db')
    conn.row_factory = sqlite3.Row
    return conn



@app.post("/create-task")
def createTask(task: Task):

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("INSERT INTO tasks (id, uid, title, state, description) VALUES (?, ?, ?, ?, ?)", (task.id, task.uid, task.title, task.state, task.description))
    conn.commit()
    conn.close()

    return task
    

@app.put("/update-task-details/{id}")
def updateTaskDetails(id: str, title: Optional[str] = None, description: Optional[str] = None):
    
    if title is None and description is None:
        return {"Message": "No updates provided"}

    conn = get_db_connection()
    cursor = conn.cursor()

    update_query = "UPDATE tasks SET "
    params = []

    if title is not None:
        update_query += "title=?, "
        params.append(title)
    if description is not None:
        update_query += "description=?, "
        params.append(description)

    update_query = update_query.rstrip(', ')

    update_query += " WHERE id=?"
    params.append(id)

    cursor.execute(update_query, tuple(params))
    conn.commit()
    conn.close()

    return {"Message" : "Task Details Updated"}



@app.put("/switch-task-state/{id}")
def switchTaskState(id: str, state: bool):

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("UPDATE tasks SET state=? WHERE id=?", (state, id))
    conn.commit()
    conn.close()

    return {"Message" : "Task State Updated"}


@app.get("/get-all-tasks/{uid}", response_model=List[Task])
def getAll(uid: str):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM tasks WHERE uid = ?", (uid, ))
    all_tasks = cursor.fetchall()
    conn.close()

    tasks = []
    for task_row in all_tasks:
        task = Task(id=task_row[0], uid=task_row[1], title=task_row[2], state=task_row[3], description=task_row[4])
        tasks.append(task)
 
    return tasks



@app.delete("/delete-task/{id}")
def deleteTask(id: str):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM tasks WHERE id = ?", (id, ))
    conn.commit()
    conn.close()

    return {"Message" : "Task deleted successfully"}