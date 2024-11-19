<script setup lang="ts">
import { PSM, createWorker } from 'tesseract.js'
import '@recogito/annotorious/dist/annotorious.min.css'
import { MdEditor } from 'md-editor-v3'
import 'md-editor-v3/lib/style.css'

const recognizedParagraphs = ref<string[]>([])
const anno = ref<typeof import('@recogito/annotorious')>(null)
const sourceImage = ref()
const imageToRecognise = ref()
const recipeImage = ref()
const imageUrl = ref('')

const recipe = ref<Recipe>({} as Recipe)

const courseOptions = computed(() => {
  const courses: any[] = []
  allowedCourses.forEach((course) => {
    courses.push({
      title: course,
      value: course,
    })
  })
  return courses
})

const countryOptions = computed(() => {
  const countries: any[] = []
  countryFlags.forEach((country) => {
    countries.push({
      title: country.name,
      value: country.name,
    })
  })
  return countries
})

const canSave = computed(() => {
  if (recipe.value.name
    && recipe.value.author
    && recipe.value.source
    && recipe.value.ingredients
    && recipe.value.instructions
    && recipe.value.course
  ) {
    return true
  }
  return false
})

function setRecipeImageFromUrl() {
  if (imageUrl.value.trim() !== '') {
    // Fetch image from URL
    fetch(imageUrl.value.trim())
      .then(response => response.blob())
      .then((blob) => {
        // Convert image to base64 encoding
        const reader = new FileReader()
        reader.onload = () => {
          // Set recipeImage to base64 encoded image
          recipeImage.value = reader.result
          imageToRecognise.value = recipeImage.value
          imageUrl.value = ''
        }
        reader.readAsDataURL(blob)
      })
      .catch((error) => {
        console.error('Error fetching image:', error)
      })
  }
}

async function recognize() {
  recognizedParagraphs.value = []
  const worker = await createWorker('eng')

  await worker.setParameters({
    tessedit_pageseg_mode: PSM.AUTO_OSD,
    preserve_interword_spaces: '1',
  })
  if (imageToRecognise.value) {
    const { data: { paragraphs } } = await worker.recognize(imageToRecognise.value)
    paragraphs.forEach((paragraph) => {
      for (const newLine of paragraph.text.split('\n'))
        recognizedParagraphs.value.push(newLine)
    })
  }
  await worker.terminate()
}

async function addToTitle() {
  await recognize()
  recipe.value.name = (recipe.value.name ? recipe.value.name + recognizedParagraphs.value.join(' ') : recognizedParagraphs.value.join(' ')).trim()
}

async function addToSource() {
  await recognize()
  recipe.value.source = recipe.value.source ? recipe.value.source + recognizedParagraphs.value.join(' ') : recognizedParagraphs.value.join(' ')
}

async function addToAuthor() {
  await recognize()
  recipe.value.author = recipe.value.author ? recipe.value.author + recognizedParagraphs.value.join(' ') : recognizedParagraphs.value.join(' ')
}

async function addToIngredients() {
  await recognize()

  let markdown = ''
  const hasNumberRegex = /\d/
  recognizedParagraphs.value.forEach((text: string) => {
    if (markdown.length) {
      markdown += '\n'
    }
    if (!hasNumberRegex.test(text) && text.length > 2) {
      markdown += `**${text}**`
    }
    else if (text.length > 2) {
      markdown += `- ${text}`
    }
  })
  recipe.value.ingredients = recipe.value.ingredients ? recipe.value.ingredients + markdown.replaceAll('\n\n\n', '\n\n') : markdown.replaceAll('\n\n\n', '\n\n')
}

