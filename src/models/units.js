import Sequelize from 'sequelize';

export default function(sequelize, DataTypes) {
  return sequelize.define('units', {
    id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true
    },
    label: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: "units_unit_type_label_key"
    },
    symbol: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: "units_symbol_key"
    },
    unit_type: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: "units_unit_type_label_key"
    }
  }, {
    sequelize,
    tableName: 'units',
    schema: 'public',
    timestamps: false,
    indexes: [
      {
        name: "uklmp1ycbph1kidphirxqu7qogu",
        unique: true,
        fields: [
          { name: "unit_type" },
          { name: "label" },
        ]
      },
      {
        name: "units_label_key",
        unique: true,
        fields: [
          { name: "label" },
        ]
      },
      {
        name: "units_pkey",
        unique: true,
        fields: [
          { name: "id" },
        ]
      },
      {
        name: "units_symbol_key",
        unique: true,
        fields: [
          { name: "symbol" },
        ]
      },
      {
        name: "units_unit_type_label_key",
        unique: true,
        fields: [
          { name: "unit_type" },
          { name: "label" },
        ]
      },
    ]
  });
};
