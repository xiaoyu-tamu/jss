// @flow
import type {Plugin} from 'jss'
import defaultUnits from './defaultUnits'

/**
 * Clones the object and adds a camel cased property version.
 */
function addCamelCasedVersion(obj) {
  const regExp = /(-[a-z])/g
  const replace = str => str[1].toUpperCase()
  const newObj = {}
  for (const key in obj) {
    newObj[key] = obj[key]
    newObj[key.replace(regExp, replace)] = obj[key]
  }
  return newObj
}

const units = addCamelCasedVersion(defaultUnits)

/**
 * Recursive deep style passing function
 *
 * @param {String} current property
 * @param {(Object|Array|Number|String)} property value
 * @param {Object} options
 * @return {(Object|Array|Number|String)} resulting value
 */
function iterate(prop, value, options) {
  if (!value) return value

  let convertedValue = value

  if (Array.isArray(value)) {
    for (let i = 0; i < value.length; i++) {
      value[i] = iterate(prop, value[i], options)
    }
  } else if (typeof value === 'number' && value !== 0) {
    convertedValue = value + (options[prop] || units[prop] || '')
  } else if (typeof value === 'object') {
    if (prop === 'fallbacks') {
      for (const innerProp in value) {
        value[innerProp] = iterate(innerProp, value[innerProp], options)
      }
    } else {
      for (const innerProp in value) {
        value[innerProp] = iterate(`${prop}-${innerProp}`, value[innerProp], options)
      }
    }
  }

  return convertedValue
}

export type Options = {[key: string]: string}

/**
 * Add unit to numeric values.
 */
export default function defaultUnit(options: Options = {}): Plugin {
  const camelCasedOptions = addCamelCasedVersion(options)

  function onProcessStyle(style, rule) {
    if (rule.type !== 'style') return style

    for (const prop in style) {
      style[prop] = iterate(prop, style[prop], camelCasedOptions)
    }

    return style
  }

  function onChangeValue(value, prop) {
    return iterate(prop, value, camelCasedOptions)
  }

  return {onProcessStyle, onChangeValue}
}
