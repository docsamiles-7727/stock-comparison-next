import { useState, useEffect, useMemo } from 'react'
import { useQuery } from 'react-query'
import axios from 'axios'

interface StockDataPoint {
  time: string
  value: number
}

interface StockApiResponse {
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
  }
}

interface DateRange {
  start: string
  end: string
}

const fetchStockData = async (symbol: string, dateRange: DateRange): Promise<StockDataPoint[]> => {
  try {
    const rangeString = `${dateRange.start}|${dateRange.end}`
    const { data } = await axios.get<StockApiResponse>(
      `/api/stock-data?symbol=${symbol}&range=${rangeString}`,
      { timeout: 15000 }
    )
    
    // Convert OHLC data to simple time series using close prices
    return data.data.ohlc.map(point => ({
      time: point.time,
      value: point.close
    }))
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message || `Failed to fetch data for ${symbol}`)
    }
    throw new Error('An unexpected error occurred')
  }
}

export interface GraphComparisonState {
  symbol1: string
  symbol2: string
  dateRange1: DateRange
  dateRange2: DateRange
  timeShift: number
  data1: StockDataPoint[]
  data2: StockDataPoint[]
  isLoading: boolean
  error: string | null
  correlation: number
  optimalShift: number
}

export const useGraphComparison = () => {
  const [state, setState] = useState<GraphComparisonState>({
    symbol1: 'SPY',
    symbol2: 'AAPL', 
    dateRange1: { start: '2y', end: 'now' },
    dateRange2: { start: '2y', end: 'now' },
    timeShift: 0,
    data1: [],
    data2: [],
    isLoading: false,
    error: null,
    correlation: 0,
    optimalShift: 0
  })

  // Fetch data for first symbol
  const query1 = useQuery(
    ['stockData', state.symbol1, state.dateRange1],
    () => fetchStockData(state.symbol1, state.dateRange1),
    {
      retry: 2,
      retryDelay: 1000,
      enabled: Boolean(state.symbol1),
      onError: (error: Error) => {
        setState(prev => ({ ...prev, error: `Error fetching ${state.symbol1}: ${error.message}` }))
      }
    }
  )

  // Fetch data for second symbol
  const query2 = useQuery(
    ['stockData', state.symbol2, state.dateRange2],
    () => fetchStockData(state.symbol2, state.dateRange2),
    {
      retry: 2,
      retryDelay: 1000,
      enabled: Boolean(state.symbol2),
      onError: (error: Error) => {
        setState(prev => ({ ...prev, error: `Error fetching ${state.symbol2}: ${error.message}` }))
      }
    }
  )

  // Calculate optimal time shift for maximum correlation
  const optimalShift = useMemo(() => {
    if (!query1.data || !query2.data || query1.data.length < 10 || query2.data.length < 10) {
      return 0
    }

    const normalizeData = (data: StockDataPoint[]) => {
      if (data.length === 0) return []
      const firstValue = data[0].value
      return data.map(point => ({
        time: point.time,
        value: ((point.value - firstValue) / firstValue) * 100
      }))
    }

    const applyTimeShift = (data: StockDataPoint[], shift: number) => {
      if (shift === 0) return data
      if (shift > 0) return data.slice(shift)
      return data.slice(0, data.length + shift)
    }

    const calculateCorrelation = (data1: StockDataPoint[], data2: StockDataPoint[], shift: number) => {
      const norm1 = normalizeData(data1)
      const norm2 = normalizeData(data2)
      const shifted2 = applyTimeShift(norm2, shift)
      
      const minLength = Math.min(norm1.length, shifted2.length)
      if (minLength < 2) return 0
      
      const values1 = norm1.slice(0, minLength).map(p => p.value)
      const values2 = shifted2.slice(0, minLength).map(p => p.value)
      
      const mean1 = values1.reduce((a, b) => a + b, 0) / values1.length
      const mean2 = values2.reduce((a, b) => a + b, 0) / values2.length
      
      let numerator = 0
      let sumSq1 = 0
      let sumSq2 = 0
      
      for (let i = 0; i < minLength; i++) {
        const diff1 = values1[i] - mean1
        const diff2 = values2[i] - mean2
        numerator += diff1 * diff2
        sumSq1 += diff1 * diff1
        sumSq2 += diff2 * diff2
      }
      
      const denominator = Math.sqrt(sumSq1 * sumSq2)
      return denominator === 0 ? 0 : numerator / denominator
    }

    const maxShift = Math.min(30, Math.floor(Math.min(query1.data.length, query2.data.length) / 4))
    let bestCorrelation = 0
    let bestShift = 0

    for (let shift = -maxShift; shift <= maxShift; shift++) {
      const correlation = calculateCorrelation(query1.data, query2.data, shift)
      if (Math.abs(correlation) > Math.abs(bestCorrelation)) {
        bestCorrelation = correlation
        bestShift = shift
      }
    }

    return bestShift
  }, [query1.data, query2.data])

  // Update state when data changes
  useEffect(() => {
    setState(prev => ({
      ...prev,
      data1: query1.data || [],
      data2: query2.data || [],
      isLoading: query1.isLoading || query2.isLoading,
      error: query1.error || query2.error ? 
        `${query1.error?.message || ''} ${query2.error?.message || ''}`.trim() : null,
      optimalShift
    }))
  }, [query1.data, query2.data, query1.isLoading, query2.isLoading, query1.error, query2.error, optimalShift])

  // Actions
  const setSymbol1 = (symbol: string) => {
    setState(prev => ({ ...prev, symbol1: symbol.toUpperCase() }))
  }

  const setSymbol2 = (symbol: string) => {
    setState(prev => ({ ...prev, symbol2: symbol.toUpperCase() }))
  }

  const setDateRange1 = (dateRange: DateRange) => {
    setState(prev => ({ ...prev, dateRange1: dateRange }))
  }

  const setDateRange2 = (dateRange: DateRange) => {
    setState(prev => ({ ...prev, dateRange2: dateRange }))
  }

  const setTimeShift = (shift: number) => {
    setState(prev => ({ ...prev, timeShift: shift }))
  }

  const useOptimalShift = () => {
    setState(prev => ({ ...prev, timeShift: prev.optimalShift }))
  }

  const reset = () => {
    setState(prev => ({ ...prev, timeShift: 0 }))
  }

  return {
    ...state,
    setSymbol1,
    setSymbol2,
    setDateRange1,
    setDateRange2,
    setTimeShift,
    useOptimalShift,
    reset,
    hasData: (query1.data?.length || 0) > 0 && (query2.data?.length || 0) > 0
  }
}
