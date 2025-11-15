import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: '/dashboard',
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/auth/LoginView.vue'),
    meta: { requiresAuth: false, layout: 'blank' },
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('@/views/auth/RegisterView.vue'),
    meta: { requiresAuth: false, layout: 'blank' },
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: () => import('@/views/DashboardView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/exams',
    name: 'Exams',
    component: () => import('@/views/exams/ExamsListView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/exams/:id',
    name: 'ExamDetail',
    component: () => import('@/views/exams/ExamDetailView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/assignments',
    name: 'Assignments',
    component: () => import('@/views/assignments/AssignmentsListView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/attendance',
    name: 'Attendance',
    component: () => import('@/views/attendance/AttendanceView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/violations',
    name: 'Violations',
    component: () => import('@/views/violations/ViolationsView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/buildings',
    name: 'Buildings',
    component: () => import('@/views/buildings/BuildingsView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/demo',
    name: 'Demo',
    component: () => import('@/views/DemoView.vue'),
    meta: { requiresAuth: false },
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/views/NotFoundView.vue'),
    meta: { requiresAuth: false, layout: 'blank' },
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

// Navigation guard for authentication
router.beforeEach((to, _from, next) => {
  const authStore = useAuthStore()
  const requiresAuth = to.meta.requiresAuth !== false

  if (requiresAuth && !authStore.isAuthenticated) {
    // Redirect to login if route requires auth and user is not authenticated
    next({ name: 'Login', query: { redirect: to.fullPath } })
  } else if (to.name === 'Login' && authStore.isAuthenticated) {
    // Redirect to dashboard if user is already authenticated
    next({ name: 'Dashboard' })
  } else {
    next()
  }
})

export default router
