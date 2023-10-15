const connection = require("../database/mysql");

const HttpError = require("../models/http-error");

const dateFormatter = require("../shared/dateFormatter");

const getLoads = async (req, res, next) => {
  const { carId, startDate, endDate } = req.params;
  const carIdParam = carId || null;
  const { flag } = req.body;

  let loads;
  if (carIdParam !== null) {
    if (flag === "singleCarLoads") {
      loads =
        "SET @sql = NULL; " +
        "SELECT GROUP_CONCAT(DISTINCT CONCAT('SUM(IF(p.id = ', p.id, ', t.quantity, 0)) AS `', p.name, '`') ORDER BY p.id) INTO @sql " +
        "FROM mydb.products p; " +
        "SET @sql = CONCAT('SELECT l.date, l.id, ', @sql, ' FROM mydb.loads l JOIN mydb.transfers t ON l.id = t.loads_id JOIN mydb.products p ON t.products_id = p.id WHERE l.car_id = " +
        `${carId}` +
        " AND l.date BETWEEN \\'" +
        `${startDate}` +
        " \\' AND \\'" +
        `${endDate}` +
        "\\' GROUP BY l.date, l.id ORDER BY l.date, l.id'); " +
        "PREPARE stmt FROM @sql; " +
        "EXECUTE stmt; " +
        "DEALLOCATE PREPARE stmt";
    }
  } else {
    if (flag === "totalCarLoads") {
      // [QUERY 2] -> ΦΟΡΤΩΜΑΤΑ ΟΛΩΝ ΤΩΝ ΑΜΑΞΙΩΝ
      loads =
        "SET @sql = NULL; " +
        "SELECT GROUP_CONCAT(DISTINCT CONCAT('SUM(IF(p.id = ', p.id, ', t.quantity, 0)) AS `', p.name, '`') ORDER BY p.id) INTO @sql " +
        "FROM mydb.products p; " +
        "SET @sql = CONCAT('SELECT c.pinakida AS `Pinakida`, ', @sql, ' FROM mydb.loads l JOIN mydb.transfers t ON l.id = t.loads_id JOIN mydb.products p ON t.products_id = p.id JOIN mydb.cars c ON l.car_id = c.id WHERE l.date BETWEEN \\'" +
        `${startDate}` +
        "\\' AND \\'" +
        `${endDate}` +
        "\\' GROUP BY c.pinakida'); " +
        "PREPARE stmt FROM @sql; " +
        "EXECUTE stmt; " +
        "DEALLOCATE PREPARE stmt";
    }
  }

  if (!loads) {
    const error = new HttpError("Invalid flag for loads provided.");
    return next(error);
  }

  try {
    const [results] = await connection.query(loads);
    const data = results[4];

    res.json({ loads: data });
  } catch (err) {
    console.log(err);
    const error = new HttpError("Fetching loads failed.", 500);
    return next(error);
  }
};