async function addToInstructions() {
  await recognize()
  const startsWithUppercaseOrNumber = /^[A-Z0-9]/
  let markdown = ''
  recognizedParagraphs.value.forEach((text: string) => {
    if (markdown.length && text.length) {
      markdown += '\n'
    }
    if (text.length && startsWithUppercaseOrNumber.test(text)) {
      markdown += `- ${text}`
    }
    else if (text.length) {
      markdown += text
    }
  })
  recipe.value.instructions = recipe.value.instructions ? recipe.value.instructions + markdown.replaceAll('\n\n\n', '\n\n') : markdown.replaceAll('\n\n\n', '\n\n')
}

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
  // eslint-disable-next-line unused-imports/no-unused-vars
  anno.value.on('changeSelected', async (selected: any, previous: any) => {
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

async function saveRecipeImage() {
  if (imageToRecognise.value) {
    recipeImage.value = imageToRecognise.value
  }
}

async function saveRecipeImageAsWebp() {
  if (recipeImage.value) {
    const image = new Image()
    image.src = recipeImage.value

    image.onload = async function () {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')

      // Calculate new width and height while preserving aspect ratio
      let newWidth = image.width
      let newHeight = image.height
      if (image.width > 800 || image.height > 800) {
        if (image.width > image.height) {
          newWidth = 800
          newHeight = Math.round((800 / image.width) * image.height)
        }
        else {
          newHeight = 800
          newWidth = Math.round((800 / image.height) * image.width)
        }
      }

      // Resize the canvas
      canvas.width = newWidth
      canvas.height = newHeight
      ctx?.drawImage(image, 0, 0, newWidth, newHeight)

      // Convert canvas to WebP format with 80% quality
      const webpData = canvas.toDataURL('image/webp', 0.8)

      // Convert base64 to blob
      const blob = await fetch(webpData).then(res => res.blob())

      // Create a download link
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      const slug = recipe.value.name?.toLowerCase().replaceAll(' ', '-') || 'recipeImage'
      link.download = `${slug}.webp`
      link.click()
    }
  }
}

async function downloadRecipe() {
  if (!canSave) {
    return
  }
  saveRecipeImageAsWebp()

  recipe.value.slug = convertToAlphanumeric(recipe.value.name)
  recipe.value.dateAdded = new Date().toISOString().split('T')[0]
  recipe.value.image = `/recipe-images/${recipe.value.slug}.webp`
  const jsonString = JSON.stringify(recipe.value, null, 2)
  const blob = new Blob([jsonString], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${recipe.value.slug}.json`
  document.body.appendChild(a)
  a.click()
  window.URL.revokeObjectURL(url)
}

onBeforeUnmount(() => {
  if (anno.value) {
    anno.value.destroy()
  }
})
</script>

<template>
  <ClientOnly>
    <div class="font-sans text-center antialiased text-bluegray-700 mt-10">
      <div class="grid grid-cols-2 gap-4">
        <div class="ml-4 min-w-4/5">
          <div class="gap-4 relative flex flex-col h-full justify-start">
            <input
              id="addFiles"
              type="file"
              accept="image/*"
              multiple="false"
              class="text-center justify-center w-3/4 add-form-component"
              @change="handleImageChange"
            >
            <div>
              <img v-if="sourceImage" id="text-img" alt="Vue logo" :src="sourceImage" class="h-full w-full" @mousedown.prevent="null">
            </div>
          </div>
        </div>

        <div class="text-white mr-auto text-left">
          <p>Recipe name:</p>
          <div class="flex gap-4 text-left mb-4 flex-row items-center">
            <ScanButton @add="addToTitle" @reset="() => { recipe.name = '' }" />
            <FormInput id="name" v-model="recipe.name" label="" type="text" class="grow" />
          </div>
          <p>Author:</p>
          <div class="text-left mb-4 flex flex-row gap-4 items-center">
            <ScanButton @add="addToAuthor" @reset="() => { recipe.author = '' }" />
            <FormInput id="name" v-model="recipe.author" type="text" class="grow" />
          </div>
          <p>Source:</p>
          <div class="text-left mb-4 flex flex-row gap-4 items-center">
            <ScanButton @add="addToSource" @reset="() => { recipe.source = '' }" />
            <FormInput id="name" v-model="recipe.source" type="text" class="grow" />
          </div>

          <FormDropdown v-model="recipe.course" label="Course" :options="courseOptions" class="text-left w-full flex gap-4 mb-4 flex-auto md:w-1/2 grid-rows-1" />
          <FormDropdown v-model="recipe.country" label="Country" :options="countryOptions" class="text-left w-full flex flex-auto gap-4 mb-4 md:w-1/2 grid-rows-1" />
          <FormCheckbox id="vegetarian" v-model="recipe.vegetarian" label="Vegetarian?" class="text-left w-full md:w-1/2 grid grid-cols-2 grid-rows-1 mb-4 text-white flex flex-auto" />
          <FormInput id="prepTime" v-model="recipe.prepTime" label="Prep Time" type="text" class="text-left w-full md:w-1/2 grid grid-cols-2 grid-rows-1 mb-4 flex flex-auto" />
          <FormInput id="cookingTime" v-model="recipe.cookingTime" label="Cooking Time" type="text" class="text-left w-full md:w-1/2 grid grid-cols-2 grid-rows-1 mb-4 flex flex-auto" />
          <FormInput id="calories" v-model="recipe.calories" label="Total Calories" type="number" class="text-left w-full md:w-1/2 grid grid-cols-2 grid-rows-1 mb-4 flex flex-auto" />
          <FormInput id="servings" v-model="recipe.servings" label="Servings" type="number" class="text-left w-full md:w-1/2 grid grid-cols-2 grid-rows-1 mb-4 flex flex-auto" />

          <div class="text-left mb-4 flex flex-row gap-4 items-center">
            <span class="text-white m-2 block">
              Ingredients:
            </span>
            <ScanButton @add="addToIngredients" @reset="() => { recipe.ingredients = '' }" />
          </div>
          <MdEditor v-model="recipe.ingredients" editor-id="ingredients" class="ml-4 mb-4 add-form-component text-left" language="en-US" />

          <div class="text-left mb-4 flex flex-row gap-4 items-center">
            <span class="m-2 block text-white">
              Instructions:
            </span>
            <ScanButton @add="addToInstructions" @reset="() => { recipe.instructions = '' }" />
          </div>
          <MdEditor v-model="recipe.instructions" editor-id="instructions" class="ml-4 mb-4 add-form-component text-left" language="en-US" />

          <div class="ml-4 text-left mb-4 flex flex-row gap-4 items-center">
            <span class="m-2 block text-white">
              Recipe Image:
            </span>
            <ScanButton download @add="saveRecipeImage" @reset="() => { recipeImage = null }" @download="saveRecipeImageAsWebp" />
            <input id="imageUrl" v-model="imageUrl" type="text" class="p-2 border rounded-md border-gray-300 focus:outline-none focus:border-blue-500">
            <button class="text-white rounded-md focus:outline-none px-4 py-2 bg-gray-500 hover:bg-blue-600 focus:bg-blue-600" @click="setRecipeImageFromUrl">
              From URL
            </button>
          </div>
          <div class="ml-4 mt-4 max-w-1/4">
            <img v-if="recipeImage" :src="recipeImage" class="w-full h-full" @mousedown.prevent="null">
          </div>
          <div>
            <div class="flex gap-4 ml-4 mt-8">
              <button
                class="text-white rounded-md focus:outline-none px-4 py-2 bg-gray-500 hover:bg-blue-600 focus:bg-blue-600 text-3xl"
                :class="{ 'bg-red hover:bg-red focus:bg-red': !(canSave) }"
                @click="downloadRecipe"
              >
                Download Recipe
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </ClientOnly>
</template>
