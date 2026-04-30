import { motion } from 'framer-motion';
import type { Message } from '../../types';
import { MarkdownRenderer } from './MarkdownRenderer';
import { useAppTranslation } from '../../i18n/useTranslation';

interface MessageBubbleProps {
  message: Message;
  agentName: string;
  index: number;
}

export function MessageBubble({ message, agentName, index }: MessageBubbleProps) {
  const { t } = useAppTranslation();

  return (
    <motion.div
      key={index}
      className={`message-wrapper ${message.role}`}
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{
        duration: 0.3,
        delay: index * 0.05,
        type: 'spring',
        stiffness: 200,
        damping: 20,
      }}
    >
      <div className={`message-bubble ${message.role}`}>
        <div className="message-content">
          {message.role === 'assistant' ? (
            <MarkdownRenderer content={message.content} />
          ) : (
            <span className="user-text">{message.content}</span>
          )}
        </div>
      </div>
    </motion.div>
  );
}
