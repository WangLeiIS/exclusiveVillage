import { motion } from 'framer-motion';
import { Users, Bot, Trash2 } from 'lucide-react';
import { useAppTranslation } from '../../i18n/useTranslation';
import type { Team } from '../../types';

interface TeamCardProps {
  team: Team;
  isActive: boolean;
  onClick: () => void;
  onDelete: () => void;
  index: number;
}

export function TeamCard({ team, isActive, onClick, onDelete, index }: TeamCardProps) {
  const { t } = useAppTranslation();

  return (
    <motion.div
      key={team.name}
      className={`team-card ${isActive ? 'active' : ''}`}
      onClick={onClick}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      whileHover={{ scale: 1.02, x: 5 }}
    >
      <div className="team-info">
        <div className="team-name">{team.name}</div>
        <div className="team-meta">
          <Bot className="meta-icon" />
          <span>{team.agent_count || 0} {t('team.agentCount')}</span>
        </div>
      </div>

      <motion.div
        className="team-actions"
        initial={{ opacity: 0 }}
        animate={{ opacity: isActive ? 1 : 0 }}
        transition={{ duration: 0.2 }}
      >
        {isActive && (
          <motion.button
            className="btn-delete"
            onClick={e => {
              e.stopPropagation();
              onDelete();
            }}
            whileHover={{ scale: 1.1, rotate: 10 }}
            whileTap={{ scale: 0.9 }}
          >
            <Trash2 />
          </motion.button>
        )}
      </motion.div>
    </motion.div>
  );
}
