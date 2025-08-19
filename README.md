# Advanced Graph Comparison Tool

A sophisticated financial time series analysis application that allows you to compare any two financial instruments, analyze their differences, and discover lead-lag relationships through intelligent time-shifting.

## 🚀 Features

### Core Functionality
- **Dual Time Series Comparison**: Compare any two stocks, indices, or financial instruments
- **Dynamic Time Shifting**: Use an interactive slider to shift one time series relative to another
- **Difference Analysis**: Calculate and visualize the mathematical difference between normalized price series
- **Correlation Analysis**: Real-time correlation coefficient calculation at different time shifts
- **Optimal Shift Detection**: Automatically find the time shift that maximizes correlation

### Visualization Modes
- **Overlay Mode**: View both normalized time series on the same chart
- **Difference Mode**: Display the calculated difference between the two series
- **Correlation Mode**: Show correlation coefficient across different time shifts

### Advanced Features
- **Arbitrary Time Periods**: Each symbol can have different date ranges
- **Real-time Analysis**: Instant updates as you adjust the time shift
- **Responsive Design**: Optimized for desktop, tablet, and mobile devices
- **Lead-Lag Detection**: Discover which instrument leads or follows the other

## 📊 Use Cases

### Market Analysis
- **Index vs Individual Stocks**: Compare S&P 500 performance against individual stocks
- **Sector Analysis**: Analyze how sector ETFs relate to broader market indices
- **International Markets**: Compare US markets with international indices
- **Commodity Relationships**: Study relationships between commodities and related stocks

### Research Applications
- **Lead-Lag Studies**: Determine if one asset consistently leads another
- **Market Efficiency**: Test for delayed reactions between related instruments
- **Pairs Trading**: Identify potential pairs trading opportunities
- **Risk Management**: Understand correlation dynamics over time

## 🛠 Technology Stack

- **Framework**: Next.js 14 with TypeScript
- **Styling**: Tailwind CSS
- **Charts**: Lightweight Charts (TradingView)
- **Data Fetching**: React Query with Axios
- **API**: Yahoo Finance integration
- **Deployment**: Vercel-ready

## 🎯 Key Technical Features

### Time Series Processing
- **Normalization**: Automatic percentage-based normalization for fair comparison
- **Interpolation**: Smart handling of different data lengths and frequencies
- **Time Alignment**: Intelligent alignment of time series with different date ranges

### Performance Optimizations
- **Memoized Calculations**: Efficient correlation and difference calculations
- **Debounced Updates**: Smooth real-time time-shifting without performance loss
- **Lazy Loading**: Components render only when data is available

### User Experience
- **Intuitive Controls**: Easy-to-use symbol input and date range selection
- **Visual Feedback**: Real-time correlation display and analysis metrics
- **Responsive Layout**: Seamless experience across all device sizes

## 📈 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation
```bash
# Clone the repository
git clone <repository-url>
cd stock-comparison-next

# Install dependencies
npm install

# Start development server
npm run dev
```

### Usage Examples

#### Compare S&P 500 vs Apple Stock
1. Set First Symbol: `SPY` (S&P 500 ETF)
2. Set Second Symbol: `AAPL` (Apple Inc.)
3. Select time periods (can be different for each)
4. Use the time shift slider to discover lead-lag relationships
5. Click "Optimal Shift" to find maximum correlation

#### Analyze Sector Performance
1. First Symbol: `XLF` (Financial Sector ETF)
2. Second Symbol: `SPY` (S&P 500)
3. Use 2Y time period for both
4. Shift to see if financial sector leads or lags the market

## 📊 Understanding the Analysis

### Time Shift Interpretation
- **Positive Shift**: Second symbol leads the first (second symbol changes first)
- **Negative Shift**: First symbol leads the second (first symbol changes first)
- **Zero Shift**: Symbols move in sync

### Correlation Values
- **0.7 to 1.0**: Strong positive correlation
- **0.3 to 0.7**: Moderate positive correlation
- **-0.3 to 0.3**: Weak correlation
- **-0.7 to -0.3**: Moderate negative correlation
- **-1.0 to -0.7**: Strong negative correlation

## 🚀 Deployment

### Vercel Deployment
```bash
# Build the application
npm run build

# Deploy to Vercel
npx vercel
```

### Environment Variables
No environment variables required - uses public Yahoo Finance API.

## 🔧 Customization

### Adding New Data Sources
The architecture supports easy integration of additional data sources by extending the `fetchStockData` function in `useGraphComparison.ts`.

### Custom Analysis Functions
Add new statistical measures by extending the calculation functions in the `GraphComparison` component.

### UI Themes
Modify the Tailwind configuration and CSS classes to implement custom themes.

## 📱 Mobile Experience

The application is fully responsive with:
- Touch-friendly controls
- Optimized chart rendering
- Collapsible advanced options
- Mobile-first design principles

## 🔍 Technical Details

### Data Processing Pipeline
1. **Fetch**: Retrieve OHLC data from Yahoo Finance API
2. **Normalize**: Convert to percentage changes from first value
3. **Align**: Handle different time series lengths
4. **Shift**: Apply time offset to one series
5. **Calculate**: Compute difference and correlation
6. **Visualize**: Render results in interactive charts

### Performance Considerations
- Calculations are memoized to prevent unnecessary recalculation
- Chart updates are debounced for smooth slider interaction
- Large datasets are efficiently processed using optimized algorithms

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Implement your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🙏 Acknowledgments

- Yahoo Finance for providing free financial data
- TradingView for the excellent Lightweight Charts library
- The React and Next.js communities for amazing tools and documentation