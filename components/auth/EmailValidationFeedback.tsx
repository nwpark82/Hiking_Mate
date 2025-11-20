'use client';

import { CheckCircle, AlertCircle, AlertTriangle } from 'lucide-react';

interface EmailValidationFeedbackProps {
  email: string;
  message?: string;
  type?: 'error' | 'warning' | 'success';
  className?: string;
}

export function EmailValidationFeedback({
  email,
  message,
  type,
  className = ''
}: EmailValidationFeedbackProps) {
  if (!message || !email) {
    return null;
  }

  const styles = {
    error: {
      container: 'bg-red-50 border-red-200 text-red-700',
      icon: <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />,
    },
    warning: {
      container: 'bg-yellow-50 border-yellow-200 text-yellow-800',
      icon: <AlertTriangle className="w-4 h-4 text-yellow-500 flex-shrink-0" />,
    },
    success: {
      container: 'bg-green-50 border-green-200 text-green-700',
      icon: <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />,
    },
  };

  const style = type ? styles[type] : styles.error;

  return (
    <div className={`mt-2 p-2 border rounded-lg flex items-start gap-2 ${style.container} ${className}`}>
      {style.icon}
      <span className="text-xs">{message}</span>
    </div>
  );
}
