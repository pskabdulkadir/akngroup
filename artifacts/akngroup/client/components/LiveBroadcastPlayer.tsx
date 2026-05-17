import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Video, Users, RefreshCw, X } from 'lucide-react';

interface BroadcastStatus {
  success: boolean;
  status: 'active' | 'inactive';
  streamUrl: string | null;
  title: string | null;
  description: string | null;
  platform?: string;
  startTime?: string;
  viewerCount?: number;
  message?: string;
}

interface LiveBroadcastPlayerProps {
  className?: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

const LiveBroadcastPlayer: React.FC<LiveBroadcastPlayerProps> = ({
  className = '',
  autoRefresh = true,
  refreshInterval = 30000, // 30 seconds
}) => {
  const [broadcastStatus, setBroadcastStatus] = useState<BroadcastStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMinimized, setIsMinimized] = useState(false);

  const fetchBroadcastStatus = async () => {
    try {
      setError(null);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      const response = await fetch('/api/broadcast/status', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        setBroadcastStatus(data);
        console.log('📺 Broadcast status updated:', data);
      } else if (response.status === 404) {
        // API endpoint doesn't exist, set default inactive state
        setBroadcastStatus({ success: false, status: 'inactive', streamUrl: null, title: null, description: null });
        console.log('📺 Broadcast API not available');
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.warn('Broadcast status fetch timed out');
        setError('Yayın bağlantısı zaman aşımına uğradı');
      } else {
        console.error('Error fetching broadcast status:', error);
        // Set default state instead of showing error for graceful degradation
        setBroadcastStatus({ success: false, status: 'inactive', streamUrl: null, title: null, description: null });
      }
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchBroadcastStatus();
  }, []);

  // Auto-refresh functionality
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchBroadcastStatus();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval]);

  // Don't render anything if no active broadcast
  if (!broadcastStatus?.success || broadcastStatus.status !== 'active' || !broadcastStatus.streamUrl) {
    return null;
  }

  // Get embed URL for different platforms
  const getEmbedUrl = (url: string, platform?: string) => {
    try {
      const urlObj = new URL(url);
      
      // Handle YouTube URLs
      if (url.includes('youtube.com') || url.includes('youtu.be')) {
        const videoId = url.includes('youtu.be') 
          ? (urlObj.pathname ? urlObj.pathname.slice(1) : '')
          : urlObj.searchParams.get('v');
        return `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1`;
      }
      
      // Handle Vimeo URLs
      if (url.includes('vimeo.com')) {
        const videoId = urlObj.pathname.split('/').pop();
        return `https://player.vimeo.com/video/${videoId}?autoplay=1&muted=1`;
      }
      
      // Handle Twitch URLs
      if (url.includes('twitch.tv')) {
        const channel = urlObj.pathname ? urlObj.pathname.slice(1) : '';
        return `https://player.twitch.tv/?channel=${channel}&parent=${window.location.hostname}&autoplay=true&muted=true`;
      }
      
      // Return original URL for custom embeds
      return url;
    } catch (error) {
      console.error('Error processing stream URL:', error);
      return url;
    }
  };

  if (loading) {
    return (
      <Card className={`border-blue-200 bg-blue-50 ${className}`}>
        <CardContent className="p-4">
          <div className="flex items-center justify-center space-x-2">
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span className="text-sm text-blue-700">Canlı yayın durumu kontrol ediliyor...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={`border-red-200 bg-red-50 ${className}`}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Video className="w-4 h-4 text-red-600" />
              <span className="text-sm text-red-700">{error}</span>
            </div>
            <Button
              onClick={fetchBroadcastStatus}
              variant="outline"
              size="sm"
            >
              <RefreshCw className="w-3 h-3 mr-1" />
              Yenile
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`border-red-200 bg-gradient-to-r from-red-50 to-pink-50 ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
            <CardTitle className="text-lg font-bold text-red-800">
              🔴 Canlı Yayın
            </CardTitle>
            <Badge variant="destructive" className="animate-pulse">
              LIVE
            </Badge>
          </div>
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-1 text-sm text-gray-600">
              <Users className="w-4 h-4" />
              <span>{broadcastStatus.viewerCount || 0}</span>
            </div>
            <Button
              onClick={() => setIsMinimized(!isMinimized)}
              variant="ghost"
              size="sm"
            >
              {isMinimized ? <Video className="w-4 h-4" /> : <X className="w-4 h-4" />}
            </Button>
          </div>
        </div>
        {broadcastStatus.title && (
          <CardDescription className="text-gray-700 font-medium">
            {broadcastStatus.title}
          </CardDescription>
        )}
      </CardHeader>
      
      {!isMinimized && (
        <CardContent className="pt-0">
          <div className="space-y-3">
            {/* Video Player */}
            <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
              <iframe
                src={getEmbedUrl(broadcastStatus.streamUrl, broadcastStatus.platform)}
                className="w-full h-full"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                title="Canlı Yayın"
              />
            </div>
            
            {/* Broadcast Info */}
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center space-x-4">
                {broadcastStatus.platform && (
                  <Badge variant="outline" className="text-xs">
                    {broadcastStatus.platform === 'youtube' && '📺 YouTube'}
                    {broadcastStatus.platform === 'vimeo' && '🎬 Vimeo'}
                    {broadcastStatus.platform === 'twitch' && '🎮 Twitch'}
                    {broadcastStatus.platform === 'custom' && '🔧 Özel'}
                  </Badge>
                )}
                {broadcastStatus.startTime && (
                  <span className="text-gray-600">
                    Başlama: {new Date(broadcastStatus.startTime).toLocaleTimeString('tr-TR')}
                  </span>
                )}
              </div>
              <Button
                onClick={fetchBroadcastStatus}
                variant="ghost"
                size="sm"
                className="text-xs"
              >
                <RefreshCw className="w-3 h-3 mr-1" />
                Yenile
              </Button>
            </div>
            
            {/* Description */}
            {broadcastStatus.description && (
              <div className="text-sm text-gray-700 bg-white p-3 rounded border">
                {broadcastStatus.description}
              </div>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  );
};

export default LiveBroadcastPlayer;
