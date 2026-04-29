import { motion } from 'framer-motion';
import { Crown } from 'lucide-react';

interface PrimaryAgentCardProps {
  isActive: boolean;
  onClick: () => void;
}

export function PrimaryAgentCard({ isActive, onClick }: PrimaryAgentCardProps) {
  return (
    <motion.div
      className={`primary-agent-card ${isActive ? 'active' : ''}`}
      onClick={onClick}
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98, y: 0 }}
      transition={{
        type: "spring",
        stiffness: 400,
        damping: 17
      }}
    >
      <div className="primary-agent-header">
        <div className="primary-agent-avatar">
          <Crown className="crown-icon" />
          <span className="avatar-text">Ren.</span>
        </div>
        {isActive && (
          <motion.div
            className="active-indicator"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
          />
        )}
      </div>

      <div className="primary-agent-info">
        <h3 className="primary-agent-name">任我行</h3>
        <p className="primary-agent-role">主理人</p>
      </div>

      <div className="primary-agent-description">
        全能型AI主理人，负责系统统筹和全局规划
      </div>
    </motion.div>
  );
}