import string from '@adonisjs/core/helpers/string'

function generateShortId(length = 9): string {
  return string.generateRandom(length)
}

export { generateShortId }
