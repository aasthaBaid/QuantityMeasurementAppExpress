const QuantityHistory = require("../models/QuantityHistory");
const units = require("../utils/unitConversions");

function validateMeasurementType(thisQuantity, thatQuantity) {
  if (
    thisQuantity.measurementType !==
    thatQuantity.measurementType
  ) {
    throw new Error(
      "Measurement types must be the same"
    );
  }
}

function convertToBase(quantity) {
  const { value, unit, measurementType } = quantity;

  if (measurementType === "temperature") {
    return convertTemperatureToCelsius(
      value,
      unit
    );
  }

  const conversionFactor =
    units[measurementType]?.[unit];

  if (!conversionFactor) {
    throw new Error("Invalid unit");
  }

  return value * conversionFactor;
}

function convertTemperatureToCelsius(value, unit) {
  switch (unit.toLowerCase()) {
    case "celsius":
      return value;

    case "fahrenheit":
      return (value - 32) * (5 / 9);

    case "kelvin":
      return value - 273.15;

    default:
      throw new Error(
        "Invalid temperature unit"
      );
  }
}

const saveHistory = async (
  operation,
  result
) => {
  await QuantityHistory.create({
    operation,
    result
  });
};

const convert = async (
  thisQuantity,
  thatQuantity
) => {
  validateMeasurementType(
    thisQuantity,
    thatQuantity
  );

  let result;

  if (
    thisQuantity.measurementType ===
    "temperature"
  ) {
    result = convertTemperature(
      thisQuantity.value,
      thisQuantity.unit,
      thatQuantity.unit
    );
  } else {
    const baseValue =
      convertToBase(thisQuantity);

    const targetFactor =
      units[
        thisQuantity.measurementType
      ][thatQuantity.unit];

    result =
      baseValue / targetFactor;
  }

  await saveHistory(
    "convert",
    result
  );

  return {
    result,
    unit: thatQuantity.unit
  };
};

function convertTemperature(
  value,
  from,
  to
) {
  let celsius;

  switch (from.toLowerCase()) {
    case "celsius":
      celsius = value;
      break;

    case "fahrenheit":
      celsius =
        (value - 32) * (5 / 9);
      break;

    case "kelvin":
      celsius = value - 273.15;
      break;

    default:
      throw new Error(
        "Invalid temperature unit"
      );
  }

  switch (to.toLowerCase()) {
    case "celsius":
      return celsius;

    case "fahrenheit":
      return (
        celsius * (9 / 5) + 32
      );

    case "kelvin":
      return celsius + 273.15;

    default:
      throw new Error(
        "Invalid temperature unit"
      );
  }
}

const compare = async (
  thisQuantity,
  thatQuantity
) => {
  validateMeasurementType(
    thisQuantity,
    thatQuantity
  );

  const first =
    convertToBase(thisQuantity);

  const second =
    convertToBase(thatQuantity);

  const result = first === second;

  await saveHistory(
    "compare",
    result ? 1 : 0
  );

  return { result };
};

const add = async (
  thisQuantity,
  thatQuantity
) => {
  validateMeasurementType(
    thisQuantity,
    thatQuantity
  );

  const first =
    convertToBase(thisQuantity);

  const second =
    convertToBase(thatQuantity);

  const result =
    first + second;

  await saveHistory(
    "add",
    result
  );

  return {
    result,
    unit:
      thisQuantity.measurementType ===
      "length"
        ? "m"
        : thisQuantity.measurementType ===
          "weight"
        ? "g"
        : thisQuantity.measurementType ===
          "volume"
        ? "litre"
        : "celsius"
  };
};

const subtract = async (
  thisQuantity,
  thatQuantity
) => {
  validateMeasurementType(
    thisQuantity,
    thatQuantity
  );

  const first =
    convertToBase(thisQuantity);

  const second =
    convertToBase(thatQuantity);

  const result =
    first - second;

  await saveHistory(
    "subtract",
    result
  );

  return {
    result
  };
};

const multiply = async (
  thisQuantity,
  thatQuantity
) => {
  const result =
    thisQuantity.value *
    thatQuantity.value;

  await saveHistory(
    "multiply",
    result
  );

  return { result };
};

const divide = async (
  thisQuantity,
  thatQuantity
) => {
  const result =
    thisQuantity.value /
    thatQuantity.value;

  await saveHistory(
    "divide",
    result
  );

  return { result };
};

const getHistory = async () => {
  return await QuantityHistory.findAll();
};

module.exports = {
  convert,
  compare,
  add,
  subtract,
  multiply,
  divide,
  getHistory
};