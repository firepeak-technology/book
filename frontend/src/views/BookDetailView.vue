<template>
  <div class="min-h-screen bg-base-200">
    <div class="navbar bg-base-100 shadow-lg">
      <div class="flex-1">
        <router-link to="/collection" class="btn btn-ghost text-xl">← Back</router-link>
      </div>
      <div class="flex-none">
        <button class="btn btn-error btn-sm" @click="showDeleteConfirm = true">
          Delete
        </button>
      </div>
    </div>

    <div v-if="loading" class="flex justify-center py-12">
      <span class="loading loading-spinner loading-lg"></span>
    </div>

    <div v-else-if="book" class="container mx-auto px-4 py-8">
      <div class="grid md:grid-cols-3 gap-8">
        <div class="md:col-span-1">
          <div class="card bg-base-100 shadow-xl">
            <figure class="px-8 pt-8">
              <img
                  v-if="book.coverUrl"
                  :src="book.coverUrl"
                  :alt="book.title"
                  class="rounded-xl max-h-96 object-contain"
              />
              <div v-else class="bg-base-300 rounded-xl h-96 w-full flex items-center justify-center">
                <span class="text-9xl">📚</span>
              </div>
            </figure>
            <div class="card-body">
              <div class="badge badge-primary">{{ book.type }}</div>
              <p v-if="book.isbn" class="text-sm"><strong>ISBN:</strong> {{ book.isbn }}</p>
              <p v-if="book.publisher" class="text-sm"><strong>Publisher:</strong> {{ book.publisher }}</p>
              <p v-if="book.publishedDate" class="text-sm"><strong>Published:</strong> {{ book.publishedDate }}</p>
              <p v-if="book.pageCount" class="text-sm"><strong>Pages:</strong> {{ book.pageCount }}</p>
            </div>
          </div>
        </div>

        <div class="md:col-span-2">
          <div class="card bg-base-100 shadow-xl">
            <div class="card-body">
              <h1 class="card-title text-3xl">{{ book.title }}</h1>
              <p v-if="book.subtitle" class="text-xl opacity-70">{{ book.subtitle }}</p>

              <div v-if="book.authors?.length" class="mt-4">
                <h3 class="font-bold">Authors</h3>
                <p>{{ book.authors.map(a => a.author.name).join(', ') }}</p>
              </div>

              <div v-if="book.categories?.length" class="mt-4">
                <h3 class="font-bold mb-2">Categories</h3>
                <div class="flex flex-wrap gap-2">
                  <div
                      v-for="cat in book.categories"
                      :key="cat.category.id"
                      class="badge badge-outline"
                  >
                    {{ cat.category.name }}
                  </div>
                </div>
              </div>

              <div v-if="book.description" class="mt-4">
                <h3 class="font-bold mb-2">Description</h3>
                <p class="text-sm leading-relaxed">{{ book.description }}</p>
              </div>

              <div class="divider"></div>

              <div class="form-control">
                <label class="label">
                  <span class="label-text">Reading Status</span>
                </label>
                <select class="select select-bordered">
                  <option>Want to Read</option>
                  <option>Reading</option>
                  <option>Finished</option>
                </select>
              </div>

              <div class="form-control mt-4">
                <label class="label">
                  <span class="label-text">Your Rating</span>
                </label>
                <div class="rating rating-lg">
                  <input type="radio" name="rating" class="mask mask-star-2 bg-orange-400"/>
                  <input type="radio" name="rating" class="mask mask-star-2 bg-orange-400"/>
                  <input type="radio" name="rating" class="mask mask-star-2 bg-orange-400"/>
                  <input type="radio" name="rating" class="mask mask-star-2 bg-orange-400"/>
                  <input type="radio" name="rating" class="mask mask-star-2 bg-orange-400"/>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <dialog :class="['modal', { 'modal-open': showDeleteConfirm }]">
      <div class="modal-box">
        <h3 class="font-bold text-lg">Confirm Delete</h3>
        <p class="py-4">Are you sure you want to remove this book from your collection?</p>
        <div class="modal-action">
          <button @click="showDeleteConfirm = false" class="btn">Cancel</button>
          <button @click="deleteBook" class="btn btn-error">Delete</button>
        </div>
      </div>
    </dialog>
  </div>
</template>

<script setup lang="ts">
import {ref} from 'vue'
import {useRoute, useRouter} from 'vue-router'
import {useBooksStore} from '@/stores/books'
import {computedAsync} from "@vueuse/core";

const route = useRoute()
const router = useRouter()
const booksStore = useBooksStore('detail')

const loading = ref(false)
const showDeleteConfirm = ref(false)

const book = computedAsync(() => {
  loading.value = true
  return booksStore.fetchBook(route.params.id as string).finally(() => loading.value = false)
})

const deleteBook = () => {
  showDeleteConfirm.value = false
  router.push('/collection')
}
</script>