const getDestructions = async (req, res, next) => {
  const { carId, startDate, endDate } = req.params;
  const carIdParam = carId || null;
  const { flag } = req.body;

  let destructions;
  if (carIdParam === null) {
    if (flag === "totalCarDestructions") {
      // [QUERY 3] -> ΚΑΤΑΣΤΡΟΦΕΣ ΟΛΩΝ ΤΩΝ ΑΜΑΞΙΩΝ
      destructions =
        "SET @sql = NULL; " +
        "SELECT GROUP_CONCAT(DISTINCT CONCAT('SUM(IF(p.id = ', p.id, ', t.quantity, 0)) AS `', p.name, '`') ORDER BY p.id) INTO @sql " +
        "FROM mydb.products p; " +
        "SET @sql = CONCAT('SELECT c.pinakida AS `Pinakida`, ', @sql, ' FROM mydb.car_destructions l JOIN mydb.car_destruction_transaction t ON l.id = t.car_destructions_id JOIN mydb.products p ON t.products_id = p.id JOIN mydb.cars c ON l.cars_id = c.id WHERE l.date BETWEEN \\'" +
        `${startDate}` +
        "\\' AND \\'" +
        `${endDate}` +
        "\\' GROUP BY c.pinakida'); " +
        "PREPARE stmt FROM @sql; " +
        "EXECUTE stmt; " +
        "DEALLOCATE PREPARE stmt";
    } else if (flag === "dailyCarDestructions") {
      // [QUERY 6] -> ΚΑΤΑΣΤΡΟΦΕΣ ΗΜΕΡΑΣ ΑΜΑΞΙΩΝ
      destructions =
        "SET @sql_products = NULL;SELECT GROUP_CONCAT(DISTINCT CONCAT('SUM(CASE WHEN cdt.products_id = ',p.id,' THEN cdt.quantity ELSE 0 END) AS `',p.name,'`')) INTO @sql_products FROM mydb.car_destruction_transaction AS cdt JOIN mydb.products AS p ON cdt.products_id = p.id;SET @sql = CONCAT('SELECT DATE(cd.date) AS date, ', @sql_products, ' FROM mydb.car_destructions AS cd JOIN mydb.car_destruction_transaction AS cdt ON cd.id = cdt.car_destructions_id JOIN mydb.products AS p ON cdt.products_id = p.id WHERE cd.date BETWEEN \\'" +
        `${startDate}` +
        "\\' AND \\'" +
        `${endDate}` +
        "\\' GROUP BY DATE(cd.date)');PREPARE stmt FROM @sql;EXECUTE stmt;DEALLOCATE PREPARE stmt;";
    } else if (flag === "warehouseDestructions") {
      // [QUERY 5] -> ΚΑΤΑΣΤΡΟΦΕΣ ΑΠΟΘΗΚΗΣ
      destructions =
        "SET @sql_products = NULL; " +
        "SELECT GROUP_CONCAT(DISTINCT CONCAT('SUM(IF(p.id = ', p.id, ', t.quantity, 0)) AS `', p.name, '`') ORDER BY p.id) INTO @sql_products " +
        "FROM mydb.products p; " +
        "SET @sql = CONCAT('SELECT wd.id AS ID, wd.date AS Date, ', @sql_products, ' FROM mydb.warehouse_destructions wd JOIN mydb.warehouse_destruction_transaction t ON wd.id = t.warehouse_destructions_id JOIN mydb.products p ON t.products_id = p.id WHERE wd.date BETWEEN \\'" +
        `${startDate}` +
        "\\' AND \\'" +
        `${endDate}` +
        "\\' GROUP BY wd.id, wd.date'); " +
        "PREPARE stmt FROM @sql; " +
        "EXECUTE stmt; " +
        "DEALLOCATE PREPARE stmt";
    }
  } else {
    if (flag === "singleCarDestructions") {
      // [QUERY 4] -> ΚΑΤΑΣΤΡΟΦΕΣ ΕΝΟΣ ΣΥΓΚΕΚΡΙΜΕΝΟΥ ΑΜΑΞΙΟΥ
      destructions =
        "SET @sql = NULL; " +
        "SELECT GROUP_CONCAT(DISTINCT CONCAT('SUM(IF(p.id = ', p.id, ', cdt.quantity, 0)) AS `', p.name, '`') ORDER BY p.id) INTO @sql " +
        "FROM mydb.products p; " +
        "SET @sql = CONCAT('SELECT cd.date, cd.id, ', @sql, ' FROM mydb.car_destructions cd JOIN mydb.car_destruction_transaction cdt ON cd.id = cdt.car_destructions_id JOIN mydb.products p ON cdt.products_id = p.id WHERE cd.cars_id = " +
        `${carIdParam}` +
        " AND cd.date BETWEEN \\'" +
        `${startDate}` +
        "\\' AND \\'" +
        `${endDate}` +
        "\\' GROUP BY cd.date, cd.id ORDER BY cd.date, cd.id'); " +
        "PREPARE stmt FROM @sql; " +
        "EXECUTE stmt";
    }
  }

  if (!destructions) {
    const error = new HttpError("Invalid flag for destructions provided");
    return next(error);
  }

  try {
    const [results] = await connection.query(destructions);
    const data = results[4];

    res.json({ destructions: data });
  } catch (err) {
    console.log(err);
    const error = new HttpError("Fetching destructions failed.", 500);
    return next(error);
  }
};

