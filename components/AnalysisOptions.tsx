interface AnalysisOptionsProps {
  value: {
    showMA: boolean
    showVolume: boolean
    showRSI: boolean
    showBollinger: boolean
    maPeriods: number[]
    bollingerPeriod: number
  }
  onChange: (options: any) => void
}

const AnalysisOptions = ({ value, onChange }: AnalysisOptionsProps) => {
  const handleChange = (key: string, newValue: any) => {
    onChange({ ...value, [key]: newValue })
  }

  const handleMAPeriodToggle = (period: number) => {
    const newPeriods = value.maPeriods.includes(period)
      ? value.maPeriods.filter(p => p !== period)
      : [...value.maPeriods, period].sort((a, b) => a - b)
    handleChange('maPeriods', newPeriods)
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
        Analysis Options
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Moving Averages */}
        <div>
          <label className="flex items-center mb-2">
            <input
              type="checkbox"
              checked={value.showMA}
              onChange={(e) => handleChange('showMA', e.target.checked)}
              className="rounded border-gray-300 text-primary-500 focus:ring-primary-500"
            />
            <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
              Moving Averages
            </span>
          </label>
          
          {value.showMA && (
            <div className="ml-6 space-y-2">
              {[20, 50, 100, 200].map((period) => (
                <label key={period} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={value.maPeriods.includes(period)}
                    onChange={() => handleMAPeriodToggle(period)}
                    className="rounded border-gray-300 text-primary-500 focus:ring-primary-500"
                  />
                  <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                    {period} days
                  </span>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Volume */}
        <div>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={value.showVolume}
              onChange={(e) => handleChange('showVolume', e.target.checked)}
              className="rounded border-gray-300 text-primary-500 focus:ring-primary-500"
            />
            <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
              Show Volume
            </span>
          </label>
        </div>

        {/* RSI */}
        <div>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={value.showRSI}
              onChange={(e) => handleChange('showRSI', e.target.checked)}
              className="rounded border-gray-300 text-primary-500 focus:ring-primary-500"
            />
            <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
              Show RSI
            </span>
          </label>
        </div>

        {/* Bollinger Bands */}
        <div>
          <label className="flex items-center mb-2">
            <input
              type="checkbox"
              checked={value.showBollinger}
              onChange={(e) => handleChange('showBollinger', e.target.checked)}
              className="rounded border-gray-300 text-primary-500 focus:ring-primary-500"
            />
            <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
              Bollinger Bands
            </span>
          </label>
          
          {value.showBollinger && (
            <div className="ml-6">
              <label className="text-sm text-gray-600 dark:text-gray-400">
                Period:
                <input
                  type="number"
                  value={value.bollingerPeriod}
                  onChange={(e) => handleChange('bollingerPeriod', parseInt(e.target.value))}
                  min={5}
                  max={50}
                  className="ml-2 w-16 rounded border-gray-300 dark:border-gray-600
                           bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </label>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default AnalysisOptions
