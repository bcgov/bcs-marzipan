import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { useForm, type Resolver } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { useEffect, useRef, useState } from 'react';

import type { CreateUserBody } from '@corpcal/shared/api/types';
import { createUser, fetchRoles, fetchTeams } from '@/api/usersApi';
import { Button } from '@/components/ui/button';
import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxItem,
  ComboboxList,
  ComboboxValue,
  useComboboxAnchor,
} from '@/components/ui/combobox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { lookupQueryKeys } from '@/lib/lookupQueryKeys';
import type { OptionItem } from '@/schemas/types';

const createUserFormSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, 'Email is required')
    .email('Invalid email format'),
  roleId: z.string().min(1, 'Role is required'),
  displayName: z.string().trim().max(255).default(''),
  teamIds: z.array(z.number().int()).default([]),
});

type CreateUserFormData = z.infer<typeof createUserFormSchema>;

const defaultValues: CreateUserFormData = {
  email: '',
  roleId: '',
  displayName: '',
  teamIds: [],
};

interface UserCreateModalProps {
  open: boolean;
  onClose: () => void;
  onSaved?: () => void;
}

/**
 * Modal for the "Add user" flow. Creates a local user (email + role required)
 * so they can sign in with Azure AD; optional display name and initial teams.
 */
export function UserCreateModal({
  open,
  onClose,
  onSaved,
}: UserCreateModalProps) {
  const teamsAnchorRef = useComboboxAnchor();
  const dialogContentRef = useRef<HTMLDivElement>(null);
  const [isTeamsComboboxOpen, setIsTeamsComboboxOpen] = useState(false);
  const queryClient = useQueryClient();

  const form = useForm<CreateUserFormData>({
    defaultValues,

    resolver: zodResolver(
      createUserFormSchema as any
    ) as Resolver<CreateUserFormData>,
  });

  const { data: roles = [] } = useQuery({
    queryKey: ['roles'],
    queryFn: async () => {
      const res = await fetchRoles();
      return res;
    },
    enabled: open,
  });

  const { data: teams = [] } = useQuery({
    queryKey: lookupQueryKeys.teams(),
    queryFn: fetchTeams,
    enabled: open,
  });

  const createMutation = useMutation({
    mutationFn: (body: CreateUserBody) => createUser(body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('User created');
      form.reset(defaultValues);
      onSaved?.();
      onClose();
    },
    onError: (err: Error & { response?: { status?: number } }) => {
      const status = err.response?.status;
      const message =
        status === 409
          ? 'A user with this email already exists.'
          : err.message || 'Create failed';
      toast.error(message);
    },
  });

  useEffect(() => {
    if (!open) {
      form.reset(defaultValues);
    }
  }, [open, form]);

  const teamOptions = teams.map((t) => ({
    value: String(t.id),
    label: t.displayName ?? t.name ?? `Team ${t.id}`,
  }));

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      form.reset(defaultValues);
      onClose();
    }
  };

  const onSubmit = (data: CreateUserFormData) => {
    const parsedRoleId = parseInt(data.roleId, 10);
    if (Number.isNaN(parsedRoleId)) {
      form.setError('roleId', { message: 'Role is required' });
      return;
    }
    const body: CreateUserBody = {
      email: data.email.trim(),
      roleId: parsedRoleId,
      ...(data.displayName?.trim() && {
        displayName: data.displayName.trim(),
      }),
      ...(data.teamIds &&
        data.teamIds.length > 0 && {
          teams: data.teamIds.map((teamId) => ({
            teamId,
            role: 'member' as const,
          })),
        }),
    };
    createMutation.mutate(body);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        ref={dialogContentRef}
        onEscapeKeyDown={(e) => {
          if (isTeamsComboboxOpen) e.preventDefault();
        }}
      >
        <DialogHeader>
          <DialogTitle>Add user</DialogTitle>
          <DialogDescription>
            Create a new user. Users can sign in with their email and Microsoft
            account.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={(e) => void form.handleSubmit(onSubmit)(e)}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel showDirtyIndicator={false}>
                    Email{' '}
                    <span
                      className="text-required-field-indicator font-semibold"
                      aria-hidden
                    >
                      *
                    </span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="example@gov.bc.ca"
                      autoComplete="email"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="displayName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel showDirtyIndicator={false}>Display name</FormLabel>
                  <FormControl>
                    <Input type="text" maxLength={255} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="roleId"
              render={({ field }) => {
                const selectedRole = roles.find(
                  (r) => String(r.id) === field.value
                );
                const roleDescription = selectedRole?.description?.trim();
                return (
                  <FormItem>
                    <FormLabel showDirtyIndicator={false}>
                      Role{' '}
                      <span
                        className="text-required-field-indicator font-semibold"
                        aria-hidden
                      >
                        *
                      </span>
                    </FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl data-field={field.name}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {roles.map((r) => (
                          <SelectItem key={r.id} value={String(r.id)}>
                            {r.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {roleDescription && (
                      <div className="bg-muted/50 text-muted-foreground rounded-md border px-3 py-2 text-sm">
                        {roleDescription}
                      </div>
                    )}
                    <FormMessage />
                  </FormItem>
                );
              }}
            />
            <FormField
              control={form.control}
              name="teamIds"
              render={({ field }) => {
                const currentValues = Array.isArray(field.value)
                  ? field.value.map((v) => String(v))
                  : [];
                const selectedOptions = teamOptions.filter((o) =>
                  currentValues.includes(o.value)
                );
                return (
                  <FormItem>
                    <FormLabel showDirtyIndicator={false}>Teams</FormLabel>
                    <FormControl data-field={field.name}>
                      <Combobox
                        items={teamOptions}
                        multiple
                        value={selectedOptions}
                        onValueChange={(selected: OptionItem[]) => {
                          field.onChange(
                            selected.map((o) => parseInt(o.value, 10))
                          );
                        }}
                        itemToStringValue={(o: OptionItem) => o.label}
                        onOpenChange={(open: boolean) =>
                          setIsTeamsComboboxOpen(open)
                        }
                      >
                        <ComboboxChips ref={teamsAnchorRef} className="w-full">
                          <ComboboxValue>
                            {(values: OptionItem[]) => (
                              <>
                                {values.map((option) => (
                                  <ComboboxChip key={option.value}>
                                    {option.label}
                                  </ComboboxChip>
                                ))}
                                <ComboboxChipsInput placeholder="Select teams..." />
                              </>
                            )}
                          </ComboboxValue>
                        </ComboboxChips>
                        <ComboboxContent
                          anchor={teamsAnchorRef}
                          container={dialogContentRef}
                          className="max-h-72"
                        >
                          <ComboboxEmpty>No teams found.</ComboboxEmpty>
                          <ComboboxList>
                            {(option: OptionItem) => (
                              <ComboboxItem key={option.value} value={option}>
                                {option.label}
                              </ComboboxItem>
                            )}
                          </ComboboxList>
                        </ComboboxContent>
                      </Combobox>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                );
              }}
            />
            <DialogFooter className="mt-8">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Create user
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
