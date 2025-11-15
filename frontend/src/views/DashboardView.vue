<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { NCard, NSpace, NStatistic, NGrid, NGridItem, NSpin } from 'naive-ui'
import { Line, Bar } from 'vue-chartjs'
import { lineChartOptions, barChartOptions, chartColors } from '@/utils/chartConfig'
import type { ChartData } from '@/types'

const loading = ref(false)

const stats = ref({
  totalExams: 156,
  activeAssignments: 42,
  totalViolations: 8,
  attendanceRate: 95.5,
})

const examTrendsData: ChartData = {
  labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
  datasets: [
    {
      label: 'Exams Conducted',
      data: [12, 19, 15, 25, 22, 18, 20],
      borderColor: chartColors.primary,
      backgroundColor: `${chartColors.primary}33`,
      borderWidth: 2,
    },
  ],
}

const violationsData: ChartData = {
  labels: ['Low', 'Medium', 'High', 'Critical'],
  datasets: [
    {
      label: 'Violations by Severity',
      data: [15, 25, 10, 3],
      backgroundColor: [chartColors.success, chartColors.warning, chartColors.error, chartColors.purple],
    },
  ],
}

onMounted(() => {
  // Fetch dashboard data
})
</script>

<template>
  <div class="dashboard-container">
    <h1>Dashboard</h1>

    <NSpin :show="loading">
      <NSpace vertical :size="24">
        <NGrid :cols="4" :x-gap="16">
          <NGridItem>
            <NCard>
              <NStatistic label="Total Exams" :value="stats.totalExams" />
            </NCard>
          </NGridItem>
          <NGridItem>
            <NCard>
              <NStatistic label="Active Assignments" :value="stats.activeAssignments" />
            </NCard>
          </NGridItem>
          <NGridItem>
            <NCard>
              <NStatistic label="Total Violations" :value="stats.totalViolations" />
            </NCard>
          </NGridItem>
          <NGridItem>
            <NCard>
              <NStatistic label="Attendance Rate" :value="stats.attendanceRate" :precision="1">
                <template #suffix>%</template>
              </NStatistic>
            </NCard>
          </NGridItem>
        </NGrid>

        <NCard title="Exam Trends">
          <div style="height: 300px">
            <Line :data="examTrendsData" :options="lineChartOptions" />
          </div>
        </NCard>

        <NCard title="Violations by Severity">
          <div style="height: 300px">
            <Bar :data="violationsData" :options="barChartOptions" />
          </div>
        </NCard>
      </NSpace>
    </NSpin>
  </div>
</template>

<style scoped>
.dashboard-container {
  max-width: 1400px;
  margin: 0 auto;
}

h1 {
  margin-bottom: 24px;
  color: #333;
}
</style>
