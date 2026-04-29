import React, { Component, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: (error: Error, retry: () => void) => ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error Boundary caught an error:', error, errorInfo);
    // 这里可以添加错误上报逻辑
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null
    });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      // 如果提供了自定义的fallback，使用它
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.handleRetry);
      }

      // 默认的错误UI
      return (
        <motion.div
          className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="w-16 h-16 mb-4 rounded-full bg-bg-tertiary flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-accent-error" />
          </div>

          <h2 className="text-xl font-semibold text-text-primary mb-2">
            出现了一些问题
          </h2>

          <p className="text-text-secondary mb-6 max-w-md">
            {this.state.error.message || '应用程序遇到了意外错误'}
          </p>

          <motion.button
            className="flex items-center gap-2 px-6 py-3 bg-text-primary text-white rounded-lg hover:bg-accent-secondary transition-colors"
            onClick={this.handleRetry}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <RefreshCw className="w-4 h-4" />
            <span>重新加载</span>
          </motion.button>

          {process.env.NODE_ENV === 'development' && (
            <details className="mt-6 text-left text-sm">
              <summary className="cursor-pointer text-text-tertiary hover:text-text-secondary">
                错误详情
              </summary>
              <pre className="mt-2 p-4 bg-bg-tertiary rounded text-xs overflow-auto max-h-48">
                {this.state.error.stack}
              </pre>
            </details>
          )}
        </motion.div>
      );
    }

    return this.props.children;
  }
}

// 用于显示错误状态的Hook
interface UseErrorStateReturn {
  error: Error | null;
  setError: (error: Error | null) => void;
  clearError: () => void;
}

export function useErrorState(): UseErrorStateReturn {
  const [error, setError] = React.useState<Error | null>(null);

  const clearError = () => setError(null);

  return {
    error,
    setError,
    clearError
  };
}

// 函数式组件的错误显示
export function ErrorDisplay({
  error,
  retry,
  title = '出现了一些问题',
  showDetails = false
}: {
  error: Error;
  retry?: () => void;
  title?: string;
  showDetails?: boolean;
}) {
  return (
    <motion.div
      className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="w-16 h-16 mb-4 rounded-full bg-bg-tertiary flex items-center justify-center">
        <AlertTriangle className="w-8 h-8 text-accent-error" />
      </div>

      <h2 className="text-xl font-semibold text-text-primary mb-2">
        {title}
      </h2>

      <p className="text-text-secondary mb-6 max-w-md">
        {error.message || '应用程序遇到了意外错误'}
      </p>

      {retry && (
        <motion.button
          className="flex items-center gap-2 px-6 py-3 bg-text-primary text-white rounded-lg hover:bg-accent-secondary transition-colors"
          onClick={retry}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <RefreshCw className="w-4 h-4" />
          <span>重新加载</span>
        </motion.button>
      )}

      {showDetails && error.stack && (
        <details className="mt-6 text-left text-sm w-full max-w-2xl">
          <summary className="cursor-pointer text-text-tertiary hover:text-text-secondary">
            错误详情
          </summary>
          <pre className="mt-2 p-4 bg-bg-tertiary rounded text-xs overflow-auto max-h-48">
            {error.stack}
          </pre>
        </details>
      )}
    </motion.div>
  );
}