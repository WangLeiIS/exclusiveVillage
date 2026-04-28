import { Users } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { useAppTranslation } from '../../i18n/useTranslation';

interface TeamModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (name: string, description: string) => void;
}

export function TeamModal({ isOpen, onClose, onSubmit }: TeamModalProps) {
  const { t } = useAppTranslation();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    onSubmit(
      formData.get('name') as string,
      formData.get('description') as string
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('team.createTitle')}
      icon={Users}
    >
      <form onSubmit={handleSubmit} className="modal-form">
        <div className="form-group">
          <label>{t('team.name')}</label>
          <input
            type="text"
            name="name"
            required
            placeholder={t('team.namePlaceholder')}
            className="form-input"
          />
        </div>

        <div className="form-group">
          <label>{t('team.description')}</label>
          <input
            type="text"
            name="description"
            placeholder={t('team.descriptionPlaceholder')}
            className="form-input"
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
            {t('common.create')} {t('sidebar.teams')}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
