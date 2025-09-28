# 🔗 Wallet Connection Tracking System

## Overview

A comprehensive wallet connection tracking system that monitors, analyzes, and provides insights into user wallet connections across the Hoodie Academy platform. This system enables detailed tracking of user behavior, platform usage patterns, and provides valuable analytics for administrators.

## ✅ Features Implemented

### 1. Enhanced Wallet Connection Tracking Service (`src/lib/wallet-connection-tracker.ts`)

**Key Features:**
- Comprehensive connection logging with detailed metadata
- Device and browser information capture
- Session tracking and management
- Provider identification (Phantom, MetaMask, etc.)
- Verification result tracking
- Analytics calculation and reporting

**Data Captured:**
- Wallet address and connection type
- Provider information (Phantom, MetaMask, etc.)
- Device type, browser, and OS information
- User agent and screen resolution
- Connection timestamps and session data
- Verification results and NFT data
- Page URL and referrer information

### 2. Updated Wallet Connection Hooks (`src/hooks/use-wallet-supabase.ts`)

**Enhancements:**
- Integrated with enhanced tracking service
- Backward compatibility with existing logging
- Improved error handling and logging
- Real-time connection state management

### 3. Admin Dashboard Components

#### Analytics Dashboard (`src/components/admin/WalletConnectionAnalytics.tsx`)
- **Key Metrics:** Total connections, unique wallets, success rates
- **Provider Breakdown:** Usage statistics by wallet provider
- **Verification Stats:** Success/failure rates for NFT verifications
- **Connection Trends:** Daily, weekly, and monthly trend analysis
- **Wallet Search:** Individual wallet connection history
- **Time Range Filtering:** 24h, 7d, 30d, 90d views

#### Real-time Monitor (`src/components/admin/RealtimeWalletMonitor.tsx`)
- **Live Feed:** Real-time wallet connection events
- **Auto-refresh:** Configurable refresh intervals
- **Connection Status:** Visual indicators for different connection types
- **Quick Stats:** Real-time metrics and counters
- **Pause/Resume:** Control monitoring state

#### User Insights (`src/components/admin/UserWalletInsights.tsx`)
- **Engagement Scoring:** 0-100 score based on multiple factors
- **Risk Assessment:** Identifies potentially suspicious behavior
- **User Filtering:** High engagement, at-risk, new users
- **Connection Patterns:** Frequency, streaks, device diversity
- **Provider Preferences:** Most used wallet providers per user

### 4. API Endpoints

#### Wallet Analytics API (`src/app/api/admin/wallet-analytics/route.ts`)
- **GET:** Retrieve comprehensive analytics data
- **Time Range Support:** 24h, 7d, 30d, 90d filtering
- **Wallet-specific Queries:** Individual wallet analysis
- **Trend Calculations:** Daily, weekly, monthly patterns

#### Enhanced Wallet Connections API (`src/app/api/admin/wallet-connections/route.ts`)
- **GET:** Retrieve wallet connection logs
- **Filtering:** By wallet address, connection type
- **Pagination:** Limit and offset support
- **Sorting:** By timestamp, connection type

### 5. Admin Dashboard Page (`src/app/admin/wallet-tracking/page.tsx`)

**Three Main Tabs:**
1. **Analytics Dashboard:** Comprehensive analytics and trends
2. **Real-time Monitor:** Live connection monitoring
3. **User Insights:** Individual user behavior analysis

## 🗄️ Database Schema

### Wallet Connections Table
```sql
CREATE TABLE wallet_connections (
  id SERIAL PRIMARY KEY,
  wallet_address TEXT NOT NULL,
  connection_type TEXT NOT NULL, -- 'connect', 'disconnect', 'verification_success', 'verification_failed'
  connection_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_agent TEXT,
  ip_address TEXT,
  verification_result JSONB, -- Store NFT verification details
  session_data JSONB, -- Store session-related data
  notes TEXT -- For admin notes
);
```

### Indexes for Performance
```sql
CREATE INDEX idx_wallet_connections_wallet_address ON wallet_connections(wallet_address);
CREATE INDEX idx_wallet_connections_timestamp ON wallet_connections(connection_timestamp);
CREATE INDEX idx_wallet_connections_type ON wallet_connections(connection_type);
```

### Summary View
```sql
CREATE VIEW wallet_connections_summary AS
SELECT 
  wallet_address,
  COUNT(*) as total_connections,
  MAX(connection_timestamp) as last_connection,
  MIN(connection_timestamp) as first_connection,
  COUNT(CASE WHEN connection_type = 'verification_success' THEN 1 END) as successful_verifications,
  COUNT(CASE WHEN connection_type = 'verification_failed' THEN 1 END) as failed_verifications
FROM wallet_connections
GROUP BY wallet_address
ORDER BY last_connection DESC;
```

## 📊 Analytics & Insights

### Engagement Scoring Algorithm
The system calculates user engagement scores (0-100) based on:
- **Total Connections (30%):** Number of wallet connections
- **Connection Frequency (25%):** Connections per day
- **Verification Success Rate (20%):** NFT verification success
- **Device Diversity (15%):** Number of different devices used
- **Connection Streak (10%):** Consecutive days with connections

