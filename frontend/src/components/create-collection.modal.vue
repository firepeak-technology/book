<template>
  <dialog :class="['modal', { 'modal-open': modelValue }]">
    <div class="modal-box">
      <h3 class="font-bold text-lg mb-4">Create New Collection</h3>

      <form @submit.prevent="handleSubmit">
        <!-- Collection Name -->
        <div class="form-control">
          <label class="label">
            <span class="label-text">Collection Name *</span>
          </label>
          <input
              v-model="form.name"
              type="text"
              placeholder="e.g., Harry Potter Series"
              class="input input-bordered"
              :class="{ 'input-error': errors.name }"
              required
              maxlength="100"
          />
          <label v-if="errors.name" class="label">
            <span class="label-text-alt text-error">{{ errors.name }}</span>
          </label>
        </div>

        <!-- Description -->
        <div class="form-control mt-4">
          <label class="label">
            <span class="label-text">Description</span>
          </label>
          <textarea
              v-model="form.description"
              class="textarea textarea-bordered h-24"
              placeholder="Add a description for this collection..."
          ></textarea>
          <label class="label">
            <span class="label-text-alt">Optional - describe the series or collection</span>
          </label>
        </div>

        <!-- Actions -->
        <div class="modal-action">
          <button
              type="button"
              class="btn"
              @click="handleClose"
              :disabled="loading"
          >
            Cancel
          </button>
          <button
              type="submit"
              class="btn btn-primary"
              :disabled="loading || !form.name.trim()"
          >
            <span v-if="loading" class="loading loading-spinner loading-sm"></span>
            <span v-else>Create Collection</span>
          </button>
        </div>
      </form>
    </div>
    <form method="dialog" class="modal-backdrop" @click="handleClose">
      <button>close</button>
    </form>
  </dialog>
</template>

<script setup lang="ts">
import {ref, watch} from 'vue'
import api from '@/services/api'

interface Props {
  modelValue: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'created': [collection: any]
}>()

const form = ref({
  name: '',
  description: '',
})

const errors = ref({
  name: '',
})

const loading = ref(false)

// Reset form when modal closes
watch(() => props.modelValue, (isOpen) => {
  if (!isOpen) {
    resetForm()
  }
})

function resetForm() {
  form.value = {
    name: '',
    description: '',
  }
  errors.value = {
    name: '',
  }
}

function validateForm(): boolean {
  errors.value.name = ''

  if (!form.value.name.trim()) {
    errors.value.name = 'Collection name is required'
    return false
  }

  if (form.value.name.trim().length < 2) {
    errors.value.name = 'Collection name must be at least 2 characters'
    return false
  }

  return true
}

async function handleSubmit() {
  if (!validateForm()) return

  loading.value = true
  try {
    const response = await api.post('/collections', {
      name: form.value.name.trim(),
      description: form.value.description.trim() || undefined,
    })

    emit('created', response.data)
    emit('update:modelValue', false)
  } catch (error: any) {
    if (error.response?.data?.message) {
      errors.value.name = error.response.data.message
    } else {
      errors.value.name = 'Failed to create collection'
    }
  } finally {
    loading.value = false
  }
}

function handleClose() {
  if (!loading.value) {
    emit('update:modelValue', false)
  }
}
</script>
