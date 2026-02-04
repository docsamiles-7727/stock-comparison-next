import { useState } from 'react'
import Head from 'next/head'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Slider } from '@/components/ui/slider'
import GraphComparison from '../components/GraphComparison'
import DifferenceChart from '../components/DifferenceChart'
import { useGraphComparison } from '../lib/hooks/useGraphComparison'
import { useStockData } from '../lib/hooks/useStockData'

export default function Home() {
  const {
    symbol1,
    symbol2,
    dateRange1,
    dateRange2,
    timeShift,
    data1,
    data2,
    isLoading,
    error,
    optimalShift,
    setSymbol1,
    setSymbol2,
    setDateRange1,
    setDateRange2,
    setTimeShift,
    useOptimalShift,
    reset,
    hasData
  } = useGraphComparison()

  // Get difference analysis data
  const { data: stockComparisonData, isLoading: isLoadingComparison } = useStockData(
    symbol1,
    symbol2,
    dateRange1
  )

  const predefinedRanges = [
    { label: '1M', value: '1m' },
    { label: '3M', value: '3m' },
    { label: '6M', value: '6m' },
    { label: '1Y', value: '1y' },
    { label: '2Y', value: '2y' },
    { label: '5Y', value: '5y' },
  ]

  const handleRangeSelect = (range: string) => {
    const dateRange = { start: range, end: 'now' }
    setDateRange1(dateRange)
    setDateRange2(dateRange)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Head>
        <title>Advanced Graph Comparison Tool</title>
        <meta name="description" content="Compare any two financial time series with time-shifting analysis" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="container mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Advanced Graph Comparison
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Compare any two financial time series, analyze their differences, and discover lead-lag relationships with intelligent time-shifting
          </p>
        </div>

        {/* Controls */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Stock Symbol Comparison</CardTitle>
            <CardDescription>
              Enter two financial symbols to compare their performance over time
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Symbol Inputs */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              {/* First Symbol */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <h3 className="text-lg font-semibold">First Symbol</h3>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="symbol1">Symbol</Label>
                  <Input
                    id="symbol1"
                    type="text"
                    value={symbol1}
                    onChange={(e) => setSymbol1(e.target.value)}
                    placeholder="e.g., SPY, AAPL"
                  />
                </div>
              </div>

              {/* Second Symbol */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <h3 className="text-lg font-semibold">Second Symbol</h3>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="symbol2">Symbol</Label>
                  <Input
                    id="symbol2"
                    type="text"
                    value={symbol2}
                    onChange={(e) => setSymbol2(e.target.value)}
                    placeholder="e.g., TSLA, NVDA"
                  />
                </div>
              </div>
            </div>

            <Separator className="my-6" />
            
            {/* Shared Time Period */}
            <div className="text-center space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">
                  Time Period
                </h3>
                <p className="text-sm text-muted-foreground">
                  Applied to both symbols
                </p>
              </div>
              <div className="flex flex-wrap justify-center gap-2">
                {predefinedRanges.map((range) => (
                  <Button
                    key={range.value}
                    onClick={() => handleRangeSelect(range.value)}
                    variant={dateRange1.start === range.value ? "default" : "outline"}
                    size="sm"
                  >
                    {range.label}
                  </Button>
                ))}
              </div>
            </div>
            
            <Separator className="my-6" />

            {/* Analysis Controls */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Analysis Controls</h3>
              
              <div className="flex flex-wrap items-center gap-4">
                <Button
                  onClick={() => setTimeShift(0)}
                  variant="secondary"
                  size="sm"
                >
                  Reset Shift
                </Button>
                
                <Button
                  onClick={useOptimalShift}
                  disabled={!hasData}
                  variant="default"
                  size="sm"
                  className="bg-green-600 hover:bg-green-700"
                >
                  Optimal Shift
                  <Badge variant="secondary" className="ml-2">
                    {optimalShift}
                  </Badge>
                </Button>

                <div className="flex items-center gap-3 bg-muted px-4 py-2 rounded-lg">
                  <Label className="text-sm whitespace-nowrap">
                    Time Shift:
                  </Label>
                  <Slider
                    value={[timeShift]}
                    onValueChange={(value) => setTimeShift(value[0])}
                    max={30}
                    min={-30}
                    step={1}
                    disabled={!hasData}
                    className="w-32"
                  />
                  <Badge variant="outline" className="min-w-[3rem] text-center">
                    {timeShift}d
                  </Badge>
                </div>
              </div>
            </div>

            {isLoading && (
              <div className="flex items-center gap-2 text-blue-600 mt-4">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                <span>Loading data...</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Error Display */}
        {error && (
          <Card className="mb-8 border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">Error loading data</h3>
                  <p className="mt-1 text-sm text-red-700">{error}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Chart */}
        {hasData && !isLoading && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Stock Comparison Chart</CardTitle>
              <CardDescription>
                Interactive comparison of {symbol1} vs {symbol2}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <GraphComparison
                data1={data1}
                data2={data2}
                symbol1={symbol1}
                symbol2={symbol2}
                timeShift={timeShift}
                onTimeShiftChange={setTimeShift}
                className="w-full"
              />
            </CardContent>
          </Card>
        )}

        {/* Difference Analysis Chart */}
        {stockComparisonData && !isLoadingComparison && stockComparisonData.differenceData && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Difference Analysis</CardTitle>
              <CardDescription>
                Normalized difference between {symbol1} and {symbol2} with time-shifting
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DifferenceChart
                data={stockComparisonData.differenceData}
                timeShift={timeShift}
                className="w-full"
              />
            </CardContent>
          </Card>
        )}

        {/* Alternative: Show manual trigger if data isn't auto-loading */}
        {!hasData && !isLoading && !stockComparisonData && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="text-center">Test the Difference Chart & Time Shifting</CardTitle>
              <CardDescription className="text-center">
                Click below to load sample data and see the difference chart with time-shifting controls.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Button
                onClick={() => {
                  setSymbol1('SPY')
                  setSymbol2('AAPL') 
                  setDateRange1({ start: '1y', end: 'now' })
                  setDateRange2({ start: '1y', end: 'now' })
                }}
                size="lg"
                className="bg-blue-600 hover:bg-blue-700"
              >
                Load Sample Comparison (SPY vs AAPL)
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Empty State */}
        {!hasData && !isLoading && !error && (
          <div className="text-center py-16">
            <div className="mx-auto h-24 w-24 text-gray-400 mb-4">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Ready to compare</h3>
            <p className="text-gray-600">Enter symbols and select time periods to start analyzing</p>
          </div>
        )}
      </main>

      <footer className="border-t border-gray-200 mt-12 py-6 bg-white">
        <div className="container mx-auto px-4 text-center text-gray-600">
          <p>Advanced Graph Comparison Tool • Data provided by Yahoo Finance</p>
        </div>
      </footer>
    </div>
  )
}

