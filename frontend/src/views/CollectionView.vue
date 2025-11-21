<template>
  <div class="min-h-screen bg-base-200">
    <div class="navbar bg-base-100 shadow-lg">
      <div class="flex-1">
        <router-link to="/" class="btn btn-ghost text-xl">← Back</router-link>
      </div>
      <div class="flex-none gap-2">
        <div class="form-control">
          <input
              v-model="searchQuery"
              type="text"
              placeholder="Search books..."
              class="input input-bordered w-64"
          />
        </div>
      </div>
    </div>

    <div class="container mx-auto px-4 py-8">
      <router-view/>
    </div>
  </div>
</template>

<script setup lang="ts">
import {onMounted, ref} from 'vue'
import {useSerieStore} from "@/stores/series.ts";

const serieStore = useSerieStore()
const loading = ref(false)
const searchQuery = ref('')


onMounted(async () => {
  loading.value = true
  try {
    await serieStore.fetchAll()
  } finally {
    loading.value = false
  }
})

</script>
