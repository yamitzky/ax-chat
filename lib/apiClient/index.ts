import type { AppType } from '@/app/api/[...route]/route'
import { hc } from 'hono/client'

export const apiClient = hc<AppType>('/').api
