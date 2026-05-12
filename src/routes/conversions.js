import { Router } from "express"

import sequelize from "../db/sequelize.js"
import initModels from "../models/init-models.js"

const router = Router()
const { conversions: Conversions, history: History, units: Units } = initModels(sequelize)

const UNIT_FIELDS = ["unitType", "label", "symbol"]
const EPSILON = 1e-9

function toUnitDTO(unit) {
    return {
        unitType: unit.unit_type,
        label: unit.label,
        symbol: unit.symbol,
    }
}

function readUnitPayload(unit, fieldName) {
    if (!unit || typeof unit !== "object") {
        throw new Error(`${fieldName} must be provided as an object`)
    }

    for (const field of UNIT_FIELDS) {
        if (!unit[field]) {
            throw new Error(`${fieldName}.${field} is required`)
        }
    }

    return unit
}

function readQuantityPayload(body, quantityField, unitField) {
    const quantity = Number(body[quantityField])

    if (!Number.isFinite(quantity)) {
        throw new Error(`${quantityField} must be a valid number`)
    }

    return {
        quantity,
        unit: readUnitPayload(body[unitField], unitField),
    }
}

async function findUnit(unitInput) {
    const unit = await Units.findOne({
        where: {
            unit_type: unitInput.unitType,
            label: unitInput.label,
            symbol: unitInput.symbol,
        },
    })

    if (!unit) {
        throw new Error(`Unit not found: ${unitInput.unitType} ${unitInput.label} (${unitInput.symbol})`)
    }

    return unit
}

async function loadConversionGraph() {
    const [allUnits, allConversions] = await Promise.all([
        Units.findAll(),
        Conversions.findAll(),
    ])

    const unitsById = new Map(allUnits.map((unit) => [unit.id, unit]))
    const adjacency = new Map()

    const addEdge = (fromId, toId, apply) => {
        if (!adjacency.has(fromId)) {
            adjacency.set(fromId, [])
        }

        adjacency.get(fromId).push({ toId, apply })
    }

    for (const conversion of allConversions) {
        const fromUnit = unitsById.get(conversion.from_unit_id)
        const toUnit = unitsById.get(conversion.to_unit_id)

        if (!fromUnit || !toUnit) {
            continue
        }

        if (conversion.factor != null) {
            const factor = Number(conversion.factor)
            addEdge(fromUnit.id, toUnit.id, (value) => value * factor)
            addEdge(toUnit.id, fromUnit.id, (value) => value / factor)
            continue
        }

        if (conversion.formula) {
            const formula = conversion.formula
            addEdge(fromUnit.id, toUnit.id, (value) => Function("value", `return ${formula}`)(value))
        }
    }

    return { adjacency }
}

async function convertValue(sourceUnit, targetUnit, value, graph) {
    if (sourceUnit.id === targetUnit.id) {
        return value
    }

    const queue = [{ unitId: sourceUnit.id, value }]
    const visited = new Set([sourceUnit.id])

    while (queue.length > 0) {
        const current = queue.shift()
        const edges = graph.adjacency.get(current.unitId) ?? []

        for (const edge of edges) {
            if (visited.has(edge.toId)) {
                continue
            }

            const nextValue = edge.apply(current.value)

            if (edge.toId === targetUnit.id) {
                return nextValue
            }

            visited.add(edge.toId)
            queue.push({ unitId: edge.toId, value: nextValue })
        }
    }

    throw new Error(`No conversion path found from ${sourceUnit.label} to ${targetUnit.label}`)
}

async function resolveUnits(sourceUnitInput, targetUnitInput, normalizedUnitInput) {
    const [sourceUnit, targetUnit] = await Promise.all([
        findUnit(sourceUnitInput),
        findUnit(targetUnitInput),
    ])

    if (sourceUnit.unit_type !== targetUnit.unit_type) {
        throw new Error("Units must belong to the same unit type")
    }

    const normalizedUnit = normalizedUnitInput
        ? await findUnit(normalizedUnitInput)
        : sourceUnit

    if (normalizedUnit.unit_type !== sourceUnit.unit_type) {
        throw new Error("Normalization unit must belong to the same unit type")
    }

    return { sourceUnit, targetUnit, normalizedUnit }
}

async function recordHistory({ fromValue, fromUnit, toValue, toUnit, resultVal, operationResult, operationType }) {
    return History.create({
        from_value: fromValue,
        to_value: toValue,
        from_unit_id: fromUnit.id,
        to_unit_id: toUnit.id,
        result: resultVal,
        op_result: operationResult,
        operation_type: operationType,
    })
}

function buildResponse({ fromValue, fromUnit, toValue, toUnit, resultVal, operationResult, operationType, normalizedUnit }) {
    return {
        fromValue,
        fromUnit: toUnitDTO(fromUnit),
        toValue,
        toUnit: toUnitDTO(toUnit),
        resultVal,
        operationResult,
        operationType,
        normalizedUnit: toUnitDTO(normalizedUnit),
    }
}

