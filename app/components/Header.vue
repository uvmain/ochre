<script setup lang="ts">
const imageSource = useState('imageSource')
const imageToRecognise = useState<string>('imageToRecognise')
const ocrText = useState<string>('ocrText')

const isLoading = ref(false)
const selectedFile = ref()

function handleInput(files: FileList) {
  const file = files[0]
  const reader = new FileReader()

  reader.addEventListener(
    "load",
    () => {
      imageSource.value = reader.result
    },
    false,
  )

  if (file) {
    reader.readAsDataURL(file)
  }
}

async function getOcrText() {
  isLoading.value = true
  const base64DataUrl = imageToRecognise.value
  if (!base64DataUrl) return

  const base64String = base64DataUrl.split(',')[1] as string
  const binaryData = atob(base64String)
  const arrayBuffer = new Uint8Array(binaryData.length)

  for (let i = 0; i < binaryData.length; i++) {
    arrayBuffer[i] = binaryData.charCodeAt(i)
  }

  const blob = new Blob([arrayBuffer], { type: 'image/png' })
  const formData = new FormData()
  formData.append('file', blob, 'snippet.png')

  try {
    const res = await $fetch<{text: string}>('/api/ocr', {
      method: 'POST',
      body: formData,
    })
    console.log(await JSON.stringify(res))
    ocrText.value = res.text
  }
  catch (error) {
    console.error(error)
  }
  finally {
    isLoading.value = false
  }
}

const colorMode = useColorMode()
const isDark = computed({
  get () {
    return colorMode.value === 'dark'
  },
  set () {
    colorMode.preference = colorMode.value === 'dark' ? 'light' : 'dark'
  }
})

</script>

<template>
  <div class="flex w-full justify-center">
    <header class="flex justify-center flex-wrap m-4">
      <div class="flex flex-row gap-2">
        <UInput id="addFiles" v-model="selectedFile" type="file" size="lg" icon="i-heroicons-folder" accept="image/*" multiple="false" @change="handleInput"/>
        <UButton icon="i-heroicons-document-text" size="lg" :loading="isLoading" :disabled="!imageToRecognise" @click="getOcrText">
          OCR
        </UButton>
        <div />
        <UButton
          :icon="isDark ? 'i-heroicons-moon-20-solid' : 'i-heroicons-sun-20-solid'"
          
          aria-label="Theme"
          size="lg"
          @click="isDark = !isDark"
        />
      </div>
    </header>
  </div>
</template>
