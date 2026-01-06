import { render, type RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { FormProvider, useForm, type UseFormReturn } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createActivityRequestSchema } from '@corpcal/shared/schemas';
import type { CreateActivityRequest } from '@corpcal/shared/schemas';
import { ReactElement, ReactNode } from 'react';

type FormData = CreateActivityRequest & {
  categoryIds?: number[];
  relatedActivityIds?: number[];
  tagIds?: string[];
  jointOrgIds?: string[];
  commsMaterialIds?: number[];
  translationLanguageIds?: number[];
  jointEventOrgIds?: string[];
  representativeIds?: number[];
  sharedWithOrgIds?: string[];
  canEditUserIds?: number[];
  canViewUserIds?: number[];
};

interface AllTheProvidersProps {
  children: ReactNode;
  form?: UseFormReturn<FormData>;
}

// This is a test utility file, so mixed exports are acceptable
// eslint-disable-next-line react-refresh/only-export-components
function AllTheProviders({ children, form }: AllTheProvidersProps) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  });

  const defaultForm = useForm<FormData>({
    resolver: zodResolver(createActivityRequestSchema) as any,
    mode: 'onChange',
    defaultValues: {
      isAllDay: false,
      isIssue: false,
      notForLookAhead: false,
      ownerId: 8,
      categoryIds: [],
      relatedActivityIds: [],
      tagIds: [],
      jointOrgIds: [],
      commsMaterialIds: [],
      translationLanguageIds: [],
      jointEventOrgIds: [],
      representativeIds: [],
      sharedWithOrgIds: [],
      canEditUserIds: [],
      canViewUserIds: [],
    } as Partial<FormData>,
  });

  const formToUse = form || defaultForm;

  return (
    <QueryClientProvider client={queryClient}>
      <FormProvider {...formToUse}>{children}</FormProvider>
    </QueryClientProvider>
  );
}

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  form?: UseFormReturn<FormData>;
}

export function renderWithProviders(
  ui: ReactElement,
  { form, ...renderOptions }: CustomRenderOptions = {}
) {
  function Wrapper({ children }: { children: ReactNode }) {
    return <AllTheProviders form={form}>{children}</AllTheProviders>;
  }

  return render(ui, { wrapper: Wrapper, ...renderOptions });
}

// eslint-disable-next-line react-refresh/only-export-components
export * from '@testing-library/react';
export { renderWithProviders as render };

// Helper to fill form fields
export function fillFormField(
  getByLabelText: (text: string) => HTMLElement,
  label: string,
  value: string | number | boolean
) {
  const field = getByLabelText(label);
  if (
    field instanceof HTMLInputElement ||
    field instanceof HTMLTextAreaElement
  ) {
    if (typeof value === 'boolean') {
      (field as HTMLInputElement).checked = value;
    } else {
      field.value = String(value);
    }
    field.dispatchEvent(new Event('input', { bubbles: true }));
    field.dispatchEvent(new Event('change', { bubbles: true }));
  }
}

// Helper to wait for validation
export async function waitForValidation() {
  await new Promise((resolve) => setTimeout(resolve, 100));
}

// Helper to submit form
export async function submitForm(
  getByRole: (role: string, options?: any) => HTMLElement
) {
  const submitButton = getByRole('button', { name: /submit/i });
  submitButton.click();
  await waitForValidation();
}
