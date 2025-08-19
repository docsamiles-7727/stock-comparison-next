import React, { useState, useEffect, useMemo } from 'react'
import { createChart, ColorType, IChartApi, ISeriesApi } from 'lightweight-charts'
import { useRef } from 'react'

interface DataPoint {
  time: string
  value: number
}

interface GraphComparisonProps {
  data1: DataPoint[]
  data2: DataPoint[]
  symbol1: string
  symbol2: string
  timeShift: number
  onTimeShiftChange: (shift: number) => void
  className?: string
}

export default function GraphComparison({
  data1,
  data2,
  symbol1,
  symbol2,
  timeShift,
  onTimeShiftChange,
  className = ''
}: GraphComparisonProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const [viewMode, setViewMode] = useState<'overlay' | 'difference' | 'correlation'>('overlay')

  // Normalize data to percentage changes from first value
  const normalizeData = (data: DataPoint[]) => {
    if (!data || !Array.isArray(data) || data.length === 0) return []
    
    // Find the first valid data point with a defined value
    const firstValidPoint = data.find(point => point && typeof point.value === 'number' && !isNaN(point.value))
    if (!firstValidPoint) return []
    
    const firstValue = firstValidPoint.value
    if (firstValue === 0) return [] // Avoid division by zero
    
    return data
      .filter(point => point && typeof point.value === 'number' && !isNaN(point.value))
      .map(point => ({
        time: point.time,
        value: ((point.value - firstValue) / firstValue) * 100
      }))
  }

  // Apply time shift to data
  const applyTimeShift = (data: DataPoint[], shift: number) => {
    if (!data || !Array.isArray(data) || data.length === 0 || shift === 0) return data
    
    if (shift > 0) {
      // Shift forward (remove first N points)
      return shift >= data.length ? [] : data.slice(shift)
    } else {
      // Shift backward (remove last N points)
      const endIndex = data.length + shift
      return endIndex <= 0 ? [] : data.slice(0, endIndex)
    }
  }

  // Calculate difference between two normalized datasets
  const calculateDifference = useMemo(() => {
    const norm1 = normalizeData(data1)
    const norm2 = normalizeData(data2)
    
    if (!norm1.length || !norm2.length) return []
    
    const shifted2 = applyTimeShift(norm2, timeShift)
    
    if (!shifted2.length) return []
    
    const minLength = Math.min(norm1.length, shifted2.length)
    const difference: DataPoint[] = []
    
    for (let i = 0; i < minLength; i++) {
      // Additional safety check
      if (norm1[i] && shifted2[i] && 
          typeof norm1[i].value === 'number' && 
          typeof shifted2[i].value === 'number') {
        difference.push({
          time: norm1[i].time,
          value: norm1[i].value - shifted2[i].value
        })
      }
    }
    
    return difference
  }, [data1, data2, timeShift])

  // Calculate correlation coefficient
  const calculateCorrelation = useMemo(() => {
    const norm1 = normalizeData(data1)
    const norm2 = normalizeData(data2)
    const shifted2 = applyTimeShift(norm2, timeShift)
    
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
  }, [data1, data2, timeShift])

  // Generate correlation data for different time shifts
  const correlationData = useMemo(() => {
    const maxShift = Math.min(50, Math.floor(Math.min(data1.length, data2.length) / 4))
    const correlations: DataPoint[] = []
    
    // Create a base date for synthetic time values
    const baseDate = new Date('2024-01-01')
    
    for (let shift = -maxShift; shift <= maxShift; shift++) {
      const norm1 = normalizeData(data1)
      const norm2 = normalizeData(data2)
      const shifted2 = applyTimeShift(norm2, shift)
      
      const minLength = Math.min(norm1.length, shifted2.length)
      if (minLength < 2) continue
      
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
      const correlation = denominator === 0 ? 0 : numerator / denominator
      
      // Create synthetic date by adding days to base date (ensuring uniqueness)
      const dayOffset = shift + maxShift // This makes all values positive and unique
      const syntheticDate = new Date(baseDate.getTime() + dayOffset * 24 * 60 * 60 * 1000)
      
      correlations.push({
        time: syntheticDate.toISOString().split('T')[0], // Format as yyyy-mm-dd
        value: correlation
      })
    }
    
    // Ensure data is sorted by time (should already be due to sequential loop, but being explicit)
    const sortedCorrelations = correlations.sort((a, b) => a.time.localeCompare(b.time))
    
    // Debug: Check for duplicate timestamps
    const timeSet = new Set(sortedCorrelations.map(item => item.time))
    if (timeSet.size !== sortedCorrelations.length) {
      console.warn('Duplicate timestamps detected in correlation data')
    }
    
    return sortedCorrelations
  }, [data1, data2])

  useEffect(() => {
    if (!chartContainerRef.current) return

    // Remove existing chart safely
    if (chartRef.current) {
      try {
        chartRef.current.remove()
      } catch (error) {
        // Chart may already be disposed, ignore the error
        console.warn('Chart removal warning:', error)
      }
      chartRef.current = null
    }

    // Create new chart
    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: '#ffffff' },
        textColor: '#333',
      },
      grid: {
        vertLines: { color: '#f0f0f0' },
        horzLines: { color: '#f0f0f0' },
      },
      width: chartContainerRef.current.clientWidth,
      height: 400,
      rightPriceScale: {
        borderColor: '#cccccc',
      },
      timeScale: {
        borderColor: '#cccccc',
        timeVisible: true,
        secondsVisible: false,
      },
    })

    chartRef.current = chart

    if (viewMode === 'overlay') {
      // Show both normalized series
      const series1 = chart.addLineSeries({
        color: '#2563eb',
        lineWidth: 2,
        title: symbol1,
      })
      
      const series2 = chart.addLineSeries({
        color: '#dc2626',
        lineWidth: 2,
        title: symbol2,
      })

      const norm1 = normalizeData(data1)
      const norm2 = normalizeData(data2)
      const shifted2 = applyTimeShift(norm2, timeShift)

      series1.setData(norm1)
      series2.setData(shifted2)
      
    } else if (viewMode === 'difference') {
      // Show difference
      const differenceSeries = chart.addLineSeries({
        color: '#059669',
        lineWidth: 2,
        title: `${symbol1} - ${symbol2}`,
      })
      
      differenceSeries.setData(calculateDifference)
      
    } else if (viewMode === 'correlation') {
      // Show correlation at different time shifts
      const correlationSeries = chart.addLineSeries({
        color: '#7c3aed',
        lineWidth: 2,
        title: 'Correlation vs Time Shift',
      })
      
      correlationSeries.setData(correlationData)
    }

    chart.timeScale().fitContent()

    // Handle resize
    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
        })
      }
    }

    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      if (chartRef.current) {
        try {
          chartRef.current.remove()
        } catch (error) {
          // Chart may already be disposed, ignore the error
          console.warn('Chart cleanup warning:', error)
        }
        chartRef.current = null
      }
    }
  }, [data1, data2, timeShift, viewMode, symbol1, symbol2, calculateDifference, correlationData])

  return (
    <div className={`bg-white rounded-lg shadow-lg p-6 ${className}`}>
      {/* Chart Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setViewMode('overlay')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              viewMode === 'overlay'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Overlay
          </button>
          <button
            onClick={() => setViewMode('difference')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              viewMode === 'difference'
                ? 'bg-green-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Difference
          </button>
          <button
            onClick={() => setViewMode('correlation')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              viewMode === 'correlation'
                ? 'bg-purple-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Correlation
          </button>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-gray-700">
            Correlation: {calculateCorrelation.toFixed(3)}
          </span>
          <div className="flex items-center gap-2">
            <span className="text-xs text-blue-600">●</span>
            <span className="text-sm text-gray-600">{symbol1}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-red-600">●</span>
            <span className="text-sm text-gray-600">{symbol2}</span>
          </div>
        </div>
      </div>

      {/* Time Shift Slider */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Time Shift: {timeShift} periods
          {timeShift > 0 && ` (${symbol2} leads ${symbol1})`}
          {timeShift < 0 && ` (${symbol1} leads ${symbol2})`}
        </label>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-500">{symbol1} leads</span>
          <input
            type="range"
            min={-Math.min(50, Math.floor(Math.min(data1.length, data2.length) / 4))}
            max={Math.min(50, Math.floor(Math.min(data1.length, data2.length) / 4))}
            value={timeShift}
            onChange={(e) => onTimeShiftChange(parseInt(e.target.value))}
            className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
          />
          <span className="text-sm text-gray-500">{symbol2} leads</span>
        </div>
      </div>

      {/* Chart */}
      <div ref={chartContainerRef} className="w-full h-[400px]" />

      {/* Analysis Results */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-2">Current Correlation</h4>
          <p className="text-2xl font-bold text-blue-600">{calculateCorrelation.toFixed(3)}</p>
          <p className="text-sm text-gray-600">
            {Math.abs(calculateCorrelation) > 0.7 ? 'Strong' : 
             Math.abs(calculateCorrelation) > 0.3 ? 'Moderate' : 'Weak'} correlation
          </p>
        </div>
        
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-2">Time Shift</h4>
          <p className="text-2xl font-bold text-green-600">{timeShift}</p>
          <p className="text-sm text-gray-600">
            {timeShift === 0 ? 'No shift' : 
             timeShift > 0 ? `${symbol2} leads by ${timeShift}` : 
             `${symbol1} leads by ${Math.abs(timeShift)}`}
          </p>
        </div>
        
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-2">Data Points</h4>
          <p className="text-2xl font-bold text-purple-600">
            {Math.min(data1.length, applyTimeShift(data2, timeShift).length)}
          </p>
          <p className="text-sm text-gray-600">Overlapping periods</p>
        </div>
      </div>
    </div>
  )
}
