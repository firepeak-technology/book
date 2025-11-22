<template>
  <div class="min-h-screen bg-base-200">
    <div class="navbar bg-base-100 shadow-lg">
      <div class="flex-1">
        <router-link to="/" class="btn btn-ghost text-xl">← Back</router-link>
      </div>
    </div>

    <div class="container mx-auto px-4 py-8">
      <h1 class="text-3xl font-bold mb-8 text-center">Scan Book Barcode</h1>

      <div class="max-w-2xl mx-auto">
        <div id="reader" class="rounded-lg overflow-hidden shadow-xl"></div>
        <div v-if="!bookData && !scanning " class="card bg-base-100 shadow-xl">
          <div class="card-body">

            <h2 class="card-title">Ready to Scan</h2>
            <p>Click the button below to start scanning book barcodes</p>
            <div class="card-actions justify-center mt-4">
              <button @click="startScanning" class="btn btn-primary btn-lg">
                Start Scanner
              </button>
            </div>
          </div>
        </div>

        <div v-else-if="!bookData" class="space-y-4">

          <div class="flex gap-2">
            <button @click="stopScanning" class="btn btn-error flex-1">
              Stop Scanner
            </button>
            <button @click="manualEntry = true" class="btn btn-secondary flex-1">
              Manual Entry
            </button>
          </div>
        </div>

        <div v-if="scannedISBN" class="alert alert-success mt-4">
          <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none"
               viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          <span>Scanned ISBN: {{ scannedISBN }}</span>
        </div>

        <div v-if="loading" class="flex justify-center mt-8">
          <span class="loading loading-spinner loading-lg"></span>
        </div>

        <BookSearchDetail v-if="bookData" :book="bookData">
          <select v-model="bookData.type" class="select select-bordered" required>
            <option disabled selected value="">Pick a book type</option>
            <option value="BOOK">Book</option>
            <option value="COMIC">Comic</option>
            <option value="MANGA">Manga</option>
            <option value="GRAPHIC_NOVEL">Graphic Novel</option>
          </select>

          <div class="card-actions  mt-4">
            <div class="flex-grow">
              <span v-if="bookData.user?.own" class="text-error">You already own it</span>
            </div>
            <button @click="resetScan" class="btn btn-ghost">Scan Another</button>
            <button @click="saveBook" class="btn btn-primary" :disabled="saving">
              {{ saving ? 'Saving...' : 'I own the book' }}
            </button>
          </div>
        </BookSearchDetail>
      </div>
    </div>

    <dialog :class="['modal', { 'modal-open': manualEntry }]">
      <div class="modal-box">
        <h3 class="font-bold text-lg">Enter ISBN Manually</h3>
        <div class="form-control mt-4">
          <input
              v-model="manualISBN"
              type="text"
              placeholder="Enter ISBN"
              class="input input-bordered"
              @keyup.enter="lookupManualISBN"
          />
        </div>
        <div class="modal-action">
          <button @click="manualEntry = false" class="btn">Cancel</button>
          <button @click="lookupManualISBN" class="btn btn-primary">Search</button>
        </div>
      </div>
    </dialog>
  </div>
</template>

<script setup lang="ts">
import {onUnmounted, ref} from 'vue'
import {useRouter} from 'vue-router'
import {Html5Qrcode, Html5QrcodeSupportedFormats} from 'html5-qrcode'
import {useBooksStore} from '@/stores/books'
import api from '@/services/api'
import BookSearchDetail from "@/components/BookSearchDetail.vue";

const router = useRouter();
const booksStore = useBooksStore('scan')


const scanning = ref(false)
const scannedISBN = ref('')
const loading = ref(false)
const bookData = ref<any>(null)
const saving = ref(false)
const manualEntry = ref(false)
const manualISBN = ref('')

let html5QrCode: Html5Qrcode | null = null

const startScanning = async () => {
  scannedISBN.value = ''
  manualISBN.value = ''
  bookData.value = null;
  scanning.value = true;

  const formatsToSupport = [
    Html5QrcodeSupportedFormats.QR_CODE,
    Html5QrcodeSupportedFormats.UPC_A,
    Html5QrcodeSupportedFormats.UPC_E,
    Html5QrcodeSupportedFormats.UPC_EAN_EXTENSION,
    Html5QrcodeSupportedFormats.EAN_13,
    Html5QrcodeSupportedFormats.EAN_8,
  ];
  const config = {fps: 10, qrbox: 250, formatsToSupport: formatsToSupport};
  html5QrCode = new Html5Qrcode("reader",
      config,
  )

  try {
    console.log('starting scanner')
    await html5QrCode.start(
        {facingMode: "environment"},
        config,
        onScanSuccess,
        onScanError
    )
  } catch (err) {
    console.error('Scanner error:', err)
    scanning.value = false
  }
}

const stopScanning = async () => {
  if (html5QrCode) {
    await html5QrCode.stop()
    html5QrCode = null
  }
  scanning.value = false
}

const onScanSuccess = (decodedText: string) => {
  scannedISBN.value = decodedText
  stopScanning()
  lookupBook(decodedText)
}

const onScanError = (error: string) => {
  // Ignore
}


const lookupBook = async (isbn: string) => {
  loading.value = true
  try {
    const response = await api.get(`/books/lookup/${isbn}`)
    bookData.value = {...response.data, userBookDto: {own: true}}
  } catch (error) {
    console.error('Book lookup error:', error)
    alert('Book not found. Try manual entry or scan another book.')
  } finally {
    loading.value = false
  }
}


const lookupManualISBN = () => {
  if (manualISBN.value) {
    scannedISBN.value = manualISBN.value
    manualEntry.value = false
    lookupBook(manualISBN.value)
    manualISBN.value = ''
  }
}

// manualISBN.value = '9789002140099'
// lookupManualISBN()

const saveBook = async () => {
  saving.value = true
  try {
    await booksStore.addBook(bookData.value)
    alert('Book added to collection!')
    bookData.value = null
    resetScan()
    // router.push('/collection')
  } catch (error) {
    console.error('Save error:', error)
    alert('Error saving book')
  } finally {
    saving.value = false
  }
}

const resetScan = () => {
  scannedISBN.value = ''
  manualISBN.value = ''
  bookData.value = null
  startScanning()
}

onUnmounted(() => {
  stopScanning()
})
</script>
