# Frontend Technical Specification
# Exam Supervision Management System

## Table of Contents
1. [Overview](#overview)
2. [Technology Stack](#technology-stack)
3. [Architecture](#architecture)
4. [Project Structure](#project-structure)
5. [State Management](#state-management)
6. [Routing](#routing)
7. [UI Components](#ui-components)
8. [API Integration](#api-integration)
9. [Authentication Flow](#authentication-flow)
10. [Real-time Features](#real-time-features)
11. [Code Quality](#code-quality)
12. [Testing Strategy](#testing-strategy)
13. [Build & Deployment](#build--deployment)

---

## Overview

The Exam Supervision Management System frontend is a modern, responsive single-page application (SPA) built with Vue 3.5, providing an intuitive interface for exam supervisors, building managers, and exam directors.

### Key Features
- Role-based dashboards
- Real-time exam monitoring
- Assignment management
- Attendance tracking
- Violation reporting
- Two-way feedback system
- Responsive design (mobile-first)
- Progressive Web App (PWA) capabilities
- Offline support for critical features

---

## Technology Stack

### Core Framework
- **Vue 3.5**: Progressive JavaScript framework with Composition API
- **TypeScript 5.x**: Type-safe JavaScript
- **Vite 6.x**: Next-generation frontend build tool

### State Management
- **Pinia 2.x**: Official Vue state management library
  - Type-safe stores
  - Devtools support
  - Hot module replacement

### Routing
- **Vue Router 4.x**: Official router for Vue 3
  - Nested routes
  - Route guards
  - Lazy loading

### Styling
- **Tailwind CSS 4.x**: Utility-first CSS framework
  - Custom theme
  - Dark mode support
  - Responsive design utilities
- **PostCSS**: CSS transformations
- **Autoprefixer**: Vendor prefix automation

### UI Components
- **Headless UI**: Unstyled, accessible components
- **Heroicons**: Beautiful hand-crafted SVG icons
- **VueUse**: Collection of Vue Composition utilities
- **Chart.js / Vue-Chartjs**: Data visualization

### Form Handling
- **VeeValidate 4.x**: Form validation
- **Yup**: Schema validation
- **vue-toastification**: Toast notifications

### HTTP Client
- **Axios**: Promise-based HTTP client
  - Interceptors for auth
  - Request/response transformation
  - Error handling

### Real-time Communication
- **Socket.io-client**: WebSocket client
  - Auto-reconnection
  - Event-based communication

### Date/Time
- **date-fns**: Modern date utility library
  - Lightweight
  - Immutable
  - Tree-shakeable

### File Upload
- **vue-upload-component**: File upload component
  - Drag & drop
  - Preview
  - Multiple files

### Code Quality
- **ESLint**: Linting
  - vue/vue3-recommended
  - @typescript-eslint
- **Prettier**: Code formatting
  - Integration with ESLint
- **Husky**: Git hooks
- **lint-staged**: Run linters on staged files

### Testing
- **Vitest**: Unit testing framework
- **Vue Test Utils**: Vue component testing
- **Playwright**: E2E testing
- **@testing-library/vue**: Testing utilities

### Development Tools
- **Vue DevTools**: Browser extension for debugging
- **TypeScript Vue Plugin (Volar)**: IDE support

---

## Architecture

### Component Architecture

```
┌─────────────────────────────────────────┐
│              App.vue                     │
│  - Layout wrapper                        │
│  - Global components                     │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│         Router View                      │
│  - Page components                       │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│       Feature Components                 │
│  - Business logic                        │
│  - State integration                     │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│         UI Components                    │
│  - Reusable components                   │
│  - Presentational                        │
└─────────────────────────────────────────┘
```

### Data Flow Architecture

```
User Action
    ↓
Component (View)
    ↓
Pinia Store (State + Actions)
    ↓
API Service (HTTP)
    ↓
Backend API
    ↓
Response
    ↓
Pinia Store (State Update)
    ↓
Component (Re-render)
```

---

## Project Structure

```
frontend/
├── public/                        # Static assets
│   ├── favicon.ico
│   └── manifest.json              # PWA manifest
│
├── src/
│   ├── main.ts                    # Application entry point
│   ├── App.vue                    # Root component
│   │
│   ├── assets/                    # Asset files
│   │   ├── images/
│   │   ├── fonts/
│   │   └── styles/
│   │       ├── main.css           # Tailwind imports
│   │       └── custom.css         # Custom styles
│   │
│   ├── components/                # Reusable components
│   │   ├── ui/                    # UI components
│   │   │   ├── Button.vue
│   │   │   ├── Card.vue
│   │   │   ├── Input.vue
│   │   │   ├── Select.vue
│   │   │   ├── Modal.vue
│   │   │   ├── Table.vue
│   │   │   ├── Badge.vue
│   │   │   ├── Alert.vue
│   │   │   ├── Spinner.vue
│   │   │   └── Pagination.vue
│   │   │
│   │   ├── layout/                # Layout components
│   │   │   ├── Header.vue
│   │   │   ├── Sidebar.vue
│   │   │   ├── Footer.vue
│   │   │   └── MainLayout.vue
│   │   │
│   │   ├── forms/                 # Form components
│   │   │   ├── FormInput.vue
│   │   │   ├── FormSelect.vue
│   │   │   ├── FormTextarea.vue
│   │   │   ├── FormCheckbox.vue
│   │   │   ├── FormRadio.vue
│   │   │   └── FormDatePicker.vue
│   │   │
│   │   └── common/                # Common components
│   │       ├── UserAvatar.vue
│   │       ├── NotificationBell.vue
│   │       ├── SearchBar.vue
│   │       └── Breadcrumb.vue
│   │
│   ├── views/                     # Page components
│   │   ├── auth/
│   │   │   ├── LoginView.vue
│   │   │   ├── RegisterView.vue
│   │   │   ├── ForgotPasswordView.vue
│   │   │   └── Setup2FAView.vue
│   │   │
│   │   ├── dashboard/
│   │   │   ├── SupervisorDashboard.vue
│   │   │   ├── ManagerDashboard.vue
│   │   │   └── DirectorDashboard.vue
│   │   │
│   │   ├── profile/
│   │   │   ├── ProfileView.vue
│   │   │   └── EditProfileView.vue
│   │   │
│   │   ├── assignments/
│   │   │   ├── AssignmentsListView.vue
│   │   │   ├── AssignmentDetailView.vue
│   │   │   └── CreateAssignmentView.vue
│   │   │
│   │   ├── exams/
│   │   │   ├── ExamsListView.vue
│   │   │   ├── ExamDetailView.vue
│   │   │   └── CreateExamView.vue
│   │   │
│   │   ├── buildings/
│   │   │   ├── BuildingsListView.vue
│   │   │   ├── BuildingDetailView.vue
│   │   │   └── ManageBuildingView.vue
│   │   │
│   │   ├── monitoring/
│   │   │   ├── RealTimeMonitoringView.vue
│   │   │   └── MonitoringDashboard.vue
│   │   │
│   │   ├── attendance/
│   │   │   ├── AttendanceView.vue
│   │   │   └── MarkAttendanceView.vue
│   │   │
│   │   ├── violations/
│   │   │   ├── ViolationsListView.vue
│   │   │   ├── ReportViolationView.vue
│   │   │   └── ViolationDetailView.vue
│   │   │
│   │   ├── feedback/
│   │   │   ├── FeedbackListView.vue
│   │   │   └── SubmitFeedbackView.vue
│   │   │
│   │   ├── notifications/
│   │   │   └── NotificationsView.vue
│   │   │
│   │   └── admin/
│   │       ├── UsersManagementView.vue
│   │       ├── AuditLogsView.vue
│   │       └── SystemSettingsView.vue
│   │
│   ├── stores/                    # Pinia stores
│   │   ├── auth.ts                # Authentication store
│   │   ├── user.ts                # User data store
│   │   ├── assignments.ts         # Assignments store
│   │   ├── exams.ts               # Exams store
│   │   ├── buildings.ts           # Buildings store
│   │   ├── monitoring.ts          # Real-time monitoring store
│   │   ├── notifications.ts       # Notifications store
│   │   └── app.ts                 # App-wide state
│   │
│   ├── router/                    # Vue Router
│   │   ├── index.ts               # Router configuration
│   │   ├── guards.ts              # Route guards
│   │   └── routes/
│   │       ├── auth.routes.ts
│   │       ├── dashboard.routes.ts
│   │       ├── assignments.routes.ts
│   │       └── admin.routes.ts
│   │
│   ├── services/                  # API services
│   │   ├── api.ts                 # Axios instance
│   │   ├── auth.service.ts
│   │   ├── users.service.ts
│   │   ├── assignments.service.ts
│   │   ├── exams.service.ts
│   │   ├── buildings.service.ts
│   │   ├── attendance.service.ts
│   │   ├── violations.service.ts
│   │   ├── feedback.service.ts
│   │   ├── notifications.service.ts
│   │   └── websocket.service.ts
│   │
│   ├── composables/               # Composition functions
│   │   ├── useAuth.ts
│   │   ├── useNotifications.ts
│   │   ├── useWebSocket.ts
│   │   ├── usePagination.ts
│   │   ├── useForm.ts
│   │   └── usePermissions.ts
│   │
│   ├── types/                     # TypeScript types
│   │   ├── models/
│   │   │   ├── user.ts
│   │   │   ├── assignment.ts
│   │   │   ├── exam.ts
│   │   │   ├── building.ts
│   │   │   └── ...
│   │   ├── api/
│   │   │   ├── requests.ts
│   │   │   └── responses.ts
│   │   └── common.ts
│   │
│   ├── utils/                     # Utility functions
│   │   ├── date.ts
│   │   ├── format.ts
│   │   ├── validation.ts
│   │   ├── storage.ts
│   │   └── constants.ts
│   │
│   ├── plugins/                   # Vue plugins
│   │   ├── toast.ts
│   │   └── vee-validate.ts
│   │
│   └── middleware/                # Middleware functions
│       └── auth.middleware.ts
│
├── tests/                         # Test files
│   ├── unit/
│   ├── e2e/
│   └── setup.ts
│
├── .env.development               # Development environment variables
├── .env.production                # Production environment variables
├── .eslintrc.cjs                  # ESLint configuration
├── .prettierrc                    # Prettier configuration
├── tsconfig.json                  # TypeScript configuration
├── tailwind.config.js             # Tailwind configuration
├── postcss.config.js              # PostCSS configuration
├── vite.config.ts                 # Vite configuration
├── vitest.config.ts               # Vitest configuration
├── playwright.config.ts           # Playwright configuration
└── package.json                   # Dependencies
```

---

## State Management

### Pinia Store Structure

#### Auth Store
```typescript
// src/stores/auth.ts
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { authService } from '@/services/auth.service';
import type { User, LoginCredentials, AuthResponse } from '@/types/models/user';

export const useAuthStore = defineStore('auth', () => {
  // State
  const user = ref<User | null>(null);
  const accessToken = ref<string | null>(localStorage.getItem('accessToken'));
  const refreshToken = ref<string | null>(localStorage.getItem('refreshToken'));
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  // Getters
  const isAuthenticated = computed(() => !!accessToken.value);
  const userRoles = computed(() => user.value?.roles || []);
  const isSupervisor = computed(() => userRoles.value.includes('supervisor'));
  const isBuildingManager = computed(() => userRoles.value.includes('building_manager'));
  const isExamDirector = computed(() => userRoles.value.includes('exam_director'));

  // Actions
  async function login(credentials: LoginCredentials): Promise<void> {
    isLoading.value = true;
    error.value = null;

    try {
      const response: AuthResponse = await authService.login(credentials);

      accessToken.value = response.accessToken;
      refreshToken.value = response.refreshToken;
      user.value = response.user;

      // Store tokens
      localStorage.setItem('accessToken', response.accessToken);
      localStorage.setItem('refreshToken', response.refreshToken);
    } catch (err: any) {
      error.value = err.message;
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  async function logout(): Promise<void> {
    try {
      await authService.logout();
    } finally {
      // Clear state
      user.value = null;
      accessToken.value = null;
      refreshToken.value = null;

      // Clear storage
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
    }
  }

  async function refreshAccessToken(): Promise<void> {
    if (!refreshToken.value) {
      throw new Error('No refresh token available');
    }

    try {
      const response = await authService.refreshToken(refreshToken.value);

      accessToken.value = response.accessToken;
      refreshToken.value = response.refreshToken;

      localStorage.setItem('accessToken', response.accessToken);
      localStorage.setItem('refreshToken', response.refreshToken);
    } catch (err) {
      // If refresh fails, logout
      await logout();
      throw err;
    }
  }

  async function fetchCurrentUser(): Promise<void> {
    try {
      user.value = await authService.getCurrentUser();
    } catch (err) {
      console.error('Failed to fetch current user:', err);
    }
  }

  return {
    // State
    user,
    accessToken,
    refreshToken,
    isLoading,
    error,
    // Getters
    isAuthenticated,
    userRoles,
    isSupervisor,
    isBuildingManager,
    isExamDirector,
    // Actions
    login,
    logout,
    refreshAccessToken,
    fetchCurrentUser,
  };
});
```

#### Assignments Store
```typescript
// src/stores/assignments.ts
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { assignmentsService } from '@/services/assignments.service';
import type { Assignment, AssignmentStatus } from '@/types/models/assignment';

export const useAssignmentsStore = defineStore('assignments', () => {
  // State
  const assignments = ref<Assignment[]>([]);
  const currentAssignment = ref<Assignment | null>(null);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  // Getters
  const myAssignments = computed(() => assignments.value);

  const pendingAssignments = computed(() =>
    assignments.value.filter(a => a.status === 'offered')
  );

  const activeAssignments = computed(() =>
    assignments.value.filter(a =>
      ['accepted', 'confirmed'].includes(a.status)
    )
  );

  const completedAssignments = computed(() =>
    assignments.value.filter(a => a.status === 'completed')
  );

  // Actions
  async function fetchAssignments(): Promise<void> {
    isLoading.value = true;
    error.value = null;

    try {
      assignments.value = await assignmentsService.getMyAssignments();
    } catch (err: any) {
      error.value = err.message;
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  async function fetchAssignmentById(id: number): Promise<void> {
    isLoading.value = true;
    error.value = null;

    try {
      currentAssignment.value = await assignmentsService.getAssignmentById(id);
    } catch (err: any) {
      error.value = err.message;
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  async function acceptAssignment(id: number): Promise<void> {
    try {
      await assignmentsService.acceptAssignment(id);
      await fetchAssignments(); // Refresh list
    } catch (err: any) {
      error.value = err.message;
      throw err;
    }
  }

  async function rejectAssignment(id: number): Promise<void> {
    try {
      await assignmentsService.rejectAssignment(id);
      await fetchAssignments(); // Refresh list
    } catch (err: any) {
      error.value = err.message;
      throw err;
    }
  }

  async function checkIn(id: number): Promise<void> {
    try {
      await assignmentsService.checkIn(id);
      await fetchAssignmentById(id); // Refresh current assignment
    } catch (err: any) {
      error.value = err.message;
      throw err;
    }
  }

  async function checkOut(id: number): Promise<void> {
    try {
      await assignmentsService.checkOut(id);
      await fetchAssignmentById(id); // Refresh current assignment
    } catch (err: any) {
      error.value = err.message;
      throw err;
    }
  }

  return {
    // State
    assignments,
    currentAssignment,
    isLoading,
    error,
    // Getters
    myAssignments,
    pendingAssignments,
    activeAssignments,
    completedAssignments,
    // Actions
    fetchAssignments,
    fetchAssignmentById,
    acceptAssignment,
    rejectAssignment,
    checkIn,
    checkOut,
  };
});
```

---

## Routing

### Router Configuration

```typescript
// src/router/index.ts
import { createRouter, createWebHistory } from 'vue-router';
import type { RouteRecordRaw } from 'vue-router';
import { authGuard, roleGuard } from './guards';

// Lazy-loaded routes
const routes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: '/dashboard',
  },
  {
    path: '/auth',
    component: () => import('@/layouts/AuthLayout.vue'),
    children: [
      {
        path: 'login',
        name: 'Login',
        component: () => import('@/views/auth/LoginView.vue'),
        meta: { requiresGuest: true },
      },
      {
        path: 'register',
        name: 'Register',
        component: () => import('@/views/auth/RegisterView.vue'),
        meta: { requiresGuest: true },
      },
      {
        path: 'forgot-password',
        name: 'ForgotPassword',
        component: () => import('@/views/auth/ForgotPasswordView.vue'),
        meta: { requiresGuest: true },
      },
      {
        path: 'setup-2fa',
        name: 'Setup2FA',
        component: () => import('@/views/auth/Setup2FAView.vue'),
        meta: { requiresAuth: true },
      },
    ],
  },
  {
    path: '/dashboard',
    component: () => import('@/layouts/MainLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        name: 'Dashboard',
        component: () => import('@/views/dashboard/DashboardView.vue'),
      },
      {
        path: 'profile',
        name: 'Profile',
        component: () => import('@/views/profile/ProfileView.vue'),
      },
      {
        path: 'assignments',
        name: 'Assignments',
        component: () => import('@/views/assignments/AssignmentsListView.vue'),
      },
      {
        path: 'assignments/:id',
        name: 'AssignmentDetail',
        component: () => import('@/views/assignments/AssignmentDetailView.vue'),
      },
      {
        path: 'exams',
        name: 'Exams',
        component: () => import('@/views/exams/ExamsListView.vue'),
        meta: { roles: ['building_manager', 'exam_director'] },
      },
      {
        path: 'monitoring',
        name: 'Monitoring',
        component: () => import('@/views/monitoring/RealTimeMonitoringView.vue'),
        meta: { roles: ['building_manager', 'exam_director'] },
      },
      {
        path: 'admin',
        meta: { roles: ['exam_director'] },
        children: [
          {
            path: 'users',
            name: 'UsersManagement',
            component: () => import('@/views/admin/UsersManagementView.vue'),
          },
          {
            path: 'audit-logs',
            name: 'AuditLogs',
            component: () => import('@/views/admin/AuditLogsView.vue'),
          },
        ],
      },
    ],
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/views/NotFoundView.vue'),
  },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition;
    } else {
      return { top: 0 };
    }
  },
});

// Global guards
router.beforeEach(authGuard);
router.beforeEach(roleGuard);

export default router;
```

### Route Guards

```typescript
// src/router/guards.ts
import type { NavigationGuardNext, RouteLocationNormalized } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

export async function authGuard(
  to: RouteLocationNormalized,
  from: RouteLocationNormalized,
  next: NavigationGuardNext
): Promise<void> {
  const authStore = useAuthStore();

  const requiresAuth = to.matched.some(record => record.meta.requiresAuth);
  const requiresGuest = to.matched.some(record => record.meta.requiresGuest);

  if (requiresAuth && !authStore.isAuthenticated) {
    next({ name: 'Login', query: { redirect: to.fullPath } });
  } else if (requiresGuest && authStore.isAuthenticated) {
    next({ name: 'Dashboard' });
  } else {
    next();
  }
}

export function roleGuard(
  to: RouteLocationNormalized,
  from: RouteLocationNormalized,
  next: NavigationGuardNext
): void {
  const authStore = useAuthStore();

  const requiredRoles = to.matched
    .flatMap(record => record.meta.roles as string[] || []);

  if (requiredRoles.length === 0) {
    next();
    return;
  }

  const hasRequiredRole = requiredRoles.some(role =>
    authStore.userRoles.includes(role)
  );

  if (hasRequiredRole) {
    next();
  } else {
    next({ name: 'Dashboard' });
  }
}
```

---

## UI Components

### Reusable Components

#### Button Component
```vue
<!-- src/components/ui/Button.vue -->
<script setup lang="ts">
interface Props {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'primary',
  size: 'md',
  loading: false,
  disabled: false,
  type: 'button',
});

const variantClasses = {
  primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
  secondary: 'bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500',
  danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
  ghost: 'bg-transparent text-gray-700 hover:bg-gray-100 focus:ring-gray-400',
};

const sizeClasses = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-base',
  lg: 'px-6 py-3 text-lg',
};
</script>

<template>
  <button
    :type="type"
    :disabled="disabled || loading"
    :class="[
      'inline-flex items-center justify-center rounded-md font-medium',
      'focus:outline-none focus:ring-2 focus:ring-offset-2',
      'disabled:opacity-50 disabled:cursor-not-allowed',
      'transition-colors duration-200',
      variantClasses[variant],
      sizeClasses[size],
    ]"
  >
    <svg
      v-if="loading"
      class="animate-spin -ml-1 mr-2 h-4 w-4"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        class="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        stroke-width="4"
      />
      <path
        class="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
    <slot />
  </button>
</template>
```

#### Modal Component
```vue
<!-- src/components/ui/Modal.vue -->
<script setup lang="ts">
import { TransitionRoot, TransitionChild, Dialog, DialogPanel, DialogTitle } from '@headlessui/vue';
import { XMarkIcon } from '@heroicons/vue/24/outline';

interface Props {
  show: boolean;
  title?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md',
});

const emit = defineEmits<{
  close: [];
}>();

const sizeClasses = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
};
</script>

<template>
  <TransitionRoot :show="show" as="template">
    <Dialog as="div" class="relative z-50" @close="emit('close')">
      <TransitionChild
        as="template"
        enter="ease-out duration-300"
        enter-from="opacity-0"
        enter-to="opacity-100"
        leave="ease-in duration-200"
        leave-from="opacity-100"
        leave-to="opacity-0"
      >
        <div class="fixed inset-0 bg-black bg-opacity-25" />
      </TransitionChild>

      <div class="fixed inset-0 overflow-y-auto">
        <div class="flex min-h-full items-center justify-center p-4">
          <TransitionChild
            as="template"
            enter="ease-out duration-300"
            enter-from="opacity-0 scale-95"
            enter-to="opacity-100 scale-100"
            leave="ease-in duration-200"
            leave-from="opacity-100 scale-100"
            leave-to="opacity-0 scale-95"
          >
            <DialogPanel
              :class="[
                'w-full transform overflow-hidden rounded-lg bg-white',
                'p-6 text-left align-middle shadow-xl transition-all',
                sizeClasses[size],
              ]"
            >
              <div class="flex items-center justify-between mb-4">
                <DialogTitle
                  v-if="title"
                  as="h3"
                  class="text-lg font-medium leading-6 text-gray-900"
                >
                  {{ title }}
                </DialogTitle>
                <button
                  @click="emit('close')"
                  class="text-gray-400 hover:text-gray-500"
                >
                  <XMarkIcon class="h-6 w-6" />
                </button>
              </div>

              <slot />

              <div v-if="$slots.footer" class="mt-6 flex justify-end space-x-3">
                <slot name="footer" />
              </div>
            </DialogPanel>
          </TransitionChild>
        </div>
      </div>
    </Dialog>
  </TransitionRoot>
</template>
```

---

## API Integration

### API Service

```typescript
// src/services/api.ts
import axios, { type AxiosInstance, type AxiosError } from 'axios';
import { useAuthStore } from '@/stores/auth';
import router from '@/router';
import { useToast } from 'vue-toastification';

const toast = useToast();

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const authStore = useAuthStore();

    if (authStore.accessToken) {
      config.headers.Authorization = `Bearer ${authStore.accessToken}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response.data;
  },
  async (error: AxiosError) => {
    const authStore = useAuthStore();
    const originalRequest = error.config as any;

    // Handle 401 Unauthorized
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Try to refresh token
        await authStore.refreshAccessToken();

        // Retry original request
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed, logout and redirect to login
        await authStore.logout();
        router.push({ name: 'Login' });
        return Promise.reject(refreshError);
      }
    }

    // Handle other errors
    const errorMessage = error.response?.data?.error?.message ||
                        error.message ||
                        'An unexpected error occurred';

    toast.error(errorMessage);

    return Promise.reject(error);
  }
);

export default api;
```

### Service Examples

```typescript
// src/services/assignments.service.ts
import api from './api';
import type { Assignment, CreateAssignmentDto, UpdateAssignmentDto } from '@/types/models/assignment';
import type { PaginatedResponse, ApiResponse } from '@/types/api/responses';

export const assignmentsService = {
  async getMyAssignments(): Promise<Assignment[]> {
    const response = await api.get<ApiResponse<Assignment[]>>('/assignments/my');
    return response.data;
  },

  async getAssignments(page = 1, limit = 20): Promise<PaginatedResponse<Assignment>> {
    const response = await api.get<PaginatedResponse<Assignment>>('/assignments', {
      params: { page, limit },
    });
    return response;
  },

  async getAssignmentById(id: number): Promise<Assignment> {
    const response = await api.get<ApiResponse<Assignment>>(`/assignments/${id}`);
    return response.data;
  },

  async createAssignment(data: CreateAssignmentDto): Promise<Assignment> {
    const response = await api.post<ApiResponse<Assignment>>('/assignments', data);
    return response.data;
  },

  async updateAssignment(id: number, data: UpdateAssignmentDto): Promise<Assignment> {
    const response = await api.patch<ApiResponse<Assignment>>(`/assignments/${id}`, data);
    return response.data;
  },

  async acceptAssignment(id: number): Promise<void> {
    await api.post(`/assignments/${id}/accept`);
  },

  async rejectAssignment(id: number): Promise<void> {
    await api.post(`/assignments/${id}/reject`);
  },

  async checkIn(id: number): Promise<void> {
    await api.post(`/assignments/${id}/checkin`);
  },

  async checkOut(id: number): Promise<void> {
    await api.post(`/assignments/${id}/checkout`);
  },
};
```

---

## Authentication Flow

### Login Flow

```vue
<!-- src/views/auth/LoginView.vue -->
<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { useToast } from 'vue-toastification';
import Button from '@/components/ui/Button.vue';
import Input from '@/components/ui/Input.vue';

const router = useRouter();
const authStore = useAuthStore();
const toast = useToast();

const form = ref({
  username: '',
  password: '',
  remember: false,
});

const isLoading = ref(false);

async function handleSubmit() {
  isLoading.value = true;

  try {
    await authStore.login({
      username: form.value.username,
      password: form.value.password,
    });

    toast.success('Login successful!');
    router.push({ name: 'Dashboard' });
  } catch (error: any) {
    // Error already handled by interceptor
  } finally {
    isLoading.value = false;
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full space-y-8">
      <div>
        <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Sign in to your account
        </h2>
      </div>

      <form class="mt-8 space-y-6" @submit.prevent="handleSubmit">
        <div class="rounded-md shadow-sm -space-y-px">
          <Input
            v-model="form.username"
            type="text"
            placeholder="Username"
            required
            autocomplete="username"
          />

          <Input
            v-model="form.password"
            type="password"
            placeholder="Password"
            required
            autocomplete="current-password"
          />
        </div>

        <div class="flex items-center justify-between">
          <div class="flex items-center">
            <input
              id="remember"
              v-model="form.remember"
              type="checkbox"
              class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label for="remember" class="ml-2 block text-sm text-gray-900">
              Remember me
            </label>
          </div>

          <div class="text-sm">
            <router-link
              :to="{ name: 'ForgotPassword' }"
              class="font-medium text-blue-600 hover:text-blue-500"
            >
              Forgot your password?
            </router-link>
          </div>
        </div>

        <div>
          <Button
            type="submit"
            variant="primary"
            size="lg"
            :loading="isLoading"
            class="w-full"
          >
            Sign in
          </Button>
        </div>

        <div class="text-center">
          <router-link
            :to="{ name: 'Register' }"
            class="font-medium text-blue-600 hover:text-blue-500"
          >
            Don't have an account? Register
          </router-link>
        </div>
      </form>
    </div>
  </div>
</template>
```

---

## Real-time Features

### WebSocket Service

```typescript
// src/services/websocket.service.ts
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '@/stores/auth';

class WebSocketService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  connect(): void {
    const authStore = useAuthStore();

    if (this.socket?.connected) {
      return;
    }

    this.socket = io(import.meta.env.VITE_WS_URL || 'http://localhost:3000', {
      auth: {
        token: authStore.accessToken,
      },
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: this.maxReconnectAttempts,
    });

    this.setupEventListeners();
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  on(event: string, callback: (...args: any[]) => void): void {
    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  off(event: string, callback?: (...args: any[]) => void): void {
    if (this.socket) {
      this.socket.off(event, callback);
    }
  }

  emit(event: string, data?: any): void {
    if (this.socket) {
      this.socket.emit(event, data);
    }
  }

  private setupEventListeners(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('WebSocket connected');
      this.reconnectAttempts = 0;
    });

    this.socket.on('disconnect', () => {
      console.log('WebSocket disconnected');
    });

    this.socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      this.reconnectAttempts++;

      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error('Max reconnection attempts reached');
        this.disconnect();
      }
    });
  }
}

export const websocketService = new WebSocketService();
```

### WebSocket Composable

```typescript
// src/composables/useWebSocket.ts
import { onMounted, onUnmounted } from 'vue';
import { websocketService } from '@/services/websocket.service';

export function useWebSocket() {
  onMounted(() => {
    websocketService.connect();
  });

  onUnmounted(() => {
    websocketService.disconnect();
  });

  return {
    on: websocketService.on.bind(websocketService),
    off: websocketService.off.bind(websocketService),
    emit: websocketService.emit.bind(websocketService),
  };
}
```

---

## Code Quality

### ESLint Configuration

```javascript
// .eslintrc.cjs
module.exports = {
  root: true,
  env: {
    browser: true,
    es2021: true,
    node: true,
  },
  extends: [
    'plugin:vue/vue3-recommended',
    'eslint:recommended',
    '@vue/typescript/recommended',
    '@vue/prettier',
  ],
  parserOptions: {
    ecmaVersion: 2021,
  },
  rules: {
    'vue/multi-word-component-names': 'off',
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    'prettier/prettier': [
      'error',
      {
        endOfLine: 'auto',
      },
    ],
  },
};
```

### Prettier Configuration

```json
// .prettierrc
{
  "singleQuote": true,
  "trailingComma": "es5",
  "printWidth": 100,
  "tabWidth": 2,
  "semi": true,
  "arrowParens": "always",
  "endOfLine": "lf",
  "vueIndentScriptAndStyle": false
}
```

### Husky & lint-staged

```json
// package.json
{
  "lint-staged": {
    "*.{js,ts,vue}": [
      "eslint --fix",
      "prettier --write"
    ],
    "*.{css,scss,html,json,md}": [
      "prettier --write"
    ]
  }
}
```

---

## Testing Strategy

### Vitest Configuration

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import vue from '@vitejs/plugin-vue';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  plugins: [vue()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'tests/',
      ],
    },
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
});
```

### Unit Test Example

```typescript
// src/stores/__tests__/auth.spec.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useAuthStore } from '../auth';
import { authService } from '@/services/auth.service';

vi.mock('@/services/auth.service');

describe('Auth Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('should login successfully', async () => {
    const store = useAuthStore();
    const mockResponse = {
      accessToken: 'token123',
      refreshToken: 'refresh123',
      user: { id: 1, username: 'testuser', roles: ['supervisor'] },
    };

    vi.mocked(authService.login).mockResolvedValue(mockResponse);

    await store.login({ username: 'testuser', password: 'password' });

    expect(store.isAuthenticated).toBe(true);
    expect(store.user).toEqual(mockResponse.user);
    expect(store.accessToken).toBe('token123');
  });

  it('should logout and clear tokens', async () => {
    const store = useAuthStore();
    store.accessToken = 'token123';
    store.user = { id: 1, username: 'testuser', roles: [] };

    await store.logout();

    expect(store.isAuthenticated).toBe(false);
    expect(store.user).toBeNull();
    expect(store.accessToken).toBeNull();
  });
});
```

---

## Build & Deployment

### Vite Configuration

```typescript
// vite.config.ts
import { defineConfig, loadEnv } from 'vite';
import vue from '@vitejs/plugin-vue';
import { fileURLToPath, URL } from 'node:url';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [
      vue(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.ico', 'robots.txt'],
        manifest: {
          name: 'Exam Supervision',
          short_name: 'ExamSup',
          description: 'Exam Supervision Management System',
          theme_color: '#2563eb',
          icons: [
            {
              src: 'pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png',
            },
            {
              src: 'pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
            },
          ],
        },
      }),
    ],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    server: {
      port: 5173,
      proxy: {
        '/api': {
          target: env.VITE_API_BASE_URL || 'http://localhost:3000',
          changeOrigin: true,
        },
      },
    },
    build: {
      sourcemap: mode === 'development',
      rollupOptions: {
        output: {
          manualChunks: {
            'vendor': ['vue', 'vue-router', 'pinia'],
            'ui': ['@headlessui/vue', '@heroicons/vue'],
          },
        },
      },
    },
  };
});
```

### Tailwind Configuration

```javascript
// tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{vue,js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
}
```

### Package.json

```json
{
  "name": "exam-supervision-frontend",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "type-check": "vue-tsc --noEmit",
    "lint": "eslint . --ext .vue,.js,.jsx,.cjs,.mjs,.ts,.tsx,.cts,.mts --fix --ignore-path .gitignore",
    "format": "prettier --write src/",
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage",
    "test:e2e": "playwright test",
    "prepare": "husky install"
  },
  "dependencies": {
    "@headlessui/vue": "^1.7.25",
    "@heroicons/vue": "^2.2.0",
    "@vueuse/core": "^11.3.0",
    "axios": "^1.7.9",
    "chart.js": "^4.4.7",
    "date-fns": "^4.1.0",
    "pinia": "^2.3.0",
    "socket.io-client": "^4.8.1",
    "vee-validate": "^4.14.7",
    "vue": "^3.5.13",
    "vue-chartjs": "^5.3.2",
    "vue-router": "^4.5.0",
    "vue-toastification": "^2.0.0-rc.5",
    "yup": "^1.6.1"
  },
  "devDependencies": {
    "@playwright/test": "^1.49.1",
    "@tailwindcss/forms": "^0.5.9",
    "@tailwindcss/typography": "^0.5.15",
    "@testing-library/vue": "^8.1.0",
    "@types/node": "^22.10.2",
    "@typescript-eslint/eslint-plugin": "^8.16.0",
    "@typescript-eslint/parser": "^8.16.0",
    "@vitejs/plugin-vue": "^5.2.1",
    "@vitest/ui": "^2.1.8",
    "@vue/eslint-config-prettier": "^10.1.0",
    "@vue/eslint-config-typescript": "^14.1.3",
    "@vue/test-utils": "^2.4.6",
    "autoprefixer": "^10.4.20",
    "eslint": "^9.16.0",
    "eslint-plugin-vue": "^9.31.0",
    "husky": "^9.1.7",
    "jsdom": "^25.0.1",
    "lint-staged": "^15.2.11",
    "postcss": "^8.4.49",
    "prettier": "^3.4.2",
    "tailwindcss": "^4.0.0",
    "typescript": "^5.7.2",
    "vite": "^6.0.3",
    "vite-plugin-pwa": "^0.21.1",
    "vitest": "^2.1.8",
    "vue-tsc": "^2.1.10"
  }
}
```

### Docker Configuration

```dockerfile
# Dockerfile
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

### Nginx Configuration

```nginx
# nginx.conf
server {
    listen 80;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://api:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /socket.io {
        proxy_pass http://api:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## Implementation Timeline

### Phase 1: Setup & Foundation (Week 1)
- Initialize Vue project with Vite
- Setup Tailwind CSS 4
- Configure ESLint & Prettier
- Setup Pinia stores
- Configure Vue Router
- Create base layout components

### Phase 2: Authentication (Week 2)
- Implement login/register views
- Setup auth store & service
- Implement route guards
- 2FA setup
- Token refresh logic

### Phase 3: Core Features (Week 3-4)
- Dashboard views (role-based)
- Profile management
- Assignments module
- Exams module
- Buildings/Halls/Rooms management

### Phase 4: Advanced Features (Week 5-6)
- Attendance tracking
- Violation reporting
- Feedback system
- Notifications
- Real-time monitoring (WebSocket)

### Phase 5: Polish & Testing (Week 7-8)
- Write unit tests
- E2E tests
- Performance optimization
- PWA features
- Accessibility improvements

### Phase 6: Deployment (Week 9)
- Build optimization
- Docker setup
- CI/CD pipeline
- Production deployment

---

## Best Practices

1. **Use Composition API**
   - Leverage `<script setup>` for better DX
   - Extract logic into composables
   - Use TypeScript for type safety

2. **Component Design**
   - Keep components small and focused
   - Use props for input, emits for output
   - Implement proper prop validation

3. **State Management**
   - Use Pinia for global state
   - Keep local state in components when appropriate
   - Use composables for shared logic

4. **Performance**
   - Lazy load routes
   - Use v-memo for expensive renders
   - Implement virtual scrolling for large lists
   - Optimize images

5. **Accessibility**
   - Use semantic HTML
   - Provide ARIA labels
   - Keyboard navigation
   - Screen reader support

6. **Security**
   - Sanitize user input
   - Use CSP headers
   - Implement XSS protection
   - Secure token storage

7. **Code Quality**
   - Write tests
   - Use TypeScript
   - Follow Vue style guide
   - Code reviews

---

## Resources

- [Vue 3 Documentation](https://vuejs.org/)
- [Vite Documentation](https://vitejs.dev/)
- [Pinia Documentation](https://pinia.vuejs.org/)
- [Vue Router Documentation](https://router.vuejs.org/)
- [Tailwind CSS Documentation](https://tailwindcss.com/)
- [Headless UI Documentation](https://headlessui.com/)
