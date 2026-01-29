import type { SharedProps } from '@adonisjs/inertia/types'
import { Head, router } from '@inertiajs/react'
import { useMutation } from '@tanstack/react-query'
import { useFormik } from 'formik'
import { toast } from 'sonner'
import { PublicLayout } from '@/components/layouts/public'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

import { type ServerErrorResponse, serverErrorResponder } from '@/lib/error'
import api from '@/lib/http'

interface ContactValues {
  name: string
  email: string
  subject: string
  message: string
}

export default function Contact(_props: SharedProps) {
  const { mutate: contactMutation, isPending } = useMutation({
    mutationFn: (values: ContactValues) => api.post('/contact', values),
    onSuccess: () => {
      toast.success('Message sent!', {
        description: 'We will get back to you as soon as possible.',
      })
      router.visit('/')
    },
    onError: (err: ServerErrorResponse) => {
      const error = serverErrorResponder(err)
      toast.error(error || 'Failed to send message. Please try again.')
    },
  })

  const formik = useFormik<ContactValues>({
    initialValues: {
      name: '',
      email: '',
      subject: '',
      message: '',
    },
    onSubmit: (values) => {
      contactMutation(values)
    },
  })

  return (
    <PublicLayout>
      <Head title='Contact' />
      <div className='max-w-screen-xl mx-auto px-6 py-12'>
        <div className='text-center mb-12'>
          <h1 className='text-4xl font-bold tracking-tight mb-4'>Contact Us</h1>
          <p className='text-muted-foreground text-lg max-w-2xl mx-auto'>
            Have a question or need help? We'd love to hear from you. Send us a message and we'll
            respond as soon as possible.
          </p>
        </div>

        <div className='max-w-2xl mx-auto'>
          <Card>
            <CardHeader>
              <CardTitle>Send us a message</CardTitle>
              <CardDescription>
                Fill out the form below and we'll get back to you within 24 hours.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={formik.handleSubmit} className='space-y-4'>
                <div className='space-y-2'>
                  <Label htmlFor='name'>Name</Label>
                  <Input
                    id='name'
                    name='name'
                    type='text'
                    value={formik.values.name}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    required
                    placeholder='Your name'
                  />
                </div>

                <div className='space-y-2'>
                  <Label htmlFor='email'>Email</Label>
                  <Input
                    id='email'
                    name='email'
                    type='email'
                    value={formik.values.email}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    required
                    placeholder='you@example.com'
                  />
                </div>

                <div className='space-y-2'>
                  <Label htmlFor='subject'>Subject</Label>
                  <Input
                    id='subject'
                    name='subject'
                    type='text'
                    value={formik.values.subject}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    required
                    placeholder='What is this regarding?'
                  />
                </div>

                <div className='space-y-2'>
                  <Label htmlFor='message'>Message</Label>
                  <Textarea
                    id='message'
                    name='message'
                    value={formik.values.message}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    required
                    placeholder='Your message...'
                    rows={6}
                  />
                </div>

                <Button type='submit' className='w-full' isLoading={isPending} loadingText='Sending…'>
                  Send Message
                </Button>
              </form>
            </CardContent>
          </Card>

          <div className='mt-8 text-center text-sm text-muted-foreground'>
            <p>Or reach us directly at support@example.com</p>
          </div>
        </div>
      </div>
    </PublicLayout>
  )
}
