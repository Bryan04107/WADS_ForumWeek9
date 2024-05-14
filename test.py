import sqlite3

# Connect to SQLite database (creates new file if it doesn't exist)
conn = sqlite3.connect('ToDoDatabase.db')

# Create a cursor object to execute SQL commands
cursor = conn.cursor()

# Define SQL command to create a tasks table
create_table_sql = '''
CREATE TABLE IF NOT EXISTS tasks (
    id TEXT PRIMARY KEY,
    uid TEXT NOT NULL,
    title TEXT NOT NULL,
    state BOOLEAN NOT NULL,
    description TEXT NOT NULL
)
'''

# Execute the SQL command to create the table
cursor.execute(create_table_sql)

# Insert data into the tasks table
cursor.execute("INSERT INTO tasks (id, uid, title, state, description) VALUES (?, ?, ?, ?, ?)", ('1245', '54321', 'Beans', True, 'Beaning'))
cursor.execute("INSERT INTO tasks (id, uid, title, state, description) VALUES (?, ?, ?, ?, ?)", ('3', '54321', 'Beans', False, 'Beaning'))
cursor.execute("INSERT INTO tasks (id, uid, title, state, description) VALUES (?, ?, ?, ?, ?)", ('54321', '123', 'Cheese', True, 'Cheesing'))

# Commit changes and close connection
conn.commit()
conn.close()