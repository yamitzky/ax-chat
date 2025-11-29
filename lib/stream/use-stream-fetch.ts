import { useCallback, useState } from 'react';

/**
 * ストリーミングHTTPリクエストを扱う汎用hook
 */
export function useStreamFetch<TRequest, TResponse>() {
  const [controller, setController] = useState<AbortController | null>(null);
  const [data, setData] = useState<TResponse | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);

  const fetchStream = useCallback(
    async (url: string, request: TRequest) => {
      if (controller) controller.abort();
      const newController = new AbortController();
      setController(newController);

      setIsStreaming(true);
      setData(null);

      try {
        const generator = fetchJSONStream<TResponse>(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(request),
          signal: newController.signal,
        });

        let accumulated = {} as TResponse;
        for await (const delta of generator) {
          accumulated = mergeDeep(accumulated, delta);
          setData(accumulated);
        }

        return accumulated;
      } finally {
        setController(null);
        setIsStreaming(false);
      }
    },
    [controller]
  );

  return {
    fetchStream,
    data: data,
    isStreaming: isStreaming,
  };
}

/**
 * 純粋な関数：JSONストリームをパース
 */
async function* fetchJSONStream<T>(
  url: string,
  init: RequestInit
): AsyncGenerator<Partial<T>> {
  const response = await fetch(url, init);

  if (!response.body) {
    throw new Error('No response body');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (line.trim()) {
        try {
          yield JSON.parse(line);
          if (init.signal?.aborted) {
            await reader.cancel();
            return;
          }
        } catch (parseError) {
          // JSONパースエラーは無視（不完全なデータの可能性）
          console.warn('Failed to parse JSON line:', parseError);
        }
      }
    }
  }

  // 最後の残りを処理
  if (buffer.trim()) {
    try {
      yield JSON.parse(buffer);
    } catch (parseError) {
      console.warn('Failed to parse final JSON:', parseError);
    }
  }
}

function mergeDeep<T>(target: any, source: any): T {
  if (typeof target !== 'object' || target === null) {
    return source;
  }
  
  const result = { ...target };
  
  for (const key in source) {
    const targetValue = result[key];
    const sourceValue = source[key];
    
    if (typeof targetValue === 'string' && typeof sourceValue === 'string') {
      result[key] = targetValue + sourceValue;
    } else if (typeof targetValue === 'object' && targetValue !== null && typeof sourceValue === 'object' && sourceValue !== null) {
      result[key] = mergeDeep(targetValue, sourceValue);
    } else {
      result[key] = sourceValue;
    }
  }
  
  return result as T;
}