function comparisonText(fromValue, fromUnit, toValue, toUnit, resultVal, normalizedUnit) {
    if (Math.abs(resultVal) <= EPSILON) {
        return `${fromValue} ${fromUnit.symbol} is equal to ${toValue} ${toUnit.symbol} in ${normalizedUnit.symbol}`
    }

    return resultVal > 0
        ? `${fromValue} ${fromUnit.symbol} is greater than ${toValue} ${toUnit.symbol} in ${normalizedUnit.symbol}`
        : `${fromValue} ${fromUnit.symbol} is less than ${toValue} ${toUnit.symbol} in ${normalizedUnit.symbol}`
}

router.get("/health", (req, res) => {
    res.json({ message: "conversions endpoint healthy" })
})

router.post("/convert", async (req, res) => {
    try {
        const { quantity: fromValue, unit: fromUnitInput } = readQuantityPayload(req.body, "fromQty", "fromUnit")
        const toUnitInput = readUnitPayload(req.body.toUnit, "toUnit")

        const { sourceUnit, targetUnit } = await resolveUnits(fromUnitInput, toUnitInput)
        const graph = await loadConversionGraph()
        const resultVal = await convertValue(sourceUnit, targetUnit, fromValue, graph)
        const operationResult = `${fromValue} ${sourceUnit.symbol} = ${resultVal} ${targetUnit.symbol}`

        await recordHistory({
            fromValue,
            fromUnit: sourceUnit,
            toValue: resultVal,
            toUnit: targetUnit,
            resultVal,
            operationResult,
            operationType: "CONVERSION",
        })

        res.status(200).json(buildResponse({
            fromValue,
            fromUnit: sourceUnit,
            toValue: resultVal,
            toUnit: targetUnit,
            resultVal,
            operationResult,
            operationType: "CONVERSION",
            normalizedUnit: targetUnit,
        }))
    } catch (err) {
        res.status(400).json({ error: err.message })
    }
})

router.post("/add", async (req, res) => {
    try {
        const { quantity: fromValue, unit: fromUnitInput } = readQuantityPayload(req.body, "fromQty", "fromUnit")
        const { quantity: toValue, unit: toUnitInput } = readQuantityPayload(req.body, "toQty", "toUnit")
        const normalizedUnitInput = req.body.normalizeUnit ? readUnitPayload(req.body.normalizeUnit, "normalizeUnit") : null

        const { sourceUnit, targetUnit, normalizedUnit } = await resolveUnits(fromUnitInput, toUnitInput, normalizedUnitInput)
        const graph = await loadConversionGraph()
        const normalizedFromValue = await convertValue(sourceUnit, normalizedUnit, fromValue, graph)
        const normalizedToValue = await convertValue(targetUnit, normalizedUnit, toValue, graph)
        const resultVal = normalizedFromValue + normalizedToValue
        const operationResult = `${fromValue} ${sourceUnit.symbol} + ${toValue} ${targetUnit.symbol} = ${resultVal} ${normalizedUnit.symbol}`

        await recordHistory({
            fromValue,
            fromUnit: sourceUnit,
            toValue,
            toUnit: targetUnit,
            resultVal,
            operationResult,
            operationType: "ARITHMETIC_ADD",
        })

        res.status(200).json(buildResponse({
            fromValue,
            fromUnit: sourceUnit,
            toValue,
            toUnit: targetUnit,
            resultVal,
            operationResult,
            operationType: "ARITHMETIC_ADD",
            normalizedUnit,
        }))
    } catch (err) {
        res.status(400).json({ error: err.message })
    }
})

router.post("/compare", async (req, res) => {
    try {
        const { quantity: fromValue, unit: fromUnitInput } = readQuantityPayload(req.body, "fromQty", "fromUnit")
        const { quantity: toValue, unit: toUnitInput } = readQuantityPayload(req.body, "toQty", "toUnit")
        const normalizedUnitInput = req.body.normalizeUnit ? readUnitPayload(req.body.normalizeUnit, "normalizeUnit") : null

        const { sourceUnit, targetUnit, normalizedUnit } = await resolveUnits(fromUnitInput, toUnitInput, normalizedUnitInput)
        const graph = await loadConversionGraph()
        const normalizedFromValue = await convertValue(sourceUnit, normalizedUnit, fromValue, graph)
        const normalizedToValue = await convertValue(targetUnit, normalizedUnit, toValue, graph)
        const resultVal = normalizedFromValue - normalizedToValue
        const operationResult = comparisonText(fromValue, sourceUnit, toValue, targetUnit, resultVal, normalizedUnit)

        await recordHistory({
            fromValue,
            fromUnit: sourceUnit,
            toValue,
            toUnit: targetUnit,
            resultVal,
            operationResult,
            operationType: "COMPARISON",
        })

        res.status(200).json(buildResponse({
            fromValue,
            fromUnit: sourceUnit,
            toValue,
            toUnit: targetUnit,
            resultVal,
            operationResult,
            operationType: "COMPARISON",
            normalizedUnit,
        }))
    } catch (err) {
        res.status(400).json({ error: err.message })
    }
})

export default router