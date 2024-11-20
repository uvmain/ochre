<script setup lang="ts">
import '@recogito/annotorious/dist/annotorious.min.css'

const anno = ref<typeof import('@recogito/annotorious')>(null)
const sourceImage = ref()
const imageToRecognise = ref()

async function handleImageChange(event: Event) {
  anno.value?.destroy()

  const input = event.target as HTMLInputElement
  if (input.files && input.files[0]) {
    const reader = new FileReader()
    reader.onload = (e) => {
      if (e.target && typeof e.target.result === 'string') {
        sourceImage.value = e.target.result
      }
    }
    reader.readAsDataURL(input.files[0])
  }
  const Anno = await import('@recogito/annotorious')
  anno.value = new Anno.Annotorious({
    image: document.getElementById('text-img'),
    disableEditor: true,
  })

  anno.value.on('createSelection', async (annotation: any) => {
    const id = annotation.id
    const snippetObject: { snippet: HTMLCanvasElement } = await anno.value.getImageSnippetById(id)
    updateImageToRecognise(snippetObject)
  })
  anno.value.on('changeSelected', async (selected: any) => {
    const id = selected.annotation.id
    const snippetObject: { snippet: HTMLCanvasElement } = await anno.value.getImageSnippetById(id)
    updateImageToRecognise(snippetObject)
  })
  anno.value.on('changeSelectionTarget', async (annotation: any) => {
    const id = annotation.id
    const snippetObject: { snippet: HTMLCanvasElement } = await anno.value.getImageSnippetById(id)
    updateImageToRecognise(snippetObject)
  })
}

function updateImageToRecognise(snippetObject: { snippet: HTMLCanvasElement }) {
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  canvas.width = snippetObject.snippet.width * 2
  canvas.height = snippetObject.snippet.height * 2
  ctx?.drawImage(snippetObject.snippet, 0, 0, canvas.width, canvas.height)
  imageToRecognise.value = canvas.toDataURL()
}

onBeforeUnmount(() => {
  if (anno.value) {
    anno.value.destroy()
  }
})
</script>

<template>
  <div class="text-center antialiased text-bluegray-700 mt-10">
    <div class="grid grid-cols-2 gap-4">
      <div class="ml-4 min-w-4/5">
        <div class="gap-4 relative flex flex-col h-full justify-start">
          <input
            id="addFiles"
            type="file"
            accept="image/*"
            multiple="false"
            class="text-center justify-center w-3/4"
            @change="handleImageChange"
          >
          <div>
            <img v-if="sourceImage" id="text-img" alt="Vue logo" :src="sourceImage" class="h-full w-full" @mousedown.prevent="null">
          </div>
          <div>
            <img v-if="imageToRecognise" alt="Vue logo" :src="imageToRecognise" class="" @mousedown.prevent="null">
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
