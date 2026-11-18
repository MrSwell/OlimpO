import { useEffect } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { ApiError } from '@/lib/apiClient'
import { toast } from '@/stores/toastStore'
import { parseBackendFieldErrors } from '@/features/clients/model/validationErrors'
import { createInventoryItem, updateInventoryItem } from '../api/inventoryApi'
import type { InventoryItem } from '../model/inventoryTypes'
import {
  inventoryItemFormSchema,
  type InventoryItemFormValues,
} from '../model/inventoryForm'

const defaultValues: InventoryItemFormValues = {
  name: '',
  category: '',
  quantity: '0',
  minStock: '5',
  unit: '',
}

const itemFormFields = ['name', 'category', 'quantity', 'minStock', 'unit'] as const

interface UseInventoryItemFormProps {
  item: InventoryItem | null
  onSaved: (saved: InventoryItem) => void
}

export const useInventoryItemForm = ({ item, onSaved }: UseInventoryItemFormProps) => {
  const queryClient = useQueryClient()
  const form = useForm<InventoryItemFormValues>({
    resolver: zodResolver(inventoryItemFormSchema),
    defaultValues,
  })

  useEffect(() => {
    form.reset(
      item
        ? {
            name: item.name,
            category: item.category ?? '',
            quantity: String(item.quantity),
            minStock: String(item.minStock),
            unit: item.unit ?? '',
          }
        : defaultValues,
    )
  }, [item, form])

  const mutation = useMutation({
    mutationFn: (values: InventoryItemFormValues) => {
      const payload = {
        name: values.name,
        category: values.category || null,
        quantity: Number(values.quantity),
        minStock: Number(values.minStock),
        unit: values.unit || null,
      }
      return item
        ? updateInventoryItem(item.id, payload)
        : createInventoryItem(payload)
    },
    onSuccess: async (saved) => {
      await queryClient.invalidateQueries({ queryKey: ['inventory'] })
      toast.success(
        item ? 'Ítem actualizado' : 'Ítem creado',
        item
          ? 'El ítem se guardó con el stock actualizado.'
          : 'El ítem ya aparece en el directorio de inventario.',
      )
      onSaved(saved)
    },
    onError: (error) => {
      const parsed = parseBackendFieldErrors(error, itemFormFields)

      for (const field of itemFormFields) {
        const message = parsed.fieldErrors[field]
        if (message) form.setError(field, { type: 'server', message })
      }

      if (parsed.hasUnmappedErrors || Object.keys(parsed.fieldErrors).length === 0) {
        const description =
          error instanceof ApiError
            ? error.message
            : 'Comprueba tu conexión e inténtalo de nuevo.'
        toast.error(item ? 'No se pudo actualizar el ítem' : 'No se pudo crear el ítem', description)
      }
    },
  })

  const submit = form.handleSubmit((values) => {
    mutation.mutate(values)
  })

  return {
    form,
    submit,
    isSubmitting: mutation.isPending,
  }
}
