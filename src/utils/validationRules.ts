export type ValidationRuleType =
  | 'required'
  | 'format'
  | 'range'
  | 'custom'
  | 'minLength'
  | 'maxLength';

export type FormatType = 'email' | 'url' | 'date' | 'phone' | 'number';

export interface ValidationRule {
  type: ValidationRuleType;
  errorMessage?: string;
}

export interface RequiredRule extends ValidationRule {
  type: 'required';
}

export interface FormatRule extends ValidationRule {
  type: 'format';
  format: FormatType;
  pattern?: string;
}

export interface RangeRule extends ValidationRule {
  type: 'range';
  min?: number;
  max?: number;
}

export interface MinLengthRule extends ValidationRule {
  type: 'minLength';
  value: number;
}

export interface MaxLengthRule extends ValidationRule {
  type: 'maxLength';
  value: number;
}

export interface CustomRule extends ValidationRule {
  type: 'custom';
  validator: (value: any) => boolean;
  errorMessage: string;
}

export type AnyValidationRule =
  | RequiredRule
  | FormatRule
  | RangeRule
  | MinLengthRule
  | MaxLengthRule
  | CustomRule;

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

const VALIDATION_PATTERNS = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  url: /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/,
  date: /^\d{4}-\d{2}-\d{2}$/,
  phone: /^[\d\s\-\+\(\)]+$/,
  number: /^-?\d+(\.\d+)?$/,
  doi: /^10\.\d{4,9}\/[-._;()/:A-Z0-9]+$/i,
};

const DEFAULT_ERROR_MESSAGES = {
  required: 'This field is required',
  email: 'Please enter a valid email address (e.g., user@example.com)',
  url: 'Please enter a valid URL (e.g., https://example.com)',
  date: 'Please enter a valid date in YYYY-MM-DD format',
  phone: 'Please enter a valid phone number',
  number: 'Please enter a valid number',
  doi: 'Please enter a valid DOI (e.g., 10.1145/1234567)',
  minLength: (min: number) => `Must be at least ${min} characters`,
  maxLength: (max: number) => `Must be no more than ${max} characters`,
  range: (min?: number, max?: number) => {
    if (min !== undefined && max !== undefined) {
      return `Value must be between ${min} and ${max}`;
    } else if (min !== undefined) {
      return `Value must be at least ${min}`;
    } else if (max !== undefined) {
      return `Value must be no more than ${max}`;
    }
    return 'Invalid value';
  },
};

function isEmpty(value: any): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string') return value.trim() === '';
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object') return Object.keys(value).length === 0;
  return false;
}

function validateRequired(value: any): ValidationResult {
  const isValid = !isEmpty(value);
  return {
    isValid,
    error: isValid ? undefined : DEFAULT_ERROR_MESSAGES.required,
  };
}

function validateFormat(value: any, rule: FormatRule): ValidationResult {
  if (isEmpty(value)) {
    return { isValid: true };
  }

  const stringValue = String(value).trim();
  const pattern = rule.pattern
    ? new RegExp(rule.pattern)
    : VALIDATION_PATTERNS[rule.format];

  if (!pattern) {
    return {
      isValid: false,
      error: rule.errorMessage || `Unknown format type: ${rule.format}`,
    };
  }

  const isValid = pattern.test(stringValue);
  return {
    isValid,
    error: isValid
      ? undefined
      : rule.errorMessage ||
        DEFAULT_ERROR_MESSAGES[rule.format] ||
        `Invalid ${rule.format} format`,
  };
}

function validateRange(value: any, rule: RangeRule): ValidationResult {
  if (isEmpty(value)) {
    return { isValid: true };
  }

  const numValue = Number(value);

  if (isNaN(numValue)) {
    return {
      isValid: false,
      error: 'Value must be a number',
    };
  }

  const { min, max } = rule;
  let isValid = true;

  if (min !== undefined && numValue < min) {
    isValid = false;
  }
  if (max !== undefined && numValue > max) {
    isValid = false;
  }

  return {
    isValid,
    error: isValid
      ? undefined
      : rule.errorMessage || DEFAULT_ERROR_MESSAGES.range(min, max),
  };
}

