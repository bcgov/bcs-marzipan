import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { useForm, type Resolver } from 'react-hook-form';
import { z } from 'zod';
import { useEffect, useMemo, useState } from 'react';

import {
  PERMISSIONS,
  SYSTEM_ROLE_IDS,
  userColourKeySchema,
  type UserColourKey,
} from '@corpcal/shared';
import type {
  UpdateUserBody,
  UserDetail,
  UserListItem,
  UserPermissionOverrideInput,
} from '@corpcal/shared/api/types';
import {
  GOV_BC_EMAIL_DOMAIN,
  USER_DISPLAY_NAME_MAX_LENGTH,
  USER_JOB_TITLE_MAX_LENGTH,
  USER_PHONE_MAX_LENGTH,
} from '@corpcal/shared/schemas';
import {
  fetchRoles,
  fetchUser,
  updateUser,
  updateUserSettings,
} from '@/api/usersApi';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
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
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from '@/components/ui/input-group';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { UserColouredAvatar } from '@/components/users/UserColouredAvatar';
import {
  initialsFromDisplayName,
  UserColourIdentityField,
} from '@/components/users/UserColourIdentityField';
import { UserRoleField } from '@/components/users/UserRoleField';
import { useAuth } from '@/hooks/useAuth';
import {
  resolveUserDisplayName,
  showEntityToast,
} from '@/lib/user-team-toast-messages';
import { invalidateUserCaches, userQueryKeys } from '@/lib/userQueryKeys';
import { cn } from '@/lib/utils';

const editUserFormSchema = z.object({
  displayName: z.string().trim().max(USER_DISPLAY_NAME_MAX_LENGTH).default(''),
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
  phone: z.string().trim().max(USER_PHONE_MAX_LENGTH).default(''),
  jobTitle: z.string().trim().max(USER_JOB_TITLE_MAX_LENGTH).default(''),
  roleId: z.string().min(1, 'Role is required'),
  notes: z.string().default(''),
  isActive: z.boolean().default(true),
  isEventPlanner: z.boolean().default(false),
  userColourKey: userColourKeySchema.default('blue' satisfies UserColourKey),
});

type EditUserFormData = z.infer<typeof editUserFormSchema>;

const emptyFormValues: EditUserFormData = {
  displayName: '',
  email: '',
  phone: '',
  jobTitle: '',
  roleId: '',
  notes: '',
  isActive: true,
  isEventPlanner: false,
  userColourKey: 'blue',
};

interface UserEditModalProps {
  user: UserListItem;
  onClose: () => void;
  onSaved: () => void;
}

function displayNameForEditForm(detail: UserDetail): string {
  const override = detail.displayName?.trim();
  if (override) return override;
  return detail.adDisplayName?.trim() ?? '';
}

/** Persist null when empty or matching Microsoft mirror (follow AD). */
function displayNameForUpdate(
  trimmed: string,
  adDisplayName: string | undefined
): string | null {
  if (!trimmed) return null;
  const microsoft = adDisplayName?.trim();
  if (microsoft && trimmed === microsoft) return null;
  return trimmed;
}

