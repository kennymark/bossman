import type { SharedProps } from '@adonisjs/inertia/types'
import { router } from '@inertiajs/react'
import { IconChevronLeft, IconChevronRight, IconMail } from '@tabler/icons-react'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'

import type { Column } from '#types/extra'
import { timeAgo } from '#utils/date'
import { DashboardPage } from '@/components/dashboard/dashboard-page'
import { LoadingSkeleton } from '@/components/ui'
import { AppCard } from '@/components/ui/app-card'
import { BaseSheet } from '@/components/ui/base-sheet'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { dateFormatter } from '@/lib/date'
import api from '@/lib/http'

/** Resend list item (snake_case from API). */
type ResendEmailListItem = {
  id: string
  to: string[]
  from: string
  created_at: string
  subject: string
  last_event:
    | 'delivered'
    | 'failed'
    | 'scheduled'
    | 'sending'
    | 'sent'
    | 'bounced'
    | 'opened'
    | 'clicked'
    | 'complained'
  bcc: string[] | null
  cc: string[] | null
  reply_to: string | null
  scheduled_at: string | null
}

/** Resend list response. */
type ResendListResponse = {
  object: 'list'
  has_more: boolean
  data: ResendEmailListItem[]
}

/** Resend single email (full). */
type ResendEmail = {
  object: 'email'
  id: string
  to: string[]
  from: string
  created_at: string
  subject: string
  html: string | null
  text: string | null
  last_event: string
  bcc?: string[]
  cc?: string[]
  reply_to?: string | null
  scheduled_at?: string | null
}

interface EmailsIndexProps extends SharedProps {
  emailId?: string
}

const emailColumns: Column<ResendEmailListItem>[] = [
  {
    key: 'to',
    header: 'To',
    cell: (row) => (
      <span
        className='text-sm text-muted-foreground truncate block max-w-[200px]'
        title={row.to?.join(', ')}>
        {Array.isArray(row.to) ? row.to.join(', ') : '—'}
      </span>
    ),
  },

  {
    key: 'subject',
    header: 'Subject',
    cell: (row) => (
      <span className='font-medium truncate block max-w-[340px]' title={row.subject}>
        {row.subject ?? '—'}
      </span>
    ),
  },
  {
    key: 'last_event',
    header: 'Status',
    width: 100,
    cell: (row) => (
      <span className='capitalize text-sm text-muted-foreground'>{row.last_event ?? '—'}</span>
    ),
  },
  {
    key: 'created_at',
    header: 'Sent',
    width: 160,
    cell: (row) => (
      <span className='text-sm text-muted-foreground'>
        {row.created_at ? timeAgo(row.created_at) : '—'}
      </span>
    ),
  },
]

function EmailDetailContent({ email }: { email: ResendEmail }) {
  return (
    <div className='space-y-4 text-sm'>
      <dl className='grid grid-cols-[auto_1fr] gap-x-3 gap-y-1'>
        <dt className='text-muted-foreground'>ID</dt>
        <dd className='font-mono text-xs break-all'>{email.id}</dd>
        <dt className='text-muted-foreground'>To</dt>
        <dd className='text-muted-foreground'>
          {Array.isArray(email.to) ? email.to.join(', ') : '—'}
        </dd>
        <dt className='text-muted-foreground'>From</dt>
        <dd>{email.from ?? '—'}</dd>
        <dt className='text-muted-foreground'>Subject</dt>
        <dd className='font-medium'>{email.subject ?? '—'}</dd>
        <dt className='text-muted-foreground'>Status</dt>
        <dd className='capitalize text-muted-foreground'>{email.last_event ?? '—'}</dd>
        <dt className='text-muted-foreground'>Sent</dt>
        <dd className='text-muted-foreground'>
          {email.created_at ? dateFormatter(email.created_at) : '—'}
        </dd>
      </dl>
      {email.html ? (
        <div className='rounded-lg border border-border overflow-hidden'>
          <p className='text-muted-foreground text-xs px-3 py-2 border-b border-border bg-muted/50'>
            HTML body
          </p>
          {/*
            Rendered in a sandboxed iframe rather than injected into the page: this is
            third-party email markup, so any script or form it carries stays isolated
            from the admin session.
          */}
          <iframe
            title='Email HTML body'
            srcDoc={email.html}
            sandbox=''
            referrerPolicy='no-referrer'
            className='w-full h-[60vh] bg-white'
          />
        </div>
      ) : email.text ? (
        <div className='rounded-lg border border-border overflow-hidden'>
          <p className='text-muted-foreground text-xs px-3 py-2 border-b border-border bg-muted/50'>
            Plain text
          </p>
          <pre className='p-4 max-h-[60vh] overflow-auto text-xs whitespace-pre-wrap font-sans'>
            {email.text}
          </pre>
        </div>
      ) : (
        <p className='text-muted-foreground'>No body content.</p>
      )}
    </div>
  )
}

