import React, { useEffect, useState } from "react";
import "bootstrap/dist/css/bootstrap.css";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Button from "react-bootstrap/Button";
import ListGroup from "react-bootstrap/ListGroup";
import Dropdown from "react-bootstrap/Dropdown";
import Modal from "react-bootstrap/Modal";
import Form from "react-bootstrap/Form";
import "./Todo.css";
import { auth, db, addTask, editTask } from "./firebase";
import { useAuthState } from "react-firebase-hooks/auth";
import { useNavigate, Link } from "react-router-dom";
import { query, collection, getDocs, where } from "firebase/firestore";
import { v4 as uuidv4 } from "uuid";

function ToDo() {
  const [list, setList] = useState([]);
  const [filter, setFilter] = useState("All");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDescription, setNewTaskDescription] = useState("");
  const [currentTaskId, setCurrentTaskId] = useState(null);
  const [currentTaskTitle, setCurrentTaskTitle] = useState("");
  const [currentTaskDescription, setCurrentTaskDescription] = useState("");
  const [user, loading] = useAuthState(auth);
  const [name, setName] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    if (loading || !user) return navigate("/");
    fetchUserName();
    fetchUserTasks();
  }, [user, loading]);

  const fetchUserName = async () => {
    try {
      const q = query(collection(db, "users"), where("uid", "==", user.uid));
      const doc = await getDocs(q);
      const data = doc.docs[0].data();
      setName(data.name);
    } catch (err) {
      console.error(err);
      alert("An error occurred while fetching user data");
    }
  };

  const fetchUserTasks = async () => {
    try {
      const response = await fetch(
        `http://127.0.0.1:8000/get-all-tasks/${user.uid}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        const tasks = await response.json();
        setList(tasks);
      } else {
        const errorData = await response.json();
        console.error("Failed to fetch tasks: ", errorData);
        alert("An error occurred while fetching tasks");
      }
    } catch (err) {
      console.error(err);
      alert("An error occurred while fetching tasks");
    }
  };

  const updateTaskList = (taskList) => {
    const totalTasks = taskList.length;
    const totalFinishedTasks = taskList.filter((task) => task.finished).length;
    const totalUnfinishedTasks = totalTasks - totalFinishedTasks;

    setList(taskList);
    // setTotalTasks(totalTasks);
    // setTotalFinishedTasks(totalFinishedTasks);
    // setTotalUnfinishedTasks(totalUnfinishedTasks);
  };

  const addItem = async () => {
    try {
      if (newTaskTitle !== "") {
        const newTask = {
          id: uuidv4(),
          uid: user.uid,
          title: newTaskTitle,
          description: newTaskDescription,
          state: false,
        };
        const response = await fetch("http://127.0.0.1:8000/create-task", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(newTask),
        });
        addTask(user.uid, newTaskTitle, false, newTaskDescription);
        const updatedList = [...list, newTask];
        updateTaskList(updatedList);
        setShowAddModal(false);
        setNewTaskTitle("");
        setNewTaskDescription("");
      }
    } catch (error) {
      console.error("Error creating document: ", error);
    }
  };

  const deleteItem = async (taskId) => {
    try {
      const response = await fetch(
        `http://127.0.0.1:8000/delete-task/${taskId}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        const updatedList = list.filter((task) => task.id !== taskId);
        updateTaskList(updatedList);
      } else {
        const errorData = await response.json();
        console.error("Failed to delete task: ", errorData);
        alert("An error occurred while deleting the task");
      }
    } catch (error) {
      console.error("Error deleting document: ", error);
      alert("An error occurred while deleting the task");
    }
  };

  const saveEditedTask = async () => {
    try {
      const response = await fetch(
        `http://127.0.0.1:8000/update-task-details/${currentTaskId}?title=${currentTaskTitle}&description=${currentTaskDescription}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title: currentTaskTitle,
            description: currentTaskDescription,
          }),
        }
      );
      if (response.ok) {
        const updatedList = list.map((task) => {
          if (task.id === currentTaskId) {
            return {
              ...task,
              title: currentTaskTitle,
              description: currentTaskDescription,
            };
          }
          return task;
        });
        updateTaskList(updatedList);
        hideEditModal();
      } else {
        const errorData = await response.json();
        console.error("Failed to update task details: ", errorData);
        alert("An error occurred while updating task details");
      }
    } catch (error) {
      console.error("Error updating task details: ", error);
      alert("An error occurred while updating task details");
    }
  };

  const toggleState = async (taskId) => {
    try {
      const task = list.find((task) => task.id === taskId);
      const newFinishedState = !task.state;
      const response = await fetch(
        `http://127.0.0.1:8000/switch-task-state/${taskId}?state=${newFinishedState}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            state: newFinishedState,
          }),
        }
      );

      if (response.ok) {
        const updatedTodos = list.map((task) => {
          if (task.id === taskId) {
            return { ...task, state: newFinishedState };
          }
          return task;
        });
        setList(updatedTodos);
      } else {
        const errorData = await response.json();
        console.error("Failed to toggle task state: ", errorData);
        alert("An error occurred while toggling task state");
      }
    } catch (error) {
      console.error("Error toggling task state: ", error);
      alert("An error occurred while toggling task state");
    }
  };

  const displayEditModal = (taskId, title, description) => {
    setShowEditModal(true);
    setCurrentTaskId(taskId);
    setCurrentTaskTitle(title);
    setCurrentTaskDescription(description);
  };

  const hideEditModal = () => {
    setShowEditModal(false);
    setCurrentTaskId(null);
    setCurrentTaskTitle("");
    setCurrentTaskDescription("");
  };

  return (
    <Container style={{ margin: 0, padding: 0 }}>
      <div className="todo-header">
        <Row>
          <Col
            className="text-start"
            style={{ fontSize: "48px", marginBottom: 10, paddingLeft: 25 }}
          >
            ToDoList
          </Col>
          <Col
            className="text-end"
            style={{ fontSize: "24px", marginBottom: 10, paddingRight: 25 }}
          >
            <Link to="/profile" className="login-detail-box">
              {user && <div>{user.displayName}</div>}
            </Link>
          </Col>
        </Row>
      </div>

      <Row className="inputs">
        <Col>
          <Button
            variant="dark"
            onClick={() => setShowAddModal(true)}
            className="w-100"
          >
            Add+
          </Button>
        </Col>
        <Col>
          <Dropdown>
            <Dropdown.Toggle
              variant="dark"
              id="dropdown-basic"
              className="w-100"
            >
              Filter: {filter}
            </Dropdown.Toggle>
            <Dropdown.Menu>
              <Dropdown.Item onClick={() => setFilter("All")}>
                All
              </Dropdown.Item>
              <Dropdown.Item onClick={() => setFilter("Finished")}>
                Finished
              </Dropdown.Item>
              <Dropdown.Item onClick={() => setFilter("Unfinished")}>
                Unfinished
              </Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>
        </Col>
      </Row>

      <Row className="lists">
        <ListGroup style={{ padding: 0 }}>
          {list.map((task) => {
            if (
              (filter === "Finished" && !task.state) ||
              (filter === "Unfinished" && task.state)
            ) {
              return null;
            }
            return (
              <div key={task.id}>
                <ListGroup.Item
                  variant={task.state ? "success" : "dark"}
                  action
                  style={{ display: "flex", flexDirection: "column" }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      width: "95%",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={task.state}
                      onChange={() => toggleState(task.id)}
                      style={{ marginRight: "10px" }}
                    />
                    <div style={{ width: "100%", overflowWrap: "break-word" }}>
                      <p
                        style={{
                          marginBottom: 0,
                          fontSize: "20px",
                          fontWeight: "bold",
                        }}
                      >
                        {task.title}
                      </p>
                      <p style={{ fontSize: "12px", color: "#6c757d" }}>
                        {task.description}
                      </p>
                    </div>
                  </div>
                  <div style={{ width: "100%", textAlign: "right" }}>
                    <Button
                      style={{ marginBottom: "10px" }}
                      variant="light"
                      onClick={() => deleteItem(task.id)}
                    >
                      Delete
                    </Button>
                    <Button
                      style={{ marginBottom: "10px", marginLeft: "10px" }}
                      variant="light"
                      onClick={() =>
                        displayEditModal(task.id, task.title, task.description)
                      }
                    >
                      Edit
                    </Button>
                  </div>
                </ListGroup.Item>
              </div>
            );
          })}
        </ListGroup>
      </Row>

      <Modal show={showAddModal} onHide={() => setShowAddModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Add New Task</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group controlId="taskTitle">
              <Form.Label>Title</Form.Label>
              <Form.Control
                type="text"
                placeholder="Enter title"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
              />
            </Form.Group>
            <Form.Group controlId="taskDescription">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                placeholder="Enter description"
                value={newTaskDescription}
                onChange={(e) => setNewTaskDescription(e.target.value)}
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowAddModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={addItem}>
            Add Task
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal show={showEditModal} onHide={hideEditModal}>
        <Modal.Header closeButton>
          <Modal.Title>Edit Task</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group controlId="editTaskTitle">
              <Form.Label>Title</Form.Label>
              <Form.Control
                type="text"
                value={currentTaskTitle}
                onChange={(e) => setCurrentTaskTitle(e.target.value)}
              />
            </Form.Group>
            <Form.Group controlId="editTaskDescription">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={currentTaskDescription}
                onChange={(e) => setCurrentTaskDescription(e.target.value)}
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={hideEditModal}>
            Cancel
          </Button>
          <Button variant="primary" onClick={saveEditedTask}>
            Save Changes
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
}

export default ToDo;
