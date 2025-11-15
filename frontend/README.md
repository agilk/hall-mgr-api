# Exam Supervision Management System - Frontend

Vue 3 + TypeScript + Vite application for managing exam supervision operations.

## Tech Stack

- **Vue 3** - Progressive JavaScript framework
- **TypeScript** - Type-safe JavaScript
- **Vite** - Next-generation frontend build tool
- **Pinia** - State management for Vue
- **Vue Router** - Official router for Vue.js
- **Naive UI** - Vue 3 component library
- **VeeValidate** - Form validation library
- **Yup** - Schema validation
- **Iconify** - Universal icon framework
- **Chart.js** - JavaScript charting library
- **vue-chartjs** - Vue wrapper for Chart.js
- **Axios** - Promise-based HTTP client
- **Tailwind CSS** - Utility-first CSS framework
- **VueUse** - Collection of Vue composition utilities
- **dayjs** - Lightweight date library

## Getting Started

### Prerequisites

- Node.js >= 18.x
- npm >= 9.x

### Installation

1. Install dependencies:
```bash
npm install
```

2. Copy environment file:
```bash
cp .env.example .env
```

3. Configure environment variables in `.env`

### Development

Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5173`

### Build

Build for production:
```bash
npm run build
```

Preview production build:
```bash
npm run preview
```

## GitHub Pages Deployment

This frontend is configured for automatic deployment to GitHub Pages.

### Live Demo

Once deployed, the application will be available at:
**https://agilk.github.io/hall-mgr-api/**

### Automatic Deployment

The application automatically deploys to GitHub Pages when:
- Changes are pushed to the `main` or `master` branch in the `frontend/` directory
- A manual deployment is triggered via GitHub Actions

### Manual Deployment

1. Go to your repository on GitHub
2. Navigate to **Actions** tab
3. Select the **Deploy Frontend to GitHub Pages** workflow
4. Click **Run workflow**
5. Choose the branch and click **Run workflow**

### GitHub Pages Setup (One-Time)

To enable GitHub Pages for this repository:

1. Go to your repository **Settings**
2. Navigate to **Pages** (under Code and automation)
3. Under **Source**, select **GitHub Actions**
4. Save the settings

The next push to `main`/`master` will trigger the deployment automatically.

### Local Testing

To test the production build locally:
```bash
npm run build
npm run preview
```

This simulates the GitHub Pages environment with the correct base path.

## Features

### 1. Naive UI Components

Comprehensive UI component library with forms, tables, charts, and more.

### 2. Form Validation (VeeValidate + Yup)

Type-safe form validation with schema support.

### 3. Iconify Icons

Access to 200,000+ icons from popular icon sets.

### 4. Chart.js Visualizations

Beautiful, responsive charts for data visualization.

### 5. State Management (Pinia)

Centralized state management with TypeScript support.

### 6. API Service

Centralized HTTP client with automatic token handling.

## Demo Page

Visit `/demo` to see examples of all libraries and components in action!

## Documentation

- [Vue 3](https://vuejs.org/)
- [Naive UI](https://www.naiveui.com/)
- [VeeValidate](https://vee-validate.logaretm.com/)
- [Iconify](https://iconify.design/)
- [Chart.js](https://www.chartjs.org/)
