import { IconCalendar, IconServer } from '@tabler/icons-react'

import { timeAgo } from '#utils/date'
import { ResourceCard } from '@/components/dashboard/resource-card'

import type { SortableProject } from './sort-utils'

export interface ProjectCardProps {
  project: SortableProject
}

export function ProjectCard({ project }: ProjectCardProps) {
  return (
    <ResourceCard
      href={`/servers/${project.id}?name=${encodeURIComponent(project.name)}`}
      icon={IconServer}
      title={project.name}
      footer={
        <span className='flex items-center gap-2 text-xs text-muted-foreground'>
          <IconCalendar className='h-3.5 w-3.5 shrink-0' />
          Updated {timeAgo(project.updatedAt)}
        </span>
      }
    />
  )
}
