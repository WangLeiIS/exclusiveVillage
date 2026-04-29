import { motion } from 'framer-motion';
import { Send, Folder } from 'lucide-react';

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  disabled: boolean;
  placeholder: string;
  apiKeySet: boolean;
  currentTeam: string;
  currentAgent: string;
  currentCwd: string;
  isPrimaryAgent?: boolean; // 新增：是否是主理人Agent
}

export function ChatInput({
  value,
  onChange,
  onSend,
  disabled,
  placeholder,
  apiKeySet,
  currentTeam,
  currentAgent,
  currentCwd,
  isPrimaryAgent = false
}: ChatInputProps) {
  // 修复禁用逻辑：主理人Agent或团队+Agent都允许对话
  const isDisabled = disabled || !apiKeySet || (!isPrimaryAgent && (!currentTeam || !currentAgent));

  return (
    <motion.div
      className="input-container"
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.3 }}
    >
      {currentCwd && (
        <motion.div
          className="cwd-indicator"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Folder size={14} />
          <span className="cwd-path">{currentCwd}</span>
        </motion.div>
      )}
      <div className="input-wrapper">
        <input
          type="text"
          value={value}
          onChange={e => onChange(e.target.value)}
          onKeyPress={e => e.key === 'Enter' && !isDisabled && onSend()}
          disabled={isDisabled}
          placeholder={placeholder}
          className="message-input"
        />
        <motion.button
          className="btn-send"
          onClick={onSend}
          disabled={isDisabled || !value.trim()}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Send />
        </motion.button>
      </div>
    </motion.div>
  );
}
