<template>
  <figure class="px-8 pt-8">
    <img :src="src" async :alt="book.title" class="w-full rounded-xl max-h-96 object-contain"/>
  </figure>
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