const getReturns = async (req, res, next) => {
  const { carId, startDate, endDate } = req.params;
  const carIdParam = carId || null;
  const { flag } = req.body;

  let returns;
  if (carIdParam !== null) {
    if (flag === "singleCarReturns") {
      // [QUERY 7] -> ΕΠΙΣΤΡΟΦΕΣ ΕΝΟΣ ΣΥΓΚΕΚΡΙΜΕΝΟΥ ΑΜΑΞΙΟΥ
      returns =
        "SET @sql = NULL; " +
        "SELECT GROUP_CONCAT(DISTINCT CONCAT('SUM(IF(p.id = ', p.id, ', rt.quantity, 0)) AS `', p.name, '`') ORDER BY p.id) INTO @sql " +
        "FROM mydb.products p; " +
        "SET @sql = CONCAT('SELECT r.date, r.id, ', @sql, ' FROM mydb.returns r JOIN mydb.returns_transaction rt ON r.id = rt.returns_id JOIN mydb.products p ON rt.products_id = p.id WHERE r.car_id = " +
        `${carId}` +
        " AND r.date BETWEEN \\'" +
        `${startDate}` +
        " \\' AND \\'" +
        `${endDate}` +
        "\\' GROUP BY r.date, r.id ORDER BY r.date, r.id'); " +
        "PREPARE stmt FROM @sql; " +
        "EXECUTE stmt; " +
        "DEALLOCATE PREPARE stmt";
    }
  } else {
    if (flag === "totalCarReturns") {
      // [QUERY 8] -> ΕΠΙΣΤΡΟΦΕΣ ΟΛΩΝ ΤΩΝ ΑΜΑΞΙΩΝ
      returns =
        "SET @sql = NULL; " +
        "SELECT GROUP_CONCAT(DISTINCT CONCAT('SUM(IF(p.id = ', p.id, ', t.quantity, 0)) AS `', p.name, '`') ORDER BY p.id) INTO @sql " +
        "FROM mydb.products p; " +
        "SET @sql = CONCAT('SELECT c.pinakida AS `pinakida`, ', @sql, ' FROM mydb.returns l JOIN mydb.returns_transaction t ON l.id = t.returns_id JOIN mydb.products p ON t.products_id = p.id JOIN mydb.cars c ON l.car_id = c.id WHERE l.date BETWEEN \\'" +
        `${startDate}` +
        "\\' AND \\'" +
        `${endDate}` +
        "\\' GROUP BY c.pinakida'); " +
        "PREPARE stmt FROM @sql; " +
        "EXECUTE stmt; " +
        "DEALLOCATE PREPARE stmt";
    }
  }

  if (!returns) {
    const error = new HttpError("Invalid flag for returns provided");
    return next(error);
  }

  try {
    const [results] = await connection.query(returns);
    const data = results[4];

    res.json({ returns: data });
  } catch (err) {
    console.log(err);
    const error = new HttpError("Fetching returns failed.", 500);
    return next(error);
  }
};

