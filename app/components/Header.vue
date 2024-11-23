<script setup lang="ts">
const imageSource = useState('imageSource')
const imageToRecognise = useState<string>('imageToRecognise')
const ocrText = useState<string>('ocrText')

function handleInput(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input && input.files ? input.files[0] : undefined
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
    ocrText.value = res.text.replace(/\r\n/g, '<br/>')
  }
  catch (error) {
    console.error(error)
  }
}

</script>

<template>
  <div class="flex w-full justify-center bg-gray-100">
    <header class="flex justify-center flex-wrap m-4">
      <div class="flex flex-row gap-2">
        <input
          id="addFiles"
          type="file"
          accept="image/*"
          multiple="false"
          class="text-center justify-center w-3/4"
          @change="handleInput"
        >
        <button
          type="button"
          class="text-white text-xl bg-blue-gray-500 rounded-lg text-center font-medium md:text-3xl px-5 py-2.5 me-2 mb-2"
          @click="getOcrText"
        >
          OCR
        </button>
      </div>
    </header>
  </div>
</template>
