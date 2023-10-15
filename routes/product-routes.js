const express = require("express");
const { check } = require("express-validator");

const productControllers = require("../controllers/product-controllers");

const router = express.Router();

router.post("/loads/:carId?/:startDate/:endDate", productControllers.getLoads);

router.post(
  "/destructions/:carId?/:startDate/:endDate",
  productControllers.getDestructions
);

router.post(
  "/returns/:carId?/:startDate/:endDate",
  productControllers.getReturns
);

router.get("/warehouse-status", productControllers.getWareHouseStatus);

router.get(
  "/total-products-destructions-status",
  productControllers.getTotalProductsDestructionsStatus
);

router.post(
  "/warehouse-last-month-status",
  productControllers.getWareHouseLastMonthStatus
);

router.get("/get-car-list", productControllers.getCarList);

router.get("/get-products", productControllers.getProducts);

router.post("/check-entry", productControllers.checkEntryExist);

router.post("/get-quantities", productControllers.getQuantities);

router.post(
  "/add-loads",
  [
    check("carId").not().isEmpty(),
    check("date").not().isDate(),
    check("products").not().isEmpty(),
  ],
  productControllers.addLoads
);
router.post("/add-car-destructions", productControllers.addCarDestructions);

router.post(
  "/add-warehouse-destructions",
  productControllers.addWarehouseDestructions
);
router.post("/add-returns", productControllers.addCarReturns);

router.delete("/delete-item/:itemId", productControllers.deleteItem);

router.patch("/edit-entry", productControllers.editEntry);

module.exports = router;
