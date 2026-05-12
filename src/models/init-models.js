import { DataTypes } from "sequelize";

import _conversions from "./conversions.js";
import _history from "./history.js";
import _units from "./units.js";

function initModels(sequelize) {
	var conversions = _conversions(sequelize, DataTypes);
	var history = _history(sequelize, DataTypes);
	var units = _units(sequelize, DataTypes);

	conversions.belongsTo(units, { as: "from_unit", foreignKey: "from_unit_id" });
	units.hasMany(conversions, { as: "conversions", foreignKey: "from_unit_id" });
	conversions.belongsTo(units, { as: "to_unit", foreignKey: "to_unit_id" });
	units.hasMany(conversions, { as: "to_unit_conversions", foreignKey: "to_unit_id" });
	history.belongsTo(units, { as: "from_unit", foreignKey: "from_unit_id" });
	units.hasMany(history, { as: "histories", foreignKey: "from_unit_id" });
	history.belongsTo(units, { as: "to_unit", foreignKey: "to_unit_id" });
	units.hasMany(history, { as: "to_unit_histories", foreignKey: "to_unit_id" });

	return {
		conversions,
		history,
		units,
	};
}

export default initModels