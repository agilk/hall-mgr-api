<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { NCard, NForm, NFormItem, NInput, NButton, NSpace, useMessage } from 'naive-ui'
import { useForm } from 'vee-validate'
import { loginSchema } from '@/utils/validation'
import { useAuthStore } from '@/stores/auth'
import type { LoginForm } from '@/types'

const router = useRouter()
const message = useMessage()
const authStore = useAuthStore()

const loading = ref(false)

const { errors, handleSubmit, defineField } = useForm({
  validationSchema: loginSchema,
})

const [username] = defineField('username')
const [password] = defineField('password')

const onSubmit = handleSubmit(async (values) => {
  loading.value = true
  try {
    await authStore.login(values as LoginForm)
    message.success('Login successful!')
    router.push({ name: 'Dashboard' })
  } catch (error: any) {
    message.error(error.response?.data?.message || 'Login failed')
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="login-container">
    <NCard title="Exam Supervision System" style="width: 400px">
      <NForm @submit.prevent="onSubmit">
        <NSpace vertical :size="16">
          <NFormItem label="Username" :feedback="errors.username" :validation-status="errors.username ? 'error' : undefined">
            <NInput v-model:value="username" placeholder="Enter username" />
          </NFormItem>

          <NFormItem label="Password" :feedback="errors.password" :validation-status="errors.password ? 'error' : undefined">
            <NInput v-model:value="password" type="password" placeholder="Enter password" />
          </NFormItem>

          <NButton type="primary" attr-type="submit" :loading="loading" block> Login </NButton>

          <div style="text-align: center">
            <router-link to="/register" style="color: #18a058">
              Don't have an account? Register
            </router-link>
          </div>
        </NSpace>
      </NForm>
    </NCard>
  </div>
</template>

<style scoped>
.login-container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
}
</style>
