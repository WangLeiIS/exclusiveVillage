import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  icon?: LucideIcon;
  iconPosition?: 'left' | 'right';
  children: React.ReactNode;
}

export function Button({
  variant = 'primary',
  icon: Icon,
  iconPosition = 'left',
  children,
  className = '',
  ...props
}: ButtonProps) {
  const baseStyles = 'btn';
  const variantStyles = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    danger: 'btn-danger',
    ghost: 'btn-ghost'
  };

  return (
    <motion.button
      className={`${baseStyles} ${variantStyles[variant]} ${className}`.trim()}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      {...props}
    >
      {Icon && iconPosition === 'left' && <Icon className="btn-icon" />}
      <span>{children}</span>
      {Icon && iconPosition === 'right' && <Icon className="btn-icon" />}
    </motion.button>
  );
}
