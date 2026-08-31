import type { SharedProps } from '@adonisjs/inertia/types'
import { Deferred, router, useForm } from '@inertiajs/react'
import { IconPlus, IconTrash } from '@tabler/icons-react'

import type { RawBlogCategory } from '#types/model-types'
import { DashboardPage } from '@/components/dashboard/dashboard-page'
import { LoadingSkeleton } from '@/components/ui'
import { AppCard } from '@/components/ui/app-card'
import { BaseModal } from '@/components/ui/base-modal'
import { Button } from '@/components/ui/button'
import { FormField } from '@/components/ui/form_field'
import { Input } from '@/components/ui/input'
import { Stack } from '@/components/ui/stack'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'

interface BlogAdminCategoriesProps extends SharedProps {
  categories?: RawBlogCategory[]
}

export default function BlogAdminCategories({ categories }: BlogAdminCategoriesProps) {
  const { data, setData, post, processing, errors, reset } = useForm({
    name: '',
    description: '',
  })

  return (
    <DashboardPage
      title='Categories'
      description='Create and manage blog categories.'
      backHref='/blog/manage'
      actions={
        <BaseModal
          title='New category'
          description='Slug is generated automatically.'
          trigger={<Button leftIcon={<IconPlus />}>Add category</Button>}
          primaryText='Create category'
          secondaryText='Cancel'
          primaryVariant='default'
          secondaryVariant='outline'
          isLoading={processing}
          primaryDisabled={processing}
          onSecondaryAction={() => reset()}
          onPrimaryAction={async () => {
            post('/blog/manage/categories', {
              preserveScroll: true,
              onSuccess: () => {
                reset()
              },
            })
          }}>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              post('/blog/manage/categories', {
                preserveScroll: true,
                onSuccess: () => {
                  reset()
                },
              })
            }}>
            <Stack spacing={4}>
              <FormField label='Name' htmlFor='name' required error={errors.name}>
                <Input
                  id='name'
                  value={data.name}
                  onChange={(e) => setData('name', e.target.value)}
                  required
                />
              </FormField>
              <FormField label='Description' htmlFor='description' error={errors.description}>
                <Textarea
                  id='description'
                  value={data.description}
                  onChange={(e) => setData('description', e.target.value)}
                  rows={3}
                />
              </FormField>
            </Stack>
          </form>
        </BaseModal>
      }>
      <Deferred data='categories' fallback={<LoadingSkeleton type='table' />}>
        <AppCard title='All categories' description={`${(categories ?? []).length} total`}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead className='text-right'>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(categories ?? []).map((c) => (
                <TableRow key={c.id}>
                  <TableCell className='font-medium'>{c.name}</TableCell>
                  <TableCell className='text-muted-foreground'>/{c.slug}</TableCell>
                  <TableCell className='text-right'>
                    <Button
                      variant='ghost'
                      size='icon'
                      className='text-destructive hover:text-destructive'
                      onClick={() => {
                        if (
                          !confirm(
                            'Delete this category? Posts will keep working (category will be cleared).',
                          )
                        )
                          return
                        router.delete(`/blog/manage/categories/${c.id}`, {
                          preserveScroll: true,
                        })
                      }}>
                      <IconTrash className='h-4 w-4' />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {!(categories ?? []).length ? (
                <TableRow>
                  <TableCell colSpan={3} className='text-center text-muted-foreground'>
                    No categories yet.
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </AppCard>
      </Deferred>
    </DashboardPage>
  )
}
