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

// Fetch data using Yahoo Finance's public API
const fetchYahooData = async (symbol: string, period1: string, period2: string) => {
  const period1Timestamp = Math.floor(new Date(period1).getTime() / 1000)
  const period2Timestamp = Math.floor(new Date(period2).getTime() / 1000)
  
  const url = `https://query1.finance.yahoo.com/v7/finance/download/${symbol}?period1=${period1Timestamp}&period2=${period2Timestamp}&interval=1d&events=history&includeAdjustedClose=true`
  
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
  })
  
  if (!response.ok) {
    throw new Error(`Failed to fetch data for ${symbol}: ${response.status}`)
  }
  
  const csvData = await response.text()
  return parseCSV(csvData)
}

// Parse CSV data
const parseCSV = (csvData: string) => {
  const lines = csvData.trim().split('\n')
  const header = lines[0].split(',')
  
  const data = lines.slice(1).map(line => {
    const values = line.split(',')
    const row: any = {}
    header.forEach((col, index) => {
      row[col] = values[index]
    })
    return row
  }).filter(row => row.Date && row.Date !== 'null' && !isNaN(parseFloat(row.Close)))

  return data.map(row => ({
    time: row.Date,
    open: parseFloat(row.Open),
    high: parseFloat(row.High),
    low: parseFloat(row.Low),
    close: parseFloat(row.Close),
    volume: parseInt(row.Volume) || 0,
  }))
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

    // Fetch historical data using Yahoo Finance CSV API
    const chartData = await fetchYahooData(symbol, dateRange.start, dateRange.end)
    
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