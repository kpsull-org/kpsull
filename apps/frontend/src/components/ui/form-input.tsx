'use client'

import * as React from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

export type ValidationType = 'email' | 'password' | 'text' | 'confirmPassword'

interface ValidationRule {
  test: (value: string, compareValue?: string) => boolean
  message: string
}

const validationRules: Record<ValidationType, ValidationRule[]> = {
  email: [
    {
      test: (value) => value.length > 0,
      message: "L'email est requis",
    },
    {
      test: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
      message: "Format d'email invalide",
    },
  ],
  password: [
    {
      test: (value) => value.length >= 8,
      message: 'Au moins 8 caractères',
    },
    {
      test: (value) => /[a-z]/.test(value),
      message: 'Au moins une minuscule',
    },
    {
      test: (value) => /[A-Z]/.test(value),
      message: 'Au moins une majuscule',
    },
    {
      test: (value) => /\d/.test(value),
      message: 'Au moins un chiffre',
    },
    {
      test: (value) => /[@$!%*?&]/.test(value),
      message: 'Au moins un caractère spécial (@$!%*?&)',
    },
  ],
  confirmPassword: [
    {
      test: (value, compareValue) => value === compareValue,
      message: 'Les mots de passe ne correspondent pas',
    },
  ],
  text: [],
}

interface FormInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string
  validationType?: ValidationType
  showValidation?: boolean
  compareValue?: string // For confirmPassword validation
}

export const FormInput = React.forwardRef<HTMLInputElement, FormInputProps>(
  (
    { label, validationType = 'text', showValidation = true, compareValue, className, ...props },
    ref
  ) => {
    const [value, setValue] = React.useState('')
    const [touched, setTouched] = React.useState(false)
    const [errors, setErrors] = React.useState<string[]>([])

    const inputType =
      validationType === 'password' || validationType === 'confirmPassword'
        ? 'password'
        : validationType === 'email'
          ? 'email'
          : 'text'

    const validate = React.useCallback(
      (inputValue: string) => {
        if (!showValidation || !touched) return []

        const rules = validationRules[validationType]
        const newErrors: string[] = []

        for (const rule of rules) {
          if (!rule.test(inputValue, compareValue)) {
            newErrors.push(rule.message)
          }
        }

        return newErrors
      },
      [validationType, showValidation, touched, compareValue]
    )

    React.useEffect(() => {
      if (touched) {
        const newErrors = validate(value)
        setErrors(newErrors)
      }
    }, [value, touched, validate])

    // Re-validate when compareValue changes (for confirm password)
    React.useEffect(() => {
      if (validationType === 'confirmPassword' && touched && compareValue !== undefined) {
        const newErrors = validate(value)
        setErrors(newErrors)
      }
    }, [compareValue, validationType, value, touched, validate])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value
      setValue(newValue)
      props.onChange?.(e)
    }

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setTouched(true)
      const newErrors = validate(value)
      setErrors(newErrors)
      props.onBlur?.(e)
    }

    const hasErrors = errors.length > 0 && touched

    return (
      <div className="space-y-2">
        <Label htmlFor={props.id} className={cn(hasErrors && 'text-destructive')}>
          {label}
        </Label>
        <Input
          ref={ref}
          type={inputType}
          className={cn(
            hasErrors && 'border-destructive focus-visible:ring-destructive',
            className
          )}
          value={value}
          onChange={handleChange}
          onBlur={handleBlur}
          aria-invalid={hasErrors}
          aria-describedby={hasErrors ? `${props.id}-error` : undefined}
          {...props}
        />
        {hasErrors && showValidation && (
          <div id={`${props.id}-error`} className="space-y-1">
            {errors.map((error, index) => (
              <p key={index} className="text-xs text-destructive">
                {error}
              </p>
            ))}
          </div>
        )}
      </div>
    )
  }
)

FormInput.displayName = 'FormInput'

// Hook to check if form is valid
export function useFormValidation() {
  const [isValid, setIsValid] = React.useState(false)

  const checkValidity = (formElement: HTMLFormElement) => {
    const isFormValid = formElement.checkValidity()
    setIsValid(isFormValid)
    return isFormValid
  }

  return { isValid, checkValidity }
}
