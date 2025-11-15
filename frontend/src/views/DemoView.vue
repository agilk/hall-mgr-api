<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  NCard,
  NSpace,
  NButton,
  NInput,
  NSelect,
  NDatePicker,
  NTimePicker,
  NSwitch,
  NCheckbox,
  NRadioGroup,
  NRadioButton,
  NSlider,
  NRate,
  NTag,
  NBadge,
  NAlert,
  NProgress,
  NStatistic,
  NGrid,
  NGridItem,
  NDivider,
  NIcon,
  NTable,
  NPagination,
  NTabs,
  NTabPane,
  useMessage,
} from 'naive-ui'
import { Icon } from '@iconify/vue'
import { Line, Bar, Pie, Doughnut } from 'vue-chartjs'
import { useForm } from 'vee-validate'
import { loginSchema } from '@/utils/validation'
import { lineChartOptions, barChartOptions, pieChartOptions, chartColors } from '@/utils/chartConfig'
import type { ChartData } from '@/types'

const message = useMessage()

// VeeValidate Form
const { errors, handleSubmit, defineField } = useForm({
  validationSchema: loginSchema,
})

const [username] = defineField('username')
const [password] = defineField('password')

const onSubmit = handleSubmit((values) => {
  message.success(`Form submitted: ${JSON.stringify(values)}`)
})

// Naive UI Components Demo
const inputValue = ref('')
const selectValue = ref(null)
const dateValue = ref(null)
const timeValue = ref(null)
const switchValue = ref(false)
const checkboxValue = ref(false)
const radioValue = ref('option1')
const sliderValue = ref(50)
const rateValue = ref(3)

const selectOptions = [
  { label: 'Option 1', value: 'option1' },
  { label: 'Option 2', value: 'option2' },
  { label: 'Option 3', value: 'option3' },
]

// Table Demo
const tableData = [
  { id: 1, name: 'John Doe', role: 'Supervisor', status: 'Active' },
  { id: 2, name: 'Jane Smith', role: 'Manager', status: 'Active' },
  { id: 3, name: 'Bob Johnson', role: 'Director', status: 'Inactive' },
]

const tableColumns = [
  { title: 'ID', key: 'id' },
  { title: 'Name', key: 'name' },
  { title: 'Role', key: 'role' },
  { title: 'Status', key: 'status' },
]

// Chart.js Data
const lineChartData = computed<ChartData>(() => ({
  labels: ['January', 'February', 'March', 'April', 'May', 'June'],
  datasets: [
    {
      label: 'Exams Conducted',
      data: [12, 19, 15, 25, 22, 30],
      borderColor: chartColors.primary,
      backgroundColor: `${chartColors.primary}33`,
      borderWidth: 2,
    },
    {
      label: 'Violations Reported',
      data: [5, 8, 6, 12, 9, 15],
      borderColor: chartColors.error,
      backgroundColor: `${chartColors.error}33`,
      borderWidth: 2,
    },
  ],
}))

const barChartData = computed<ChartData>(() => ({
  labels: ['Building A', 'Building B', 'Building C', 'Building D', 'Building E'],
  datasets: [
    {
      label: 'Exam Halls',
      data: [12, 19, 8, 15, 10],
      backgroundColor: chartColors.primary,
    },
  ],
}))

const pieChartData = computed<ChartData>(() => ({
  labels: ['Present', 'Absent', 'Late', 'Excused'],
  datasets: [
    {
      label: 'Attendance Status',
      data: [300, 50, 30, 20],
      backgroundColor: [chartColors.success, chartColors.error, chartColors.warning, chartColors.info],
    },
  ],
}))

// Iconify Icons Demo
const iconList = [
  'mdi:home',
  'mdi:account',
  'mdi:cog',
  'mdi:heart',
  'mdi:star',
  'mdi:bell',
  'mdi:email',
  'mdi:calendar',
  'mdi:file',
  'mdi:chart-line',
  'mdi:clipboard-text',
  'mdi:office-building',
  'mdi:school',
  'mdi:account-group',
  'mdi:alert-circle',
  'mdi:check-circle',
]
</script>

