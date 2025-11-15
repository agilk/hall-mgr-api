<script setup lang="ts">
import { h, ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  NLayout,
  NLayoutSider,
  NLayoutHeader,
  NLayoutContent,
  NMenu,
  NSpace,
  NButton,
  NIcon,
  NAvatar,
  NDropdown,
  type MenuOption,
} from 'naive-ui'
import { Icon } from '@iconify/vue'
import { useAuthStore } from '@/stores/auth'
import { useAppStore } from '@/stores/app'

const router = useRouter()
const authStore = useAuthStore()
const appStore = useAppStore()

const collapsed = ref(false)

const menuOptions: MenuOption[] = [
  {
    label: 'Dashboard',
    key: 'dashboard',
    icon: () => h(NIcon, null, { default: () => h(Icon, { icon: 'mdi:view-dashboard' }) }),
  },
  {
    label: 'Exams',
    key: 'exams',
    icon: () => h(NIcon, null, { default: () => h(Icon, { icon: 'mdi:clipboard-text' }) }),
  },
  {
    label: 'Assignments',
    key: 'assignments',
    icon: () => h(NIcon, null, { default: () => h(Icon, { icon: 'mdi:account-check' }) }),
  },
  {
    label: 'Attendance',
    key: 'attendance',
    icon: () => h(NIcon, null, { default: () => h(Icon, { icon: 'mdi:account-group' }) }),
  },
  {
    label: 'Violations',
    key: 'violations',
    icon: () => h(NIcon, null, { default: () => h(Icon, { icon: 'mdi:alert-circle' }) }),
  },
  {
    label: 'Buildings',
    key: 'buildings',
    icon: () => h(NIcon, null, { default: () => h(Icon, { icon: 'mdi:office-building' }) }),
  },
  {
    label: 'Demo',
    key: 'demo',
    icon: () => h(NIcon, null, { default: () => h(Icon, { icon: 'mdi:star' }) }),
  },
]

const userDropdownOptions = [
  {
    label: 'Profile',
    key: 'profile',
    icon: () => h(Icon, { icon: 'mdi:account' }),
  },
  {
    label: 'Settings',
    key: 'settings',
    icon: () => h(Icon, { icon: 'mdi:cog' }),
  },
  {
    type: 'divider',
    key: 'd1',
  },
  {
    label: 'Logout',
    key: 'logout',
    icon: () => h(Icon, { icon: 'mdi:logout' }),
  },
]

const handleMenuSelect = (key: string) => {
  router.push({ name: key.charAt(0).toUpperCase() + key.slice(1) })
}

const handleUserDropdown = (key: string) => {
  if (key === 'logout') {
    authStore.logout()
    router.push({ name: 'Login' })
  }
}
</script>

<template>
  <NLayout has-sider position="absolute">
    <NLayoutSider
      bordered
      collapse-mode="width"
      :collapsed-width="64"
      :width="240"
      :collapsed="collapsed"
      show-trigger
      @collapse="collapsed = true"
      @expand="collapsed = false"
    >
      <div class="logo-container">
        <h2 v-if="!collapsed">Exam Manager</h2>
        <h2 v-else>EM</h2>
      </div>
      <NMenu
        :collapsed="collapsed"
        :collapsed-width="64"
        :collapsed-icon-size="22"
        :options="menuOptions"
        @update:value="handleMenuSelect"
      />
    </NLayoutSider>

    <NLayout>
      <NLayoutHeader bordered style="height: 64px; padding: 0 24px; display: flex; align-items: center">
        <div style="flex: 1"></div>
        <NSpace align="center" :size="16">
          <NButton circle @click="appStore.toggleDarkMode">
            <template #icon>
              <NIcon>
                <Icon :icon="appStore.isDarkMode ? 'mdi:white-balance-sunny' : 'mdi:moon-waning-crescent'" />
              </NIcon>
            </template>
          </NButton>

          <NDropdown :options="userDropdownOptions" @select="handleUserDropdown">
            <div style="display: flex; align-items: center; gap: 8px; cursor: pointer">
              <NAvatar round size="small" style="background-color: #18a058">
                {{ authStore.userName?.charAt(0).toUpperCase() }}
              </NAvatar>
              <span v-if="authStore.userName">{{ authStore.userName }}</span>
            </div>
          </NDropdown>
        </NSpace>
      </NLayoutHeader>

      <NLayoutContent
        content-style="padding: 24px; min-height: calc(100vh - 64px); background-color: #f5f5f5;"
      >
        <slot />
      </NLayoutContent>
    </NLayout>
  </NLayout>
</template>

<style scoped>
.logo-container {
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  border-bottom: 1px solid #e8e8e8;
}

.logo-container h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #18a058;
}
</style>
