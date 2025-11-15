import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { GlobalThemeOverrides } from 'naive-ui'

export type NotificationType = 'success' | 'info' | 'warning' | 'error'

export interface Notification {
  id: string
  type: NotificationType
  title: string
  message?: string
  duration?: number
}

export const useAppStore = defineStore('app', () => {
  // State
  const isDarkMode = ref(false)
  const sidebarCollapsed = ref(false)
  const notifications = ref<Notification[]>([])
  const loading = ref(false)

  // Getters
  const theme = computed(() => (isDarkMode.value ? 'dark' : 'light'))

  // Naive UI theme overrides
  const themeOverrides = computed<GlobalThemeOverrides>(() => ({
    common: {
      primaryColor: '#18a058',
      primaryColorHover: '#36ad6a',
      primaryColorPressed: '#0c7a43',
      primaryColorSuppl: '#36ad6a',
    },
    Button: {
      textColor: '#fff',
    },
    Select: {
      peers: {
        InternalSelection: {
          textColor: isDarkMode.value ? '#fff' : '#000',
        },
      },
    },
  }))

  // Actions
  function toggleDarkMode() {
    isDarkMode.value = !isDarkMode.value
    localStorage.setItem('darkMode', isDarkMode.value ? 'true' : 'false')
  }

  function toggleSidebar() {
    sidebarCollapsed.value = !sidebarCollapsed.value
    localStorage.setItem('sidebarCollapsed', sidebarCollapsed.value ? 'true' : 'false')
  }

  function addNotification(notification: Omit<Notification, 'id'>) {
    const id = `notification-${Date.now()}-${Math.random()}`
    const newNotification: Notification = {
      id,
      ...notification,
      duration: notification.duration || 3000,
    }

    notifications.value.push(newNotification)

    // Auto remove after duration
    if (newNotification.duration && newNotification.duration > 0) {
      setTimeout(() => {
        removeNotification(id)
      }, newNotification.duration)
    }

    return id
  }

  function removeNotification(id: string) {
    const index = notifications.value.findIndex((n) => n.id === id)
    if (index !== -1) {
      notifications.value.splice(index, 1)
    }
  }

  function clearNotifications() {
    notifications.value = []
  }

  function showSuccess(title: string, message?: string, duration?: number) {
    return addNotification({ type: 'success', title, message, duration })
  }

  function showError(title: string, message?: string, duration?: number) {
    return addNotification({ type: 'error', title, message, duration: duration || 5000 })
  }

  function showWarning(title: string, message?: string, duration?: number) {
    return addNotification({ type: 'warning', title, message, duration })
  }

  function showInfo(title: string, message?: string, duration?: number) {
    return addNotification({ type: 'info', title, message, duration })
  }

  function setLoading(value: boolean) {
    loading.value = value
  }

  // Initialize from localStorage
  function initialize() {
    const savedDarkMode = localStorage.getItem('darkMode')
    if (savedDarkMode !== null) {
      isDarkMode.value = savedDarkMode === 'true'
    }

    const savedSidebarState = localStorage.getItem('sidebarCollapsed')
    if (savedSidebarState !== null) {
      sidebarCollapsed.value = savedSidebarState === 'true'
    }
  }

  return {
    // State
    isDarkMode,
    sidebarCollapsed,
    notifications,
    loading,
    // Getters
    theme,
    themeOverrides,
    // Actions
    toggleDarkMode,
    toggleSidebar,
    addNotification,
    removeNotification,
    clearNotifications,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    setLoading,
    initialize,
  }
})
