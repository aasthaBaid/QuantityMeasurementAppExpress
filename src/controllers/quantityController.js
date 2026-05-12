const service = require("../services/quantityService");

exports.convert = async (req, res) => {
  const result = await service.convert(
    req.body.thisQuantity,
    req.body.thatQuantity
  );

  res.json(result);
};

exports.compare = async (req, res) => {
  const result = await service.compare(
    req.body.thisQuantity,
    req.body.thatQuantity
  );

  res.json(result);
};

exports.add = async (req, res) => {
  const result = await service.add(
    req.body.thisQuantity,
    req.body.thatQuantity
  );

  res.json(result);
};

exports.subtract = async (req, res) => {
  const result = await service.subtract(
    req.body.thisQuantity,
    req.body.thatQuantity
  );

  res.json(result);
};

exports.multiply = async (req, res) => {
  const result = await service.multiply(
    req.body.thisQuantity,
    req.body.thatQuantity
  );

  res.json(result);
};

exports.divide = async (req, res) => {
  const result = await service.divide(
    req.body.thisQuantity,
    req.body.thatQuantity
  );

  res.json(result);
};

exports.history = async (req, res) => {
  const history = await service.getHistory();
  res.json(history);
};