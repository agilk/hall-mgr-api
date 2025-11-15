<script setup lang="ts">
import { NCard, NButton, NSpace, NIcon } from 'naive-ui'
import { Icon } from '@iconify/vue'
</script>

<template>
  <div>
    <h1>Assignments</h1>
    <NCard title="Supervisor Assignments">
      <NSpace vertical :size="16">
        <p>List of supervisor assignments will be displayed here.</p>
        <NButton type="primary">
          <template #icon>
            <NIcon><Icon icon="mdi:plus" /></NIcon>
          </template>
          Create New Assignment
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
