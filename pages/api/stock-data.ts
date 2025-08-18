import type { NextApiRequest, NextApiResponse } from 'next'

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

const fetchYahooChartData = async (symbol: string, period1: string, period2: string): Promise<Point[]> => {
  const p1 = Math.floor(new Date(period1).getTime() / 1000)
  const p2 = Math.floor(new Date(period2).getTime() / 1000)
  const encodedSymbol = encodeURIComponent(symbol)

  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodedSymbol}?period1=${p1}&period2=${p2}&interval=1d&events=history&includeAdjustedClose=true&lang=en-US&region=US`

  const response = await fetch(url, {
    headers: {
      'Accept': 'application/json',
      'User-Agent': 'Mozilla/5.0'
    }
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch chart for ${symbol}: ${response.status}`)
  }

  const json = await response.json()
  const result = json?.chart?.result?.[0]
  if (!result) {
    const errMsg = json?.chart?.error?.description || 'Unknown chart error'
    throw new Error(`Yahoo chart error for ${symbol}: ${errMsg}`)
  }

  const timestamps: number[] = result.timestamp || []
  const quote = result.indicators?.quote?.[0]

  if (!quote || timestamps.length === 0) {
    throw new Error('No quote data returned')
  }

  const opens: Array<number | null> = quote.open || []
  const highs: Array<number | null> = quote.high || []
  const lows: Array<number | null> = quote.low || []
  const closes: Array<number | null> = quote.close || []
  const volumes: Array<number | null> = quote.volume || []

  const data: RawPoint[] = timestamps.map((ts, i) => {
    const o = opens[i]
    const h = highs[i]
    const l = lows[i]
    const c = closes[i]
    const v = volumes[i]
    return {
      time: new Date(ts * 1000).toISOString().split('T')[0],
      open: typeof o === 'number' ? o : null,
      high: typeof h === 'number' ? h : null,
      low: typeof l === 'number' ? l : null,
      close: typeof c === 'number' ? c : null,
      volume: typeof v === 'number' ? v : 0,
    }
  })

  // Filter out rows with missing close values
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

    // Fetch historical data using Yahoo Finance Chart JSON API
    const chartData = await fetchYahooChartData(symbol, dateRange.start, dateRange.end)
    
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