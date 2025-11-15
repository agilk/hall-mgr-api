<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { NConfigProvider, NMessageProvider, NDialogProvider, NLoadingBarProvider } from 'naive-ui'
import { useAppStore } from '@/stores/app'
import { useAuthStore } from '@/stores/auth'
import DefaultLayout from '@/layouts/DefaultLayout.vue'
import BlankLayout from '@/layouts/BlankLayout.vue'
import { useRoute } from 'vue-router'

const appStore = useAppStore()
const authStore = useAuthStore()
const route = useRoute()

const layoutComponent = computed(() => {
  const layoutType = route.meta.layout || 'default'
  return layoutType === 'blank' ? BlankLayout : DefaultLayout
})

onMounted(() => {
  appStore.initialize()
  authStore.initialize()
})
</script>

<template>
  <NConfigProvider :theme-overrides="appStore.themeOverrides">
    <NLoadingBarProvider>
      <NMessageProvider>
        <NDialogProvider>
          <component :is="layoutComponent">
            <router-view />
          </component>
        </NDialogProvider>
      </NMessageProvider>
    </NLoadingBarProvider>
  </NConfigProvider>
</template>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html,
body,
#app {
  height: 100%;
  width: 100%;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
</style>
