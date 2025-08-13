'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { RefreshCw, Search, Filter, Download } from 'lucide-react';

interface WalletConnection {
  id: number;
  wallet_address: string;
  connection_type: string;
  connection_timestamp: string;
  user_agent?: string;
  ip_address?: string;
  verification_result?: any;
  session_data?: any;
  notes?: string;
}

interface WalletConnectionsResponse {
  success: boolean;
  data: WalletConnection[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

export default function WalletConnectionsView() {
  const [connections, setConnections] = useState<WalletConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchWallet, setSearchWallet] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [pagination, setPagination] = useState({
    total: 0,
    limit: 50,
    offset: 0,
    hasMore: false
  });

  const fetchConnections = async (resetOffset = true) => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        limit: pagination.limit.toString(),
        offset: resetOffset ? '0' : pagination.offset.toString()
      });

      if (searchWallet) {
        params.append('wallet_address', searchWallet);
      }
      if (filterType && filterType !== 'all') {
        params.append('connection_type', filterType);
      }

      const response = await fetch(`/api/admin/wallet-connections?${params}`);
      const data: WalletConnectionsResponse = await response.json();

      if (data.success) {
        setConnections(data.data);
        setPagination(prev => ({
          ...prev,
          total: data.pagination.total,
          offset: resetOffset ? 0 : prev.offset,
          hasMore: data.pagination.hasMore
        }));
      } else {
        setError('Failed to fetch connections');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch connections';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConnections();
  }, []);

  const handleSearch = () => {
    fetchConnections(true);
  };

  const handleFilter = (type: string) => {
    setFilterType(type);
    fetchConnections(true);
  };

  const loadMore = () => {
    if (pagination.hasMore) {
      setPagination(prev => ({ ...prev, offset: prev.offset + prev.limit }));
      fetchConnections(false);
    }
  };

  const exportData = () => {
    const csvContent = [
      ['Wallet Address', 'Connection Type', 'Timestamp', 'IP Address', 'Notes'],
      ...connections.map(conn => [
        conn.wallet_address,
        conn.connection_type,
        new Date(conn.connection_timestamp).toLocaleString(),
        conn.ip_address || 'N/A',
        conn.notes || 'N/A'
      ])
    ].map(row => row.map(field => `"${field}"`).join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `wallet-connections-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getConnectionTypeColor = (type: string) => {
    switch (type) {
      case 'connect': return 'bg-green-100 text-green-800';
      case 'disconnect': return 'bg-red-100 text-red-800';
      case 'verification_success': return 'bg-blue-100 text-blue-800';
      case 'verification_failed': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const truncateAddress = (address: string) => {
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Wallet Connections Log</span>
            <div className="flex items-center space-x-2">
              <Button onClick={() => fetchConnections(true)} variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button onClick={exportData} variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search wallet address..."
                  value={searchWallet}
                  onChange={(e) => setSearchWallet(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={filterType} onValueChange={handleFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="connect">Connect</SelectItem>
                <SelectItem value="disconnect">Disconnect</SelectItem>
                <SelectItem value="verification_success">Verification Success</SelectItem>
                <SelectItem value="verification_failed">Verification Failed</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleSearch} className="w-full sm:w-auto">
              Search
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold">{pagination.total}</div>
                <div className="text-sm text-gray-600">Total Connections</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-green-600">
                  {connections.filter(c => c.connection_type === 'verification_success').length}
                </div>
                <div className="text-sm text-gray-600">Successful Verifications</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-yellow-600">
                  {connections.filter(c => c.connection_type === 'verification_failed').length}
                </div>
                <div className="text-sm text-gray-600">Failed Verifications</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-blue-600">
                  {new Set(connections.map(c => c.wallet_address)).size}
                </div>
                <div className="text-sm text-gray-600">Unique Wallets</div>
              </CardContent>
            </Card>
          </div>

          {/* Connections Table */}
          {loading ? (
            <div className="text-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2" />
              <p>Loading connections...</p>
            </div>
          ) : error ? (
            <div className="text-center py-8 text-red-600">
              <p>{error}</p>
              <Button onClick={() => fetchConnections()} className="mt-2">
                Try Again
              </Button>
            </div>
          ) : connections.length === 0 ? (
            <div className="text-center py-8 text-gray-600">
              <p>No connections found</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Wallet</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Timestamp</TableHead>
                      <TableHead>IP Address</TableHead>
                      <TableHead>Details</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {connections.map((connection) => (
                      <TableRow key={connection.id}>
                        <TableCell className="font-mono text-sm">
                          {truncateAddress(connection.wallet_address)}
                        </TableCell>
                        <TableCell>
                          <Badge className={getConnectionTypeColor(connection.connection_type)}>
                            {connection.connection_type.replace('_', ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">
                          {formatTimestamp(connection.connection_timestamp)}
                        </TableCell>
                        <TableCell className="text-sm">
                          {connection.ip_address || 'N/A'}
                        </TableCell>
                        <TableCell className="text-sm">
                          {connection.verification_result && (
                            <div className="text-xs">
                              {connection.verification_result.nft_count && (
                                <div>NFTs: {connection.verification_result.nft_count}</div>
                              )}
                              {connection.verification_result.wifhoodie_count !== undefined && (
                                <div>WifHoodies: {connection.verification_result.wifhoodie_count}</div>
                              )}
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {pagination.hasMore && (
                <div className="text-center mt-4">
                  <Button onClick={loadMore} variant="outline">
                    Load More
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
