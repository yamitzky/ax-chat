import Chat from "@/features/chat/components/Chat";

type Props = {
  params: Promise<{
    sessionId: string;
  }>;
};

export default async function SessionPage({ params }: Props) {
  const { sessionId } = await params;

  return (
    <div className="h-screen w-full bg-zinc-50 dark:bg-zinc-950 overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] -z-10" />
      <Chat sessionId={sessionId} />
    </div>
  );
}
