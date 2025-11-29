import Chat from "@/features/chat/components/Chat";

export default function Home() {
  return (
    <div className="h-screen w-full bg-zinc-50 dark:bg-zinc-950 overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] -z-10" />
      <Chat />
    </div>
  );
}
