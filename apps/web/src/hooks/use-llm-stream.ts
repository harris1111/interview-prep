import { useState, useRef } from 'react';

export function useLlmStream() {
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamedContent, setStreamedContent] = useState('');
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const startStream = async (
    sessionId: string,
    roundNumber: number,
    content: string,
  ): Promise<string> => {
    setIsStreaming(true);
    setStreamedContent('');
    setError(null);

    const token = localStorage.getItem('accessToken');
    const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';
    abortRef.current = new AbortController();

    try {
      const response = await fetch(
        `${baseURL}/interview/${sessionId}/rounds/${roundNumber}/stream`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ content }),
          signal: abortRef.current.signal,
        },
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let accumulated = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const text = decoder.decode(value, { stream: true });
        const lines = text.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ') && line !== 'data: [DONE]') {
            try {
              const parsed = JSON.parse(line.slice(6));
              if (parsed.error) {
                setError(parsed.error);
                setIsStreaming(false);
                return accumulated;
              }
              if (parsed.content) {
                accumulated += parsed.content;
                setStreamedContent(accumulated);
              }
            } catch (parseError) {
              console.error('Failed to parse SSE data:', parseError);
            }
          }
        }
      }

      setIsStreaming(false);
      return accumulated;
    } catch (err: any) {
      if (err.name === 'AbortError') {
        setError('Stream cancelled');
      } else {
        setError(err.message || 'Stream failed');
      }
      setIsStreaming(false);
      throw err;
    }
  };

  const cancelStream = () => {
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
  };

  const resetStream = () => {
    setStreamedContent('');
    setError(null);
    setIsStreaming(false);
  };

  return {
    isStreaming,
    streamedContent,
    error,
    startStream,
    cancelStream,
    resetStream,
  };
}
