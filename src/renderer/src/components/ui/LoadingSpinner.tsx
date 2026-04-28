import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  text?: string;
}

export function LoadingSpinner({ text = '思考中...' }: LoadingSpinnerProps) {
  return (
    <motion.div
      className="loading-dots"
      initial={{ opacity: 0.5 }}
      animate={{ opacity: 1 }}
      transition={{
        duration: 0.8,
        repeat: Infinity,
        repeatType: 'reverse',
      }}
    >
      <Loader2 className="spinner" />
      <span>{text}</span>
    </motion.div>
  );
}
