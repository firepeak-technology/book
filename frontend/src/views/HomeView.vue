<template>
  <div class="min-h-screen bg-base-200">
    <div class="navbar bg-base-100 shadow-lg">
      <div class="flex-1">
        <a class="btn btn-ghost text-xl">Book Collection</a>
      </div>
      <div class="flex-none gap-2">
        <router-link to="/scan" class="btn btn-primary">
          Scan Book
        </router-link>
        <div class="dropdown dropdown-end">
          <label tabindex="0" class="btn btn-ghost btn-circle avatar">
            <div class="w-10 rounded-full">
              <img v-if="authStore.user" :src="authStore.user.picture || '/avatar.png'" />
            </div>
          </label>
          <ul tabindex="0" class="mt-3 z-[1] p-2 shadow menu menu-sm dropdown-content bg-base-100 rounded-box w-52">
            <li><router-link to="/collection">My Collection</router-link></li>
            <li><a @click="logout">Logout</a></li>
          </ul>
        </div>
      </div>
    </div>

    <div class="container mx-auto px-4 py-8">
      <div class="text-center mb-8">
        <h1 class="text-4xl font-bold mb-4">
          Welcome, {{ authStore.user?.name }}!
        </h1>
        <p class="text-lg">Start scanning books to build your collection</p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div class="card bg-base-100 shadow-xl">
          <div class="card-body">
            <h2 class="card-title">Scan Books</h2>
            <p>Use your camera to scan book barcodes</p>
            <div class="card-actions justify-end">
              <router-link to="/scan" class="btn btn-primary">Scan Now</router-link>
            </div>
          </div>
        </div>

        <div class="card bg-base-100 shadow-xl">
          <div class="card-body">
            <h2 class="card-title">View Collection</h2>
            <p>Browse all your books and comics</p>
            <div class="card-actions justify-end">
              <router-link to="/collection" class="btn btn-primary">View</router-link>
            </div>
          </div>
        </div>

        <div class="card bg-base-100 shadow-xl">
          <div class="card-body">
            <h2 class="card-title">Family Sharing</h2>
            <p>Share your collection with family</p>
            <div class="card-actions justify-end">
              <button class="btn btn-primary">Coming Soon</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

onMounted(async () => {
  if (!authStore.user) {
    await authStore.fetchUser()
  }
})

const logout = () => {
  authStore.logout()
  router.push('/login')
}
</script>
