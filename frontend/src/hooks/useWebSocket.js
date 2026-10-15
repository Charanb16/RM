import { useEffect, useRef, useState, useCallback } from 'react';
import { useAuthStore } from '../store/authStore';

export const useWebSocket = ({
  urlPath = '/ws/notifications/',
  onMessage,
  enabled = true,
} = {}) => {
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState(null);
  const socketRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const accessToken = useAuthStore((state) => state.accessToken);

  const connect = useCallback(() => {
    if (!enabled || typeof window === 'undefined') return;

    const baseWs = import.meta.env.VITE_WS_URL || 'ws://localhost:8000';
    const query = accessToken ? `?token=${encodeURIComponent(accessToken)}` : '';
    const fullUrl = `${baseWs}${urlPath}${query}`;

    try {
      const ws = new WebSocket(fullUrl);
      socketRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
      };

      ws.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data);
          setLastMessage(parsed);
          onMessage?.(parsed);
        } catch {
          // ignore invalid non-JSON payloads
        }
      };

      ws.onclose = () => {
        setIsConnected(false);
        // Retry connection after 5 seconds if still enabled
        reconnectTimeoutRef.current = window.setTimeout(() => {
          if (enabled) {
            connect();
          }
        }, 5000);
      };

      ws.onerror = () => {
        setIsConnected(false);
        ws.close();
      };
    } catch {
      // WS connection failure fallback
      setIsConnected(false);
    }
  }, [enabled, urlPath, accessToken, onMessage]);

  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, [connect]);

  const sendMessage = useCallback((data) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(data));
      return true;
    }
    return false;
  }, []);

  return {
    isConnected,
    lastMessage,
    sendMessage,
  };
};

export default useWebSocket;
