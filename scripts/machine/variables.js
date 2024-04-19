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

    const valueDef = this.variableLookup[variableName]
    if (!valueDef) {
      let initValue = (variableType === 'string') ? '' : 0
      this.variableLookup[variableName] = {
        type: variableType,
        value: initValue
      }
      return initValue
    } else {
      return valueDef.value
    }
  }

  setValue(variableDef, value) {
    // NOTE: assumes value is of correct type
    const variableName = variableDef.token
    const dimension = variableDef.dimension
    // TODO: dealing with arrays and user functions later

    const valueDef = this.variableLookup[variableName]
    if (valueDef) {
      valueDef.value = value
    } else {
      this.variableLookup[variableName] = {
        valueType: variableDef.valueType,
        value: value
      }
    }
  }
}