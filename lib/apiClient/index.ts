import { hc } from "hono/client"
import type { AppType } from "@/app/api/[...route]/route"

export const apiClient = hc<AppType>("/").api
