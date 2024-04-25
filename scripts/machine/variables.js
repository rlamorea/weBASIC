import { ErrorCodes, error } from '../interpreter/errors.js'

const defaultArrayLength = 10

export default class Variables {
  constructor() {
    this.variableLookup = {}
  }

  clearAll() {
    this.variableLookup = {}
  }

  getDimensionValues(dimensions, interpreter) {
    let dimensionValues = []
    for (const dimension of dimensions) {
      const dimValue = interpreter.interpretExpression(dimension, dimension.tokenStart)
      if (dimValue.error) { return dimValue }
      if (dimValue.valueType !== 'number') {
        return error(ErrorCodes.ILLEGAL_INDEX, dimension.tokenStart, dimension.tokenEnd)
      }
      if (dimValue.value < 0) {
        return error(ErrorCodes.INDEX_OUT_OF_BOUNDS, dimension.tokenStart, dimension.tokenEnd)
      }
      dimensionValues.push(dimValue.value)
    }
    return dimensionValues
  }

  getValueArrayForIndex(value, dimensionValues, dimensions) {
    let valueArray = value
    for (let idx = 0; idx < dimensionValues.length; idx++) {
      if (!Array.isArray(value)) {
        return error(ErrorCodes.ILLEGAL_INDEX, dimensions[0].tokenStart, dimensions.slice(-1)[0].tokenEnd)
      }
      const dimValue = dimensionValues[idx]
      if (dimValue >= value.length) {
        return error(ErrorCodes.INDEX_OUT_OF_BOUNDS, dimensions[idx].tokenStart, dimensions[idx].tokenEnd)
      }
      valueArray = value
      value = value[dimValue]
    }
    return { value,  valueArray }
  }

  prepValueArray(valueType, dimensionValues, dimensions, idx, forceDimension) {
    let arrayLen = dimensionValues[idx] + 1
    if (!forceDimension) arrayLen = Math.max(arrayLen, defaultArrayLength + 1)
    if (arrayLen <= 1) {
      return error(ErrorCodes.INDEX_OUT_OF_BOUNDS, dimensions[idx].tokenStart, dimensions[idx].tokenEnd)
    }
    let valueArray = Array(arrayLen)
    valueArray.fill(valueType === 'string' ? '' : 0, 0, arrayLen)
    if (idx < dimensionValues.length - 1) {
      for (let arrayIdx = 0; arrayIdx < arrayLen; arrayIdx++) {
        valueArray[arrayIdx] = this.prepValueArray(valueType, dimensionValues, dimensions,idx+1, forceDimension)
      }
    }
    return valueArray
  }

  getValue(variableDef, interpreter) {
    if (variableDef.dimension) {
      return this.getArrayValue(variableDef, interpreter)
    } else if (variableDef.userFunction) {
      return this.getUserFunctionValue(variableDef.userFunction)
    }
    const variableName = variableDef.token
    const variableType = variableDef.valueType

    let valueDef = this.variableLookup[variableName]
    if (!valueDef) {
      let initValue = (variableType === 'string') ? '' : 0
      valueDef = {
        value: initValue,
        valueType: variableDef.variableType
      }
      this.variableLookup[variableName] = valueDef
    }
    return valueDef
  }

  getArrayValue(variableDef, interpreter) {
    const variableName = variableDef.token
    const dimensions = variableDef.dimension
    const dimensionValues = this.getDimensionValues(variableDef.dimension, interpreter)
    if (dimensionValues.error) { return dimensionValues }

    let valueDef = this.variableLookup[variableName]
    if (valueDef) {
      let valueArrayInfo = this.getValueArrayForIndex(valueDef.value, dimensionValues, dimensions)
      if (valueArrayInfo.error) { return valueArrayInfo }
      valueDef = {
        value: valueArrayInfo.value,
        valueType: valueDef.valueType
      }
    } else { // automatic dimension
      if (dimensionValues.length > 1) {
        return error(ErrorCodes.UNDIM_ARRAY, dimensions[0].tokenStart, dimensions.slice(-1)[0].tokenEnd)
      }
      let valueArray = this.prepValueArray(variableDef.valueType, dimensionValues, dimensions,0)
      valueDef = {
        value: 0,
        valueType: variableDef.valueType
      }
      this.variableLookup[variableName] = {
        value: valueArray,
        valueType: variableDef.valueType
      }
    }
    return valueDef
  }

