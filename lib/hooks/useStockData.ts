import { useQuery } from 'react-query'
import axios, { AxiosError } from 'axios'

interface StockData {
  symbol: string
  timeframe: {
    start: string
    end: string
  }
  dataPoints: number
  data: {
    ohlc: Array<{
      time: string
      open: number
      high: number
      low: number
      close: number
      volume: number
    }>
    ma50: Array<{
      time: string
      value: number
    }>
    ma200: Array<{
      time: string
      value: number
    }>
    volume: Array<{
      time: string
      value: number
      color: string
    }>
  }
}

interface UseStockDataResult {
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
  } | null
  isLoading: boolean
  error: Error | null
}

const fetchStockData = async (symbol: string, range: string): Promise<StockData> => {
  try {
    const { data } = await axios.get(`/api/stock-data?symbol=${symbol}&range=${range}`, {
      timeout: 10000, // 10 second timeout
    })
    return data
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.response) {
        throw new Error(error.response.data.message || `Failed to fetch data for ${symbol}`)
      } else if (error.request) {
        throw new Error('No response received from server')
      } else {
        throw new Error(`Error setting up request: ${error.message}`)
      }
    }
    throw new Error('An unexpected error occurred')
  }
}

export const useStockData = (
  ticker1: string,
  ticker2: string,
  dateRange: { start: string; end: string }
): UseStockDataResult => {
  const { data: data1, isLoading: isLoading1, error: error1 } = useQuery<StockData, Error>(
    ['stockData', ticker1, dateRange],
    () => fetchStockData(ticker1, `${dateRange.start}|${dateRange.end}`),
    {
      retry: 2,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
      enabled: Boolean(ticker1),
    }
  )

  const { data: data2, isLoading: isLoading2, error: error2 } = useQuery<StockData, Error>(
    ['stockData', ticker2, dateRange],
    () => fetchStockData(ticker2, `${dateRange.start}|${dateRange.end}`),
    {
      retry: 2,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
      enabled: Boolean(ticker2),
    }
  )

  if (isLoading1 || isLoading2) {
    return { data: null, isLoading: true, error: null }
  }

  if (error1 || error2) {
    const errorMessage = error1?.message || error2?.message || 'Failed to fetch data'
    return { 
      data: null, 
      isLoading: false, 
      error: new Error(errorMessage)
    }
  }

  if (!data1?.data || !data2?.data) {
    return { 
      data: null, 
      isLoading: false, 
      error: new Error('No data available') 
    }
  }

  // Calculate metrics
  const returns1 = data1.data.ohlc.map(d => d.close)
  const returns2 = data2.data.ohlc.map(d => d.close)
  
  const totalReturn1 = ((returns1[returns1.length - 1] / returns1[0]) - 1) * 100
  const totalReturn2 = ((returns2[returns2.length - 1] / returns2[0]) - 1) * 100
  
  const dailyReturns1 = returns1.slice(1).map((v, i) => (v / returns1[i]) - 1)
  const dailyReturns2 = returns2.slice(1).map((v, i) => (v / returns2[i]) - 1)
  
  const volatility1 = Math.sqrt(252) * calculateStandardDeviation(dailyReturns1) * 100
  const volatility2 = Math.sqrt(252) * calculateStandardDeviation(dailyReturns2) * 100
  
  const correlation = calculateCorrelation(dailyReturns1, dailyReturns2)
  const beta = calculateBeta(dailyReturns1, dailyReturns2)
  
  const riskFreeRate = 0.02 // Assume 2% risk-free rate
  const sharpeRatio1 = ((totalReturn1 / 100) - riskFreeRate) / (volatility1 / 100)
  const sharpeRatio2 = ((totalReturn2 / 100) - riskFreeRate) / (volatility2 / 100)

  return {
    data: {
      ticker1,
      ticker2,
      metrics: {
        totalReturn1,
        totalReturn2,
        volatility1,
        volatility2,
        correlation,
        beta,
        sharpeRatio1,
        sharpeRatio2,
      }
    },
    isLoading: false,
    error: null
  }
}

// Helper functions
function calculateStandardDeviation(values: number[]): number {
  const n = values.length
  if (n < 2) return 0

  const mean = values.reduce((acc, val) => acc + val, 0) / n
  const variance = values.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / (n - 1)
  return Math.sqrt(variance)
}

function calculateCorrelation(x: number[], y: number[]): number {
  const n = x.length
  if (n < 2) return 0

  const mean_x = x.reduce((a, b) => a + b) / n
  const mean_y = y.reduce((a, b) => a + b) / n
  
  const cov = x.reduce((acc, _, i) => 
    acc + (x[i] - mean_x) * (y[i] - mean_y), 0) / (n - 1)
  
  const std_x = calculateStandardDeviation(x)
  const std_y = calculateStandardDeviation(y)
  
  return cov / (std_x * std_y)
}

function calculateBeta(market: number[], stock: number[]): number {
  const covariance = calculateCovariance(market, stock)
  const variance = calculateVariance(market)
  return variance === 0 ? 0 : covariance / variance
}

function calculateCovariance(x: number[], y: number[]): number {
  const n = x.length
  if (n < 2) return 0

  const mean_x = x.reduce((a, b) => a + b) / n
  const mean_y = y.reduce((a, b) => a + b) / n
  return x.reduce((acc, _, i) => 
    acc + (x[i] - mean_x) * (y[i] - mean_y), 0) / (n - 1)
}

function calculateVariance(x: number[]): number {
  const n = x.length
  if (n < 2) return 0

  const mean = x.reduce((a, b) => a + b) / n
  return x.reduce((acc, val) => 
    acc + Math.pow(val - mean, 2), 0) / (n - 1)
}