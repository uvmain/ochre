export function titleCasePhrase(phrase: string): string {
  phrase = splitAndTitleCase(phrase, '\n')
  phrase = splitAndTitleCase(phrase, '.')
  phrase = splitAndTitleCase(phrase, /\r?\n/, '\n')
  return phrase
}

function splitAndTitleCase(phraseString: string, splitString: string | RegExp, joinString?: string): string {
  const tempArray: string[] = []
  const phraseArray = phraseString.split(splitString)
  phraseArray.forEach((phrase: string) => {
    phrase = phrase.toLowerCase()
    phrase = phrase.replace(/[a-z]/i, match => match.toUpperCase())
    tempArray.push(phrase)
  })
  joinString = joinString ?? splitString as string
  return tempArray.join(joinString)
}