  getUserFunctionValue(variableDef, interpreter) {
    return error(ErrorCodes.UNSUPPORTED, variableDef.tokenStart, variableDef.tokenEnd)
  }

  setValue(variableDef, valueDef, interpreter) {
    if (variableDef.dimension) {
      return this.setArrayValue(variableDef, valueDef, interpreter)
    } else if (variableDef.userFunction) {
      return this.setUserFunctionValue(variableDef, valueDef, interpreter)
    }

    const variableName = variableDef.token
    valueDef = this.cleanValueDef(variableDef, valueDef)
    if (valueDef.error) { return valueDef }

    const storedValue = this.variableLookup[variableName]
    if (storedValue) {
      storedValue.value = valueDef.value
    } else {
      this.variableLookup[variableName] = {
        valueType: valueDef.valueType,
        value: valueDef.value
      }
    }
    return valueDef
  }

  setArrayValue(variableDef, valueDef, interpreter) {
    const variableName = variableDef.token
    const dimensions = variableDef.dimension
    const dimensionValues = this.getDimensionValues(variableDef.dimension, interpreter)
    if (dimensionValues.error) { return dimensionValues }

    valueDef = this.cleanValueDef(variableDef, valueDef)
    if (valueDef.error) { return valueDef }

    const storedValue = this.variableLookup[variableName]
    if (storedValue) {
      let valueArrayInfo = this.getValueArrayForIndex(storedValue.value, dimensionValues, dimensions)
      if (valueArrayInfo.error) { return valueArrayInfo }
      valueArrayInfo.valueArray[dimensionValues.slice(-1)[0]] = valueDef.value
    } else { // automatic dimension
      if (dimensionValues.length > 1) {
        return error(ErrorCodes.UNDIM_ARRAY, dimensions[0].tokenStart, dimensions.slice(-1)[0].tokenEnd)
      }
      const valueArray = this.prepValueArray(variableDef.valueType, dimensionValues, dimensions,0)
      if (valueArray.error) { return valueArray}
      valueArray[dimensionValues[0]] = valueDef.value
      this.variableLookup[variableName] = {
        value: valueArray,
        valueType: valueDef.valueType
      }
    }
    return valueDef
  }

  setUserFunctionValue(variableDef, valueDef, interpreter) {
    return error(ErrorCodes.UNSUPPORTED, variableDef.tokenStart, variableDef.tokenEnd)
  }

  cleanValueDef(variableDef, valueDef) {
    if (variableDef.coding === 'variable-integer') {
      valueDef.value = Math.trunc(valueDef.value)
    }
    if (valueDef.valueType !== variableDef.valueType) {
      return error(ErrorCodes.TYPE_MISMATCH, variableDef.tokenStart, variableDef.tokenEnd)
    }
    return valueDef
  }

  dimensionArray(variableDef, machine, interpreter) {
    const variableName = variableDef.token
    const dimensions = variableDef.dimension
    let valueDef = this.variableLookup[variableName]
    if (valueDef) {
      return error(ErrorCodes.REDIM_ARRAY, variableDef.tokenStart, variableDef.dimension.slice(-1)[0].tokenEnd)
    }

    const dimensionValues = this.getDimensionValues(variableDef.dimension, interpreter)
    if (dimensionValues.error) { return dimensionValues }
    const value = this.prepValueArray(variableDef.valueType, dimensionValues, dimensions,0, true)
    if (value.error) { return value }
    machine.variables.variableLookup[variableName] = {
      value, valueType: variableDef.valueType
    }
    return { done: true }
  }
}