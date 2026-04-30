import { motion } from 'framer-motion';
import { Users, Trash2 } from 'lucide-react';
import type { Team } from '../../types';

interface TeamCardProps {
  team: Team;
  isActive: boolean;
  onClick: () => void;
  onDelete: () => void;
  index: number;
}

export function TeamCard({ team, isActive, onClick, onDelete, index }: TeamCardProps) {
  return (
    <motion.div
      key={team.name}
      className={`sidebar-card team-card ${isActive ? 'active' : ''}`}
      onClick={onClick}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      whileHover={{ x: 4 }}
      whileTap={{ scale: 0.98 }}
    >
      <div className="card-avatar">
        <Users size={16} className="avatar-icon" />
      </div>

      <span className="card-name">{team.name}</span>

      <span className="card-count">{team.agent_count ?? 0}</span>

      {isActive && (
        <motion.button
          className="card-delete-btn"
          onClick={e => {
            e.stopPropagation();
            onDelete();
          }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <Trash2 size={14} />
        </motion.button>
      )}
    </motion.div>
  );
}
