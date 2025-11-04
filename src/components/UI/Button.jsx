import { Link } from "react-router-dom";

const Button = ({
  children,
  asLink = false,
  to = "/",
  onClick,
  className = "",
  size = "default",
  disabled = false,
  type = "button",
  ...props
}) => {
  // Size variants
  const sizeClasses = {
    sm: "px-3 py-1.5 text-sm",
    default: "px-4 py-2 text-base",
    lg: "px-6 py-3 text-lg",
  };

  // Base classes
  const baseClasses = `
    inline-flex items-center justify-center
    font-medium rounded-md
    transition-colors duration-200
    focus:outline-none focus:ring-2 focus:ring-offset-2
    disabled:opacity-50 disabled:cursor-not-allowed
    ${sizeClasses[size]}
  `;

  // Default styling if no className provided
  const defaultClasses = className
    ? ""
    : "bg-blue-600 hover:bg-blue-700 text-white border border-blue-600";

  const combinedClasses =
    `${baseClasses} ${defaultClasses} ${className}`.trim();

  // If it's a link button
  if (asLink) {
    return (
      <Link to={to} className={combinedClasses} {...props}>
        {children}
      </Link>
    );
  }

  // Regular button
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={combinedClasses}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;