export default function EmailsIndex({ emailId: initialEmailId }: EmailsIndexProps) {
  const [selectedEmailId, setSelectedEmailId] = useState<string | null>(initialEmailId ?? null)
  const [cursor, setCursor] = useState<{ after?: string; before?: string }>({})
  const limit = 20

  const viewSheetOpen = selectedEmailId != null

  const openEmail = (id: string) => {
    setSelectedEmailId(id)
    router.visit(`/emails/${id}`)
  }
  const closeSheet = () => {
    setSelectedEmailId(null)
    router.visit('/emails')
  }

  const { data: emailsList, isLoading: emailsListLoading } = useQuery({
    queryKey: ['emails', 'list', limit, cursor.after, cursor.before],
    queryFn: async () => {
      const res = await api.get<ResendListResponse>('/emails', {
        params: {
          limit,
          ...(cursor.after && { after: cursor.after }),
          ...(cursor.before && { before: cursor.before }),
        },
      })
      return res.data
    },
  })

  const emailDetailQuery = useQuery({
    queryKey: ['emails', selectedEmailId],
    queryFn: async () => {
      if (!selectedEmailId) return null
      const res = await api.get<ResendEmail>(`/emails/${selectedEmailId}`)
      return res.data
    },
    enabled: !!selectedEmailId,
  })

  const data = emailsList?.data ?? []
  const hasMore = emailsList?.has_more ?? false
  const firstId = data[0]?.id
  const lastId = data[data.length - 1]?.id

  const goNext = () => {
    if (hasMore && lastId) setCursor({ after: lastId })
  }
  const goPrev = () => {
    if (firstId) setCursor({ before: firstId })
  }
  const canGoPrev = !!firstId && (!!cursor.after || !!cursor.before)

  const columnsWithClick: Column<ResendEmailListItem>[] = [
    ...emailColumns,
    {
      key: 'actions',
      header: '',
      width: 80,
      cell: (row) => (
        <Button variant='ghost' size='sm' onClick={() => openEmail(row.id)}>
          View
        </Button>
      ),
    },
  ]

  return (
    <DashboardPage
      title='Emails'
      description='Sent emails from Resend. Open an email to view details and share the link.'>
      <BaseSheet
        open={viewSheetOpen}
        onOpenChange={(open) => !open && closeSheet()}
        title='Email details'
        description={
          selectedEmailId ? (
            <span className='font-mono text-xs break-all'>{selectedEmailId}</span>
          ) : undefined
        }
        side='right'
        className='w-full sm:max-w-2xl'
        showFooter={false}>
        {emailDetailQuery.isPending && selectedEmailId ? (
          <LoadingSkeleton type='list' />
        ) : emailDetailQuery.data ? (
          <EmailDetailContent email={emailDetailQuery.data} />
        ) : emailDetailQuery.isError ? (
          <p className='text-destructive text-sm'>Failed to load email.</p>
        ) : null}
      </BaseSheet>

      <AppCard title='Sent emails' description='Browse sent emails.'>
        <div className='space-y-4'>
          {emailsListLoading ? (
            <LoadingSkeleton type='table' />
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    {columnsWithClick.map((col) => (
                      <TableHead key={col.key} style={{ width: col.width }}>
                        {col.header}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={columnsWithClick.length} className='text-center'>
                        <EmptyState
                          icon={IconMail}
                          title='No emails found'
                          description='Emails sent via Resend will appear here.'
                          className='py-12'
                        />
                      </TableCell>
                    </TableRow>
                  ) : (
                    data.map((row) => (
                      <TableRow
                        key={row.id}
                        className='cursor-pointer hover:bg-muted/50'
                        onClick={() => openEmail(row.id)}>
                        {columnsWithClick.map((col) => (
                          <TableCell key={col.key}>{col.cell ? col.cell(row) : null}</TableCell>
                        ))}
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
              {(hasMore || canGoPrev) && (
                <div className='flex items-center justify-between border-t border-border pt-4'>
                  <Button variant='outline' size='sm' disabled={!canGoPrev} onClick={goPrev}>
                    <IconChevronLeft className='h-4 w-4' />
                    Previous
                  </Button>
                  <Button variant='outline' size='sm' disabled={!hasMore} onClick={goNext}>
                    Next
                    <IconChevronRight className='h-4 w-4' />
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </AppCard>
    </DashboardPage>
  )
}
