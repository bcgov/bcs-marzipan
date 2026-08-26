import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { useForm, type Resolver } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { useEffect, useRef, useState } from 'react';

import type { CreateUserBody } from '@corpcal/shared/api/types';
import {
  USER_DISPLAY_NAME_MAX_LENGTH,
  USER_JOB_TITLE_MAX_LENGTH,
  USER_PHONE_MAX_LENGTH,
} from '@corpcal/shared/schemas';
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
  ComboboxSeparator,
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
import { TeamsComboboxSelectAllRow } from '@/components/users/TeamsComboboxSelectAllRow';
import { lookupQueryKeys } from '@/lib/lookupQueryKeys';
import { userQueryKeys } from '@/lib/userQueryKeys';
import type { OptionItem } from '@/schemas/types';

const GOV_BC_EMAIL_DOMAIN = '@gov.bc.ca';

const createUserFormSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, 'Email is required')
    .email('Invalid email format')
    .max(255)
    .refine(
      (value) => value.toLowerCase().endsWith(GOV_BC_EMAIL_DOMAIN),
      'Email must be a @gov.bc.ca address'
    ),
  idirUsername: z
    .string()
    .trim()
    .min(1, 'IDIR username is required')
    .max(255)
    .regex(/^[^\s@]+$/, 'IDIR username must not contain spaces or @'),
  roleId: z.string().min(1, 'Role is required'),
  displayName: z.string().trim().max(USER_DISPLAY_NAME_MAX_LENGTH).default(''),
  adJobTitle: z.string().trim().max(USER_JOB_TITLE_MAX_LENGTH).default(''),
  adPhone: z.string().trim().max(USER_PHONE_MAX_LENGTH).default(''),
  teamIds: z.array(z.number().int()).default([]),
});

type CreateUserFormData = z.infer<typeof createUserFormSchema>;

const defaultValues: CreateUserFormData = {
  email: '',
  idirUsername: '',
  roleId: '',
  displayName: '',
  adJobTitle: '',
  adPhone: '',
  teamIds: [],
};

interface UserCreateModalProps {
  open: boolean;
  onClose: () => void;
  onSaved?: () => void;
}

type CreateUserRequest = CreateUserBody;

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
    mutationFn: (body: CreateUserRequest) => createUser(body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: userQueryKeys.list() });
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
    const body: CreateUserRequest = {
      email: data.email.trim(),
      idirUsername: data.idirUsername.trim().toUpperCase(),
      roleId: parsedRoleId,
      ...(data.displayName?.trim() && {
        displayName: data.displayName.trim(),
      }),
      ...(data.adJobTitle?.trim() && {
        adJobTitle: data.adJobTitle.trim(),
      }),
      ...(data.adPhone?.trim() && {
        adPhone: data.adPhone.trim(),
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
            Create a new user. Use a @gov.bc.ca email and the user&apos;s IDIR
            username.
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
              name="idirUsername"
              render={({ field }) => (
                <FormItem>
                  <FormLabel showDirtyIndicator={false}>
                    IDIR username{' '}
                    <span
                      className="text-required-field-indicator font-semibold"
                      aria-hidden
                    >
                      *
                    </span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="text"
                      placeholder="JSMITH"
                      autoComplete="off"
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
                    <Input
                      type="text"
                      maxLength={USER_DISPLAY_NAME_MAX_LENGTH}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="adJobTitle"
              render={({ field }) => (
                <FormItem>
                  <FormLabel showDirtyIndicator={false}>Job title</FormLabel>
                  <FormControl>
                    <Input
                      type="text"
                      placeholder="e.g. Senior Analyst"
                      maxLength={USER_JOB_TITLE_MAX_LENGTH}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="adPhone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel showDirtyIndicator={false}>Phone</FormLabel>
                  <FormControl>
                    <Input
                      type="tel"
                      placeholder="e.g. 250-555-0123"
                      maxLength={USER_PHONE_MAX_LENGTH}
                      {...field}
                    />
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
                const allTeamIds = teamOptions.map((o) =>
                  parseInt(o.value, 10)
                );
                const allTeamsSelected =
                  allTeamIds.length > 0 &&
                  allTeamIds.every((id) => field.value.includes(id));
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
                          className="popover-list-scroll flex max-h-[min(var(--popover-list-max-height),24rem)] flex-col overflow-x-hidden overflow-y-auto p-0"
                        >
                          <div className="bg-popover px-1 py-1">
                            <TeamsComboboxSelectAllRow
                              allSelected={allTeamsSelected}
                              disabled={teamOptions.length === 0}
                              onToggleSelectAll={() => {
                                field.onChange(
                                  allTeamsSelected ? [] : allTeamIds
                                );
                              }}
                            />
                            {teamOptions.length > 0 ? (
                              <ComboboxSeparator className="my-1" />
                            ) : null}
                            <ComboboxEmpty>No teams found.</ComboboxEmpty>
                            <ComboboxList className="max-h-none scroll-py-1 overflow-visible p-0 data-empty:p-0">
                              {(option: OptionItem) => (
                                <ComboboxItem key={option.value} value={option}>
                                  {option.label}
                                </ComboboxItem>
                              )}
                            </ComboboxList>
                          </div>
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
