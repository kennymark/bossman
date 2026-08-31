import type { SharedProps } from '@adonisjs/inertia/types'
import { Link, useForm } from '@inertiajs/react'
import { IconPlus } from '@tabler/icons-react'

import { COVER_PHOTO_OPTIONS } from '@/components/blog'
import { MarkdownEditor } from '@/components/blog/markdown-editor'
import { DashboardPage } from '@/components/dashboard/dashboard-page'
import { SimpleGrid } from '@/components/ui'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { DateTimePicker } from '@/components/ui/date-time-picker'
import { FormField } from '@/components/ui/form_field'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup } from '@/components/ui/radio-group'
import { Textarea } from '@/components/ui/textarea'

interface BlogAdminCreateProps extends SharedProps {}

export default function BlogAdminCreate(_props: BlogAdminCreateProps) {
  const { data, setData, post, processing, errors } = useForm<{
    title: string
    body: string
    excerpt: string
    isUploadedPhotoLink: boolean
    coverImageAltUrl: string
    coverImage: File | null
    publish: boolean
    publishedAt: string | null
  }>({
    title: '',
    body: '',
    excerpt: '',
    isUploadedPhotoLink: false,
    coverImageAltUrl: '',
    coverImage: null,
    publish: false,
    publishedAt: null,
  })

  const submit = () => {
    post('/blog/manage', { preserveScroll: true })
  }

  return (
    <DashboardPage
      title='New post'
      description='Create a post. Slug is auto-generated from the title.'
      backHref='/blog/manage'>
      <Card>
        <CardHeader>
          <CardTitle>Post</CardTitle>
          <CardDescription>Slug is auto-generated from the title.</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              submit()
            }}
            className='space-y-6'>
            <div className='grid gap-4 md:grid-cols-2'>
              <FormField
                label='Title'
                htmlFor='title'
                required
                error={errors.title}
                className='md:col-span-2'>
                <Input
                  id='title'
                  value={data.title}
                  onChange={(e) => setData('title', e.target.value)}
                  required
                />
              </FormField>

              <FormField
                label='Excerpt'
                htmlFor='excerpt'
                error={errors.excerpt}
                className='md:col-span-2'>
                <Textarea
                  id='excerpt'
                  value={data.excerpt}
                  onChange={(e) => setData('excerpt', e.target.value)}
                  rows={3}
                />
              </FormField>

              <FormField label='Body' htmlFor='body' error={errors.body} className='md:col-span-2'>
                <MarkdownEditor
                  value={data.body}
                  onChange={(markdown) => setData('body', markdown)}
                />
              </FormField>

              <div className='md:col-span-2 space-y-4'>
                <Label>Cover photo</Label>
                <RadioGroup
                  options={COVER_PHOTO_OPTIONS.map((o) => ({
                    value: String(o.value),
                    label: o.label,
                    description: o.description,
                  }))}
                  value={String(data.isUploadedPhotoLink)}
                  onChange={(value) => setData('isUploadedPhotoLink', value === 'true')}
                  cols={2}
                />
                {!data.isUploadedPhotoLink ? (
                  <div className='space-y-3'>
                    <FormField
                      label='Image file'
                      htmlFor='coverImage'
                      error={(errors as Record<string, string | undefined>).coverImage}>
                      <Input
                        id='coverImage'
                        type='file'
                        accept='image/*'
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          setData('coverImage', file ?? null)
                        }}
                      />
                    </FormField>
                    <SimpleGrid cols={4}>
                      {data.coverImage && (
                        <div className='mt-2 rounded-md overflow-hidden border border-border'>
                          <img
                            src={URL.createObjectURL(data.coverImage)}
                            alt='Cover preview'
                            className='max-h-48 w-full object-cover'
                          />
                        </div>
                      )}
                    </SimpleGrid>
                  </div>
                ) : (
                  <div className='space-y-3'>
                    <FormField
                      label='Image URL'
                      htmlFor='coverImageAltUrl'
                      error={(errors as Record<string, string | undefined>).coverImageAltUrl}>
                      <Input
                        id='coverImageAltUrl'
                        type='url'
                        value={data.coverImageAltUrl}
                        onChange={(e) => setData('coverImageAltUrl', e.target.value)}
                        placeholder='https://…'
                      />
                    </FormField>
                    {data.coverImageAltUrl && (
                      <div className='mt-2 rounded-md overflow-hidden border border-border'>
                        <img
                          src={data.coverImageAltUrl}
                          alt='Cover preview'
                          className='max-h-48 w-full object-cover'
                          onError={(e) => {
                            ;(e.target as HTMLImageElement).style.display = 'none'
                          }}
                          onLoad={(e) => {
                            ;(e.target as HTMLImageElement).style.display = 'block'
                          }}
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className='md:col-span-2 space-y-4'>
                <Label>Publish</Label>
                <div className='grid gap-4 md:grid-cols-2 items-start'>
                  <div className='flex items-center gap-2 h-10'>
                    <Checkbox
                      checked={data.publish}
                      onCheckedChange={(checked) => {
                        const isChecked = Boolean(checked)
                        setData((prev) => ({
                          ...prev,
                          publish: isChecked,
                          publishedAt:
                            isChecked && !prev.publishedAt
                              ? new Date().toISOString()
                              : prev.publishedAt,
                        }))
                      }}
                      id='publish'
                    />
                    <Label htmlFor='publish' className='font-normal'>
                      Publish
                    </Label>
                  </div>

                  {data.publish && (
                    <div>
                      <DateTimePicker
                        value={data.publishedAt}
                        onChange={(val) => setData('publishedAt', val)}
                        clearable
                        placeholder='Now'
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className='flex flex-wrap items-center gap-2'>
              <Button
                type='submit'
                leftIcon={<IconPlus />}
                isLoading={processing}
                loadingText='Creating…'>
                Create post
              </Button>
              <Button type='button' variant='outline' asChild>
                <Link href='/blog/manage'>Cancel</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </DashboardPage>
  )
}
