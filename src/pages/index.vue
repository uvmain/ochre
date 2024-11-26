<script setup lang="ts">
import type { SpellCheckResponse } from '../logic/spelling'
import { useDark, useToggle } from '@vueuse/core'
import { createWorker, OEM, PSM } from 'tesseract.js'
import { checkSpelling } from '../logic/spelling'
import '@recogito/annotorious/dist/annotorious.min.css'

const imageSource = ref()
const imageToRecognise = ref()
const tesseractWorker = ref()
const ocrText = ref<string>()
const textSize = ref<number>(3)
const loading = ref(false)
const useSpellCheck = ref(false)
const useBulletPoints = ref(false)
const useMarkdownList = ref(false)

const isDark = useDark()
const toggleDark = useToggle(isDark)
function handleToggleDark() {
  toggleDark()
}

function toggleUseSpellCheck() {
  useSpellCheck.value = !useSpellCheck.value
}

function toggleUseBulletPoints() {
  useBulletPoints.value = !useBulletPoints.value
}

function toggleUseMarkdownList() {
  useMarkdownList.value = !useMarkdownList.value
}

const modifiedText = computed(() => {
  if (!ocrText.value) {
    return undefined
  }

  let returnText = ocrText.value

  if (useSpellCheck.value) {
    const corrections = spellCheck(returnText)
    corrections.forEach((correction) => {
      if (correction.recommendations.length > 0 && returnText.includes(correction.word)) {
        returnText = returnText.replaceAll(correction.word, correction.recommendations[0])
      }
    })
  }

  if (useBulletPoints.value) {
    const list: string[] = []
    const sentences = returnText.split('\n')
    sentences.forEach((sentence) => {
      list.push(sentence.length > 0 ? `• ${sentence}` : sentence)
    })
    returnText = list.join('\n')
  }

  if (useMarkdownList.value) {
    const list: string[] = []
    const sentences = returnText.split('\n')
    sentences.forEach((sentence) => {
      list.push(sentence.length > 0 ? `- ${sentence}` : sentence)
    })
    returnText = list.join('\n')
  }
  return returnText
})

const canOcr = computed<boolean>(() => {
  return !!((loading.value === false && imageToRecognise.value))
})

function handleInput(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input && input.files ? input.files[0] : undefined
  const reader = new FileReader()

  reader.addEventListener(
    'load',
    () => {
      imageSource.value = reader.result
    },
    false,
  )

  if (file) {
    reader.readAsDataURL(file)
  }
}

const Anno = ref()
const anno = ref<typeof import('@recogito/annotorious')>(null)

watch(imageSource, () => {
  handleImageChange()
})

async function handleImageChange() {
  await defineAnno()

  if (anno.value) {
    anno.value.destroy()
    anno.value = null
  }
  initializeAnnotorious()
}

async function defineAnno() {
  if (!Anno.value) {
    Anno.value = await import('@recogito/annotorious')
  }
}

async function initializeAnnotorious() {
  await defineAnno()
  if (imageSource.value && Anno.value) {
    anno.value = new Anno.value.Annotorious({
      image: document.getElementById('text-img') as HTMLImageElement,
      disableEditor: true,
    })

    anno.value.on('createSelection', handleSelection)
    anno.value.on('changeSelected', handleSelection)
    anno.value.on('changeSelectionTarget', handleSelection)
    anno.value.on('cancelSelected', handleSelection)
    anno.value.on('deleteAnnotation', handleSelection)
    anno.value.on('updateAnnotation', handleSelection)
  }

  imageToRecognise.value = imageSource.value
}

async function handleSelection(annotation: { id: string | number }) {
  const id = annotation.id
  const snippetObject: { snippet: HTMLCanvasElement } = await anno.value.getImageSnippetById(id)
  if (snippetObject) {
    updateImageToRecognise(snippetObject)
  }
  else if (imageSource.value) {
    imageToRecognise.value = imageSource.value
  }
}

function updateImageToRecognise(snippetObject: { snippet: HTMLCanvasElement }) {
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  canvas.width = snippetObject.snippet.width * 2
  canvas.height = snippetObject.snippet.height * 2
  ctx?.drawImage(snippetObject.snippet, 0, 0, canvas.width, canvas.height)
  imageToRecognise.value = canvas.toDataURL()
}

async function getWorker() {
  if (!tesseractWorker.value) {
    tesseractWorker.value = await createWorker('eng', OEM.TESSERACT_LSTM_COMBINED)
  }
}

async function getOcrText() {
  try {
    if (imageToRecognise.value) {
      loading.value = true
      await getWorker()
      await tesseractWorker.value.setParameters({
        preserve_interword_spaces: 1,
        tessedit_pageseg_mode: PSM.SINGLE_BLOCK,
      })
      const ret = await tesseractWorker.value.recognize(imageToRecognise.value)
      ocrText.value = ret.data.text
    }
    else {
      console.warn('No image loaded')
    }
  }
  catch (err) {
    console.error(err)
  }
  finally {
    loading.value = false
  }
}

