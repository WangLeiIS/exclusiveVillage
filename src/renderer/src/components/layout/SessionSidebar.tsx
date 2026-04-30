import { memo, useState } from 'react';
import { motion } from 'framer-motion';
import { Folder, Plus, Trash2, Clock } from 'lucide-react';
import type { Session } from '../../types';

interface SessionSidebarProps {
  sessions: Session[];
  currentSession: string | null;
  currentAgentName: string;
  onSessionSelect: (sessionId: string) => void;
  onSessionCreate: (directoryPath: string) => Promise<void>;
  onSessionDelete: (sessionId: string) => Promise<void>;
}

function SessionSidebarComponent({
  sessions,
  currentSession,
  currentAgentName,
  onSessionSelect,
  onSessionCreate,
  onSessionDelete
}: SessionSidebarProps) {
  const [isCreating, setIsCreating] = useState(false);

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return '今天';
    } else if (diffDays === 1) {
      return '昨天';
    } else if (diffDays < 7) {
      return `${diffDays}天前`;
    } else {
      return date.toLocaleDateString('zh-CN');
    }
  };

  const formatDirectoryPath = (path: string) => {
    // 如果路径太长，截断显示
    const maxLength = 40;
    if (path.length <= maxLength) {
      return path;
    }
    return '...' + path.slice(-(maxLength - 3));
  };

  const handleCreateSession = async () => {
    setIsCreating(true);
    try {
      // 使用IPC调用选择目录
      const result = await window.electronAPI.selectCwd();
      if (result.success && result.data) {
        await onSessionCreate(result.data);
      }
    } catch (error) {
      console.error('Failed to create session:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteSession = async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();

    const session = sessions.find(s => s.id === sessionId);
    if (!session) return;

    const confirmMessage = `确定要删除会话"${session.title}"吗？\n\n目录: ${session.directory_path}\n\n此操作将删除该会话的所有消息历史，无法恢复。`;

    if (window.confirm(confirmMessage)) {
      try {
        await onSessionDelete(sessionId);
      } catch (error) {
        console.error('Failed to delete session:', error);
        alert('删除会话失败，请重试');
      }
    }
  };

  return (
    <motion.aside
      className="session-sidebar"
      initial={{ x: 20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      {/* 会话列表 */}
      <div className="sessions-list">
        {sessions.length === 0 ? (
          <div className="empty-sessions">
            <Folder className="empty-icon" />
            <p>暂无会话</p>
            <span className="empty-hint">点击上方按钮选择工作目录创建会话</span>
          </div>
        ) : (
          sessions.map((session) => (
            <motion.div
              key={session.id}
              className={`session-card ${currentSession === session.id ? 'active' : ''}`}
              onClick={() => onSessionSelect(session.id)}
              whileHover={{ x: currentSession === session.id ? 0 : 2 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              {/* 主内容区 */}
              <div className="session-card-main">
                {/* 头部：图标、标题、消息数 */}
                <div className="session-card-header">
                  <div className="session-card-title-row">
                    <Folder className="session-card-icon" />
                    <h4 className="session-card-title">{session.title}</h4>
                    <span className="session-card-count">
                      {session.message_count}
                    </span>
                  </div>
                </div>

                {/* 元信息：时间、路径 */}
                <div className="session-card-meta">
                  <div className="session-card-time">
                    <Clock className="time-icon" size={12} />
                    <span>{formatDate(session.updated_at)}</span>
                  </div>
                  <div className="session-card-path" title={session.directory_path}>
                    {formatDirectoryPath(session.directory_path)}
                  </div>
                </div>
              </div>

              {/* 删除按钮（仅在非当前会话时显示） */}
              {currentSession !== session.id && (
                <motion.button
                  className="btn-delete-session"
                  onClick={(e) => handleDeleteSession(session.id, e)}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  title="删除此会话"
                >
                  <Trash2 className="delete-icon" size={16} />
                </motion.button>
              )}
            </motion.div>
          ))
        )}
      </div>

      {/* 底部统计信息 */}
      {sessions.length > 0 && (
        <div className="session-sidebar-footer">
          <motion.button
            className="btn-create-session"
            onClick={handleCreateSession}
            disabled={isCreating}
            whileHover={{ scale: isCreating ? 1 : 1.05 }}
            whileTap={{ scale: isCreating ? 1 : 0.95 }}
            title="选择工作目录创建新会话"
          >
            <Plus className="btn-icon" />
            <span>{isCreating ? '创建中...' : '新建'}</span>
          </motion.button>
          <span>共 {sessions.length} 个会话</span>
        </div>
      )}
    </motion.aside>
  );
}

// 使用React.memo优化性能
export const SessionSidebar = memo(SessionSidebarComponent, (prevProps, nextProps) => {
  return (
    prevProps.currentSession === nextProps.currentSession &&
    prevProps.currentAgentName === nextProps.currentAgentName &&
    prevProps.sessions === nextProps.sessions
  );
});
