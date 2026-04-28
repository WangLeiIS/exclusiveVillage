import { CheckCircle2, AlertCircle } from 'lucide-react';

interface StatusIndicatorProps {
  status: 'success' | 'error';
  successText: string;
  errorText: string;
}

export function StatusIndicator({ status, successText, errorText }: StatusIndicatorProps) {
  const isSuccess = status === 'success';

  return (
    <div className={`status-indicator ${status}`}>
      {isSuccess ? (
        <>
          <CheckCircle2 className="status-icon" />
          <span>{successText}</span>
        </>
      ) : (
        <>
          <AlertCircle className="status-icon" />
          <span>{errorText}</span>
        </>
      )}
    </div>
  );
}
