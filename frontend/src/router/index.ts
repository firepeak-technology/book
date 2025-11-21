import {createRouter, createWebHistory} from 'vue-router'
import {useAuthStore} from '@/stores/auth'

const router = createRouter({
    history: createWebHistory(),
    routes: [
        {
            path: '/',
            name: 'home',
            component: () => import('@/views/HomeView.vue'),
            meta: {requiresAuth: true},
        },
        {
            path: '/login',
            name: 'login',
            component: () => import('@/views/LoginView.vue'),
        },
        {
            path: '/auth/callback',
            name: 'auth-callback',
            component: () => import('@/views/AuthCallback.vue'),
        },
        {
            path: '/scan',
            name: 'scan',
            component: () => import('@/views/ScanView.vue'),
            meta: {requiresAuth: true},
        },
        {
            path: '/check',
            name: 'check',
            component: () => import('@/views/CheckView.vue'),
            meta: {requiresAuth: true},
        },
        {
            path: '/collection',
            name: 'collection',
            children: [
                {
                    path: '',
                    component: () => import('@/views/CollectionList.vue'),
                },
                {
                    path: ':serieId',
                    component: () => import('@/views/CollectionDetail.vue'),
                }
            ],
            component: () => import('@/views/CollectionView.vue'),
            meta: {requiresAuth: true},
        },
        {
            path: '/book/:id',
            name: 'book-detail',
            component: () => import('@/views/BookDetailView.vue'),
            meta: {requiresAuth: true},
        },
    ],
})

router.beforeEach((to, from, next) => {
    const authStore = useAuthStore()

    if (to.meta.requiresAuth && !authStore.isAuthenticated) {
        next('/login')
    } else if (to.name === 'login' && authStore.isAuthenticated) {
        next('/')
    } else {
        next()
    }
})

export default router
