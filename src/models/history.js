import Sequelize from 'sequelize';

export default function (sequelize, DataTypes) {
	return sequelize.define('history', {
		id: {
			type: DataTypes.BIGINT,
			allowNull: false,
			autoIncrement : true,
			primaryKey: true
		},
		result: {
			type: DataTypes.DOUBLE,
			allowNull: false
		},
		from_unit_id: {
			type: DataTypes.BIGINT,
			allowNull: false,
			references: {
				model: 'units',
				key: 'id'
			}
		},
		to_unit_id: {
			type: DataTypes.BIGINT,
			allowNull: false,
			references: {
				model: 'units',
				key: 'id'
			}
		},
		from_value: {
			type: DataTypes.DOUBLE,
			allowNull: false
		},
		op_result: {
			type: DataTypes.STRING(255),
			allowNull: false
		},
		operation_type: {
			type: DataTypes.STRING(255),
			allowNull: false
		},
		to_value: {
			type: DataTypes.DOUBLE,
			allowNull: false
		}
	}, {
		sequelize,
		tableName: 'history',
		schema: 'public',
		timestamps: false,
		indexes: [
			{
				name: "history_pkey",
				unique: true,
				fields: [
					{ name: "id" },
				]
			},
		]
	});
};
