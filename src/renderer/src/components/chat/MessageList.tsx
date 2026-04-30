import { useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { MessageBubble } from './MessageBubble';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import type { Message } from '../../types';

interface MessageListProps {
  messages: Message[];
  loading: boolean;
  agentName: string;
}

export function MessageList({ messages, loading, agentName }: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 自动滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  return (
    <div className="messages-list">
      <AnimatePresence>
        {messages.map((msg, index) => (
          <MessageBubble
            key={index}
            message={msg}
            agentName={agentName}
            index={index}
          />
        ))}
      </AnimatePresence>

      {loading && (
        <motion.div
          className="message-wrapper assistant"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="message-bubble assistant">
            <div className="message-loading">
              <LoadingSpinner />
            </div>
          </div>
        </motion.div>
      )}

      {/* 用于滚动定位的锚点 */}
      <div ref={messagesEndRef} />
    </div>
  );
}
