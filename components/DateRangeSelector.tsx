import { useState } from 'react'
import { CalendarIcon } from '@heroicons/react/24/outline'

interface DateRangeSelectorProps {
  value: { start: string; end: string }
  onChange: (range: { start: string; end: string }) => void
}

const QUICK_RANGES = [
  { label: '1M', value: '1m' },
  { label: '3M', value: '3m' },
  { label: '6M', value: '6m' },
  { label: 'YTD', value: 'ytd' },
  { label: '1Y', value: '1y' },
  { label: '3Y', value: '3y' },
  { label: '5Y', value: '5y' },
]

const DateRangeSelector = ({ value, onChange }: DateRangeSelectorProps) => {
  const [activeRange, setActiveRange] = useState(value.start)

  const handleQuickRangeSelect = (range: string) => {
    setActiveRange(range)
    onChange({ start: range, end: 'now' })
  }

  return (
    <div className="mb-6">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        Date Range
      </label>
      
      <div className="flex flex-wrap gap-2">
        {QUICK_RANGES.map((range) => (
          <button
            key={range.value}
            onClick={() => handleQuickRangeSelect(range.value)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors
                       ${activeRange === range.value
                         ? 'bg-primary-500 text-white'
                         : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                       }`}
          >
            {range.label}
          </button>
        ))}

        <button
          onClick={() => {/* TODO: Add custom date picker */}}
          className="px-4 py-2 rounded-lg text-sm font-medium bg-gray-100 dark:bg-gray-700
                     text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600
                     flex items-center gap-2"
        >
          <CalendarIcon className="h-4 w-4" />
          Custom
        </button>
      </div>
    </div>
  )
}

export default DateRangeSelector