export function UserEditModal({ user, onClose, onSaved }: UserEditModalProps) {
  const [permissionOverrideInputs, setPermissionOverrideInputs] = useState<
    UserPermissionOverrideInput[]
  >([]);
  const [colourPickerExpanded, setColourPickerExpanded] = useState(false);

  const queryClient = useQueryClient();
  const { user: currentUser, hasPermission, refreshUser } = useAuth();
  const canEditOverrides = hasPermission(PERMISSIONS.USERS.MANAGE_ROLES);

  const canEditProfile =
    currentUser?.roleId === SYSTEM_ROLE_IDS.ADMIN ||
    currentUser?.roleId === SYSTEM_ROLE_IDS.SYSTEM_ADMIN;

  const { data: detail, isLoading } = useQuery<UserDetail | null>({
    queryKey: userQueryKeys.detail(user.id),
    queryFn: () => fetchUser(user.id),
    enabled: !!user.id,
  });

  const { data: roles = [] } = useQuery({
    queryKey: ['roles'],
    queryFn: fetchRoles,
  });

  const currentUserIsSystemAdmin =
    currentUser?.roleId === SYSTEM_ROLE_IDS.SYSTEM_ADMIN;

  const availableRoles = roles.filter((role) => {
    if (!currentUserIsSystemAdmin && role.id === SYSTEM_ROLE_IDS.SYSTEM_ADMIN) {
      return false;
    }
    return true;
  });

  const form = useForm<EditUserFormData>({
    defaultValues: emptyFormValues,
    resolver: zodResolver(
      editUserFormSchema as any
    ) as Resolver<EditUserFormData>,
  });

  useEffect(() => {
    if (!detail) return;
    form.reset({
      displayName: displayNameForEditForm(detail),
      email: detail.adEmail ?? '',
      phone: detail.phone ?? '',
      jobTitle: detail.jobTitle ?? '',
      roleId: String(detail.roleId),
      notes: detail.notes ?? '',
      isActive: detail.isActive,
      isEventPlanner: detail.isEventPlanner,
      userColourKey: detail.userColourKey,
    });
    setColourPickerExpanded(false);
  }, [detail, form]);

  const watchedDisplayName = form.watch('displayName');
  const watchedUserColourKey = form.watch('userColourKey');
  const trimmedDisplayName = watchedDisplayName?.trim() ?? '';
  const microsoftDisplayName = detail?.adDisplayName?.trim() ?? '';
  const hasMicrosoftName = microsoftDisplayName.length > 0;
  const previewAssigneeName =
    trimmedDisplayName ||
    detail?.adDisplayName?.trim() ||
    detail?.adUsername?.trim() ||
    resolveUserDisplayName(detail ?? user);
  const avatarInitials = initialsFromDisplayName(previewAssigneeName);
  const showAppearanceControls = trimmedDisplayName.length > 0;

  const parsedRoleId = parseInt(form.watch('roleId'), 10);
  const selectedRoleId = Number.isNaN(parsedRoleId) ? null : parsedRoleId;

  const showRestoreMicrosoftName =
    canEditProfile &&
    hasMicrosoftName &&
    trimmedDisplayName !== microsoftDisplayName;

  const updateMutation = useMutation({
    mutationFn: ({ body }: { body: UpdateUserBody; displayLabel: string }) =>
      updateUser(user.id, body),
    onSuccess: (_data, variables) => {
      invalidateUserCaches(queryClient, user.id);
      showEntityToast('success', 'Updated user', {
        description: variables.displayLabel,
        id: `user-updated-${user.id}`,
      });
    },
    onError: (err: Error, variables) => {
      showEntityToast('error', 'Could not update user', {
        description: variables?.displayLabel
          ? `${variables.displayLabel} — ${err.message || 'Update failed'}`
          : err.message || 'Update failed',
        id: `user-updated-${user.id}`,
      });
    },
  });

  const handleRestoreMicrosoftName = () => {
    form.setValue('displayName', microsoftDisplayName, { shouldDirty: true });
  };

  const handleSave = async (data: EditUserFormData) => {
    const newRoleId = parseInt(data.roleId, 10);
    if (Number.isNaN(newRoleId)) {
      form.setError('roleId', { message: 'Role is required' });
      return;
    }

    const body: UpdateUserBody = {
      roleId: newRoleId,
      notes: data.notes || null,
      isActive: Boolean(data.isActive),
      isEventPlanner: data.isEventPlanner,
    };

    if (canEditProfile) {
      const trimmedDisplay = data.displayName.trim();
      body.displayName = displayNameForUpdate(
        trimmedDisplay,
        detail?.adDisplayName ?? undefined
      );
      body.email = data.email.trim().toLowerCase();
      body.phone = data.phone.trim() || null;
      body.jobTitle = data.jobTitle.trim() || null;
    }

    if (permissionOverrideInputs.length > 0) {
      body.permissionOverrides = permissionOverrideInputs;
    }

    const trimmedDisplay = data.displayName.trim();
    const displayLabel =
      trimmedDisplay ||
      detail?.adDisplayName?.trim() ||
      resolveUserDisplayName(detail ?? user);

    const colourChanged =
      detail != null && data.userColourKey !== detail.userColourKey;

    try {
      await updateMutation.mutateAsync({ body, displayLabel });
    } catch {
      return;
    }

    if (colourChanged) {
      try {
        await updateUserSettings(user.id, {
          userColourKey: data.userColourKey,
        });
        invalidateUserCaches(queryClient, user.id);
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : 'Could not update user colour';
        showEntityToast('error', 'Could not update user colour', {
          description: message,
          id: `user-colour-updated-${user.id}`,
        });
        return;
      }
    }

    if (currentUser?.id === user.id) {
      await refreshUser();
    }

    onSaved();
  };

  const editModalTitle = useMemo(() => {
    const source = detail ?? user;
    const name =
      source.displayName?.trim() || source.adDisplayName?.trim() || '';
    return name ? `Edit user ${name}` : 'Edit user';
  }, [detail, user]);

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="max-w-xl overflow-x-hidden"
        aria-describedby={undefined}
      >
        <DialogHeader>
          <DialogTitle>{editModalTitle}</DialogTitle>
        </DialogHeader>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
          </div>
        ) : (
          <Form {...form}>
            <form
              onSubmit={(e) => void form.handleSubmit(handleSave)(e)}
              className="flex flex-col gap-4"
            >
              <div className="space-y-1">
                <FormField
                  control={form.control}
                  name="displayName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel showDirtyIndicator={false}>
                        Display name
                      </FormLabel>
                      <FormControl>
                        <InputGroup>
                          <InputGroupAddon
                            align="inline-start"
                            className={cn(
                              'pl-2 transition-[padding,width]',
                              !showAppearanceControls &&
                                'w-0 overflow-hidden border-0 p-0'
                            )}
                            aria-hidden={!showAppearanceControls}
                          >
                            {showAppearanceControls ? (
                              <UserColouredAvatar
                                userColourKey={watchedUserColourKey}
                                initials={avatarInitials}
                                size="sm"
                                title={previewAssigneeName}
                                decorative
                              />
                            ) : null}
                          </InputGroupAddon>
                          <InputGroupInput
                            type="text"
                            maxLength={USER_DISPLAY_NAME_MAX_LENGTH}
                            readOnly={!canEditProfile}
                            disabled={!canEditProfile}
                            className={cn(!canEditProfile && 'bg-slate-50')}
                            {...field}
                          />
                          {showRestoreMicrosoftName ? (
                            <InputGroupAddon
                              align="inline-end"
                              className="shrink-0 pr-1"
                            >
                              <InputGroupButton
                                variant="link"
                                className="text-primary h-auto px-2 text-xs font-normal whitespace-nowrap"
                                onClick={handleRestoreMicrosoftName}
                              >
                                Restore Microsoft name
                              </InputGroupButton>
                            </InputGroupAddon>
                          ) : null}
                        </InputGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="userColourKey"
                  render={({ field }) => (
                    <FormItem
                      className={cn(
                        'space-y-2',
                        !showAppearanceControls && 'hidden'
                      )}
                    >
                      <FormControl>
                        <UserColourIdentityField
                          id="edit-user-colour"
                          value={field.value}
                          onChange={field.onChange}
                          previewAssigneeName={previewAssigneeName}
                          avatarInitials={avatarInitials}
                          collapsible
                          embedded
                          expanded={colourPickerExpanded}
                          onExpandedChange={setColourPickerExpanded}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Separator />

              <div className="grid grid-cols-3 gap-3">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem className="col-span-2">
                      <FormLabel showDirtyIndicator={false}>Email</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          readOnly={!canEditProfile}
                          disabled={!canEditProfile}
                          className={canEditProfile ? undefined : 'bg-slate-50'}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="space-y-2">
                  <Label htmlFor="edit-user-idir">IDIR</Label>
                  <Input
                    id="edit-user-idir"
                    type="text"
                    readOnly
                    disabled
                    className="bg-slate-50"
                    value={detail?.adUsername?.trim() ?? ''}
                    placeholder={
                      detail && !detail.adUsername?.trim()
                        ? 'After first sign-in'
                        : '—'
                    }
                  />
                </div>
              </div>

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel showDirtyIndicator={false}>Phone</FormLabel>
                    <FormControl>
                      <Input
                        type="tel"
                        readOnly={!canEditProfile}
                        disabled={!canEditProfile}
                        className={canEditProfile ? undefined : 'bg-slate-50'}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="jobTitle"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel showDirtyIndicator={false}>Job title</FormLabel>
                    <FormControl>
                      <Input
                        type="text"
                        readOnly={!canEditProfile}
                        disabled={!canEditProfile}
                        className={canEditProfile ? undefined : 'bg-slate-50'}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isEventPlanner"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-3">
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={(v) => field.onChange(Boolean(v))}
                      />
                    </FormControl>
                    <FormLabel showDirtyIndicator={false} className="mt-0!">
                      Event planner
                    </FormLabel>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="roleId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel showDirtyIndicator={false}>Role</FormLabel>
                    <FormControl>
                      <UserRoleField
                        roles={availableRoles}
                        value={field.value}
                        onValueChange={field.onChange}
                        roleId={selectedRoleId}
                        savedRoleId={detail?.roleId}
                        existingOverrides={detail?.permissionOverrides}
                        canEditOverrides={canEditOverrides}
                        onPermissionChange={setPermissionOverrideInputs}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-3">
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={(v) => field.onChange(Boolean(v))}
                      />
                    </FormControl>
                    <FormLabel showDirtyIndicator={false} className="mt-0!">
                      Active
                    </FormLabel>
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button type="button" variant="secondary" onClick={onClose}>
                  Cancel
                </Button>
                <Button type="submit" disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  Save changes
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
