export default class Variables {
  constructor() {
    this.variableLookup = {}
  }

  clearAll() {
    this.variableLookup = {}
  }

  getValue(variableDef, interpreter) {
    const variableName = variableDef.token
    const variableType = variableDef.valueType
    const dimension = variableDef.dimension
    // TODO: dealing with arrays and user functions later

    let valueDef = this.variableLookup[variableName]
    if (!valueDef) {
      let initValue = (variableType === 'string') ? '' : 0
      valueDef = {
        value: initValue,
        valueType: variableType
      }
      this.variableLookup[variableName] = valueDef
      return valueDef
    } else {
      return valueDef
    }
  }

  setValue(variableDef, valueDef) {
    const variableName = variableDef.token
    const dimension = variableDef.dimension
    // TODO: dealing with arrays and user functions later

    if (variableDef.coding === 'variable-integer') {
      valueDef.value = Math.trunc(valueDef.value)
    }

    if (valueDef.valueType !== variableDef.valueType) {
      return { error: 'Type Mismatch', location: variableDef.tokenStart, endLocation: variableDef.tokenEnd }
    }

    const storedValue = this.variableLookup[variableName]
    if (storedValue) {
      storedValue.value = valueDef.value
    } else {
      this.variableLookup[variableName] = {
        valueType: valueDef.valueType,
        value: valueDef.value
      }
    }
  }
}