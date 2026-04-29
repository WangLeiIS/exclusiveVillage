import { useState } from 'react';
import { ChatContainer } from './ChatContainer';
import { SettingsContainer } from './SettingsContainer';

type Page = 'chat' | 'settings';

/**
 * 应用主容器组件
 * 负责页面路由和顶层状态管理
 */
export function AppContainer() {
  const [currentPage, setCurrentPage] = useState<Page>('chat');

  const handleOpenSettings = () => setCurrentPage('settings');

  if (currentPage === 'settings') {
    return <SettingsContainer onBack={() => setCurrentPage('chat')} />;
  }

  return <ChatContainer onOpenSettings={handleOpenSettings} />;
}
