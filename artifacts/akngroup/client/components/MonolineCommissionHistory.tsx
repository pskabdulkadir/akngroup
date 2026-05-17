import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

interface MonolineCommissionTransaction {
  id: string;
  saleId?: string;
  recipientId: string;
  amount: number;
  commissionType: 'direct_sponsor' | 'depth_level' | 'passive_pool' | 'company_fund';
  level?: number; // For depth commissions
  buyerId?: string;
  status: 'pending' | 'processed' | 'inactive';
  createdAt: Date;
  processedAt?: Date;
}

interface MonolineCommissionHistoryProps {
  userId: string;
  limit?: number;
}

export const MonolineCommissionHistory: React.FC<MonolineCommissionHistoryProps> = ({
  userId,
  limit = 50
}) => {
  const [transactions, setTransactions] = useState<MonolineCommissionTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalEarned, setTotalEarned] = useState(0);
  const [stats, setStats] = useState({
    directSponsor: 0,
    depth: 0,
    passivePool: 0
  });

  useEffect(() => {
    const fetchCommissions = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/monoline/user/${userId}/commissions?limit=${limit}`);

        if (!response.ok) {
          throw new Error('Komisyon geçmişi yüklenemedi');
        }

        const data = await response.json();
        const allTransactions = data.transactions || [];

        // Filter out company_fund transactions so user doesn't see them
        const visibleTransactions = allTransactions.filter(
          (tx: MonolineCommissionTransaction) => tx.commissionType !== 'company_fund'
        );

        setTransactions(visibleTransactions);

        // Calculate stats (excluding company fund)
        let total = 0;
        let directSum = 0;
        let depthSum = 0;
        let passiveSum = 0;

        for (const tx of visibleTransactions) {
          if (tx.status === 'processed') {
            total += tx.amount;

            if (tx.commissionType === 'direct_sponsor') {
              directSum += tx.amount;
            } else if (tx.commissionType === 'depth_level') {
              depthSum += tx.amount;
            } else if (tx.commissionType === 'passive_pool') {
              passiveSum += tx.amount;
            }
          }
        }

        setTotalEarned(total);
        setStats({
          directSponsor: directSum,
          depth: depthSum,
          passivePool: passiveSum
        });
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Bir hata oluştu');
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchCommissions();
    }
  }, [userId, limit]);

  const getCommissionTypeLabel = (type: string): string => {
    switch (type) {
      case 'direct_sponsor':
        return 'Direkt Sponsor Bonusu';
      case 'depth_level':
        return 'Derinlik Komisyonu';
      case 'passive_pool':
        return 'Pasif Havuz';
      // company_fund case removed as it is filtered out
      default:
        return type;
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'processed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'inactive':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string): string => {
    switch (status) {
      case 'processed':
        return '✅ İşlendi';
      case 'pending':
        return '⏳ Beklemede';
      case 'inactive':
        return '⛔ İnaktif';
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-gray-500">Komisyon geçmişi yükleniyor...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-green-50 to-blue-50">
          <CardContent className="p-4">
            <div className="text-sm font-semibold text-gray-600 mb-1">Toplam Kazanç</div>
            <div className="text-2xl font-bold text-green-600">${totalEarned.toFixed(2)}</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-purple-50">
          <CardContent className="p-4">
            <div className="text-sm font-semibold text-gray-600 mb-1">Direkt Sponsor</div>
            <div className="text-2xl font-bold text-blue-600">${stats.directSponsor.toFixed(2)}</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-pink-50">
          <CardContent className="p-4">
            <div className="text-sm font-semibold text-gray-600 mb-1">Derinlik (7 Seviye)</div>
            <div className="text-2xl font-bold text-purple-600">${stats.depth.toFixed(2)}</div>
          </CardContent>
        </Card>

        {/* Passive Pool Card Removed or made smaller if needed, but let's keep it if user wants to see their passive income */}
        <Card className="bg-gradient-to-br from-pink-50 to-orange-50 md:col-span-3 lg:col-span-1">
          <CardContent className="p-4">
            <div className="text-sm font-semibold text-gray-600 mb-1">Pasif Havuz</div>
            <div className="text-2xl font-bold text-orange-600">${stats.passivePool.toFixed(2)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Commissions Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <span>📊 Komisyon Geçmişi</span>
            <Badge variant="outline">{transactions.length}</Badge>
          </CardTitle>
          <CardDescription>
            Monoline MLM sistemi kapsamında kazandığınız tüm komisyonlar
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4 text-red-800 text-sm">
              {error}
            </div>
          )}

          {transactions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>Henüz komisyon kaydı bulunmuyor</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tarih</TableHead>
                    <TableHead>Komisyon Türü</TableHead>
                    <TableHead className="text-right">Miktar</TableHead>
                    <TableHead>Seviye</TableHead>
                    <TableHead>Durum</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((tx) => (
                    <TableRow key={tx.id} className="hover:bg-gray-50">
                      <TableCell className="text-sm">
                        {format(new Date(tx.createdAt), 'dd MMM yyyy HH:mm', { locale: tr })}
                      </TableCell>
                      <TableCell className="text-sm font-medium">
                        {getCommissionTypeLabel(tx.commissionType)}
                      </TableCell>
                      <TableCell className="text-right font-semibold text-green-600">
                        ${tx.amount.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-sm">
                        {tx.level ? `Seviye ${tx.level}` : '-'}
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(tx.status)}>
                          {getStatusLabel(tx.status)}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Commission Structure Info */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-base">📋 Monoline MLM Komisyon Yapısı</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between items-center p-2 bg-white rounded border">
              <span>💎 Direkt Sponsor Bonusu</span>
              <span className="font-semibold">15% ($3.00)</span>
            </div>
            <div className="flex justify-between items-center p-2 bg-white rounded border">
              <span>📈 Derinlik Komisyonu (7 Seviye)</span>
              <span className="font-semibold">39.5% ($7.90)</span>
            </div>
            <div className="flex justify-between items-center p-2 bg-white rounded border">
              <span>🎁 Pasif Havuz (Aktif Üyeler)</span>
              <span className="font-semibold">0.5% ($0.10)</span>
            </div>
            {/* Company Fund Row Removed */}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
