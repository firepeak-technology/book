<template>
  <div class="card bg-base-100 shadow-xl mt-8">
    <CoverImage :book="book"/>
    <div class="card-body">
      <h2 class="card-title">{{ book.title }}</h2>

      <p v-if="book.subtitle" class="text-sm opacity-70">{{ book.subtitle }}</p>
      <p v-if="book.source" class="text-sm "><strong>Source:</strong> {{ book.source }}</p>
      <p v-if="book.serie" class="text-sm0"><strong>Serie:</strong>{{ book.serie.name }}
        <strong>nr:</strong> {{ book.serieNumber }}</p>
      <p v-if="book.authors" class="text-sm">
        <strong>Authors:</strong> {{ book.authors.join(', ') }}
      </p>
      <p v-if="book.categories" class="text-sm">
        <strong>Categories:</strong> {{ book.categories.join(', ') }}
      </p>
      <p v-if="book.description" class="text-sm">{{ book.description }}</p>
      <slot/>
    </div>
  </div>
</template>

<script setup lang="ts">
import {Book} from "@/stores/books.ts";
import CoverImage from "@/components/cover-image.vue";

const props = defineProps<{ book: Book }>()
</script>
