import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { User, LoginForm } from '@/types'
import apiService from '@/services/api'

export const useAuthStore = defineStore('auth', () => {
  // State
  const user = ref<User | null>(null)
  const accessToken = ref<string | null>(localStorage.getItem('access_token'))
  const refreshToken = ref<string | null>(localStorage.getItem('refresh_token'))
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Getters
  const isAuthenticated = computed(() => !!accessToken.value && !!user.value)
  const userRole = computed(() => user.value?.role)
  const userName = computed(() => user.value?.full_name || user.value?.username)

  // Actions
  async function login(credentials: LoginForm) {
    loading.value = true
    error.value = null

    try {
      const response = await apiService.post('/auth/login', credentials)

      if (response.data.access_token) {
        accessToken.value = response.data.access_token
        refreshToken.value = response.data.refresh_token

        localStorage.setItem('access_token', response.data.access_token)
        localStorage.setItem('refresh_token', response.data.refresh_token)

        await fetchUser()
        return true
      }
      return false
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Login failed'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function register(data: any) {
    loading.value = true
    error.value = null

    try {
      await apiService.post('/auth/register', data)
      return true
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Registration failed'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function fetchUser() {
    if (!accessToken.value) return

    try {
      const response = await apiService.get('/auth/me')
      user.value = response.data
    } catch (err: any) {
      console.error('Failed to fetch user:', err)
      if (err.response?.status === 401) {
        logout()
      }
    }
  }

  async function logout() {
    user.value = null
    accessToken.value = null
    refreshToken.value = null

    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
  }

  async function refreshAccessToken() {
    if (!refreshToken.value) {
      logout()
      return false
    }

    try {
      const response = await apiService.post('/auth/refresh', {
        refresh_token: refreshToken.value,
      })

      accessToken.value = response.data.access_token
      localStorage.setItem('access_token', response.data.access_token)
      return true
    } catch (err) {
      logout()
      return false
    }
  }

  // Initialize
  function initialize() {
    if (accessToken.value) {
      fetchUser()
    }
  }

  return {
    // State
    user,
    accessToken,
    refreshToken,
    loading,
    error,
    // Getters
    isAuthenticated,
    userRole,
    userName,
    // Actions
    login,
    register,
    logout,
    fetchUser,
    refreshAccessToken,
    initialize,
  }
})