function updateTextSize(value: number) {
  if (value > 0 && textSize.value < 7) {
    textSize.value += 1
  }
  else if (value < 0 && textSize.value > 0) {
    textSize.value -= 1
  }
}

const textSizeClass = computed(() => {
  switch (textSize.value) {
    case 0:
      return 'text-xs'
    case 1:
      return 'text-sm'
    case 2:
      return 'text-base'
    case 3:
      return 'text-lg'
    case 4:
      return 'text-xl'
    case 5:
      return 'text-2xl'
    case 6:
      return 'text-3xl'
    case 7:
      return 'text-4xl'
    default:
      return 'text-lg'
  }
})

function copyToClipboard() {
  if (ocrText.value) {
    navigator.clipboard.writeText(ocrText.value)
  }
}

function spellCheck(words: string) {
  const checkedWords: SpellCheckResponse[] = []
  const wordArray = words.split(/[\n ]+/)
  const uniqueWords = [...new Set(wordArray.filter((word: string) => word.length > 4))]
  for (const word of uniqueWords) {
    const result = checkSpelling(word)
    checkedWords.push(result)
  }
  return checkedWords.filter((word: SpellCheckResponse) => {
    return word.correct === false
  })
}

onBeforeUnmount(async () => {
  if (anno.value) {
    anno.value.off('createSelection', handleSelection)
    anno.value.off('changeSelected', handleSelection)
    anno.value.off('changeSelectionTarget', handleSelection)
    anno.value.destroy()
    anno.value = null
  }
  if (tesseractWorker.value) {
    await tesseractWorker.value.terminate()
  }
})
</script>

<template>
  <div class="flex flex-col gap-6 pt-4">
    <div class="mx-auto flex flex-row items-center justify-center gap-6">
      <label>
        <input
          id="addFiles"
          type="file"
          accept="image/*"
          multiple="false"
          class="text-lg file:mr-5 file:h-11 file:border-1 file:border-gray-400 file:rounded-lg file:border-solid file:bg-gray-100 file:px-4 file:py-2 file:text-lg dark:text-white file:text-gray-600 file:font-bold hover:file:cursor-pointer hover:file:border-blue-500 dark:file:bg-gray-700 hover:file:bg-gray-200 dark:file:text-white"
          @change="handleInput"
        >
      </label>
      <button
        type="button"
        :disabled="!canOcr"
        class="headerButton"
        @click="getOcrText"
      >
        OCR
      </button>
      <button
        type="button"
        class="size-11 flex items-center justify-center border-1 border-gray-400 rounded-lg border-solid bg-gray-100 text-lg text-gray-600 font-bold hover:border-blue-500 dark:bg-gray-700 hover:bg-gray-200"
        @click="handleToggleDark"
      >
        <icon-tabler:sun v-if="isDark" class="text-white" />
        <icon-tabler:moon v-else class="text-gray-700" />
      </button>
    </div>
    <div class="grid grid-cols-2 gap-4">
      <div v-if="imageSource" class="ml-auto border-1 border-gray-400 rounded-lg border-solid p-2 lg:w-2/3">
        <img id="text-img" :src="imageSource" class="h-full w-full" @mousedown.prevent="null">
      </div>
      <div v-if="modifiedText" class="mr-auto flex flex-row gap-2 bg-gray-100 text-gray-700 lg:w-2/3 dark:bg-gray-700 dark:text-white">
        <textarea v-model="modifiedText" class="grow resize-none border-1 border-gray-400 rounded-lg border-solid bg-transparent p-2 text-gray-700 dark:text-white" :class="textSizeClass" />
        <div class="flex flex-col gap-2">
          <button
            type="button"
            class="smallButton"
            @click="updateTextSize(1)"
          >
            <icon-tabler:plus />
          </button>
          <button
            type="button"
            class="smallButton"
            @click="updateTextSize(-1)"
          >
            <icon-tabler:minus />
          </button>
          <button
            type="button"
            class="smallButton"
            @click="copyToClipboard"
          >
            <icon-tabler:copy />
          </button>
          <br>
          <button
            type="button"
            class="smallButton"
            @click="toggleUseSpellCheck"
          >
            <icon-tabler:text-spellcheck :class="{ 'text-green-600': useSpellCheck }" />
          </button>
          <button
            type="button"
            class="smallButton"
            @click="toggleUseBulletPoints"
          >
            <icon-tabler:list :class="{ 'text-green-600': useBulletPoints }" />
          </button>
          <button
            type="button"
            class="smallButton"
            @click="toggleUseMarkdownList"
          >
            <icon-tabler:markdown :class="{ 'text-green-600': useMarkdownList }" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
