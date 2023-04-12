const express = require("express");
const path = require("path");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const app = express();
var format = require("date-fns/format");
var isValid = require("date-fns/isValid");

const dbPath = path.join(__dirname, "todoApplication.db");
app.use(express.json());

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();
const hasPriorityAndStatusProperties = (requestQuery) => {
  return (
    requestQuery.status !== undefined && requestQuery.priority !== undefined
  );
};

const hasPriorityProperty = (requestQuery) => {
  return requestQuery.priority !== undefined;
};

const hasPriorityStatus = (requestQuery) => {
  return requestQuery.status !== undefined;
};

const hasCategoryAndStatusProperties = (requestQuery) => {
  return (
    requestQuery.status !== undefined && requestQuery.category !== undefined
  );
};

const hasCategoryProperty = (requestQuery) => {
  return requestQuery.category !== undefined;
};

const hasCategoryAndPriorityProperties = (requestQuery) => {
  return (
    requestQuery.category !== undefined && requestQuery.priority !== undefined
  );
};

// get todo

app.get("/todos/", async (request, response) => {
  const { search_q = "", status, priority, category } = request.query;
  let getTodoDetailsQuery = "";
  let data = null;
  switch (true) {
    case hasPriorityAndStatusProperties(request.query):
      getTodoDetailsQuery = `
            SELECT 
                id,todo,priority,status,category,due_date as dueDate 
            FROM 
                todo
            WHERE 
                todo LIKE '%${search_q}%' 
                AND  status = '${status}'
                AND priority = '${priority}'
            `;
      break;
    case hasPriorityStatus(request.query):
      if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
        getTodoDetailsQuery = `
            SELECT 
                id,todo,priority,status,category,due_date as dueDate 
            FROM 
                todo
            WHERE 
                todo LIKE '%${search_q}%'
                AND status = '${status}'
                `;
        break;
      } else {
        response.status(400);
        response.send("Invalid Todo Status");
      }

    case hasPriorityProperty(request.query):
      if (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") {
        getTodoDetailsQuery = `
            SELECT 
                id,todo,priority,status,category,due_date as dueDate
            FROM 
                todo
            WHERE 
                todo LIKE '%${search_q}%'
                AND  priority = '${priority}'
            `;
        break;
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }

    case hasCategoryAndStatusProperties(request.query):
      getTodoDetailsQuery = `
            SELECT 
                id,todo,priority,status,category,due_date as dueDate 
            FROM 
                todo
            WHERE 
                todo LIKE '%${search_q}%' 
                AND  status = '${status}'
                AND category = '${category}'
            `;
      break;
    case hasCategoryProperty(request.query):
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        getTodoDetailsQuery = `
            SELECT 
                id,todo,priority,status,category,due_date as dueDate 
            FROM 
                todo
            WHERE 
                todo LIKE '%${search_q}%'
                AND  category = '${category}'
            `;
        break;
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }

    case hasCategoryAndPriorityProperties(request.query):
      getTodoDetailsQuery = `
            SELECT 
                id,todo,priority,status,category,due_date as dueDate 
            FROM 
                todo
            WHERE 
                todo LIKE '%${search_q}%' 
                AND  priority = '${priority}'
                AND category = '${category}'
            `;
      break;
    default:
      getTodoDetailsQuery = `
            SELECT 
                id,todo,priority,status,category,due_date as dueDate 
            FROM 
                todo
            WHERE 
                todo LIKE '%${search_q}%'
            `;
  }
  const todoDetails = await db.all(getTodoDetailsQuery);
  response.send(todoDetails);
});

//get specific todo

app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  //   const { search_q = "", status = "", priority = "" } = request.query;
  const getTodoDetailsQuery = `
  SELECT 
    id,todo,priority,status,category,due_date as dueDate
    FROM todo
  WHERE
    id = ${todoId}
  `;
  const todoDetails = await db.get(getTodoDetailsQuery);
  response.send(todoDetails);
});

// get todo as per date

app.get("/agenda/", async (request, response) => {
  const { date } = request.query;
  const validDate = isValid(new Date(date));
  if (validDate === true) {
    var newDate = format(new Date(date), `yyyy-MM-dd`);
    const getTodoDetailsQuery = `
        SELECT 
            id,todo,priority,status,category,due_date as dueDate
            FROM todo
        WHERE
            due_date = '${newDate}'
        `;
    const todoDetails = await db.all(getTodoDetailsQuery);
    response.send(todoDetails);
  } else {
    response.status(400);
    response.send("Invalid Due Date");
  }
});

// add todo

app.post("/todos/", async (request, response) => {
  const todoDetail = request.body;
  const { id, todo, priority, status, category, dueDate } = request.body;
  const validDate = isValid(new Date(dueDate));
  if (
    (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") &&
    (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") &&
    (category === "WORK" || category === "HOME" || category === "LEARNING") &&
    validDate === true
  ) {
    const addTodoQuery = `
        INSERT INTO todo (id,todo,priority,status,category,due_date)
        VALUES
            (
                ${id},
                '${todo}',
                '${priority}',
                '${status}',
                '${category}',
                '${dueDate}'
            )
        `;
    await db.run(addTodoQuery);
    response.send("Todo Successfully Added");
  } else {
    if (status !== "TO DO" || status !== "IN PROGRESS" || status !== "DONE") {
      response.status(400);
      response.send("Invalid Todo Status");
    } else if (
      priority !== "HIGH" ||
      priority !== "MEDIUM" ||
      priority !== "LOW"
    ) {
      response.status(400);
      response.send("Invalid Todo Priority");
    } else if (
      category !== "WORK" ||
      category !== "HOME" ||
      category !== "LEARNING"
    ) {
      response.status(400);
      response.send("Invalid Todo Category");
    } else if (validDate === false) {
      response.status(400);
      response.send("Invalid Due Date");
    }
  }
});

//update todo

app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const updateDetails = request.body;
  let updatedColumn = "";
  switch (true) {
    case updateDetails.status !== undefined:
      updatedColumn = "Status";
      break;
    case updateDetails.priority !== undefined:
      updatedColumn = "Priority";
      break;
    case updateDetails.todo !== undefined:
      updatedColumn = "Todo";
      break;
    case updateDetails.category !== undefined:
      updatedColumn = "Category";
      break;
    case updateDetails.dueDate !== undefined:
      updatedColumn = "Due Date";
      break;
  }

  const previousTodoQuery = `
  SELECT *
    FROM todo 
  WHERE 
    id = ${todoId};
  `;
  const previousTodo = await db.get(previousTodoQuery);
  const {
    todo = previousTodo.todo,
    priority = previousTodo.priority,
    status = previousTodo.status,
    category = previousTodo.category,
    dueDate = previousTodo.due_date,
  } = updateDetails;

  const updateTodoQuery = `
  UPDATE todo
  SET
    todo = '${todo}',
    priority = '${priority}',
    status = '${status}',
    category = '${category}',
    due_date = '${dueDate}'
  WHERE
    id = ${todoId}
  `;
  await db.run(updateTodoQuery);
  response.send(`${updatedColumn} Updated`);
});

// delete todo

app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteTodoQuery = `
    DELETE FROM todo
    WHERE
        id = ${todoId}
    `;
  await db.run(deleteTodoQuery);
  response.send("Todo Deleted");
});

module.exports = app;
