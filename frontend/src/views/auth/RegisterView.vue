<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { NCard, NForm, NFormItem, NInput, NButton, NSpace, useMessage } from 'naive-ui'
import { useForm } from 'vee-validate'
import { registerSchema } from '@/utils/validation'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const message = useMessage()
const authStore = useAuthStore()

const loading = ref(false)

const { errors, handleSubmit, defineField } = useForm({
  validationSchema: registerSchema,
})

const [username] = defineField('username')
const [email] = defineField('email')
const [password] = defineField('password')
const [confirm_password] = defineField('confirm_password')
const [full_name] = defineField('full_name')
const [phone_number] = defineField('phone_number')

const onSubmit = handleSubmit(async (values) => {
  loading.value = true
  try {
    await authStore.register(values)
    message.success('Registration successful! Please login.')
    router.push({ name: 'Login' })
  } catch (error: any) {
    message.error(error.response?.data?.message || 'Registration failed')
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="register-container">
    <NCard title="Register - Exam Supervision System" style="width: 450px">
      <NForm @submit.prevent="onSubmit">
        <NSpace vertical :size="16">
          <NFormItem label="Username" :feedback="errors.username" :validation-status="errors.username ? 'error' : undefined">
            <NInput v-model:value="username" placeholder="Choose a username" />
          </NFormItem>

          <NFormItem label="Email" :feedback="errors.email" :validation-status="errors.email ? 'error' : undefined">
            <NInput v-model:value="email" placeholder="Enter email address" />
          </NFormItem>

          <NFormItem label="Full Name" :feedback="errors.full_name" :validation-status="errors.full_name ? 'error' : undefined">
            <NInput v-model:value="full_name" placeholder="Enter full name" />
          </NFormItem>

          <NFormItem label="Phone Number (Optional)" :feedback="errors.phone_number" :validation-status="errors.phone_number ? 'error' : undefined">
            <NInput v-model:value="phone_number" placeholder="Enter phone number" />
          </NFormItem>

          <NFormItem label="Password" :feedback="errors.password" :validation-status="errors.password ? 'error' : undefined">
            <NInput v-model:value="password" type="password" placeholder="Choose a password" />
          </NFormItem>

          <NFormItem label="Confirm Password" :feedback="errors.confirm_password" :validation-status="errors.confirm_password ? 'error' : undefined">
            <NInput v-model:value="confirm_password" type="password" placeholder="Re-enter password" />
          </NFormItem>

          <NButton type="primary" attr-type="submit" :loading="loading" block> Register </NButton>

          <div style="text-align: center">
            <router-link to="/login" style="color: #18a058">
              Already have an account? Login
            </router-link>
          </div>
        </NSpace>
      </NForm>
    </NCard>
  </div>
</template>

<style scoped>
.register-container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
}
</style>
