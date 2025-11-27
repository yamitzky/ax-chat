import { useId, useState } from "react";
import { useQueryClient, useQuery, useMutation } from "@tanstack/react-query";

async function* getCompletion(prompt: string, signal: AbortSignal) {
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ prompt }),
    signal,
  });

  if (!response.body) throw new Error('No body');
  
  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    yield decoder.decode(value, { stream: true });
  }
}

export default function useStreamCompletion() {
  const id = useId();
  const queryClient = useQueryClient();
  const [abortController, setAbortController] =
    useState<AbortController | null>(null);

  const { data: completion } = useQuery<string>({
    queryKey: ["completion", id],
    queryFn: () => "",
    initialData: "",
    staleTime: Infinity,
    enabled: false,
  });

  const { mutate, mutateAsync, isPending, error } = useMutation({
    mutationKey: ["mutate-completion", id],
    mutationFn: async (prompt: string) => {
      if (abortController) {
        abortController.abort();
      }
      const controller = new AbortController();
      const signal = controller.signal;
      setAbortController(controller);

      // Clear previous completion
      queryClient.setQueryData(["completion", id], "");
      
      let fullResponse = "";

      try {
        for await (const token of getCompletion(
          prompt,
          signal,
        )) {
          queryClient.setQueryData<string>(
            ["completion", id],
            (prev) => (prev ? prev + token : token),
          );
          fullResponse += token;
        }
      } finally {
        setAbortController(null);
      }
      
      return fullResponse;
    },
  });

  return { mutate, mutateAsync, completion, error, isLoading: isPending };
}
