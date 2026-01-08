import { type Control, Controller, type FieldValues, type Path } from 'react-hook-form'

import { Input } from '@/src/components/ui/Input'
import type { ComponentProps } from 'react'

type InputProps = ComponentProps<typeof Input>

type FormInputProps<T extends FieldValues> = Omit<InputProps, 'value' | 'onChangeText'> & {
  control: Control<T>
  name: Path<T>
}

export function FormInput<T extends FieldValues>({
  control,
  name,
  ...props
}: FormInputProps<T>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
        <Input
          value={value ?? ''}
          onChangeText={onChange}
          onBlur={onBlur}
          error={error?.message}
          {...props}
        />
      )}
    />
  )
}
