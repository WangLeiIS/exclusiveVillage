import { SettingsPage } from '../pages/SettingsPage';
import { useAppConfig } from '../hooks/useAppConfig';

interface SettingsContainerProps {
  onBack: () => void;
}

/**
 * 设置页面容器组件
 * 负责管理 AI 配置的加载和保存
 */
export function SettingsContainer({ onBack }: SettingsContainerProps) {
  const { aiConfig, reloadConfig } = useAppConfig();

  const handleSave = () => {
    // 重新加载配置
    reloadConfig();
    onBack();
  };

  return (
    <div className="app">
      <SettingsPage config={aiConfig} onSave={handleSave} onBack={onBack} />
    </div>
  );
}
