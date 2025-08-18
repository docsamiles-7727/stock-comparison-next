import type { NextApiRequest, NextApiResponse } from 'next'
import yahooFinance from 'yahoo-finance2'
import { startOfDay, subYears, subMonths, parseISO } from 'date-fns'

type DateRange = {
  start: string
  end: string
}

const parseDateRange = (range: string): DateRange => {
  const now = startOfDay(new Date())
  
  switch (range) {
    case '1m':
      return { start: subMonths(now, 1).toISOString(), end: now.toISOString() }
    case '3m':
      return { start: subMonths(now, 3).toISOString(), end: now.toISOString() }
    case '6m':
      return { start: subMonths(now, 6).toISOString(), end: now.toISOString() }
    case '1y':
      return { start: subYears(now, 1).toISOString(), end: now.toISOString() }
    case '3y':
      return { start: subYears(now, 3).toISOString(), end: now.toISOString() }
    case '5y':
      return { start: subYears(now, 5).toISOString(), end: now.toISOString() }
    default:
      if (range.includes('|')) {
        const [start, end] = range.split('|')
        return {
          start: parseISO(start).toISOString(),
          end: parseISO(end).toISOString(),
        }
      }
      return { start: subYears(now, 1).toISOString(), end: now.toISOString() }
  }
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

    // Fetch historical data with correct parameters
    const result = await yahooFinance.historical(symbol, {
      period1: new Date(dateRange.start),
      period2: new Date(dateRange.end),
      interval: '1d',
    })
    
    console.log(`Received ${result.length} data points`)

    if (!result || result.length === 0) {
      console.log('No data received from Yahoo Finance')
      return res.status(404).json({ message: 'No data found for the specified symbol and date range' })
    }

    // Transform data for the chart
    const chartData = result.map(quote => ({
      time: quote.date.toISOString().split('T')[0],
      open: quote.open,
      high: quote.high,
      low: quote.low,
      close: quote.close,
      volume: quote.volume,
    }))

    // Basic data validation
    const hasInvalidData = chartData.some(data => 
      !data.open || !data.high || !data.low || !data.close || !data.volume
    )

    if (hasInvalidData) {
      console.log('Invalid data detected in response')
      return res.status(500).json({ message: 'Invalid data received from Yahoo Finance' })
    }

    // Calculate technical indicators
    const ma50 = calculateMA(chartData, 50)
    const ma200 = calculateMA(chartData, 200)

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

// Helper function to calculate Moving Average
function calculateMA(data: any[], period: number) {
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