const getWareHouseStatus = async (req, res, next) => {
  const { firstDayCurrentMonth, lastDayCurrentMonth, firstDayPrevMonth } =
    dateFormatter();
  console.log(firstDayCurrentMonth, lastDayCurrentMonth, firstDayPrevMonth);

  const today = new Date();
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const formattedFirstDayOfMonth = firstDayOfMonth.toISOString().slice(0, 10);
  const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  const formattedLastDayOfMonth = lastDayOfMonth.toISOString().slice(0, 10);
  const firstDayOfPrevMonth = new Date(
    today.getFullYear(),
    today.getMonth() - 1,
    1
  );
  const formattedFirstDayOfPrevMonth = firstDayOfPrevMonth
    .toISOString()
    .slice(0, 10);

  const warehouseStatus =
    "SELECT p.id AS product_id, p.name AS product_name, COALESCE(SUM(loads_in_ntalika), 0) + COALESCE(SUM(apografi_proionton), 0) + COALESCE(SUM(returns), 0) - COALESCE(SUM(loads_out_ntalika), 0) - COALESCE(SUM(warehouse_destructions), 0) - COALESCE(SUM(car_destructions), 0) AS current_quantity FROM mydb.products p LEFT JOIN (SELECT products_id, SUM(quantity) AS loads_in_ntalika FROM mydb.loads l JOIN mydb.transfers t ON l.id = t.loads_id JOIN mydb.cars c ON l.car_id = c.id WHERE l.date BETWEEN '" +
    `${formattedFirstDayOfMonth}` +
    "' AND '" +
    `${formattedLastDayOfMonth}` +
    "' AND c.isNtalika = 1 GROUP BY products_id) AS lin ON p.id = lin.products_id LEFT JOIN (SELECT products_id, SUM(quantity) AS apografi_proionton FROM mydb.apografi_proionton ap JOIN mydb.apografi_proionton_transaction apt ON ap.apografi_id = apt.apografi_apografi_id WHERE ap.month = '" +
    `${formattedFirstDayOfPrevMonth}` +
    "' GROUP BY products_id) AS apg ON p.id = apg.products_id LEFT JOIN (SELECT products_id, SUM(quantity) AS returns FROM mydb.returns r JOIN mydb.returns_transaction rt ON r.id = rt.returns_id WHERE r.date BETWEEN '" +
    `${formattedFirstDayOfMonth}` +
    "' AND '" +
    `${formattedLastDayOfMonth}` +
    "' GROUP BY products_id) AS ret ON p.id = ret.products_id LEFT JOIN (SELECT products_id, SUM(quantity) AS loads_out_ntalika FROM mydb.loads l JOIN mydb.transfers t ON l.id = t.loads_id JOIN mydb.cars c ON l.car_id = c.id WHERE l.date BETWEEN '" +
    `${formattedFirstDayOfMonth}` +
    "' AND '" +
    `${formattedLastDayOfMonth}` +
    "' AND c.isNtalika = 0 GROUP BY products_id) AS lout ON p.id = lout.products_id LEFT JOIN (SELECT products_id, SUM(quantity) AS warehouse_destructions FROM mydb.warehouse_destructions wd JOIN mydb.warehouse_destruction_transaction wdt ON wd.id = wdt.warehouse_destructions_id WHERE wd.date BETWEEN '" +
    `${formattedFirstDayOfMonth}` +
    "' AND '" +
    `${formattedLastDayOfMonth}` +
    "' GROUP BY products_id) AS wde ON p.id = wde.products_id LEFT JOIN (SELECT products_id, SUM(quantity) AS car_destructions FROM mydb.car_destructions cd JOIN mydb.car_destruction_transaction cdt ON cd.id = cdt.car_destructions_id WHERE cd.date BETWEEN '" +
    `${formattedFirstDayOfMonth}` +
    "' AND '" +
    `${formattedLastDayOfMonth}` +
    "' GROUP BY products_id) AS cde ON p.id = cde.products_id GROUP BY p.id, p.name";

  try {
    const [results] = await connection.query(warehouseStatus);

    res.json({ warehouseStatus: results });
  } catch (err) {
    console.log(err);
    const error = new HttpError("Fetching warehouse status failed.", 500);
    return next(error);
  }
};

const getTotalProductsDestructionsStatus = async (req, res, next) => {
  const today = new Date();
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const formattedFirstDayOfMonth = firstDayOfMonth.toISOString().slice(0, 10);
  const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  const formattedLastDayOfMonth = lastDayOfMonth.toISOString().slice(0, 10);

  const totalDestructionsQuery =
    "SELECT product_id, product_name, SUM(quantity) as 'total_quantity' FROM (SELECT products.id AS 'product_id', products.name AS 'product_name', SUM(warehouse_destruction_transaction.quantity) AS 'quantity' FROM products LEFT JOIN warehouse_destruction_transaction ON products.id = warehouse_destruction_transaction.products_id LEFT JOIN warehouse_destructions ON warehouse_destruction_transaction.warehouse_destructions_id = warehouse_destructions.id WHERE warehouse_destructions.date BETWEEN  '" +
    `${formattedFirstDayOfMonth}` +
    "' AND '" +
    `${formattedLastDayOfMonth}` +
    "'  GROUP BY products.id, products.name UNION ALL SELECT products.id AS 'product_id', products.name AS 'product_name', SUM(car_destruction_transaction.quantity) AS 'quantity' FROM products LEFT JOIN car_destruction_transaction ON products.id = car_destruction_transaction.products_id LEFT JOIN car_destructions ON car_destruction_transaction.car_destructions_id = car_destructions.id WHERE car_destructions.date BETWEEN  '" +
    `${formattedFirstDayOfMonth}` +
    "' AND '" +
    `${formattedLastDayOfMonth}` +
    "'  GROUP BY products.id, products.name) AS combined GROUP BY product_id, product_name;";

  try {
    const [results] = await connection.query(totalDestructionsQuery);

    res.json({ totalProductsDestructions: results });
  } catch (err) {
    console.log(err);
    const error = new HttpError("Fetching total destructions failed.", 500);
    return next(error);
  }
};

