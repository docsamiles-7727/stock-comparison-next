import { useState } from 'react'
import Head from 'next/head'
import StockChart from '../components/StockChart'
import StockInput from '../components/StockInput'
import DateRangeSelector from '../components/DateRangeSelector'
import AnalysisOptions from '../components/AnalysisOptions'
import PerformanceMetrics from '../components/PerformanceMetrics'
import { useStockData } from '../lib/hooks/useStockData'

export default function Home() {
  const [ticker1, setTicker1] = useState('SPY')
  const [ticker2, setTicker2] = useState('AAPL')
  const [dateRange, setDateRange] = useState({ start: '1y', end: 'now' })
  const [options, setOptions] = useState({
    showMA: true,
    showVolume: true,
    showRSI: false,
    showBollinger: false,
    maPeriods: [50, 200],
    bollingerPeriod: 20,
  })

  const { data: stockData, isLoading, error } = useStockData(ticker1, ticker2, dateRange)

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Head>
        <title>Stock Comparison Tool</title>
        <meta name="description" content="Compare stock performance with advanced technical analysis" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-8">
          Stock Comparison Tool
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
          <StockInput
            label="First Stock"
            value={ticker1}
            onChange={setTicker1}
            placeholder="e.g., AAPL"
          />
          <StockInput
            label="Second Stock"
            value={ticker2}
            onChange={setTicker2}
            placeholder="e.g., MSFT"
          />
        </div>

        <DateRangeSelector value={dateRange} onChange={setDateRange} />
        
        <div className="mb-8">
          <AnalysisOptions value={options} onChange={setOptions} />
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900 p-4 rounded-lg mb-8">
            <p className="text-red-700 dark:text-red-100">{error}</p>
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center items-center h-96">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-500"></div>
          </div>
        ) : (
          <>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 mb-8">
              <StockChart
                data={stockData}
                options={options}
                className="h-[600px] w-full"
              />
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4">
              <PerformanceMetrics data={stockData} />
            </div>
          </>
        )}
      </main>

      <footer className="border-t border-gray-200 dark:border-gray-700 mt-12 py-6">
        <div className="container mx-auto px-4 text-center text-gray-600 dark:text-gray-400">
          <p>Data provided by Yahoo Finance • Prices adjusted for splits and dividends</p>
        </div>
      </footer>
    </div>
  )
}
