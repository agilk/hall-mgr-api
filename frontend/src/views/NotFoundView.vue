<script setup lang="ts">
import { NButton, NResult } from 'naive-ui'
import { useRouter } from 'vue-router'

const router = useRouter()

const goHome = () => {
  router.push('/')
}
</script>

<template>
  <div class="not-found-container">
    <NResult status="404" title="404 Not Found" description="The page you're looking for doesn't exist.">
      <template #footer>
        <NButton type="primary" @click="goHome"> Back to Home </NButton>
      </template>
    </NResult>
  </div>
</template>

<style scoped>
.not-found-container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: white;
}
</style>