const getCarList = async (req, res, next) => {
  const carslist = "SELECT * FROM mydb.cars;";

  try {
    const [results] = await connection.query(carslist);

    res.json({ carslist: results });
  } catch (err) {
    console.log(err);
    const error = new HttpError("Fetching car list failed.", 500);
    return next(error);
  }
};

const getProducts = async (req, res, next) => {
  const productsList = "SELECT * FROM mydb.products;";

  try {
    const [results] = await connection.query(productsList);

    res.json({ productsList: results });
  } catch (err) {
    console.log(err);
    const error = new HttpError("Fetching products failed.", 500);
    return next(error);
  }
};

const getQuantities = async (req, res, next) => {
  const { id, flag } = req.body;

  let sqlquery = "";
  if (flag === "load") {
    sqlquery = `
      SELECT p.id as products_id, COALESCE(t.quantity, 0) as quantity
      FROM mydb.products p
      LEFT JOIN mydb.transfers t ON p.id = t.products_id AND t.loads_id = ${id};
    `;
  } else if (flag === "return") {
    sqlquery = `
      SELECT p.id as products_id, COALESCE(rt.quantity, 0) as quantity
      FROM mydb.products p
      LEFT JOIN mydb.returns_transaction rt ON p.id = rt.products_id AND rt.returns_id = ${id};
    `;
  } else if (flag === "cardestruction") {
    sqlquery = `
      SELECT p.id as products_id, COALESCE(cdt.quantity, 0) as quantity
      FROM mydb.products p
      LEFT JOIN mydb.car_destruction_transaction cdt ON p.id = cdt.products_id AND cdt.car_destructions_id = ${id};
    `;
  } else if (flag === "warehousedestruction") {
    sqlquery = `
      SELECT p.id as products_id, COALESCE(wdt.quantity, 0) as quantity
      FROM mydb.products p
      LEFT JOIN mydb.warehouse_destruction_transaction wdt ON p.id = wdt.products_id AND wdt.warehouse_destructions_id = ${id};
    `;
  } else {
    const error = new HttpError(
      "Invalid flag provided, please provide a valid flag."
    );
    return next(error);
  }

  try {
    const [results] = await connection.query(sqlquery);

    res.json({ quantities: results });
  } catch (err) {
    console.log(err);
    const error = new HttpError(
      "Fetching quantities failed, please try again.",
      500
    );
    return next(error);
  }
};

const getWareHouseLastMonthStatus = async (req, res, next) => {
  const { year, month } = req.body;

  const warehouseLastMonthStatus =
    "SELECT p.name AS 'Product Name', apt.quantity AS 'Quantity' FROM mydb.apografi_proionton ap JOIN mydb.apografi_proionton_transaction apt ON ap.apografi_id = apt.apografi_apografi_id JOIN mydb.products p ON apt.products_id = p.id WHERE YEAR(ap.month) = " +
    `${year}` +
    " AND MONTH(ap.month) = " +
    `${month}` +
    "";

  let results;
  try {
    [results] = await connection.query(warehouseLastMonthStatus);

    res.json({ warehouseLastMonthStatus: results });

    const warehouseLastMonthDestructionsStatus =
      "SELECT p.name AS 'Product Name', SUM(akt.quantity) AS 'Quantity' FROM mydb.apografi_katastrofon_transaction AS akt JOIN mydb.apografi_katastrofon AS ak ON akt.apografi_katastrofon_apografi_katastrofon_id = ak.apografi_katastrofon_id JOIN mydb.products AS p ON akt.products_id = p.id WHERE MONTH(ak.month) = " +
      `${month}` +
      " AND YEAR(ak.month) = " +
      `${year}` +
      " GROUP BY p.id, p.name";

    [results] = await connection.query(warehouseLastMonthDestructionsStatus);

    res.json({ warehouseLastMonthDestructionsStatus: results });
  } catch (err) {
    console.log(err);
    const error = new HttpError(
      "Fetching warehouse last month status failed.",
      500
    );
    return next(error);
  }
};

