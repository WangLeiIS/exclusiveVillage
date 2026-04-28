import { AnimatePresence, motion } from 'framer-motion';
import { Users, Plus } from 'lucide-react';
import { EmptyState } from '../ui/EmptyState';
import { TeamCard } from './TeamCard';
import { useAppTranslation } from '../../i18n/useTranslation';
import type { Team } from '../../types';

interface TeamListProps {
  teams: Team[];
  currentTeam: string;
  onTeamSelect: (team: string) => void;
  onTeamCreate: () => void;
  onTeamDelete: (team: string) => void;
}

export function TeamList({
  teams,
  currentTeam,
  onTeamSelect,
  onTeamCreate,
  onTeamDelete
}: TeamListProps) {
  const { t } = useAppTranslation();

  return (
    <div className="sidebar-section">
      <div className="sidebar-header">
        <div className="section-title">
          <Users className="section-icon" />
          <h3>{t('sidebar.teams')}</h3>
        </div>
        <motion.button
          className="btn-add"
          onClick={onTeamCreate}
          whileHover={{ scale: 1.1, rotate: 90 }}
          whileTap={{ scale: 0.9 }}
        >
          <Plus />
        </motion.button>
      </div>

      <div className="team-list">
        <AnimatePresence>
          {teams.map((team, index) => (
            <TeamCard
              key={team.name}
              team={team}
              isActive={currentTeam === team.name}
              onClick={() => onTeamSelect(team.name)}
              onDelete={() => onTeamDelete(team.name)}
              index={index}
            />
          ))}
        </AnimatePresence>

        {teams.length === 0 && (
          <EmptyState
            icon={Users}
            title={t('team.noTeams')}
            hint={t('team.noTeamsHint')}
          />
        )}
      </div>
    </div>
  );
}
