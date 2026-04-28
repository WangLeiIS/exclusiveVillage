import { Bot } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { useAppTranslation } from '../../i18n/useTranslation';

interface AgentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (params: {
    name: string;
    role: string;
    className: string;
    isVocal: boolean;
    goalDescription: string;
  }) => void;
}

export function AgentModal({ isOpen, onClose, onSubmit }: AgentModalProps) {
  const { t } = useAppTranslation();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    onSubmit({
      name: formData.get('name') as string,
      role: formData.get('role') as string,
      className: formData.get('class') as string,
      isVocal: formData.get('is_vocal') === 'true',
      goalDescription: formData.get('goal_description') as string,
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('agent.createTitle')}
      icon={Bot}
    >
      <form onSubmit={handleSubmit} className="modal-form">
        <div className="form-group">
          <label>{t('agent.name')}</label>
          <input
            type="text"
            name="name"
            required
            placeholder={t('agent.namePlaceholder')}
            className="form-input"
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>{t('agent.role')}</label>
            <input
              type="text"
              name="role"
              required
              placeholder={t('agent.rolePlaceholder')}
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label>{t('agent.class')}</label>
            <input
              type="text"
              name="class"
              required
              placeholder={t('agent.classPlaceholder')}
              className="form-input"
            />
          </div>
        </div>

        <div className="form-group checkbox-group">
          <label className="checkbox-label">
            <input type="checkbox" name="is_vocal" value="true" />
            <span>{t('agent.isVocal')}</span>
          </label>
        </div>

        <div className="form-group">
          <label>{t('agent.goalDescription')}</label>
          <textarea
            name="goal_description"
            placeholder={t('agent.goalDescriptionPlaceholder')}
            className="form-textarea"
            rows={4}
          />
        </div>

        <div className="form-actions">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
          >
            {t('common.cancel')}
          </Button>
          <Button type="submit" variant="primary">
            {t('common.create')} {t('sidebar.agents')}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
