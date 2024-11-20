<script setup lang="ts">
</script>

<template>
  <div class="flex w-full justify-center bg-gray-100">
    <header class="flex justify-center flex-wrap m-4">
      <div>
        <button
          type="button"
          class="text-white text-xl bg-blue-gray-500 rounded-lg font-medium md:text-3xl px-5 py-2.5 me-2 mb-2 text-center"
        >
          Latest
        </button>
        <button
          type="button"
          class="text-white text-xl bg-blue-gray-500 rounded-lg text-center font-medium md:text-3xl px-5 py-2.5 me-2 mb-2"
        >
          All
        </button>
        <button
          type="button"
          class="text-white text-xl bg-blue-gray-500 rounded-lg text-center font-medium md:text-3xl px-5 py-2.5 me-2 mb-2"
        >
          Random
        </button>
        <button
          type="button"
          class="text-white text-xl bg-blue-gray-500 rounded-lg text-center font-medium md:text-3xl px-5 py-2.5 mb-2 md:me-2"
        >
          <Icon name="lucide:plus" class="scale-140" />
        </button>
      </div>
      <SearchBar class="" />
    </header>
  </div>
</template>
