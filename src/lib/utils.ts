import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { differenceInDays, format, formatDistanceToNow } from 'date-fns'
import type { RAGStatus, TaskStatus, TaskOwner } from './types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date | null | undefined, fmt = 'MMM d, yyyy') {
  if (!date) return '—'
  return format(new Date(date), fmt)
}

export function daysUntil(date: string | null | undefined): number | null {
  if (!date) return null
  return differenceInDays(new Date(date), new Date())
}

export function timeAgo(date: string) {
  return formatDistanceToNow(new Date(date), { addSuffix: true })
}

export function ragColor(rag: RAGStatus) {
  return { green: 'emerald', amber: 'amber', red: 'red' }[rag]
}

export function ragDotClass(rag: RAGStatus) {
  return {
    green: 'bg-emerald-500',
    amber: 'bg-amber-500',
    red: 'bg-red-500',
  }[rag]
}

export function ragBadgeClass(rag: RAGStatus) {
  return {
    green: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    amber: 'bg-amber-50 text-amber-700 border-amber-200',
    red: 'bg-red-50 text-red-700 border-red-200',
  }[rag]
}

export function statusBadgeClass(status: TaskStatus) {
  return {
    not_started: 'bg-slate-100 text-slate-600',
    in_progress: 'bg-blue-50 text-blue-700',
    completed: 'bg-emerald-50 text-emerald-700',
    blocked: 'bg-red-50 text-red-700',
    na: 'bg-slate-50 text-slate-400',
  }[status]
}

export function ownerBadgeClass(owner: TaskOwner) {
  return {
    uc: 'bg-indigo-50 text-indigo-600',
    customer: 'bg-orange-50 text-orange-600',
    both: 'bg-purple-50 text-purple-600',
  }[owner]
}

export function ownerLabel(owner: TaskOwner) {
  return { uc: 'UC', customer: 'Client', both: 'Both' }[owner]
}

export function statusLabel(status: TaskStatus) {
  return {
    not_started: 'Not Started',
    in_progress: 'In Progress',
    completed: 'Completed',
    blocked: 'Blocked',
    na: 'N/A',
  }[status]
}

export function projectStatusLabel(status: string) {
  return {
    active: 'Active',
    go_live_ready: 'Go-Live Ready',
    live: 'Live',
    hypercare: 'Hypercare',
    completed: 'Completed',
    on_hold: 'On Hold',
    cancelled: 'Cancelled',
  }[status] ?? status
}

export function issueSLAHours(severity: string): number {
  return { P1: 4, P2: 8, P3: 24, P4: 72 }[severity] ?? 24
}

export function generatePortalUrl(token: string): string {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? ''
  return `${base}/portal/${token}`
}

export function getInitials(name: string): string {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}