const addLoads = async (req, res, next) => {
  const { carId, date, products } = req.body;

  try {
    // First query to insert the new load
    const [results] = await connection.query(
      "INSERT INTO mydb.loads (car_id, date) VALUES (?, ?)",
      [carId, date]
    );

    // Get the last inserted load ID
    const lastInsertedLoadId = results.insertId;

    // Construct the second query to insert the transfers
    let transfersQuery =
      "INSERT INTO mydb.transfers (loads_id, products_id, quantity) VALUES";

    for (const product of products) {
      const productId = parseInt(product.productId);
      const quantity = parseInt(product.quantity);
      const values = `${lastInsertedLoadId}, ${productId}, ${quantity}`;
      const secondPart = " (" + `${values}` + " ),";
      transfersQuery += secondPart;
    }

    // Remove the last comma and add a semicolon
    transfersQuery = transfersQuery.slice(0, -1) + ";";

    try {
      // Execute the second query to insert the transfers
      await connection.query(transfersQuery);

      res.json({ OK: "OK" });
    } catch (err) {
      console.log(err);
      const error = new HttpError("Inserting transfers failed.", 500);
      return next(error);
    }
  } catch (err) {
    console.log(err);
    const error = new HttpError("Adding loads failed.", 500);
    return next(error);
  }
};

const addCarDestructions = async (req, res, next) => {
  const { carId, date, products } = req.body;

  try {
    const [results] = await connection.query(
      "INSERT INTO mydb.car_destructions (cars_id, date) VALUES (?, ?)",
      [carId, date]
    );
    const lastInsertedDestructionId = results.insertId;

    // Construct the second query to insert the car_destruction_transaction
    let transfersQuery =
      "INSERT INTO mydb.car_destruction_transaction (car_destructions_id, products_id, quantity) VALUES";

    for (const key in products) {
      const productId = products[key].productId;
      const quantity = products[key].quantity;
      const values = `${lastInsertedDestructionId}, ${productId}, ${quantity}`;
      const secondPart = " (" + `${values}` + " ),";
      transfersQuery += secondPart;
    }

    // Remove the last comma and add a semicolon
    transfersQuery = transfersQuery.slice(0, -1) + ";";

    try {
      // Execute the second query to insert the transfers
      await connection.query(transfersQuery);

      res.json({ OK: "OK" });
    } catch (err) {
      console.log(err);
      const error = new HttpError("Inserting transfers failed.", 500);
      return next(error);
    }
  } catch (err) {
    console.log(err);
    const error = new HttpError("Add car destructions failed.", 500);
    return next(error);
  }
};

const addWarehouseDestructions = async (req, res, next) => {
  const { date, products } = req.body;

  // First query to insert the new load
  try {
    const [results] = await connection.query(
      "INSERT INTO mydb.warehouse_destructions (date) VALUES (?)",
      [date]
    );
    // Get the last inserted load ID
    const lastInsertedWDestructionId = results.insertId;

    // Construct the second query to insert the car_destruction_transaction
    let transfersQuery =
      "INSERT INTO mydb.warehouse_destruction_transaction (warehouse_destructions_id, products_id, quantity) VALUES";

    for (const product of products) {
      const { productId, quantity } = product;
      const values = `${lastInsertedWDestructionId}, ${productId}, ${quantity}`;
      const secondPart = " (" + `${values}` + " ),";
      transfersQuery += secondPart;
    }

    // Remove the last comma and add a semicolon
    transfersQuery = transfersQuery.slice(0, -1) + ";";

    // Execute the second query to insert the transfers
    try {
      await connection.query(transfersQuery);
      res.json({ OK: "OK" });
    } catch (err) {
      console.log(err);
      const error = new HttpError("Inserting transfers failed.", 500);
      return next(error);
    }
  } catch (err) {
    console.log(err);
    const error = new HttpError("Adding warehouse destructions failed.", 500);
    return next(error);
  }
};

