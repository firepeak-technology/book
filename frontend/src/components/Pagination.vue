<template>
  <div v-if="totalPages > 1" class="flex flex-col sm:flex-row items-center justify-between gap-4 py-4">
    <!-- Page info -->
    <div class="text-sm">
      Showing <span class="font-semibold">{{ startItem }}</span> to
      <span class="font-semibold">{{ endItem }}</span> of
      <span class="font-semibold">{{ total }}</span> results
    </div>

    <!-- Pagination controls -->
    <div class="join">
      <!-- First page button -->
      <button
          v-if="showFirstLast"
          class="join-item btn btn-sm"
          :class="{ 'btn-disabled': currentPage === 1 }"
          :disabled="currentPage === 1"
          @click="goToPage(1)"
          aria-label="First page"
      >
        «
      </button>

      <!-- Previous button -->
      <button
          class="join-item btn btn-sm"
          :class="{ 'btn-disabled': !hasPreviousPage }"
          :disabled="!hasPreviousPage"
          @click="goToPage(currentPage - 1)"
          aria-label="Previous page"
      >
        ‹
      </button>

      <!-- Page numbers -->
      <template v-for="page in visiblePages" :key="page">
        <button
            v-if="page !== '...'"
            class="join-item btn btn-sm"
            :class="{ 'btn-active': page === currentPage }"
            @click="goToPage(page)"
        >
          {{ page }}
        </button>
        <button
            v-else
            class="join-item btn btn-sm btn-disabled"
            disabled
        >
          ...
        </button>
      </template>

      <!-- Next button -->
      <button
          class="join-item btn btn-sm"
          :class="{ 'btn-disabled': !hasNextPage }"
          :disabled="!hasNextPage"
          @click="goToPage(currentPage + 1)"
          aria-label="Next page"
      >
        ›
      </button>

      <!-- Last page button -->
      <button
          v-if="showFirstLast"
          class="join-item btn btn-sm"
          :class="{ 'btn-disabled': currentPage === totalPages }"
          :disabled="currentPage === totalPages"
          @click="goToPage(totalPages)"
          aria-label="Last page"
      >
        »
      </button>
    </div>

    <!-- Items per page selector -->
    <div v-if="showLimitSelector" class="flex items-center gap-2">
      <label class="text-sm">Per page:</label>
      <select
          v-model="selectedLimit"
          class="select select-bordered select-sm w-20"
          @change="changeLimit"
      >
        <option v-for="option in limitOptions" :key="option" :value="option">
          {{ option }}
        </option>
      </select>
    </div>
  </div>
</template>

<script setup lang="ts">
import {computed, ref, watch} from 'vue'

interface Props {
  currentPage: number
  totalPages: number
  total: number
  limit: number
  hasNextPage?: boolean
  hasPreviousPage?: boolean
  maxVisiblePages?: number
  showFirstLast?: boolean
  showLimitSelector?: boolean
  limitOptions?: number[]
}

const props = withDefaults(defineProps<Props>(), {
  maxVisiblePages: 5,
  showFirstLast: true,
  showLimitSelector: true,
  limitOptions: () => [10, 20, 50, 100],
})

const emit = defineEmits<{
  'page-change': [page: number]
  'limit-change': [limit: number]
}>()

const selectedLimit = ref(props.limit)

// Watch for external limit changes
watch(() => props.limit, (newLimit) => {
  selectedLimit.value = newLimit
})

const startItem = computed(() => {
  return (props.currentPage - 1) * props.limit + 1
})

const endItem = computed(() => {
  const end = props.currentPage * props.limit
  return end > props.total ? props.total : end
})

const visiblePages = computed(() => {
  const pages: (number | string)[] = []
  const maxVisible = props.maxVisiblePages
  const total = props.totalPages
  const current = props.currentPage

  if (total <= maxVisible) {
    // Show all pages if total is less than max visible
    for (let i = 1; i <= total; i++) {
      pages.push(i)
    }
  } else {
    // Always show first page
    pages.push(1)

    // Calculate range around current page
    let start = Math.max(2, current - Math.floor(maxVisible / 2))
    let end = Math.min(total - 1, start + maxVisible - 3)

    // Adjust start if we're near the end
    if (end === total - 1) {
      start = Math.max(2, end - maxVisible + 3)
    }

    // Add ellipsis after first page if needed
    if (start > 2) {
      pages.push('...')
    }

    // Add middle pages
    for (let i = start; i <= end; i++) {
      pages.push(i)
    }

    // Add ellipsis before last page if needed
    if (end < total - 1) {
      pages.push('...')
    }

    // Always show last page
    pages.push(total)
  }

  return pages
})

function goToPage(page: number | string) {
  if (typeof page === 'number' && page !== props.currentPage) {
    emit('page-change', page)
  }
}

function changeLimit() {
  emit('limit-change', selectedLimit.value)
}
</script>
