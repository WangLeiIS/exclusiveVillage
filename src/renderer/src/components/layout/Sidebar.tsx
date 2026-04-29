import { memo } from 'react';
import { motion } from 'framer-motion';
import { TeamList } from '../teams/TeamList';
import { PrimaryAgentCard } from '../primary/PrimaryAgentCard';

interface SidebarProps {
  teams: any[];
  currentSelection: string; // 'primary' 或 teamName
  onTeamSelect: (team: string) => void;
  onTeamCreate: () => void;
  onTeamDelete: (team: string) => void;
}

function SidebarComponent({
  teams,
  currentSelection,
  onTeamSelect,
  onTeamCreate,
  onTeamDelete
}: SidebarProps) {
  return (
    <motion.aside
      className="sidebar"
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.1 }}
    >
      {/* 主理人Agent卡片 */}
      <PrimaryAgentCard
        isActive={currentSelection === 'primary'}
        onClick={() => onTeamSelect('primary')}
      />

      {/* 分隔线 */}
      <div className="sidebar-divider"></div>

      {/* 团队列表 */}
      <TeamList
        teams={teams}
        currentTeam={currentSelection === 'primary' ? '' : currentSelection}
        onTeamSelect={onTeamSelect}
        onTeamCreate={onTeamCreate}
        onTeamDelete={onTeamDelete}
      />
    </motion.aside>
  );
}

// 使用React.memo优化性能
export const Sidebar = memo(SidebarComponent, (prevProps, nextProps) => {
  return (
    prevProps.currentSelection === nextProps.currentSelection &&
    prevProps.teams === nextProps.teams
  );
});
