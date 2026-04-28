import { Suspense } from 'react'
import { LoginForm } from './LoginForm'

export default function LoginPage() {
  return (
    <Suspense fallback={<div style={{minHeight:'100vh',background:'linear-gradient(150deg,#f2faea,#eaf5e0,#f5ede0)'}}/>}>
      <LoginForm />
    </Suspense>
  )
}
