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
    case '2y':
      return { 
        start: new Date(now.getTime() - 2 * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], 
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
        // Handle special 'now' keyword for end date
        const endDate = end === 'now' ? now.toISOString().split('T')[0] : end
        // Validate start date format and handle period shortcuts
        let startDate = start
        if (['1m', '3m', '6m', '1y', '2y', '3y', '5y'].includes(start)) {
          // Recursively parse the start period
          const parsed = parseDateRange(start)
          startDate = parsed.start
        }
        return { start: startDate, end: endDate }
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

    // Validate date range
    const startDate = new Date(dateRange.start)
    const endDate = new Date(dateRange.end)
    
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      console.error(`[API] Invalid date range for ${symbol}:`, dateRange)
      return res.status(400).json({ 
        message: 'Invalid date range provided',
        symbol,
        dateRange,
        error: 'Start or end date is invalid'
      })
    }

    if (startDate >= endDate) {
      console.error(`[API] Start date must be before end date for ${symbol}:`, dateRange)
      return res.status(400).json({ 
        message: 'Start date must be before end date',
        symbol,
        dateRange
      })
    }

    // Use yahoo-finance2 with basic configuration
    const queryOptions = {
      period1: startDate,
      period2: endDate,
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
    
    // Handle specific Yahoo Finance errors
    if (error instanceof Error) {
      if (error.message.includes('400') || error.message.includes('Bad Request')) {
        return res.status(400).json({
          message: `Invalid request for symbol ${symbol}`,
          details: 'The symbol may not exist or the date range may be invalid',
          symbol,
          range,
          originalError: error.message
        })
      }
      
      if (error.message.includes('404') || error.message.includes('Not Found')) {
        return res.status(404).json({
          message: `Symbol ${symbol} not found`,
          details: 'The requested stock symbol does not exist',
          symbol,
          range
        })
      }
      
      if (error.message.includes('timeout') || error.message.includes('ETIMEDOUT')) {
        return res.status(504).json({
          message: 'Request timeout',
          details: 'The request to fetch stock data timed out',
          symbol,
          range
        })
      }
    }
    
    const errorResponse = {
      message: 'Error fetching stock data',
      details: error instanceof Error ? error.message : 'Unknown error',
      symbol,
      range,
      stack: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.stack : undefined) : undefined
    }
    
    res.status(500).json(errorResponse)
  }
}