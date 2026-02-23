'use client'

import { useEffect, useMemo, useState } from 'react'
import { ChevronDownIcon, CalendarDays } from 'lucide-react'
import { type DateRange } from 'react-day-picker'

import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'

export interface DateRangePickerProps {
  selectedPeriod: string
  customRange?: DateRange
  onPeriodSelect: (period: string) => void
  onRangeApply: (range: DateRange | undefined) => void
  quickRanges?: string[]
  label?: string
}

const DEFAULT_QUICK_RANGES = ['1 Month', '3 Months', '6 Months', '1 Year', 'All Time']

const formatDate = (date?: Date) =>
  date
    ? date.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : ''

export default function DateRangePicker({
  selectedPeriod,
  customRange,
  onPeriodSelect,
  onRangeApply,
  quickRanges = DEFAULT_QUICK_RANGES,
  label = 'Filter by Period',
}: DateRangePickerProps) {
  const [pendingRange, setPendingRange] = useState<DateRange | undefined>(customRange)
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    setPendingRange(customRange)
  }, [customRange])

  const hasPendingRange = Boolean(pendingRange?.from && pendingRange?.to)

  const rangeLabel = useMemo(() => {
    if (hasPendingRange && pendingRange?.from && pendingRange?.to) {
      return `${formatDate(pendingRange.from)} - ${formatDate(pendingRange.to)}`
    }

    return selectedPeriod
  }, [hasPendingRange, pendingRange, selectedPeriod])
  const today = useMemo(() => new Date(), [])

  const handleApply = () => {
    if (!hasPendingRange) return

    onRangeApply(pendingRange)
    onPeriodSelect('Custom Range')
    setIsOpen(false)
  }

  const handleQuickRange = (period: string) => {
    setPendingRange(undefined)
    onRangeApply(undefined)
    onPeriodSelect(period)
    setIsOpen(false)
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="default"
          size="sm"
          className="w-auto flex items-center justify-between gap-2 h-9 rounded-md border border-[#e5e7eb] bg-white px-3 text-sm font-medium text-[#111827] transition-colors duration-150 hover:border-transparent hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 focus-visible:ring-sidebar-accent/80 focus-visible:ring-offset-2"
        >
          <div className="flex items-center gap-2 overflow-hidden">
            <CalendarDays className="min-w-4 w-4 h-4 text-current flex-shrink-0" />
            <span className="text-sm text-current truncate">{rangeLabel}</span>
          </div>
          <ChevronDownIcon className="min-w-3 w-3 h-3 text-current flex-shrink-0" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-4" align="end">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-wide text-[#16a34a]">
              Select Date Range
            </Label>
            <div className="flex justify-center">
              <Calendar
                mode="range"
                selected={pendingRange}
                onSelect={range => setPendingRange(range)}
                className="w-[260px]"
                disabled={{ after: today }}
              />
            </div>
            <div className="flex justify-between">
              <Button
                variant="default"
                size="sm"
                className="bg-sidebar-accent text-sidebar-accent-foreground hover:bg-sidebar-accent/90"
                onClick={() => {
                  setPendingRange(undefined)
                  onRangeApply(undefined)
                  onPeriodSelect('All Time')
                }}
              >
                Clear
              </Button>
              <Button
                size="sm"
                disabled={!hasPendingRange}
                className="bg-sidebar-accent text-sidebar-accent-foreground hover:bg-sidebar-accent/90"
                onClick={handleApply}
              >
                Apply
              </Button>
            </div>
          </div>
          <div className="border-t border-border pt-3 space-y-2">
            <p className="text-xs font-medium text-muted-foreground">{label}</p>
            <div className="flex flex-wrap gap-2">
              {quickRanges.map(period => {
                const isActive = selectedPeriod === period
                return (
                  <Button
                    key={period}
                    variant="default"
                    size="sm"
                    className={cn(
                      'justify-center rounded-full px-4 py-1.5 text-xs font-semibold transition-colors duration-150',
                      isActive
                        ? 'bg-sidebar-accent text-sidebar-accent-foreground border border-transparent hover:bg-sidebar-accent/90'
                        : 'bg-white text-[#111827] border border-[#e5e7eb] hover:border-transparent hover:bg-sidebar-accent/10'
                    )}
                    onClick={() => handleQuickRange(period)}
                  >
                    {period}
                  </Button>
                )
              })}
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
