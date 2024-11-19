import easyocr
reader = easyocr.Reader(['en'])
result = reader.readtext('test.png', paragraph=True)

def replace_last_underscore_with_comma(input_string):
    if input_string.endswith('_'):
        return input_string[:-1] + ','
    return input_string

for x in result:
  sentence = x[1]
  words = sentence.split()
  new_words = []
  for word in words:
    word = replace_last_underscore_with_comma(word)
    new_words.append(word)
  sentence = ' '.join(new_words)

  print(sentence)