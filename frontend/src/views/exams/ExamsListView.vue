<script setup lang="ts">
import { NCard, NButton, NSpace, NIcon } from 'naive-ui'
import { Icon } from '@iconify/vue'
</script>

<template>
  <div>
    <h1>Exams</h1>
    <NCard title="Upcoming Exams">
      <NSpace vertical :size="16">
        <p>List of scheduled exams will be displayed here.</p>
        <NButton type="primary">
          <template #icon>
            <NIcon><Icon icon="mdi:plus" /></NIcon>
          </template>
          Schedule New Exam
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
