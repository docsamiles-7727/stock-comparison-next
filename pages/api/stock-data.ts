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

const calculateMA = (data: any[], period: number) => {
  const result = []
  for (let i = period - 1; i < data.length; i++) {
    const sum = data.slice(i - period + 1, i + 1).reduce((acc, val) => acc + val.close, 0)
    result.push({
      time: data[i].time,
      value: sum / period,
    })
  }
  return result
}

const calculateBollingerBands = (data: any[], period: number, stdDev: number = 2) => {
  const upper = []
  const lower = []
  
  for (let i = period - 1; i < data.length; i++) {
    const slice = data.slice(i - period + 1, i + 1)
    const ma = slice.reduce((acc, val) => acc + val.close, 0) / period
    const variance = slice.reduce((acc, val) => acc + Math.pow(val.close - ma, 2), 0) / period
    const std = Math.sqrt(variance)
    
    upper.push({
      time: data[i].time,
      value: ma + (stdDev * std),
    })
    lower.push({
      time: data[i].time,
      value: ma - (stdDev * std),
    })
  }
  
  return { upper, lower }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  const { symbol, range } = req.query
  
  if (!symbol || typeof symbol !== 'string') {
    return res.status(400).json({ message: 'Symbol is required' })
  }

  try {
    const dateRange = parseDateRange(range as string)
    
    // Create a query options object that matches the library's expectations
    const queryOptions = {
      period1: dateRange.start,  // ISO string is accepted
      period2: dateRange.end,    // ISO string is accepted
      interval: '1d' as const    // Type assertion to match expected literal type
    }

    // Fetch historical data
    const result = await yahooFinance.historical(symbol, queryOptions)
    
    // Transform data for the chart
    const chartData = result.map(quote => ({
      time: quote.date.toISOString().split('T')[0],
      open: quote.open,
      high: quote.high,
      low: quote.low,
      close: quote.close,
      volume: quote.volume,
    }))

    // Calculate technical indicators
    const ma50 = calculateMA(chartData, 50)
    const ma200 = calculateMA(chartData, 200)
    const bollinger = calculateBollingerBands(chartData, 20)

    res.status(200).json({
      ohlc: chartData,
      ma50,
      ma200,
      bollingerUpper: bollinger.upper,
      bollingerLower: bollinger.lower,
      volume: chartData.map(d => ({
        time: d.time,
        value: d.volume,
        color: d.close >= d.open ? 'rgba(38, 166, 154, 0.5)' : 'rgba(239, 83, 80, 0.5)',
      })),
    })
  } catch (error) {
    console.error('Error fetching stock data:', error)
    res.status(500).json({ message: 'Error fetching stock data' })
  }
}