const addCarReturns = async (req, res, next) => {
  const { carId, date, products } = req.body;

  // First query to insert the new load
  try {
    const [results] = await connection.query(
      "INSERT INTO mydb.returns (car_id, date) VALUES (?, ?)",
      [carId, date]
    );
    // Get the last inserted load ID
    const lastInsertedReturnID = results.insertId;

    // Construct the second query to insert the car_destruction_transaction
    let transfersQuery =
      "INSERT INTO mydb.returns_transaction (returns_id, products_id, quantity) VALUES";

    for (const product of products) {
      const productId = parseInt(product.productId);
      const quantity = parseInt(product.quantity);
      const values = `${lastInsertedReturnID}, ${productId}, ${quantity}`;
      const secondPart = " (" + `${values}` + " ),";
      transfersQuery += secondPart;
    }

    // Remove the last comma and add a semicolon
    transfersQuery = transfersQuery.slice(0, -1) + ";";

    // Execute the second query to insert the transfers
    try {
      await connection.query(transfersQuery);
      res.json({ OK: "OK" });
    } catch (err) {
      console.log(err);
      const error = new HttpError("Inserting transfers failed.", 500);
      return next(error);
    }
  } catch (err) {
    console.log(err);
    const error = new HttpError("Adding car returns failed.", 500);
    return next(error);
  }
};

const checkEntryExist = async (req, res, next) => {
  const { transactionid } = req.body;
  const { flag } = req.body;

  const checkQuery =
    flag === "editload"
      ? `SELECT EXISTS(SELECT 1 FROM mydb.loads WHERE id = ${transactionid}) as entry_exists;`
      : flag === "editreturn"
      ? `SELECT EXISTS(SELECT 1 FROM mydb.returns WHERE id = ${transactionid}) as entry_exists;`
      : flag === "editcardestruction"
      ? `SELECT EXISTS(SELECT 1 FROM mydb.car_destructions WHERE id = ${transactionid}) as entry_exists;`
      : flag === "editwarehousedestruction"
      ? `SELECT EXISTS(SELECT 1 FROM mydb.warehouse_destructions WHERE id = ${transactionid}) as entry_exists;`
      : "";

  if (checkQuery !== "") {
    const [results] = await connection.query(checkQuery);
    res.json({ exists: results[0].entry_exists });
  } else {
    console.log(err);
    const error = new HttpError("Something went wrong", 500);
    return next(error);
  }
};

const editEntry = async (req, res, next) => {
  const { transactionid, products } = req.body;
  const { flag } = req.body;
  let query = "";

  const checkQuery =
    // Make sure the flag values are case insensitive
    flag.toLowerCase() === "editload"
      ? `SELECT EXISTS(SELECT 1 FROM mydb.loads WHERE id = ${transactionid}) as entry_exists;`
      : flag.toLowerCase() === "editreturn"
      ? `SELECT EXISTS(SELECT 1 FROM mydb.returns WHERE id = ${transactionid}) as entry_exists;`
      : flag.toLowerCase() === "editcardestruction"
      ? `SELECT EXISTS(SELECT 1 FROM mydb.car_destructions WHERE id = ${transactionid}) as entry_exists;`
      : flag.toLowerCase() === "editwarehousedestruction"
      ? `SELECT EXISTS(SELECT 1 FROM mydb.warehouse_destructions WHERE id = ${transactionid}) as entry_exists;`
      : "";

  const checkIfExists = async (query) => {
    try {
      if (query !== "") {
        const [results] = await connection.query(query);
        return results[0].entry_exists;
      } else {
        throw new Error("Something went wrong.");
      }
    } catch (err) {
      console.log(err);
      const error = new HttpError("This id does not exists", 500);
      return next(error);
    }
  };

  try {
    const exists = await checkIfExists(checkQuery);

    if (flag.toLowerCase() === "editload" && exists) {
      let firstPart = `
      BEGIN;
      DELETE FROM mydb.transfers WHERE loads_id = ${transactionid};
      INSERT INTO mydb.transfers (loads_id, products_id, quantity) VALUES
    `;
      products.forEach((product) => {
        const values = `${transactionid}, ${product.productId}, ${product.quantity}`;
        const secondPart = `(${values}),`;
        firstPart += secondPart;
      });
      query = firstPart.slice(0, -1) + "; COMMIT;";
    } else if (flag.toLowerCase() === "editreturn" && exists) {
      let firstPart = `
      BEGIN;
      DELETE FROM mydb.returns_transaction WHERE returns_id = ${transactionid};
      INSERT INTO mydb.returns_transaction (returns_id, products_id, quantity) VALUES
    `;
      products.forEach((product) => {
        const values = `${transactionid}, ${product.productId}, ${product.quantity}`;
        const secondPart = `(${values}),`;
        firstPart += secondPart;
      });
      query = firstPart.slice(0, -1) + "; COMMIT;";
    } else if (flag.toLowerCase() === "editcardestruction" && exists) {
      let firstPart = `
      BEGIN;
      DELETE FROM mydb.car_destruction_transaction WHERE car_destructions_id = ${transactionid};
      INSERT INTO mydb.car_destruction_transaction (car_destructions_id, products_id, quantity) VALUES
    `;
      products.forEach((product) => {
        const values = `${transactionid}, ${product.productId}, ${product.quantity}`;
        const secondPart = `(${values}),`;
        firstPart += secondPart;
      });
      query = firstPart.slice(0, -1) + "; COMMIT;";
    } else if (flag.toLowerCase() === "editwarehousedestruction" && exists) {
      let firstPart = `
      BEGIN;
      DELETE FROM mydb.warehouse_destruction_transaction WHERE warehouse_destructions_id = ${transactionid};
      INSERT INTO mydb.warehouse_destruction_transaction (warehouse_destructions_id, products_id, quantity) VALUES
    `;
      products.forEach((product) => {
        const values = `${transactionid}, ${product.productId}, ${product.quantity}`;
        const secondPart = `(${values}),`;
        firstPart += secondPart;
      });
      query = firstPart.slice(0, -1) + "; COMMIT;";
    }

    if (query && exists) {
      await connection.query(query);
      res.json({ OK: "OK" });
    } else {
      const newError = new HttpError("Invalid flag for edit provided.");
      return next(newError);
    }
  } catch (err) {
    console.log(err);
    const error = new HttpError(
      "Something went wrong. This id does not exists",
      500
    );
    return next(error);
  }
};

