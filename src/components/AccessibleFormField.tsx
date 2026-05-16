import { ReactNode } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface AccessibleFormFieldProps {
  id: string;
  label: string;
  required?: boolean;
  error?: string;
  type?: string;
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  description?: string;
  children?: ReactNode;
}

export const AccessibleFormField = ({
  id,
  label,
  required = false,
  error,
  type = "text",
  placeholder,
  value,
  onChange,
  description,
  children,
}: AccessibleFormFieldProps) => {
  const labelText = required ? `${label} (required)` : label;

  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="font-medium text-sm">
        {labelText}
        {required && <span aria-label="required">*</span>}
      </Label>
      {children ? (
        children
      ) : (
        <Input
          id={id}
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : description ? `${id}-description` : undefined}
          className={error ? "border-destructive" : ""}
        />
      )}
      {description && (
        <p id={`${id}-description`} className="text-xs text-muted-foreground">
          {description}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="text-xs text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  );
};