function validateMinLength(value: any, rule: MinLengthRule): ValidationResult {
  if (isEmpty(value)) {
    return { isValid: true };
  }

  const stringValue = String(value);
  const isValid = stringValue.length >= rule.value;

  return {
    isValid,
    error: isValid
      ? undefined
      : rule.errorMessage || DEFAULT_ERROR_MESSAGES.minLength(rule.value),
  };
}

function validateMaxLength(value: any, rule: MaxLengthRule): ValidationResult {
  if (isEmpty(value)) {
    return { isValid: true };
  }

  const stringValue = String(value);
  const isValid = stringValue.length <= rule.value;

  return {
    isValid,
    error: isValid
      ? undefined
      : rule.errorMessage || DEFAULT_ERROR_MESSAGES.maxLength(rule.value),
  };
}

function validateCustom(value: any, rule: CustomRule): ValidationResult {
  try {
    const isValid = rule.validator(value);
    return {
      isValid,
      error: isValid ? undefined : rule.errorMessage,
    };
  } catch (error) {
    return {
      isValid: false,
      error: rule.errorMessage || 'Validation error',
    };
  }
}

export function executeValidationRule(
  value: any,
  rule: AnyValidationRule
): ValidationResult {
  switch (rule.type) {
    case 'required':
      return validateRequired(value);
    case 'format':
      return validateFormat(value, rule as FormatRule);
    case 'range':
      return validateRange(value, rule as RangeRule);
    case 'minLength':
      return validateMinLength(value, rule as MinLengthRule);
    case 'maxLength':
      return validateMaxLength(value, rule as MaxLengthRule);
    case 'custom':
      return validateCustom(value, rule as CustomRule);
    default:
      return {
        isValid: true,
        error: undefined,
      };
  }
}

export function validateValue(
  value: any,
  rules: AnyValidationRule[]
): ValidationResult {
  if (!rules || rules.length === 0) {
    return { isValid: true };
  }

  for (const rule of rules) {
    const result = executeValidationRule(value, rule);
    if (!result.isValid) {
      return result;
    }
  }

  return { isValid: true };
}

export function parseValidationRules(questionConfig: any): AnyValidationRule[] {
  const rules: AnyValidationRule[] = [];
  if (questionConfig.required === true) {
    rules.push({
      type: 'required',
    });
  }

  if (questionConfig.validation) {
    const validation = questionConfig.validation;

    if (validation.format) {
      rules.push({
        type: 'format',
        format: validation.format,
        pattern: validation.pattern,
        errorMessage: validation.formatError,
      });
    }

    if (validation.min !== undefined || validation.max !== undefined) {
      rules.push({
        type: 'range',
        min: validation.min,
        max: validation.max,
        errorMessage: validation.rangeError,
      });
    }

    if (validation.minLength !== undefined) {
      rules.push({
        type: 'minLength',
        value: validation.minLength,
        errorMessage: validation.minLengthError,
      });
    }

    if (validation.maxLength !== undefined) {
      rules.push({
        type: 'maxLength',
        value: validation.maxLength,
        errorMessage: validation.maxLengthError,
      });
    }

    if (validation.custom) {
      console.warn(
        'Custom validation rules from JSON are not supported in client-side validation'
      );
    }
  }

  return rules;
}

export interface FieldValidationState {
  isValid: boolean;
  error?: string;
  touched: boolean;
}

export interface ValidationState {
  fields: Record<string, FieldValidationState>;
}

export function createValidationState(): ValidationState {
  return {
    fields: {},
  };
}

export function updateFieldValidation(
  state: ValidationState,
  fieldId: string,
  result: ValidationResult,
  touched: boolean = true
): ValidationState {
  return {
    ...state,
    fields: {
      ...state.fields,
      [fieldId]: {
        isValid: result.isValid,
        error: result.error,
        touched,
      },
    },
  };
}

export function getFieldValidation(
  state: ValidationState,
  fieldId: string
): FieldValidationState | undefined {
  return state.fields[fieldId];
}