const deleteItem = async (req, res, next) => {
  const itemId = req.params.itemId;
  const { flag } = req.body;
  let query = "";

  if (flag === "deleteLoadItem") {
    query = `
      BEGIN;
      DELETE FROM mydb.transfers
      WHERE loads_id = ${itemId};
      DELETE FROM mydb.loads
      WHERE id = ${itemId};
      COMMIT;
    `;
  } else if (flag === "deleteReturnItem") {
    query = `
      BEGIN;
      DELETE FROM mydb.returns_transaction
      WHERE returns_id = ${itemId};
      DELETE FROM mydb.returns
      WHERE id = ${itemId};
      COMMIT;
    `;
  } else if (flag === "deleteCarDestructionItem") {
    query = `
      BEGIN;
      DELETE FROM mydb.car_destruction_transaction
      WHERE car_destructions_id = ${itemId};
      DELETE FROM mydb.car_destructions
      WHERE id = ${itemId};
      COMMIT;
    `;
  } else if (flag === "deleteWarehouseDestructionItem") {
    query = `
    BEGIN;
    DELETE FROM mydb.warehouse_destruction_transaction
    WHERE warehouse_destructions_id = ${itemId};
    DELETE FROM mydb.warehouse_destructions
    WHERE id = ${itemId};
    COMMIT;
    `;
  }

  try {
    await connection.query(query);
    res.json({ OK: "OK" });
  } catch (err) {
    console.log(err);
    const error = new HttpError("Invalid flag to delete an item provided", 500);
    return next(error);
  }
};

exports.getLoads = getLoads;
exports.getDestructions = getDestructions;
exports.getReturns = getReturns;
exports.getWareHouseStatus = getWareHouseStatus;
exports.getWareHouseLastMonthStatus = getWareHouseLastMonthStatus;
exports.addLoads = addLoads;
exports.addCarDestructions = addCarDestructions;
exports.addWarehouseDestructions = addWarehouseDestructions;
exports.addCarReturns = addCarReturns;
exports.getCarList = getCarList;
exports.getProducts = getProducts;
exports.editEntry = editEntry;
exports.deleteItem = deleteItem;
exports.getQuantities = getQuantities;
exports.checkEntryExist = checkEntryExist;
exports.getTotalProductsDestructionsStatus = getTotalProductsDestructionsStatus;
