<script setup lang="ts">
import '@recogito/annotorious/dist/annotorious.min.css'
import { ref, onBeforeUnmount } from 'vue'

const Anno = ref()
const anno = ref<typeof import('@recogito/annotorious')>(null)

const imageSource = useState<string>('imageSource')
const imageToRecognise = useState<string>('imageToRecognise')
const ocrText = useState<string>('ocrText')

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

onBeforeUnmount(() => {
  if (anno.value) {
    anno.value.off('createSelection', handleSelection)
    anno.value.off('changeSelected', handleSelection)
    anno.value.off('changeSelectionTarget', handleSelection)
    anno.value.destroy()
    anno.value = null
  }
})
</script>


<template>
  <div class="text-center antialiased text-bluegray-700 mt-10">
    <div class="grid grid-cols-2 gap-4 p-4">
      <div class="w-full ml-auto flex flex-col gap-4">
        <UCard>
          <img v-if="imageSource" id="text-img" alt="Vue logo" :src="imageSource" class="h-full w-full" @mousedown.prevent="null">
        </UCard>
      </div>
      <div class="w-full mr-auto">
        <UTextarea
          v-model="ocrText"
          :padded="true"
          autoresize
        />
      </div>
    </div>
  </div>
</template>
