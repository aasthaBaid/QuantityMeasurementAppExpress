const express = require("express");
const router = express.Router();

const controller = require("../controllers/quantityController");

router.post("/convert", controller.convert);
router.post("/compare", controller.compare);
router.post("/add", controller.add);
router.post("/subtract", controller.subtract);
router.post("/multiply", controller.multiply);
router.post("/divide", controller.divide);

router.get("/history", controller.history);

module.exports = router;