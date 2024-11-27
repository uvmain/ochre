import {
  defineConfig,
  presetAttributify,
  presetTypography,
  presetUno,
  presetWind,
  transformerDirectives,
  transformerVariantGroup,
} from 'unocss'

function getSafelist(): string[] {
  const base = 'prose prose-sm m-auto text-left'.split(' ')
  const unusedSafelist: string[] = []
  return [...unusedSafelist, ...base]
}

export default defineConfig({
  shortcuts: {
    // buttons
    smallButton: 'size-10 flex dark:hover:bg-gray-600 items-center justify-center border-1 border-gray-400 rounded-lg border-solid bg-gray-100 text-lg text-gray-600 font-bold hover:border-blue-500 hover:bg-gray-200 dark:text-white dark:bg-gray-700',
    headerButton: 'h-11 border-1 border-gray-400 rounded-lg border-solid bg-gray-100 px-4 py-2 text-lg text-gray-600 font-bold hover:border-blue-500 dark:hover:bg-gray-600 hover:bg-gray-200 dark:text-white dark:bg-gray-700',
  },
  theme: {
    colors: {},
  },
  presets: [
    presetUno(),
    presetAttributify(),
    presetWind(),
    presetTypography(),
  ],
  transformers: [
    transformerDirectives(),
    transformerVariantGroup(),
  ],
  safelist: getSafelist(),
})
