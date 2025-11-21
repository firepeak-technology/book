<template>
  <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
    <router-link
        v-for="book in books"
        :key="book.id"
        :to="`/book/${book.id}`"
        class="card bg-base-100 shadow-xl hover:shadow-2xl transition-shadow cursor-pointer"
    >
      <div class="px-4 pt-4">
        <CoverImage :book="book"/>
      </div>
 
      <div class="card-body p-4">
        <h2 class="card-title text-sm line-clamp-2">{{ book.title }}</h2>
        <p class="text-xs opacity-70 line-clamp-1" v-if="book.authors?.length">
          {{ book.authors.map(a => a.author.name).join(', ') }}
        </p>
        <div class="badge badge-sm">{{ book.type }}</div>
      </div>
    </router-link>
  </div>

</template>
<script setup lang="ts">
import {Book} from "@/stores/books.ts";
import CoverImage from "@/components/cover-image.vue";

const props = defineProps<{
  books: Array<Book>;
}>();
</script>
