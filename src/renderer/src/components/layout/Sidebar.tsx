import { motion, AnimatePresence } from 'framer-motion';
import { TeamList } from '../teams/TeamList';
import { AgentList } from '../agents/AgentList';

interface SidebarProps {
  teams: any[];
  currentTeam: string;
  onTeamSelect: (team: string) => void;
  onTeamCreate: () => void;
  onTeamDelete: (team: string) => void;
  agents: any[];
  currentAgent: string;
  onAgentSelect: (agent: string) => void;
  onAgentCreate: () => void;
}

export function Sidebar({
  teams,
  currentTeam,
  onTeamSelect,
  onTeamCreate,
  onTeamDelete,
  agents,
  currentAgent,
  onAgentSelect,
  onAgentCreate
}: SidebarProps) {
  return (
    <motion.aside
      className="sidebar"
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.1 }}
    >
      <TeamList
        teams={teams}
        currentTeam={currentTeam}
        onTeamSelect={onTeamSelect}
        onTeamCreate={onTeamCreate}
        onTeamDelete={onTeamDelete}
      />

      <AnimatePresence>
        {currentTeam && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <AgentList
              agents={agents}
              currentAgent={currentAgent}
              onAgentSelect={onAgentSelect}
              onAgentCreate={onAgentCreate}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.aside>
  );
}
