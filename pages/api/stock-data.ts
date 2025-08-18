import type { NextApiRequest, NextApiResponse } from 'next'
import yahooFinance, { type HistoricalOptions } from 'yahoo-finance2'

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

// Fetch data using Yahoo Finance's chart JSON endpoint (no crumb/cookies required)
type RawPoint = {
  time: string
  open: number | null
  high: number | null
  low: number | null
  close: number | null
  volume: number
}

type Point = {
  time: string
  open: number
  high: number
  low: number
  close: number
  volume: number
}

function isCompletePoint(p: RawPoint): p is Point {
  return p.open !== null && p.high !== null && p.low !== null && p.close !== null
}

const fetchYahooHistorical = async (symbol: string, start: string, end: string): Promise<Point[]> => {
  const options: HistoricalOptions = {
    period1: new Date(start),
    period2: new Date(end),
    interval: '1d'
  }
  const rows = await yahooFinance.historical(symbol, options)
  const data: RawPoint[] = rows.map(r => ({
    time: r.date.toISOString().split('T')[0],
    open: typeof r.open === 'number' ? r.open : null,
    high: typeof r.high === 'number' ? r.high : null,
    low: typeof r.low === 'number' ? r.low : null,
    close: typeof r.close === 'number' ? r.close : null,
    volume: typeof r.volume === 'number' ? r.volume : 0,
  }))
  return data.filter(isCompletePoint)
}

// Calculate moving average
const calculateMA = (data: any[], period: number) => {
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
    console.log(`Fetching data for symbol: ${symbol}, range: ${range}`)
    
    const dateRange = parseDateRange(range as string)
    console.log('Parsed date range:', dateRange)

    // Fetch historical data using yahoo-finance2 (Node client)
    const chartData = await fetchYahooHistorical(symbol, dateRange.start, dateRange.end)
    
    console.log(`Received ${chartData.length} data points`)

    if (!chartData || chartData.length === 0) {
      console.log('No data received from Yahoo Finance')
      return res.status(404).json({ message: 'No data found for the specified symbol and date range' })
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

    res.status(200).json(response)
  } catch (error) {
    console.error('Error in stock-data API:', error)
    
    // Detailed error response
    const errorResponse = {
      message: 'Error fetching stock data',
      details: error instanceof Error ? error.message : 'Unknown error',
      symbol,
      range,
    }
    
    res.status(500).json(errorResponse)
  }
}