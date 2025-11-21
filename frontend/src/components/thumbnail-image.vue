<template>
  <div class="w-16 h-20 bg-base-200 rounded overflow-hidden shadow-md">
    <img
        :src="src"
        alt="Thumbnail"
        class="w-full h-full object-cover"
        async
    />
  </div>
</template>


<script setup lang="ts">
import {Book} from "@/stores/books.ts";
import {computed} from "vue";
import {BASE_API_URL} from "@/services/api.ts";

const props = defineProps<{
  book: Book;
}>();

const src = computed(() => {
  const coverUrl = props.book.coverUrl;
  if (!coverUrl) return '/public/logo.png';

  if (!coverUrl.startsWith('http')) {
    return `${BASE_API_URL}${coverUrl}`;
  }

  return coverUrl
})
</script>
