import { motion } from 'framer-motion';
import { Bot, ChevronRight } from 'lucide-react';
import type { Agent } from '../../types';

interface AgentCardProps {
  agent: Agent;
  isActive: boolean;
  onClick: () => void;
  index: number;
}

export function AgentCard({ agent, isActive, onClick, index }: AgentCardProps) {
  return (
    <motion.div
      key={agent.name}
      className={`agent-card ${isActive ? 'active' : ''}`}
      onClick={onClick}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      whileHover={{ scale: 1.02, x: 5 }}
    >
      <div className="agent-avatar">
        <Bot className="avatar-icon" />
      </div>
      <div className="agent-info">
        <div className="agent-name">{agent.name}</div>
        <div className="agent-role">{agent.role}</div>
      </div>
      {isActive && (
        <motion.div
          className="active-indicator"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        >
          <ChevronRight />
        </motion.div>
      )}
    </motion.div>
  );
}
