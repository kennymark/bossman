import { router, usePage } from '@inertiajs/react'
import { useMutation } from '@tanstack/react-query'
import { useFormik } from 'formik'
import { Camera, Trash2 } from 'lucide-react'
import { useRef, useState } from 'react'
import { toast } from 'sonner'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

import { type ServerErrorResponse, serverErrorResponder } from '@/lib/error'
import api from '@/lib/http'
import { AccountTab } from './components/delete-account'
import { EmailVerificationCard } from './components/email_verification_card'
import { TwoFactorTab } from './components/two-factor-auth'

interface ProfileValues {
  fullName: string
  email: string
}

export function ProfileTab() {
  const page = usePage()
  const user = page.props.user as {
    id?: string
    fullName?: string
    email?: string
    pendingEmail?: string | null
    emailVerified?: boolean
    avatar?: { url?: string } | null
    twoFactorEnabled?: boolean
  }
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)

  // Profile update mutation
  const { mutate: updateProfileMutation, isPending: isUpdatingProfile } = useMutation({
    mutationFn: (values: ProfileValues) => api.put<{ message?: string }>('/user/profile', values),
    onSuccess: (response) => {
      const message =
        response.data?.message ||
        'Profile updated successfully! A verification email has been sent to your new email address.'
      toast.success(message)
      router.reload()
    },
    onError: (err: ServerErrorResponse) => {
      const error = serverErrorResponder(err)
      toast.error(error || 'Failed to update profile. Please try again.')
    },
  })

  // Avatar upload mutation
  const { mutate: uploadAvatarMutation, isPending: isUploadingAvatar } = useMutation({
    mutationFn: (file: File) => {
      const formData = new FormData()
      formData.append('avatar', file)
      return api.post('/user/avatar', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
    },
    onSuccess: () => {
      toast.success('Avatar uploaded successfully!')
      setAvatarPreview(null)
      router.reload()
    },
    onError: (err: ServerErrorResponse) => {
      const error = serverErrorResponder(err)
      toast.error(error || 'Failed to upload avatar. Please try again.')
    },
  })

  // Avatar delete mutation
  const { mutate: deleteAvatarMutation, isPending: isDeletingAvatar } = useMutation({
    mutationFn: () => api.delete('/user/avatar'),
    onSuccess: () => {
      toast.success('Avatar deleted successfully!')
      setAvatarPreview(null)
      router.reload()
    },
    onError: (err: ServerErrorResponse) => {
      const error = serverErrorResponder(err)
      toast.error(error || 'Failed to delete avatar. Please try again.')
    },
  })

  const profileFormik = useFormik<ProfileValues>({
    initialValues: {
      fullName: user?.fullName || '',
      email: user?.email || '',
    },
    enableReinitialize: true,
    onSubmit: (values) => {
      updateProfileMutation(values)
    },
  })



  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file')
      return
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB')
      return
    }

    // Create preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setAvatarPreview(reader.result as string)
    }
    reader.readAsDataURL(file)

    // Upload
    uploadAvatarMutation(file)
  }

  const handleDeleteAvatar = () => {
    if (confirm('Are you sure you want to delete your avatar?')) {
      deleteAvatarMutation()
    }
  }

  const avatarUrl = avatarPreview || user?.avatar?.url

  return (
    <>
      {/* Avatar Upload */}
      <Card>
        <CardHeader>
          <CardTitle>Profile Picture</CardTitle>
          <CardDescription>Upload a profile picture to personalize your account.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className='flex items-center gap-6'>
            <Avatar className='h-24 w-24'>
              {avatarUrl ? (
                <AvatarImage src={avatarUrl} alt={user?.fullName || 'User'} />
              ) : null}
              <AvatarFallback className='text-2xl'>
                {user?.fullName?.charAt(0) || user?.email?.charAt(0) || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className='flex flex-col gap-2'>
              <div className='flex gap-2'>
                <Button
                  type='button'
                  variant='outline'
                  size='sm'
                  className={user?.avatar ? 'hidden' : ''}
                  isLoading={isUploadingAvatar}
                  loadingText='Uploading...'
                  leftIcon={<Camera className='mr-2 h-4 w-4' />}
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingAvatar}>
                  Upload Avatar
                </Button>
                {user?.avatar && (
                  <Button
                    type='button'
                    variant='outline'
                    size='sm'
                    onClick={handleDeleteAvatar}
                    leftIcon={<Trash2 className='mr-2 h-4 w-4' />}
                    loadingText='Deleting...'
                    disabled={isDeletingAvatar}
                    className={user?.avatar ? '' : 'hidden'}>
                    Clear
                  </Button>
                )}
              </div>
              <p className='text-xs text-muted-foreground'>JPG, PNG or GIF. Max size 5MB.</p>
            </div>
            <input
              ref={fileInputRef}
              type='file'
              accept='image/*'
              className='hidden'
              onChange={handleAvatarChange}
            />
          </div>
        </CardContent>
      </Card>

      {/* Profile Information */}
      <Card>
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
          <CardDescription>
            Update your profile information. This will be visible to other users.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={profileFormik.handleSubmit} className='space-y-4'>
            <div className='space-y-2'>
              <Label htmlFor='fullName'>Full Name</Label>
              <Input
                id='fullName'
                name='fullName'
                type='text'
                value={profileFormik.values.fullName}
                onChange={profileFormik.handleChange}
                onBlur={profileFormik.handleBlur}
                placeholder='John Doe'
              />
            </div>

            <div className='space-y-2'>
              <Label htmlFor='email'>Email</Label>
              <Input
                id='email'
                name='email'
                type='email'
                value={profileFormik.values.email}
                onChange={profileFormik.handleChange}
                onBlur={profileFormik.handleBlur}
                placeholder='you@example.com'
                disabled={!user?.emailVerified}
              />
              {!user?.emailVerified && (
                <p className='text-xs text-muted-foreground'>
                  Please verify your email address before changing it.
                </p>
              )}
              {user?.pendingEmail && (
                <div className='rounded-lg bg-yellow-500/10 border border-yellow-500/20 p-3'>
                  <p className='text-sm text-yellow-700 dark:text-yellow-300'>
                    <strong>Pending email change:</strong> {user.pendingEmail}
                  </p>
                  <p className='text-xs text-yellow-600 dark:text-yellow-400 mt-1'>
                    Please check your new email inbox for a confirmation link.
                  </p>
                </div>
              )}
            </div>

            <Button
              type='submit'
              disabled={!user?.emailVerified}
              isLoading={isUpdatingProfile}
              loadingText='Saving…'>
              Save Changes
            </Button>
            {!user?.emailVerified && (
              <p className='text-sm text-muted-foreground'>
                You must verify your email address before updating your profile.
              </p>
            )}
          </form>
        </CardContent>
      </Card>

      {/* Two-Factor Authentication */}
      <TwoFactorTab />

      {/* Email Verification */}
      <EmailVerificationCard emailVerified={Boolean(user?.emailVerified)} />

      {/* Danger Zone */}
      <AccountTab />
    </>
  )
}
