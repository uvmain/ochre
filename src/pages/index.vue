<script setup lang="ts">
import { createWorker, OEM, PSM } from 'tesseract.js'
import '@recogito/annotorious/dist/annotorious.min.css'

const imageSource = ref()
const imageToRecognise = ref()
const tesseractWorker = ref()
const ocrText = ref<string>()
const loading = ref(false)

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
  }
}

async function handleSelection(annotation: { id: string | number }) {
  const id = annotation.id
  const snippetObject: { snippet: HTMLCanvasElement } = await anno.value.getImageSnippetById(id)
  updateImageToRecognise(snippetObject)
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
      console.log(JSON.stringify(ret.data))
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
  <div>
    <div class="flex flex-row justify-center gap-2">
      <input
        id="addFiles"
        type="file"
        accept="image/*"
        multiple="false"
        class="w-3/4 justify-center text-center"
        @change="handleInput"
      >
      <button
        type="button"
        :disabled="!canOcr"
        class="mb-2 me-2 rounded-lg bg-blue-gray-500 px-5 py-2.5 text-center text-xl text-white font-medium md:text-3xl"
        @click="getOcrText"
      >
        OCR
      </button>
    </div>
    <div class="mt-10 flex flex-row gap-4 text-bluegray-700">
      <div class="max-w-1/2 flex flex-col gap-4">
        <img v-if="imageSource" id="text-img" :src="imageSource" class="h-full w-full" @mousedown.prevent="null">
      </div>
      <textarea id="story" v-model="ocrText" name="story" />
    </div>
  </div>
</template>
