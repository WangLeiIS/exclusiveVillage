import { motion } from 'framer-motion';
import { Plus, MessageSquare, Trash2 } from 'lucide-react';
import { useState } from 'react';

interface Session {
  id: string;
  directory_path: string;
  title: string;
  created_at: number;
  updated_at: number;
  message_count: number;
}

interface ConversationPanelProps {
  sessions: Session[];
  currentSession: string | null;
  onSessionSelect: (sessionId: string) => void;
  onSessionCreate: (directoryPath: string) => void;
  onSessionDelete: (sessionId: string) => void;
}

export function ConversationPanel({
  sessions,
  currentSession,
  onSessionSelect,
  onSessionCreate,
  onSessionDelete
}: ConversationPanelProps) {
  const [showCreateModal, setShowCreateModal] = useState(false);

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
      return `${diffDays} 天前`;
    } else {
      return date.toLocaleDateString('zh-CN');
    }
  };

  const handleCreateSession = () => {
    // 简化版本：直接使用当前目录
    const currentPath = process.cwd() || '.';
    onSessionCreate(currentPath);
    setShowCreateModal(false);
  };

  return (
    <div className="conversation-panel">
      {/* 头部 */}
      <div className="conversation-header">
        <h3>会话历史</h3>
        <motion.button
          className="btn-create-session"
          onClick={handleCreateSession}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          title="新建会话"
        >
          <Plus className="btn-icon" />
          <span>新建会话</span>
        </motion.button>
      </div>

      {/* 会话列表 */}
      <div className="sessions-list">
        {sessions.length === 0 ? (
          <div className="empty-sessions">
            <MessageSquare className="empty-icon" />
            <p>暂无会话历史</p>
            <span className="empty-hint">点击上方按钮创建新会话</span>
          </div>
        ) : (
          sessions.map((session) => (
            <motion.div
              key={session.id}
              className={`session-item ${currentSession === session.id ? 'active' : ''}`}
              onClick={() => onSessionSelect(session.id)}
              whileHover={{ x: 2 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              <div className="session-main">
                <div className="session-header-row">
                  <MessageSquare className="session-icon" />
                  <h4 className="session-title">{session.title}</h4>
                  <span className="session-count">{session.message_count}</span>
                </div>
                <div className="session-meta">
                  <span className="session-time">{formatDate(session.updated_at)}</span>
                  <span className="session-path">{session.directory_path}</span>
                </div>
              </div>

              {currentSession !== session.id && (
                <motion.button
                  className="btn-delete-session"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm('确定要删除这个会话吗？')) {
                      onSessionDelete(session.id);
                    }
                  }}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  title="删除会话"
                >
                  <Trash2 className="delete-icon" />
                </motion.button>
              )}
            </motion.div>
          ))
        )}
      </div>

      {/* 创建会话模态框 (简化版本) */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>创建新会话</h2>
              <button onClick={() => setShowCreateModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <p>将在当前目录创建新会话</p>
              <div className="modal-actions">
                <button
                  className="btn-cancel"
                  onClick={() => setShowCreateModal(false)}
                >
                  取消
                </button>
                <button
                  className="btn-confirm"
                  onClick={handleCreateSession}
                >
                  创建
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}