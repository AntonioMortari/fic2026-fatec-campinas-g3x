import { cn } from '../../lib/cn'

interface OrderedStepsProps {
  steps: string[]
  larger?: boolean
}

export function OrderedSteps({ steps, larger = false }: OrderedStepsProps) {
  return (
    <ol className={cn('m-0 flex list-decimal flex-col pl-[1.375rem] text-brown marker:text-brown', larger ? 'gap-2 text-[0.96875rem] leading-[1.5]' : 'gap-1.5 text-[0.9375rem] leading-[1.5]')}>
      {steps.map((step) => (
        <li key={step} className="pl-0.5">
          {step}
        </li>
      ))}
    </ol>
  )
}
