import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

interface LoadingStateProps {
  size?: 'small' | 'medium' | 'large';
  text?: string;
  fullScreen?: boolean;
}

export function LoadingState({
  size = 'medium',
  text,
  fullScreen = false
}: LoadingStateProps) {
  const sizeClasses = {
    small: 'w-4 h-4',
    medium: 'w-8 h-8',
    large: 'w-12 h-12'
  };

  const textSizes = {
    small: 'text-sm',
    medium: 'text-base',
    large: 'text-lg'
  };

  const content = (
    <motion.div
      className="flex flex-col items-center justify-center gap-3"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
    >
      <motion.div
        className={sizeClasses[size]}
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
      >
        <Loader2 className="w-full h-full text-current" />
      </motion.div>
      {text && (
        <motion.p
          className={`text-text-tertiary ${textSizes[size]}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          {text}
        </motion.p>
      )}
    </motion.div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-bg-primary/80 backdrop-blur-sm z-50">
        {content}
      </div>
    );
  }

  return content;
}

// 骨架屏组件
interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
}

export function Skeleton({ className = '', variant = 'rectangular' }: SkeletonProps) {
  const baseClasses = 'animate-pulse bg-bg-tertiary';

  const variantClasses = {
    text: 'h-4 w-full rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-md'
  };

  return (
    <div className={`${baseClasses} ${variantClasses[variant]} ${className}`} />
  );
}

// 消息输入骨架屏
export function MessageInputSkeleton() {
  return (
    <div className="flex gap-3 items-center p-4 border-t border-border-color">
      <Skeleton className="flex-1 h-10" variant="rectangular" />
      <Skeleton className="w-12 h-10" variant="rectangular" />
    </div>
  );
}

// 消息列表骨架屏
export function MessageListSkeleton() {
  return (
    <div className="flex flex-col gap-3 p-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex gap-3">
          <Skeleton className="w-8 h-8 rounded-full flex-shrink-0" variant="circular" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-24" variant="text" />
            <Skeleton className="h-16 w-full" variant="rectangular" />
          </div>
        </div>
      ))}
    </div>
  );
}