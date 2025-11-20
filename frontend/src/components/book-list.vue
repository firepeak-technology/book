<template>

  <div v-if="books.length === 0" class="text-center py-12">
    <p class="text-xl mb-4">No books in this collection yet</p>
    <router-link :to="{name: 'scan', query}" class="btn btn-primary">Scan First Book</router-link>
  </div>
  <div v-else>
    <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
      <router-link
          v-for="book in books"
          :key="book.id"
          :to="`/book/${book.id}`"
          class="card bg-base-100 shadow-xl hover:shadow-2xl transition-shadow cursor-pointer"
      >
        <figure class="px-4 pt-4">
          <img
              v-if="book.coverUrl"
              :src="book.coverUrl"
              :alt="book.title"
              class="rounded-xl h-48 object-cover"
          />
          <div v-else class="bg-base-300 rounded-xl h-48 w-full flex items-center justify-center">
            <span class="text-4xl">📚</span>
          </div>
        </figure>
        <div class="card-body p-4">
          <h2 class="card-title text-sm line-clamp-2">{{ book.title }}</h2>
          <p class="text-xs opacity-70 line-clamp-1" v-if="book.authors?.length">
            {{ book.authors.map(a => a.author.name).join(', ') }}
          </p>
          <div class="badge badge-sm">{{ book.type }}</div>
        </div>
      </router-link>
    </div>
    <div v-if="pagination">
      <Pagination
          v-bind="pagination"
          :current-page="pagination.page"
          @page-change="emit('page-change', $event)"
      />
    </div>
  </div>

</template>
<script setup lang="ts">
import {Book} from "@/stores/books.ts";
import Pagination from './Pagination.vue'
import {PaginationMeta} from "@/stores/paginated.data.ts";

defineProps<{
  books: Array<Book>;
  pagination: PaginationMeta | null;
  query?: Record<string, unknown>;
}>();

const emit = defineEmits<{
  (e: 'page-change', page: number): void;
}>();
</script>
