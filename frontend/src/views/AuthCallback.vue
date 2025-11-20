<template>
  <div class="hero min-h-screen bg-base-200">
    <div class="hero-content text-center">
      <div class="max-w-md">
        <span class="loading loading-spinner loading-lg"></span>
        <p class="mt-4">Authenticating...</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

onMounted(async () => {
  const token = route.query.token as string
  const error = route.query.error as string

  if (error) {
    router.push('/login?error=' + error)
    return
  }

  if (token) {
    authStore.setToken(token)
    try {
      await authStore.fetchUser()
      router.push('/')
    } catch (err) {
      router.push('/login?error=auth_failed')
    }
  } else {
    router.push('/login')
  }
})
</script>
