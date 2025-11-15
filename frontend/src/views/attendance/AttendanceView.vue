<script setup lang="ts">
import { NCard, NButton, NSpace, NIcon } from 'naive-ui'
import { Icon } from '@iconify/vue'
</script>

<template>
  <div>
    <h1>Attendance</h1>
    <NCard title="Participant Attendance">
      <NSpace vertical :size="16">
        <p>Participant attendance records will be displayed here.</p>
        <NButton type="primary">
          <template #icon>
            <NIcon><Icon icon="mdi:check-circle" /></NIcon>
          </template>
          Mark Attendance
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
