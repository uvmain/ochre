import Typo from 'typo-js'

const dictionary = new Typo('en_US', null, null, { dictionaryPath: '/node_modules/typo-js/dictionaries' })

export interface SpellCheckResponse {
  word: string
  correct: boolean
  recommendations: string[]
}

export function checkSpelling(wordToCheck: string): SpellCheckResponse {
  let arrayOfSuggestions: string[] = []
  if (wordToCheck.endsWith(',') || wordToCheck.endsWith('.')) {
    wordToCheck = wordToCheck.slice(0, -1)
  }
  const isSpelledCorrectly = dictionary.check(wordToCheck)
  if (!isSpelledCorrectly) {
    arrayOfSuggestions = dictionary.suggest(wordToCheck)
  }
  return {
    word: wordToCheck,
    correct: isSpelledCorrectly,
    recommendations: arrayOfSuggestions,
  }
}
