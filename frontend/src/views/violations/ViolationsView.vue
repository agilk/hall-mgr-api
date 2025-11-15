<script setup lang="ts">
import { NCard, NButton, NSpace, NIcon } from 'naive-ui'
import { Icon } from '@iconify/vue'
</script>

<template>
  <div>
    <h1>Violations</h1>
    <NCard title="Exam Violations">
      <NSpace vertical :size="16">
        <p>List of reported violations will be displayed here.</p>
        <NButton type="primary">
          <template #icon>
            <NIcon><Icon icon="mdi:alert-circle" /></NIcon>
          </template>
          Report Violation
        </NButton>
      </NSpace>
    </NCard>
  </div>
</template>

<style scoped>
h1 {
  margin-bottom: 24px;
}
</style>
