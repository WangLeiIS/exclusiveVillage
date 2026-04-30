import { motion } from 'framer-motion';

interface PrimaryAgentCardProps {
  isActive: boolean;
  onClick: () => void;
}

export function PrimaryAgentCard({ isActive, onClick }: PrimaryAgentCardProps) {
  return (
    <motion.div
      className={`sidebar-card primary-agent-card ${isActive ? 'active' : ''}`}
      onClick={onClick}
      whileHover={{ x: 4 }}
      whileTap={{ scale: 0.98 }}
      transition={{
        type: "spring",
        stiffness: 300,
        damping: 20
      }}
    >
      <div className="card-avatar">
        <span className="avatar-text">Ren.</span>
      </div>

      <span className="card-name">任我行</span>
      <span className="card-badge">主理人</span>
    </motion.div>
  );
}