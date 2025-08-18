import { useQuery } from 'react-query'
import axios from 'axios'

interface StockData {
  ohlc: any[]
  ma50: any[]
  ma200: any[]
  bollingerUpper: any[]
  bollingerLower: any[]
  volume: any[]
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
  const { data } = await axios.get(`/api/stock-data?symbol=${symbol}&range=${range}`)
  return data
}

export const useStockData = (
  ticker1: string,
  ticker2: string,
  dateRange: { start: string; end: string }
): UseStockDataResult => {
  const { data: data1, isLoading: isLoading1 } = useQuery(
    ['stockData', ticker1, dateRange],
    () => fetchStockData(ticker1, `${dateRange.start}|${dateRange.end}`),
    { enabled: !!ticker1 }
  )

  const { data: data2, isLoading: isLoading2 } = useQuery(
    ['stockData', ticker2, dateRange],
    () => fetchStockData(ticker2, `${dateRange.start}|${dateRange.end}`),
    { enabled: !!ticker2 }
  )

  if (isLoading1 || isLoading2) {
    return { data: null, isLoading: true, error: null }
  }

  if (!data1 || !data2) {
    return { 
      data: null, 
      isLoading: false, 
      error: new Error('Failed to fetch data') 
    }
  }

  // Calculate metrics
  const returns1 = data1.ohlc.map(d => d.close)
  const returns2 = data2.ohlc.map(d => d.close)
  
  const totalReturn1 = ((returns1[returns1.length - 1] / returns1[0]) - 1) * 100
  const totalReturn2 = ((returns2[returns2.length - 1] / returns2[0]) - 1) * 100
  
  const dailyReturns1 = returns1.slice(1).map((v, i) => (v / returns1[i]) - 1)
  const dailyReturns2 = returns2.slice(1).map((v, i) => (v / returns2[i]) - 1)
  
  const volatility1 = Math.sqrt(252) * Math.std(dailyReturns1) * 100
  const volatility2 = Math.sqrt(252) * Math.std(dailyReturns2) * 100
  
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
function calculateCorrelation(x: number[], y: number[]): number {
  const n = x.length
  const mean_x = x.reduce((a, b) => a + b) / n
  const mean_y = y.reduce((a, b) => a + b) / n
  
  const cov = x.reduce((acc, _, i) => 
    acc + (x[i] - mean_x) * (y[i] - mean_y), 0) / (n - 1)
  
  const std_x = Math.sqrt(x.reduce((acc, val) => 
    acc + Math.pow(val - mean_x, 2), 0) / (n - 1))
  
  const std_y = Math.sqrt(y.reduce((acc, val) => 
    acc + Math.pow(val - mean_y, 2), 0) / (n - 1))
  
  return cov / (std_x * std_y)
}

function calculateBeta(market: number[], stock: number[]): number {
  const covariance = calculateCovariance(market, stock)
  const variance = calculateVariance(market)
  return covariance / variance
}

function calculateCovariance(x: number[], y: number[]): number {
  const n = x.length
  const mean_x = x.reduce((a, b) => a + b) / n
  const mean_y = y.reduce((a, b) => a + b) / n
  return x.reduce((acc, _, i) => 
    acc + (x[i] - mean_x) * (y[i] - mean_y), 0) / (n - 1)
}

function calculateVariance(x: number[]): number {
  const n = x.length
  const mean = x.reduce((a, b) => a + b) / n
  return x.reduce((acc, val) => 
    acc + Math.pow(val - mean, 2), 0) / (n - 1)
}
