interface MetricCardProps {
  label: string
  value: string | number
  change?: string | number
  tooltip?: string
}

const MetricCard = ({ label, value, change, tooltip }: MetricCardProps) => (
  <div 
    className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4"
    title={tooltip}
  >
    <div className="text-sm text-gray-500 dark:text-gray-400">{label}</div>
    <div className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">
      {value}
    </div>
    {change !== undefined && (
      <div className={`mt-1 text-sm ${
        Number(change) >= 0 
          ? 'text-green-600 dark:text-green-400'
          : 'text-red-600 dark:text-red-400'
      }`}>
        {Number(change) >= 0 ? '+' : ''}{change}
      </div>
    )}
  </div>
)

interface PerformanceMetricsProps {
  data: {
    ticker1: string
    ticker2: string
    metrics: {
      totalReturn1: number
      totalReturn2: number
      volatility1: number
      volatility2: number
      correlation: number
      beta: number
      sharpeRatio1: number
      sharpeRatio2: number
    }
  }
}

const PerformanceMetrics = ({ data }: PerformanceMetricsProps) => {
  const { ticker1, ticker2, metrics } = data

  return (
    <div>
      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
        Performance Metrics
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label={`${ticker1} Return`}
          value={`${metrics.totalReturn1.toFixed(2)}%`}
          tooltip="Total return since start date"
        />

        <MetricCard
          label={`${ticker2} Return`}
          value={`${metrics.totalReturn2.toFixed(2)}%`}
          tooltip="Total return since start date"
        />

        <MetricCard
          label="Correlation"
          value={metrics.correlation.toFixed(2)}
          tooltip="Price correlation coefficient (-1 to 1)"
        />

        <MetricCard
          label="Beta"
          value={metrics.beta.toFixed(2)}
          tooltip={`${ticker2}'s sensitivity to ${ticker1}'s movements`}
        />

        <MetricCard
          label={`${ticker1} Volatility`}
          value={`${metrics.volatility1.toFixed(2)}%`}
          tooltip="Annualized standard deviation of returns"
        />

        <MetricCard
          label={`${ticker2} Volatility`}
          value={`${metrics.volatility2.toFixed(2)}%`}
          tooltip="Annualized standard deviation of returns"
        />

        <MetricCard
          label={`${ticker1} Sharpe Ratio`}
          value={metrics.sharpeRatio1.toFixed(2)}
          tooltip="Risk-adjusted return (higher is better)"
        />

        <MetricCard
          label={`${ticker2} Sharpe Ratio`}
          value={metrics.sharpeRatio2.toFixed(2)}
          tooltip="Risk-adjusted return (higher is better)"
        />
      </div>
    </div>
  )
}

export default PerformanceMetrics
