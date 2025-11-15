<script setup lang="ts">
import { useRoute } from 'vue-router'
import { NCard, NSpace } from 'naive-ui'

const route = useRoute()
const examId = route.params.id
</script>

<template>
  <div>
    <h1>Exam Details - {{ examId }}</h1>
    <NCard title="Exam Information">
      <NSpace vertical :size="16">
        <p>Detailed exam information will be displayed here.</p>
      </NSpace>
    </NCard>
  </div>
</template>

<style scoped>
h1 {
  margin-bottom: 24px;
}
</style>