### Risk Assessment Algorithm
Risk scores (0-100) are calculated based on:
- **High Connection Frequency:** Potential bot behavior
- **Low Verification Success:** Suspicious activity
- **High Device Diversity:** Possible account sharing
- **Long Connection Streaks:** Potential automation
- **Inactivity Patterns:** Abandoned accounts

### Connection Types Tracked
1. **connect:** Initial wallet connection
2. **disconnect:** Wallet disconnection
3. **verification_success:** Successful NFT verification
4. **verification_failed:** Failed NFT verification
5. **reconnect:** Reconnection after disconnect
6. **error:** Connection errors

## 🚀 Usage

### For Administrators

1. **Access the Dashboard:**
   ```
   /admin/wallet-tracking
   ```

2. **View Analytics:**
   - Select time range (24h, 7d, 30d, 90d)
   - Analyze connection trends and patterns
   - Review provider usage statistics

3. **Monitor Real-time Activity:**
   - Watch live connection feed
   - Pause/resume monitoring as needed
   - View recent connection events

4. **Analyze User Behavior:**
   - Filter users by engagement level
   - Identify at-risk accounts
   - Review individual user patterns

### For Developers

1. **Track Wallet Connections:**
   ```typescript
   import { walletTracker } from '@/lib/wallet-connection-tracker';
   
   // Track connection
   await walletTracker.trackConnection(
     walletAddress,
     'connect',
     'phantom',
     verificationResult,
     additionalMetadata
   );
   
   // Track disconnection
   await walletTracker.trackDisconnection(walletAddress, 'phantom');
   
   // Track verification
   await walletTracker.trackVerification(
     walletAddress,
     true, // success
     verificationData,
     'phantom'
   );
   ```

2. **Retrieve Analytics:**
   ```typescript
   // Get comprehensive analytics
   const analytics = await walletTracker.getWalletAnalytics('30d');
   
   // Get wallet connections
   const connections = await walletTracker.getWalletConnections(
     walletAddress,
     50, // limit
     0   // offset
   );
   ```

## 🔧 Configuration

### Environment Variables
Ensure these are set in your environment:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### Database Setup
Run the SQL scripts in order:
1. `WALLET_CONNECTIONS_SETUP.sql` - Create tables and indexes
2. `USER_ACTIVITY_LOGGING_SETUP.sql` - Set up activity logging

## 📈 Benefits

### For Platform Management
- **User Behavior Insights:** Understand how users interact with the platform
- **Platform Health Monitoring:** Track connection success rates and issues
- **Security Monitoring:** Identify suspicious patterns and potential threats
- **Performance Optimization:** Identify bottlenecks and optimization opportunities

### For User Experience
- **Seamless Tracking:** Non-intrusive connection monitoring
- **Improved Reliability:** Better error handling and connection management
- **Enhanced Security:** Verification and risk assessment
- **Personalized Experience:** Data-driven user experience improvements

### For Analytics
- **Comprehensive Data:** Rich metadata for detailed analysis
- **Real-time Monitoring:** Live insights into platform usage
- **Trend Analysis:** Historical data for pattern recognition
- **Customizable Views:** Flexible filtering and sorting options

## 🔒 Privacy & Security

- **Data Minimization:** Only necessary data is collected
- **Secure Storage:** All data stored in secure Supabase database
- **Access Control:** Admin-only access to sensitive analytics
- **Data Retention:** Configurable data retention policies
- **Anonymization:** Wallet addresses can be partially masked in displays

## 🚀 Future Enhancements

### Planned Features
- **Alert System:** Real-time notifications for unusual activity
- **Export Functionality:** Data export for external analysis
- **Advanced Filtering:** More sophisticated filtering options
- **Custom Dashboards:** User-configurable dashboard layouts
- **API Rate Limiting:** Protection against abuse
- **Data Visualization:** Enhanced charts and graphs
- **Mobile Optimization:** Mobile-friendly admin interface

### Integration Opportunities
- **Slack/Discord Notifications:** Real-time alerts
- **External Analytics:** Integration with Google Analytics, Mixpanel
- **Machine Learning:** Predictive analytics and anomaly detection
- **A/B Testing:** Connection flow optimization
- **User Segmentation:** Advanced user categorization

## 📝 Maintenance

### Regular Tasks
- **Database Cleanup:** Remove old connection logs as needed
- **Performance Monitoring:** Monitor query performance and optimize
- **Security Audits:** Regular review of access controls
- **Data Backup:** Ensure regular backups of connection data
- **Update Dependencies:** Keep tracking libraries up to date

### Monitoring
- **Connection Success Rates:** Monitor for drops in success rates
- **Error Patterns:** Identify recurring connection issues
- **Performance Metrics:** Track response times and query performance
- **Storage Usage:** Monitor database growth and storage needs

This comprehensive wallet connection tracking system provides the foundation for understanding user behavior, improving platform reliability, and making data-driven decisions for the Hoodie Academy platform.
