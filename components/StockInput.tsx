import { useState, useEffect } from 'react'
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline'

interface StockInputProps {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

const POPULAR_STOCKS = [
  { symbol: 'AAPL', name: 'Apple Inc.' },
  { symbol: 'MSFT', name: 'Microsoft Corporation' },
  { symbol: 'GOOGL', name: 'Alphabet Inc.' },
  { symbol: 'AMZN', name: 'Amazon.com Inc.' },
  { symbol: 'SPY', name: 'S&P 500 ETF' },
  { symbol: '^GSPC', name: 'S&P 500 Index' },
  { symbol: '^DJI', name: 'Dow Jones Industrial Average' },
  { symbol: '^IXIC', name: 'NASDAQ Composite' },
]

const StockInput = ({ label, value, onChange, placeholder }: StockInputProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [suggestions, setSuggestions] = useState(POPULAR_STOCKS)

  useEffect(() => {
    if (search) {
      const filtered = POPULAR_STOCKS.filter(
        stock => 
          stock.symbol.toLowerCase().includes(search.toLowerCase()) ||
          stock.name.toLowerCase().includes(search.toLowerCase())
      )
      setSuggestions(filtered)
    } else {
      setSuggestions(POPULAR_STOCKS)
    }
  }, [search])

  const handleSelect = (symbol: string) => {
    onChange(symbol)
    setIsOpen(false)
    setSearch('')
  }

  return (
    <div className="relative">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        {label}
      </label>
      <div className="relative">
        <input
          type="text"
          value={value}
          onChange={(e) => {
            onChange(e.target.value.toUpperCase())
            setSearch(e.target.value)
            setIsOpen(true)
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                   bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                   focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        />
        <MagnifyingGlassIcon className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" />
      </div>

      {isOpen && (
        <div 
          className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg
                     border border-gray-200 dark:border-gray-700 max-h-60 overflow-auto"
          onMouseDown={(e) => e.preventDefault()}
        >
          {suggestions.map((stock) => (
            <button
              key={stock.symbol}
              onClick={() => handleSelect(stock.symbol)}
              className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700
                         flex items-center justify-between"
            >
              <span className="font-medium">{stock.symbol}</span>
              <span className="text-sm text-gray-500 dark:text-gray-400">{stock.name}</span>
            </button>
          ))}
          {suggestions.length === 0 && (
            <div className="px-4 py-2 text-gray-500 dark:text-gray-400">
              No matches found
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default StockInput
