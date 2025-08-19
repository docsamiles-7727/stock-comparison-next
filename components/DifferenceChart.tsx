import React, { useEffect, useRef } from 'react'
import { createChart, ColorType, IChartApi, ISeriesApi } from 'lightweight-charts'

interface DifferenceData {
  difference: Array<{
    time: string
    value: number
  }>
  normalizedSeries1: Array<{
    time: string
    value: number
  }>
  normalizedSeries2: Array<{
    time: string
    value: number
  }>
  correlation: number
  timeShift: number
  ticker1: string
  ticker2: string
}

interface DifferenceChartProps {
  data: DifferenceData
  timeShift?: number
  className?: string
}

export default function DifferenceChart({ 
  data, 
  timeShift = 0, 
  className = '' 
}: DifferenceChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)

  useEffect(() => {
    if (!chartContainerRef.current || !data.difference.length) return

    // Create chart
    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: '#ffffff' },
        textColor: '#333',
      },
      width: chartContainerRef.current.clientWidth,
      height: 400,
      grid: {
        vertLines: { color: '#f0f0f0' },
        horzLines: { color: '#f0f0f0' },
      },
      rightPriceScale: {
        borderColor: '#cccccc',
        scaleMargins: {
          top: 0.1,
          bottom: 0.1,
        },
      },
      timeScale: {
        borderColor: '#cccccc',
        timeVisible: true,
        secondsVisible: false,
      },
    })

    chartRef.current = chart

    // Add normalized series 1 (reference stock)
    const normalizedSeries1 = chart.addLineSeries({
      color: '#2196F3',
      lineWidth: 2,
      title: `${data.ticker1} (Normalized)`,
    })

    // Add normalized series 2 (comparison stock)
    const normalizedSeries2 = chart.addLineSeries({
      color: '#FF9800',
      lineWidth: 2,
      title: `${data.ticker2} (Normalized)`,
    })

    // Add difference series (primary focus)
    const differenceSeries = chart.addLineSeries({
      color: '#F44336',
      lineWidth: 3,
      title: `Difference (${data.ticker1} - ${data.ticker2})`,
    })

    // Add zero line for reference
    const zeroLineSeries = chart.addLineSeries({
      color: '#666666',
      lineWidth: 1,
      lineStyle: 2, // dashed
      title: 'Zero Line',
    })

    // Apply time shift if specified
    const shiftedData1 = applyTimeShift(data.normalizedSeries1, timeShift)
    const shiftedData2 = applyTimeShift(data.normalizedSeries2, timeShift)
    const shiftedDifference = applyTimeShift(data.difference, timeShift)

    // Set data
    normalizedSeries1.setData(shiftedData1)
    normalizedSeries2.setData(shiftedData2)
    differenceSeries.setData(shiftedDifference)
    
    // Create zero line data
    const zeroLineData = shiftedDifference.map(point => ({
      time: point.time,
      value: 0
    }))
    zeroLineSeries.setData(zeroLineData)

    // Fit content
    chart.timeScale().fitContent()

    // Handle resize
    const handleResize = () => {
      if (chartContainerRef.current && chart) {
        chart.applyOptions({
          width: chartContainerRef.current.clientWidth,
        })
      }
    }

    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      try {
        chart.remove()
      } catch (error) {
        // Chart may already be disposed, ignore the error
        console.warn('Chart cleanup warning:', error)
      }
      chartRef.current = null
    }
  }, [data, timeShift])

  // Apply time shift to data
  function applyTimeShift(data: Array<{time: string, value: number}>, shift: number) {
    if (shift === 0) return data
    
    // Create a new array with shifted timestamps
    return data.map((point, index) => {
      // Calculate new index position after shift
      const newIndex = index + shift
      
      // If the shift pushes us outside the bounds, return null (will be filtered out)
      if (newIndex < 0 || newIndex >= data.length) {
        return null
      }
      
      // Use the original timestamp but shifted value
      return {
        time: point.time,
        value: data[newIndex].value
      }
    }).filter((point): point is {time: string, value: number} => point !== null)
  }

  return (
    <div className={`${className}`}>
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Price Difference Analysis
        </h3>
        <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400">
          <div>
            <span className="font-medium">Correlation:</span>{' '}
            <span className={`font-mono ${
              data.correlation > 0.7 ? 'text-green-600' : 
              data.correlation > 0.3 ? 'text-yellow-600' : 'text-red-600'
            }`}>
              {data.correlation.toFixed(3)}
            </span>
          </div>
          <div>
            <span className="font-medium">Time Shift:</span>{' '}
            <span className="font-mono">{timeShift} days</span>
          </div>
          <div>
            <span className="font-medium">Data Points:</span>{' '}
            <span className="font-mono">{data.difference.length}</span>
          </div>
        </div>
      </div>
      
      <div ref={chartContainerRef} className="w-full" />
      
      <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <h4 className="font-medium text-gray-900 dark:text-white mb-2">
          Understanding the Difference Chart
        </h4>
        <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-4 h-0.5 bg-blue-500"></div>
            <span><strong>{data.ticker1}</strong> normalized price movement</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-0.5 bg-orange-500"></div>
            <span><strong>{data.ticker2}</strong> normalized price movement</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-0.5 bg-red-500"></div>
            <span><strong>Difference</strong> ({data.ticker1} - {data.ticker2})</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-0.5 bg-gray-500 border-dashed border-t"></div>
            <span><strong>Zero Line</strong> (no difference)</span>
          </div>
        </div>
        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
          Positive values indicate {data.ticker1} outperforming {data.ticker2}. 
          Negative values indicate {data.ticker2} outperforming {data.ticker1}.
        </p>
      </div>
    </div>
  )
}