<template>
  <div class="demo-container">
    <NSpace vertical :size="24">
      <h1>Component Library Demo</h1>

      <!-- Naive UI Components -->
      <NCard title="Naive UI Components">
        <NTabs type="line" animated>
          <NTabPane name="inputs" tab="Form Inputs">
            <NSpace vertical :size="16">
              <NInput v-model:value="inputValue" placeholder="Text Input" />
              <NSelect v-model:value="selectValue" :options="selectOptions" placeholder="Select Option" />
              <NDatePicker v-model:value="dateValue" type="date" placeholder="Pick Date" />
              <NTimePicker v-model:value="timeValue" placeholder="Pick Time" />

              <NSpace>
                <span>Switch:</span>
                <NSwitch v-model:value="switchValue" />
              </NSpace>

              <NCheckbox v-model:checked="checkboxValue">Checkbox Option</NCheckbox>

              <NRadioGroup v-model:value="radioValue">
                <NSpace>
                  <NRadioButton value="option1">Option 1</NRadioButton>
                  <NRadioButton value="option2">Option 2</NRadioButton>
                  <NRadioButton value="option3">Option 3</NRadioButton>
                </NSpace>
              </NRadioGroup>

              <div>
                <div>Slider: {{ sliderValue }}</div>
                <NSlider v-model:value="sliderValue" />
              </div>

              <div>
                <div>Rating: {{ rateValue }}</div>
                <NRate v-model:value="rateValue" />
              </div>
            </NSpace>
          </NTabPane>

          <NTabPane name="display" tab="Display Components">
            <NSpace vertical :size="16">
              <NSpace>
                <NTag type="success">Success Tag</NTag>
                <NTag type="info">Info Tag</NTag>
                <NTag type="warning">Warning Tag</NTag>
                <NTag type="error">Error Tag</NTag>
              </NSpace>

              <NSpace>
                <NBadge :value="5">
                  <NButton>Notifications</NButton>
                </NBadge>
                <NBadge dot>
                  <NButton>Messages</NButton>
                </NBadge>
              </NSpace>

              <NAlert title="Success Alert" type="success">This is a success message</NAlert>
              <NAlert title="Info Alert" type="info">This is an info message</NAlert>
              <NAlert title="Warning Alert" type="warning">This is a warning message</NAlert>
              <NAlert title="Error Alert" type="error">This is an error message</NAlert>

              <NProgress type="line" :percentage="75" />
              <NProgress type="circle" :percentage="60" />

              <NGrid :cols="3" :x-gap="12">
                <NGridItem>
                  <NStatistic label="Total Exams" :value="1234" />
                </NGridItem>
                <NGridItem>
                  <NStatistic label="Active Supervisors" :value="56" />
                </NGridItem>
                <NGridItem>
                  <NStatistic label="Buildings" :value="12" />
                </NGridItem>
              </NGrid>
            </NSpace>
          </NTabPane>

          <NTabPane name="table" tab="Data Table">
            <NSpace vertical :size="16">
              <NTable :columns="tableColumns" :data="tableData" :bordered="false" />
              <div style="display: flex; justify-content: flex-end">
                <NPagination :page-count="10" />
              </div>
            </NSpace>
          </NTabPane>
        </NTabs>
      </NCard>

      <!-- VeeValidate Form -->
      <NCard title="VeeValidate Form Validation">
        <form @submit.prevent="onSubmit">
          <NSpace vertical :size="16">
            <div>
              <NInput
                v-model:value="username"
                placeholder="Username"
                :status="errors.username ? 'error' : undefined"
              />
              <div v-if="errors.username" style="color: red; font-size: 12px; margin-top: 4px">
                {{ errors.username }}
              </div>
            </div>

            <div>
              <NInput
                v-model:value="password"
                type="password"
                placeholder="Password"
                :status="errors.password ? 'error' : undefined"
              />
              <div v-if="errors.password" style="color: red; font-size: 12px; margin-top: 4px">
                {{ errors.password }}
              </div>
            </div>

            <NButton type="primary" attr-type="submit"> Submit Form </NButton>
          </NSpace>
        </form>
      </NCard>

      <!-- Iconify Icons -->
      <NCard title="Iconify Icons">
        <NGrid :cols="8" :x-gap="16" :y-gap="16">
          <NGridItem v-for="icon in iconList" :key="icon">
            <div style="text-align: center">
              <Icon :icon="icon" :style="{ fontSize: '32px', color: '#18a058' }" />
              <div style="font-size: 10px; margin-top: 4px">{{ icon.split(':')[1] }}</div>
            </div>
          </NGridItem>
        </NGrid>
      </NCard>

      <!-- Chart.js Charts -->
      <NCard title="Chart.js Visualizations">
        <NTabs type="line" animated>
          <NTabPane name="line" tab="Line Chart">
            <div style="height: 300px">
              <Line :data="lineChartData" :options="lineChartOptions" />
            </div>
          </NTabPane>

          <NTabPane name="bar" tab="Bar Chart">
            <div style="height: 300px">
              <Bar :data="barChartData" :options="barChartOptions" />
            </div>
          </NTabPane>

          <NTabPane name="pie" tab="Pie Chart">
            <div style="height: 300px">
              <Pie :data="pieChartData" :options="pieChartOptions" />
            </div>
          </NTabPane>

          <NTabPane name="doughnut" tab="Doughnut Chart">
            <div style="height: 300px">
              <Doughnut :data="pieChartData" :options="pieChartOptions" />
            </div>
          </NTabPane>
        </NTabs>
      </NCard>

      <!-- Buttons Demo -->
      <NCard title="Buttons & Icons">
        <NSpace :size="12">
          <NButton type="default">Default</NButton>
          <NButton type="primary">Primary</NButton>
          <NButton type="success">Success</NButton>
          <NButton type="info">Info</NButton>
          <NButton type="warning">Warning</NButton>
          <NButton type="error">Error</NButton>

          <NDivider vertical />

          <NButton type="primary" circle>
            <template #icon>
              <NIcon><Icon icon="mdi:plus" /></NIcon>
            </template>
          </NButton>

          <NButton type="primary">
            <template #icon>
              <NIcon><Icon icon="mdi:download" /></NIcon>
            </template>
            Download
          </NButton>

          <NButton type="success">
            <template #icon>
              <NIcon><Icon icon="mdi:check" /></NIcon>
            </template>
            Approve
          </NButton>
        </NSpace>
      </NCard>
    </NSpace>
  </div>
</template>

<style scoped>
.demo-container {
  max-width: 1200px;
  margin: 0 auto;
}

h1 {
  color: #18a058;
  margin-bottom: 16px;
}
</style>
