import { Hono } from "hono"
import { handle } from "hono/vercel"
import { chatRoutes } from "@/features/chat/api/routes"

const app = new Hono().basePath("/api").route("/", chatRoutes)

export const GET = handle(app)
export const POST = handle(app)

export type AppType = typeof app
