import { defineRule, configure } from 'vee-validate'
import * as yup from 'yup'

// Define custom validation rules
defineRule('required', (value: any) => {
  if (!value || !value.length) {
    return 'This field is required'
  }
  return true
})

defineRule('email', (value: string) => {
  if (!value || !value.length) {
    return true
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(value)) {
    return 'Must be a valid email'
  }
  return true
})

defineRule('min', (value: string, [limit]: [number]) => {
  if (!value || !value.length) {
    return true
  }
  if (value.length < limit) {
    return `Must be at least ${limit} characters`
  }
  return true
})

defineRule('max', (value: string, [limit]: [number]) => {
  if (!value || !value.length) {
    return true
  }
  if (value.length > limit) {
    return `Must not exceed ${limit} characters`
  }
  return true
})

defineRule('confirmed', (value: string, [target]: [string]) => {
  if (value !== target) {
    return 'Passwords do not match'
  }
  return true
})

defineRule('phone', (value: string) => {
  if (!value || !value.length) {
    return true
  }
  const phoneRegex = /^[\d\s\-\+\(\)]+$/
  if (!phoneRegex.test(value)) {
    return 'Must be a valid phone number'
  }
  return true
})

defineRule('username', (value: string) => {
  if (!value || !value.length) {
    return true
  }
  const usernameRegex = /^[a-zA-Z0-9_-]+$/
  if (!usernameRegex.test(value)) {
    return 'Username can only contain letters, numbers, hyphens, and underscores'
  }
  return true
})

// Configure VeeValidate
configure({
  validateOnBlur: true,
  validateOnChange: true,
  validateOnInput: false,
  validateOnModelUpdate: true,
})

// Yup schemas for complex validations
export const loginSchema = yup.object({
  username: yup
    .string()
    .required('Username is required')
    .min(3, 'Username must be at least 3 characters'),
  password: yup
    .string()
    .required('Password is required')
    .min(6, 'Password must be at least 6 characters'),
  twofa_code: yup.string().optional(),
})

export const registerSchema = yup.object({
  username: yup
    .string()
    .required('Username is required')
    .min(3, 'Username must be at least 3 characters')
    .matches(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, hyphens, and underscores'),
  email: yup
    .string()
    .required('Email is required')
    .email('Must be a valid email'),
  password: yup
    .string()
    .required('Password is required')
    .min(8, 'Password must be at least 8 characters'),
  confirm_password: yup
    .string()
    .required('Please confirm your password')
    .oneOf([yup.ref('password')], 'Passwords must match'),
  full_name: yup
    .string()
    .required('Full name is required')
    .min(2, 'Full name must be at least 2 characters'),
  phone_number: yup
    .string()
    .optional()
    .matches(/^[\d\s\-\+\(\)]+$/, 'Must be a valid phone number'),
})

export const violationSchema = yup.object({
  violation_type: yup.string().required('Violation type is required'),
  participant_name: yup.string().optional(),
  description: yup
    .string()
    .required('Description is required')
    .min(10, 'Description must be at least 10 characters'),
  severity: yup
    .string()
    .required('Severity is required')
    .oneOf(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'], 'Invalid severity level'),
})

export const attendanceSchema = yup.object({
  participant_id: yup.string().required('Participant ID is required'),
  participant_name: yup.string().required('Participant name is required'),
  status: yup
    .string()
    .required('Status is required')
    .oneOf(['PRESENT', 'ABSENT', 'EXCUSED', 'LATE'], 'Invalid status'),
  notes: yup.string().optional(),
})

// Helper function to get validation errors
export function getValidationErrors(error: any): Record<string, string> {
  if (!error.inner) return {}

  const errors: Record<string, string> = {}
  error.inner.forEach((err: any) => {
    if (err.path) {
      errors[err.path] = err.message
    }
  })
  return errors
}
