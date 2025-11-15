import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js'

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

// Common chart colors
export const chartColors = {
  primary: '#18a058',
  success: '#18a058',
  info: '#2080f0',
  warning: '#f0a020',
  error: '#d03050',
  purple: '#9333ea',
  pink: '#ec4899',
  teal: '#14b8a6',
  orange: '#f97316',
  indigo: '#6366f1',
}

export const chartColorArray = [
  chartColors.primary,
  chartColors.info,
  chartColors.warning,
  chartColors.error,
  chartColors.purple,
  chartColors.pink,
  chartColors.teal,
  chartColors.orange,
  chartColors.indigo,
]

// Default chart options
export const defaultChartOptions: any = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'top',
    },
    tooltip: {
      mode: 'index',
      intersect: false,
    },
  },
  interaction: {
    mode: 'nearest',
    axis: 'x',
    intersect: false,
  },
}

// Line chart options
export const lineChartOptions: any = {
  ...defaultChartOptions,
  scales: {
    y: {
      beginAtZero: true,
      grid: {
        color: 'rgba(0, 0, 0, 0.05)',
      },
    },
    x: {
      grid: {
        display: false,
      },
    },
  },
}

// Bar chart options
export const barChartOptions: any = {
  ...defaultChartOptions,
  scales: {
    y: {
      beginAtZero: true,
      grid: {
        color: 'rgba(0, 0, 0, 0.05)',
      },
    },
    x: {
      grid: {
        display: false,
      },
    },
  },
}

// Pie/Doughnut chart options
export const pieChartOptions: any = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'right',
    },
    tooltip: {
      callbacks: {
        label: function (context: any) {
          const label = context.label || ''
          const value = context.parsed
          const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0) as number
          const percentage = ((value / total) * 100).toFixed(1)
          return `${label}: ${value} (${percentage}%)`
        },
      },
    },
  },
}

// Utility functions
export function createGradient(ctx: CanvasRenderingContext2D, color: string, alpha = 0.2) {
  const gradient = ctx.createLinearGradient(0, 0, 0, 400)
  gradient.addColorStop(0, color)
  gradient.addColorStop(1, `rgba(${hexToRgb(color)}, ${alpha})`)
  return gradient
}

export function hexToRgb(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  if (!result || !result[1] || !result[2] || !result[3]) return '0, 0, 0'

  return `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`
}

export function generateRandomColor(): string {
  return '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')
}
