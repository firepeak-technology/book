<template>

  <div v-if="books.length === 0" class="text-center py-12">
    <p class="text-xl mb-4">No books in this collection yet</p>
    <router-link :to="{name: 'scan', query}" class="btn btn-primary">Scan First Book</router-link>
  </div>
  <div v-else>
    <router-link :to="{name: 'scan', query}" class="btn btn-primary">Scan Book</router-link>

    <ul class="list bg-white shadow-sm rounded-box mt-4">

      <router-link :to="'/book/'+book.id" v-for="book in books" :key="book.id" class="list-row">
        <div class="flex items-center gap-2">
          <span class="badge badge-soft badge-primary">{{ book.serieNumber }}</span>
          <ThumbnailImage :book="book"/>
        </div>
        <div>
          <div class="text-secondary font-semibold">{{ book.title }}</div>
          <div class="text-xs opacity-60">{{ book.subtitle }}</div>
          <div class="text-xs opacity-60">{{ book.authors?.map(a => a.author.name).join(', ') }}</div>

        </div>
        <router-link :to="'/book/'+book.id" class="btn btn-square btn-ghost">
          <svg class="size-[1.2em]" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5"
                 stroke="currentColor" class="size-6">
              <path stroke-linecap="round" stroke-linejoin="round"
                    d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25"/>
            </svg>
          </svg>
        </router-link>
        <button :class="['btn btn-square',
        book.user?.own? 'btn-success':'btn-ghost opacity-20',
        ]"
                @click.prevent="emit('own', book)">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5"
               stroke="currentColor" class="size-6">
            <path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5"/>
          </svg>
        </button>
      </router-link>
    </ul>
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
import ThumbnailImage from "@/components/thumbnail-image.vue";

defineProps<{
  books: Array<Book>;
  pagination: PaginationMeta | null;
  query?: Record<string, unknown>;

}>();

const emit = defineEmits<{
  (e: 'page-change', page: number): void;
  (e: 'own', book: Book): void;
}>();

</script>
