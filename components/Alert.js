import { CheckCircle, XCircle, Info } from 'lucide-react'; // Using lucide-react for icons

function Alert({ message, type, onClose }) {
  let bgColor, borderColor, textColor, IconComponent;

  switch (type) {
    case 'success':
      bgColor = 'bg-green-100 dark:bg-green-900';
      borderColor = 'border-green-400 dark:border-green-600';
      textColor = 'text-green-700 dark:text-green-300';
      IconComponent = CheckCircle;
      break;
    case 'error':
      bgColor = 'bg-red-100 dark:bg-red-900';
      borderColor = 'border-red-400 dark:border-red-600';
      textColor = 'text-red-700 dark:text-red-300';
      IconComponent = XCircle;
      break;
    default: // 'info' or other types
      bgColor = 'bg-blue-100 dark:bg-blue-900';
      borderColor = 'border-blue-400 dark:border-blue-600';
      textColor = 'text-blue-700 dark:text-blue-300';
      IconComponent = Info;
      break;
  }

  if (!message) return null;

  return (
    <div className={`${bgColor} ${borderColor} ${textColor} px-4 py-3 rounded-lg border mb-4 relative shadow`} role="alert">
      <div className="flex items-center">
        <IconComponent className="w-5 h-5 mr-2 flex-shrink-0" />
        <span className="font-medium flex-grow">{message}</span>
        {onClose && (
          <button onClick={onClose} className="ml-auto -mx-1.5 -my-1.5 p-1.5 rounded-md hover:bg-opacity-20 hover:bg-current focus:outline-none">
            <XCircle className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
}

export default Alert;