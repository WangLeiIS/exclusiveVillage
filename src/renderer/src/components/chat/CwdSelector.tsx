import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FolderOpen, AlertCircle, Check, Home } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { useAppTranslation } from '../../i18n/useTranslation';

interface CwdSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (cwd: string) => void;
  currentTeam?: string;
  currentAgent?: string;
}

export function CwdSelector({
  isOpen,
  onClose,
  onConfirm,
  currentTeam,
  currentAgent,
}: CwdSelectorProps) {
  const { t } = useAppTranslation();
  const [selectedPath, setSelectedPath] = useState<string>('');
  const [isValidating, setIsValidating] = useState(false);
  const [validation, setValidation] = useState<{
    valid: boolean;
    error?: string;
  } | null>(null);

  // 加载已保存的 CWD
  useEffect(() => {
    if (isOpen && currentTeam && currentAgent) {
      loadSavedCwd();
    }
  }, [isOpen, currentTeam, currentAgent]);

  const loadSavedCwd = async () => {
    if (!currentTeam || !currentAgent) return;

    try {
      const response = await window.electronAPI.getSessionCwd(currentTeam, currentAgent);
      if (response.success && response.data) {
        setSelectedPath(response.data);
        setValidation({ valid: true });
      }
    } catch (error) {
      console.error('Failed to load saved CWD:', error);
    }
  };

  const handleSelectDirectory = async () => {
    try {
      const response = await window.electronAPI.selectCwd();
      if (response.success && response.data) {
        setSelectedPath(response.data);
        // 自动验证选择的目录
        await validatePath(response.data);
      }
    } catch (error) {
      console.error('Failed to select directory:', error);
    }
  };

  const validatePath = async (path: string) => {
    if (!path) {
      setValidation({ valid: false, error: t('cwd.notSet') });
      return;
    }

    setIsValidating(true);
    try {
      const response = await window.electronAPI.validateCwd(path);
      setValidation({
        valid: response.success,
        error: response.error,
      });
    } catch (error) {
      setValidation({
        valid: false,
        error: error instanceof Error ? error.message : t('cwd.invalid'),
      });
    } finally {
      setIsValidating(false);
    }
  };

  const handleConfirm = () => {
    if (validation?.valid && selectedPath) {
      onConfirm(selectedPath);
      onClose();
      // 重置状态
      setSelectedPath('');
      setValidation(null);
    }
  };

  const handlePathChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPath = e.target.value;
    setSelectedPath(newPath);
    // 延迟验证
    const timer = setTimeout(() => validatePath(newPath), 500);
    return () => clearTimeout(timer);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t('cwd.select')} icon={FolderOpen}>
      <div className="cwd-selector">
        <div className="cwd-info">
          <p>
            {t('cwd.select')} <strong>{currentAgent}</strong> {t('cwd.select')}
          </p>
        </div>

        <div className="cwd-input-group">
          <div className="input-header">
            <label>{t('cwd.select')}</label>
            <motion.button
              className="btn-browse"
              onClick={handleSelectDirectory}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <FolderOpen size={16} />
              浏览...
            </motion.button>
          </div>

          <div className={`input-wrapper ${validation ? (validation.valid ? 'valid' : 'invalid') : ''}`}>
            <input
              type="text"
              value={selectedPath}
              onChange={handlePathChange}
              placeholder={t('cwd.select')}
              className="cwd-input"
            />
            {validation && !isValidating && (
              <div className="validation-icon">
                {validation.valid ? (
                  <Check className="icon-valid" size={20} />
                ) : (
                  <AlertCircle className="icon-invalid" size={20} />
                )}
              </div>
            )}
          </div>

          {validation && !isValidating && (
            <motion.div
              className={`validation-message ${validation.valid ? 'valid' : 'invalid'}`}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
            >
              {validation.valid ? (
                <span className="valid-text">
                  <Check size={14} />
                  {t('status.success')}
                </span>
              ) : (
                <span className="invalid-text">
                  <AlertCircle size={14} />
                  {validation.error}
                </span>
              )}
            </motion.div>
          )}
        </div>

        <div className="cwd-default-suggestions">
          <p className="suggestions-label">常用目录:</p>
          <div className="suggestion-buttons">
            <motion.button
              className="suggestion-btn"
              onClick={() => {
                const homeDir = process.env.HOME || process.env.USERPROFILE || '';
                setSelectedPath(homeDir);
                validatePath(homeDir);
              }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Home size={14} />
              用户目录
            </motion.button>
          </div>
        </div>

        <div className="modal-actions">
          <motion.button
            className="btn-secondary"
            onClick={onClose}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {t('common.cancel')}
          </motion.button>
          <motion.button
            className="btn-primary"
            onClick={handleConfirm}
            disabled={!validation?.valid || !selectedPath}
            whileHover={{ scale: validation?.valid ? 1.02 : 1 }}
            whileTap={{ scale: validation?.valid ? 0.98 : 1 }}
          >
            {t('common.confirm')}
          </motion.button>
        </div>
      </div>
    </Modal>
  );
}
