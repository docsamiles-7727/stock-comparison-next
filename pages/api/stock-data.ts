import type { NextApiRequest, NextApiResponse } from 'next'
import yahooFinance from 'yahoo-finance2'

type DateRange = {
  start: string
  end: string
}

const parseDateRange = (range: string): DateRange => {
  const now = new Date()
  
  switch (range) {
    case '1m':
      return { 
        start: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], 
        end: now.toISOString().split('T')[0] 
      }
    case '3m':
      return { 
        start: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], 
        end: now.toISOString().split('T')[0] 
      }
    case '6m':
      return { 
        start: new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], 
        end: now.toISOString().split('T')[0] 
      }
    case '1y':
      return { 
        start: new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], 
        end: now.toISOString().split('T')[0] 
      }
    case '3y':
      return { 
        start: new Date(now.getTime() - 3 * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], 
        end: now.toISOString().split('T')[0] 
      }
    case '5y':
      return { 
        start: new Date(now.getTime() - 5 * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], 
        end: now.toISOString().split('T')[0] 
      }
    default:
      if (range.includes('|')) {
        const [start, end] = range.split('|')
        return { start, end }
      }
      return { 
        start: new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], 
        end: now.toISOString().split('T')[0] 
      }
  }
}

type Point = {
  time: string
  open: number
  high: number
  low: number
  close: number
  volume: number
}

// Calculate moving average
const calculateMA = (data: Point[], period: number) => {
  const result = []
  for (let i = period - 1; i < data.length; i++) {
    const sum = data
      .slice(i - period + 1, i + 1)
      .reduce((acc, val) => acc + val.close, 0)
    
    result.push({
      time: data[i].time,
      value: sum / period,
    })
  }
  return result
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  const { symbol, range } = req.query
  
  if (!symbol || typeof symbol !== 'string') {
    return res.status(400).json({ message: 'Symbol is required' })
  }

  try {
    console.log(`[API] Fetching data for symbol: ${symbol}, range: ${range}`)
    
    const dateRange = parseDateRange(range as string)
    console.log(`[API] Parsed date range:`, dateRange)

    // Use yahoo-finance2 with basic configuration
    const queryOptions = {
      period1: new Date(dateRange.start),
      period2: new Date(dateRange.end),
      interval: '1d' as const
    }

    console.log(`[API] Yahoo Finance options:`, queryOptions)

    const historicalData = await yahooFinance.historical(symbol, queryOptions)
    console.log(`[API] Raw data received: ${historicalData.length} rows`)

    if (!historicalData || historicalData.length === 0) {
      console.log(`[API] No data received from Yahoo Finance for ${symbol}`)
      return res.status(404).json({ 
        message: `No data found for symbol ${symbol}`,
        symbol,
        dateRange 
      })
    }

    // Transform and filter data
    const chartData: Point[] = historicalData
      .map(row => ({
        time: row.date.toISOString().split('T')[0],
        open: row.open,
        high: row.high,
        low: row.low,
        close: row.close,
        volume: row.volume || 0,
      }))
      .filter(row => 
        typeof row.open === 'number' && 
        typeof row.high === 'number' && 
        typeof row.low === 'number' && 
        typeof row.close === 'number'
      )

    console.log(`[API] Filtered to ${chartData.length} complete data points`)

    if (chartData.length === 0) {
      return res.status(404).json({ 
        message: `No valid OHLC data for symbol ${symbol}`,
        symbol,
        dateRange,
        rawDataLength: historicalData.length 
      })
    }

    // Calculate technical indicators
    const ma50 = calculateMA(chartData, Math.min(50, chartData.length))
    const ma200 = calculateMA(chartData, Math.min(200, chartData.length))

    const response = {
      symbol,
      timeframe: { start: dateRange.start, end: dateRange.end },
      dataPoints: chartData.length,
      data: {
        ohlc: chartData,
        ma50,
        ma200,
        volume: chartData.map(d => ({
          time: d.time,
          value: d.volume,
          color: d.close >= d.open ? 'rgba(38, 166, 154, 0.5)' : 'rgba(239, 83, 80, 0.5)',
        })),
      }
    }

    console.log(`[API] Sending response with ${response.dataPoints} data points`)
    res.status(200).json(response)

  } catch (error) {
    console.error(`[API] Error fetching data for ${symbol}:`, error)
    
    const errorResponse = {
      message: 'Error fetching stock data',
      details: error instanceof Error ? error.message : 'Unknown error',
      symbol,
      range,
      stack: error instanceof Error ? error.stack : undefined
    }
    
    res.status(500).json(errorResponse)
  }
}