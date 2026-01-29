import type { SharedProps } from '@adonisjs/inertia/types'
import { Link, usePage } from '@inertiajs/react'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface BlogHeaderActionsProps {
  showBlogLink?: boolean
}

export function BlogHeaderActions({ showBlogLink = false }: BlogHeaderActionsProps) {
  const page = usePage()
  const isLoggedIn = Boolean((page.props as SharedProps).isLoggedIn)

  if (isLoggedIn) {
    return (
      <Button asChild rightIcon={<ArrowRight className='h-4 w-4' />}>
        <Link href='/dashboard'>Dashboard</Link>
      </Button>
    )
  }

  return (
    <>
      {showBlogLink ? (
        <Button variant='ghost' asChild>
          <Link href='/blog'>Blog</Link>
        </Button>
      ) : null}
      <Button asChild rightIcon={<ArrowRight className='h-4 w-4' />}>
        <Link href='/login'>Sign In</Link>
      </Button>
    </>
  )
}

