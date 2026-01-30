import { Link } from '@inertiajs/react'
import { Check, ChevronLeft, ChevronRight } from 'lucide-react'
import type { ComponentType } from 'react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export type StepStatus = 'completed' | 'active' | 'pending'

export interface StepperStepConfig {
  id: string
  label: string
  icon?: ComponentType<{ className?: string }>
  content: React.ReactNode
  /** Override next button label (e.g. "Create" on last step). Default: "Next" */
  nextText?: string
  /** Disable the next button on this step */
  nextBtnDisabled?: boolean
  /** Called when next is clicked on this step (e.g. submit on last step). If set, Next button calls this instead of advancing. */
  onNextClick?: () => void
}

export interface StepperProps {
  steps: StepperStepConfig[]
  className?: string
}

/**
 * Builds an array of stepper step configs for use with <Stepper steps={steps} />.
 * Each step has label, icon, id, content, and optionally nextText, nextBtnDisabled, onNextClick.
 */
export function createStepperSteps(steps: StepperStepConfig[]): StepperStepConfig[] {
  return steps
}

export function Stepper({ steps, className }: StepperProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const currentStep = steps[currentStepIndex]
  const isFirstStep = currentStepIndex === 0
  const isLastStep = currentStepIndex === steps.length - 1

  const handlePrev = () => {
    if (!isFirstStep) setCurrentStepIndex((i) => i - 1)
  }

  const handleNext = () => {
    if (isLastStep && currentStep.onNextClick) {
      currentStep.onNextClick()
      return
    }
    if (!isLastStep) setCurrentStepIndex((i) => i + 1)
  }

  const nextLabel = isLastStep ? (currentStep.nextText ?? 'Create') : 'Next'
  const nextDisabled = currentStep.nextBtnDisabled ?? false

  return (
    <div className={cn('space-y-6', className)}>
      <nav aria-label='Progress'>
        <ol className='flex items-center justify-between'>
          {steps.map((step, index) => {
            const status: StepStatus =
              index < currentStepIndex
                ? 'completed'
                : index === currentStepIndex
                  ? 'active'
                  : 'pending'
            const isLast = index === steps.length - 1
            const Icon = step.icon

            return (
              <li
                key={step.id}
                className={cn(
                  'relative flex flex-1 flex-col items-center',
                  !isLast && 'pr-2 sm:pr-8',
                )}>
                {index > 0 && (
                  <span
                    className={cn(
                      'absolute left-0 top-5 h-0.5 -translate-y-1/2',
                      index <= currentStepIndex ? 'bg-primary' : 'bg-muted',
                    )}
                    style={{ width: '50%' }}
                    aria-hidden
                  />
                )}

                <div className='flex flex-col items-center gap-2'>
                  <span
                    className={cn(
                      'flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 text-sm font-medium transition-colors',
                      status === 'completed' && 'border-primary bg-primary text-primary-foreground',
                      status === 'active' && 'border-primary bg-primary text-primary-foreground',
                      status === 'pending' && 'border-muted bg-muted text-muted-foreground',
                    )}
                    aria-current={status === 'active' ? 'step' : undefined}>
                    {status === 'completed' ? (
                      <Check className='h-5 w-5' aria-hidden />
                    ) : Icon ? (
                      <Icon className='h-5 w-5' aria-hidden />
                    ) : (
                      <span>{index + 1}</span>
                    )}
                  </span>
                  <span
                    className={cn(
                      'text-sm font-medium',
                      status === 'active' && 'text-primary',
                      status === 'completed' && 'text-primary',
                      status === 'pending' && 'text-muted-foreground',
                    )}>
                    {step.label}
                  </span>
                </div>
              </li>
            )
          })}
        </ol>
      </nav>

      <div className='min-h-[200px]'>{currentStep?.content}</div>

      <div className='flex items-center justify-between gap-4'>
        {isFirstStep ? (
          <Button variant='outline' asChild>
            <Link href='/orgs'>Cancel</Link>
          </Button>
        ) : (
          <Button type='button' variant='outline' onClick={handlePrev}>
            <ChevronLeft className='h-4 w-4' />
            Prev
          </Button>
        )}
        <Button type='button' onClick={handleNext} disabled={nextDisabled}>
          {nextLabel}
          {!isLastStep && <ChevronRight className='h-4 w-4' />}
        </Button>
      </div>
    </div>
  )
}
