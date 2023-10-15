require("dotenv").config();
const mysql = require("mysql2");
const { DATABASE_CREATION } = require("./creation");
const { INITIAL_DATA } = require("./initialData");

const pool = mysql.createPool({
  host: `${process.env.DB_HOST}`,
  user: `${process.env.DB_USER}`,
  password: `${process.env.DB_PASSWORD}`,
  database: `${process.env.DB_NAME}`,
  multipleStatements: true,
});

const connection = pool.promise();

const databaseInitialization = async () => {
  try {
    await connection.query(DATABASE_CREATION);
    const [results] = await connection.query(
      "SELECT COUNT(*) as number FROM users;"
    );
    const userSum = results[0].number;
    if (userSum === 0) {
      await connection.query(INITIAL_DATA);
      console.log("Database created & initial data inserted successfully.");
    }
  } catch (err) {
    console.log(err);
    console.log("Initial data insertion failed.");
  }
};

connection
  .getConnection()
  .then((connection) => {
    console.log("Connected to MySQL server");

    connection.release(); // Release the connection back to the pool
    databaseInitialization();
  })
  .catch((err) => {
    console.error("Error connecting to MySQL server:", err);
  });

module.exports = connection;
