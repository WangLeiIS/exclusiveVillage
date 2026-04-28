import { AnimatePresence } from 'framer-motion';
import { Sparkles, Plus } from 'lucide-react';
import { EmptyState } from '../ui/EmptyState';
import { AgentCard } from './AgentCard';
import { useAppTranslation } from '../../i18n/useTranslation';
import type { Agent } from '../../types';

interface AgentListProps {
  agents: Agent[];
  currentAgent: string;
  onAgentSelect: (agent: string) => void;
  onAgentCreate: () => void;
}

export function AgentList({
  agents,
  currentAgent,
  onAgentSelect,
  onAgentCreate
}: AgentListProps) {
  const { t } = useAppTranslation();

  return (
    <div className="sidebar-section">
      <div className="sidebar-header">
        <div className="section-title">
          <Sparkles className="section-icon" />
          <h3>{t('sidebar.agents')}</h3>
        </div>
        <button
          className="btn-add"
          onClick={onAgentCreate}
        >
          <Plus />
        </button>
      </div>

      <div className="agent-list">
        <AnimatePresence>
          {agents.map((agent, index) => (
            <AgentCard
              key={agent.name}
              agent={agent}
              isActive={currentAgent === agent.name}
              onClick={() => onAgentSelect(agent.name)}
              index={index}
            />
          ))}
        </AnimatePresence>

        {agents.length === 0 && (
          <EmptyState
            icon={Sparkles}
            title={t('agent.noAgents')}
            hint={t('agent.noAgentsHint')}
          />
        )}
      </div>
    </div>
  );
}
