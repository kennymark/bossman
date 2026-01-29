import type { SharedProps } from '@adonisjs/inertia/types'
import { Head, Link, useForm, usePage } from '@inertiajs/react'
import { Save } from 'lucide-react'
import type { RawUser } from '#types/model-types'
import { DashboardLayout } from '@/components/dashboard/layout'
import { PageHeader } from '@/components/dashboard/page_header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { FormField } from '@/components/ui/form_field'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'


interface AdminUserEditProps extends SharedProps {
  targetUser: RawUser
}

export default function AdminUserEdit({ targetUser }: AdminUserEditProps) {
  const page = usePage<SharedProps>()
  const authUser = page.props.user as RawUser

  const isEditingSelf = Boolean(authUser && authUser.id === targetUser.id)

  const { data, setData, put, processing, errors } = useForm<{
    fullName: string
    role: 'admin'
  }>({
    fullName: targetUser.fullName || '',
    role: targetUser.role,
  })

  return (
    <DashboardLayout>
      <Head title={`Edit user: ${targetUser.email}`} />
      <div className='space-y-6'>
        <PageHeader
          backHref={`/users/${targetUser.id}`}
          title='Edit user'
          description={targetUser.email}
        />

        <Card>
          <CardHeader>
            <CardTitle>Account</CardTitle>
            <CardDescription>Update basic user information.</CardDescription>
          </CardHeader>
          <CardContent>
            <form
              className='space-y-6'
              onSubmit={(e) => {
                e.preventDefault()
                put(`/users/${targetUser.id}`, { preserveScroll: true })
              }}>
              <div className='grid gap-4 md:grid-cols-2'>
                <FormField
                  label='Email'
                  htmlFor='email'
                  description='Email is read-only here to avoid breaking the app’s email verification/change flow.'
                  className='md:col-span-2'>
                  <Input id='email' value={targetUser.email} disabled />
                </FormField>

                <FormField
                  label='Full name'
                  htmlFor='fullName'
                  error={errors.fullName}
                  className='md:col-span-2'>
                  <Input
                    id='fullName'
                    value={data.fullName}
                    onChange={(e) => setData('fullName', e.target.value)}
                    placeholder='Jane Doe'
                  />
                </FormField>

                <FormField
                  label='Role'
                  error={errors.role}
                  description={isEditingSelf ? 'You can’t change your own role.' : undefined}
                  className='md:col-span-2'>
                  <Select
                    value={data.role}
                    onValueChange={(value) => setData('role', value as 'admin')}
                    disabled={isEditingSelf}>
                    <SelectTrigger className='w-full'>
                      <SelectValue placeholder='Select a role' />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='admin'>Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </FormField>
              </div>

              <div className='flex items-center justify-end gap-2'>
                <Button variant='outline' asChild>
                  <Link href={`/users/${targetUser.id}`}>Cancel</Link>
                </Button>
                <Button
                  leftIcon={<Save className='h-4 w-4' />}
                  isLoading={processing}
                  loadingText='Saving...'>
                  Save changes
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
