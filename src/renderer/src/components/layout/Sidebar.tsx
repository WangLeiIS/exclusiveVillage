import { memo } from 'react';
import { motion } from 'framer-motion';
import { Settings } from 'lucide-react';
import { useAppTranslation } from '../../i18n/useTranslation';
import { TeamList } from '../teams/TeamList';
import { PrimaryAgentCard } from '../primary/PrimaryAgentCard';

interface SidebarProps {
  teams: any[];
  currentSelection: string; // 'primary' 或 teamName
  onTeamSelect: (team: string) => void;
  onTeamCreate: () => void;
  onTeamDelete: (team: string) => void;
  onOpenSettings: () => void;
}

function SidebarComponent({
  teams,
  currentSelection,
  onTeamSelect,
  onTeamCreate,
  onTeamDelete,
  onOpenSettings
}: SidebarProps) {
  const { t } = useAppTranslation();

  return (
    <motion.aside
      className="sidebar"
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.1 }}
    >
      {/* Logo 区域 */}
      <div className="sidebar-header">
        <motion.div
          className="sidebar-logo"
          whileHover={{ scale: 1.02 }}
          transition={{ type: "spring", stiffness: 400, damping: 17 }}
        >
          <img src="./logo.png" alt="Logo" className="logo-icon" />
          <span className="logo-text">{t('app.name')}</span>
        </motion.div>
      </div>

      {/* 内容区域 */}
      <div className="sidebar-content">
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
      </div>

      {/* 底部设置按钮 */}
      <div className="sidebar-footer">
        <motion.button
          className="sidebar-settings-btn"
          onClick={onOpenSettings}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          title={t('header.settings')}
        >
          <Settings size={18} />
          <span>{t('header.settings')}</span>
        </motion.button>
      </div>
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
