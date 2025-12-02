import Chat from "@/features/chat/components/Chat"

export default function Home() {
  return (
    <div className="h-screen w-full bg-background overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,oklch(0.5_0_0/0.05)_1px,transparent_1px),linear-gradient(to_bottom,oklch(0.5_0_0/0.05)_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,oklch(0.8_0_0/0.03)_1px,transparent_1px),linear-gradient(to_bottom,oklch(0.8_0_0/0.03)_1px,transparent_1px)] bg-size-[24px_24px] -z-10" />
      <Chat />
    </div>
  )
}
