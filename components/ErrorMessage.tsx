
import React from 'react';

interface ErrorMessageProps {
  message: string;
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({ message }) => (
  <div className="mt-6 p-4 bg-red-900/50 border border-red-700 text-red-200 rounded-lg shadow-lg w-full max-w-4xl" role="alert">
    <strong className="font-bold">Error: </strong>
    <span className="block sm:inline">{message}</span>
  </div>
);

export default ErrorMessage;
