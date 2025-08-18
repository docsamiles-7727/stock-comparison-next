import { useEffect, useRef } from 'react'
import { createChart, ColorType } from 'lightweight-charts'

interface StockChartProps {
  data: any
  options: {
    showMA: boolean
    showVolume: boolean
    showRSI: boolean
    showBollinger: boolean
    maPeriods: number[]
    bollingerPeriod: number
  }
  className?: string
}

const StockChart = ({ data, options, className }: StockChartProps) => {
  const chartContainerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<any>(null)

  useEffect(() => {
    if (!chartContainerRef.current || !data) return

    // Create chart
    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: '#666',
      },
      grid: {
        vertLines: { color: '#404040' },
        horzLines: { color: '#404040' },
      },
      width: chartContainerRef.current.clientWidth,
      height: 600,
    })

    // Add price series
    const mainSeries = chart.addCandlestickSeries({
      upColor: '#26a69a',
      downColor: '#ef5350',
      borderVisible: false,
      wickUpColor: '#26a69a',
      wickDownColor: '#ef5350',
    })

    // Add volume series if enabled
    if (options.showVolume) {
      const volumeSeries = chart.addHistogramSeries({
        color: '#26a69a50',
        priceFormat: {
          type: 'volume',
        },
        priceScaleId: '',
      })
      volumeSeries.setData(data.volume)
    }

    // Add moving averages if enabled
    if (options.showMA) {
      options.maPeriods.forEach((period, index) => {
        const maSeries = chart.addLineSeries({
          color: index === 0 ? '#2962FF' : '#FF6D00',
          lineWidth: 2,
        })
        maSeries.setData(data[`ma${period}`])
      })
    }

    // Add Bollinger Bands if enabled
    if (options.showBollinger) {
      const upperBandSeries = chart.addLineSeries({
        color: '#2962FF50',
        lineWidth: 1,
      })
      const lowerBandSeries = chart.addLineSeries({
        color: '#2962FF50',
        lineWidth: 1,
      })
      upperBandSeries.setData(data.bollingerUpper)
      lowerBandSeries.setData(data.bollingerLower)
    }

    // Set main series data
    mainSeries.setData(data.ohlc)

    // Fit content and add margin
    chart.timeScale().fitContent()
    chart.applyOptions({
      rightPriceScale: {
        scaleMargins: {
          top: 0.1,
          bottom: 0.2,
        },
      },
    })

    // Store chart reference
    chartRef.current = chart

    // Handle resize
    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({
          width: chartContainerRef.current.clientWidth,
        })
      }
    }

    window.addEventListener('resize', handleResize)

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize)
      chart.remove()
    }
  }, [data, options])

  return (
    <div ref={chartContainerRef} className={className} />
  )
}

export default StockChart
