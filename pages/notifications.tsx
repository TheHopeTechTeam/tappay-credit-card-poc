import { useEffect, useState } from 'react';

interface NotificationData {
    timestamp: string;
    method: string;
    url: string;
    headers: Record<string, any>;
    body: any;
}

const NotificationsPage = () => {
    const [notifications, setNotifications] = useState<NotificationData[]>([]);
    const [loading, setLoading] = useState(true);
    const [autoRefresh, setAutoRefresh] = useState(false);

    const fetchNotifications = async () => {
        try {
            const response = await fetch('/api/tappay/notify');
            const data = await response.json();
            setNotifications(data.notifications || []);
        } catch (error) {
            console.error('取得通知記錄失敗:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNotifications();
    }, []);

    useEffect(() => {
        if (autoRefresh) {
            const interval = setInterval(fetchNotifications, 3000);
            return () => clearInterval(interval);
        }
    }, [autoRefresh]);

    return (
        <div style={{
            maxWidth: '1200px',
            margin: '20px auto',
            padding: '20px',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h1 style={{ margin: 0 }}>TapPay 通知記錄</h1>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}>
                        <input
                            type="checkbox"
                            checked={autoRefresh}
                            onChange={(e) => setAutoRefresh(e.target.checked)}
                        />
                        自動重新整理 (3秒)
                    </label>
                    <button
                        onClick={fetchNotifications}
                        style={{
                            padding: '8px 16px',
                            backgroundColor: '#007bff',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer'
                        }}
                    >
                        🔄 重新整理
                    </button>
                </div>
            </div>

            <div style={{
                backgroundColor: '#f8f9fa',
                padding: '15px',
                borderRadius: '8px',
                marginBottom: '20px',
                border: '1px solid #dee2e6'
            }}>
                <p style={{ margin: '0 0 10px 0', fontWeight: '600' }}>📊 統計資訊</p>
                <p style={{ margin: 0 }}>
                    共 <strong>{notifications.length}</strong> 筆通知記錄
                    {notifications.length === 0 && ' (尚未收到任何通知)'}
                </p>
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#6c757d' }}>
                    載入中...
                </div>
            ) : notifications.length === 0 ? (
                <div style={{
                    textAlign: 'center',
                    padding: '40px',
                    backgroundColor: '#fff',
                    borderRadius: '8px',
                    border: '1px solid #dee2e6'
                }}>
                    <p style={{ color: '#6c757d', marginBottom: '20px' }}>尚未收到任何 TapPay 通知</p>
                    <p style={{ fontSize: '14px', color: '#6c757d' }}>
                        當完成付款交易後，TapPay 會發送通知到 <code>/api/tappay/notify</code>
                    </p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {notifications.map((notification, index) => (
                        <div
                            key={index}
                            style={{
                                backgroundColor: '#fff',
                                borderRadius: '8px',
                                border: '1px solid #dee2e6',
                                overflow: 'hidden'
                            }}
                        >
                            <div style={{
                                backgroundColor: '#f8f9fa',
                                padding: '15px',
                                borderBottom: '1px solid #dee2e6',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center'
                            }}>
                                <div>
                                    <strong>通知 #{notifications.length - index}</strong>
                                    <span style={{ marginLeft: '10px', color: '#6c757d', fontSize: '14px' }}>
                                        {new Date(notification.timestamp).toLocaleString('zh-TW')}
                                    </span>
                                </div>
                                <span style={{
                                    padding: '4px 12px',
                                    backgroundColor: '#28a745',
                                    color: 'white',
                                    borderRadius: '4px',
                                    fontSize: '12px',
                                    fontWeight: '600'
                                }}>
                                    {notification.method}
                                </span>
                            </div>

                            <div style={{ padding: '20px' }}>
                                {/* Body 資訊 */}
                                <div style={{ marginBottom: '20px' }}>
                                    <h3 style={{ fontSize: '16px', marginBottom: '10px', color: '#495057' }}>
                                        📦 Body
                                    </h3>
                                    {notification.body && Object.keys(notification.body).length > 0 ? (
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '10px' }}>
                                            {Object.entries(notification.body).map(([key, value]) => (
                                                <div key={key} style={{ fontSize: '14px' }}>
                                                    <strong>{key}:</strong>{' '}
                                                    <span style={{ color: '#6c757d' }}>
                                                        {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p style={{ color: '#6c757d', fontSize: '14px', margin: 0 }}>無 Body 資料</p>
                                    )}
                                </div>

                                {/* Headers 資訊 */}
                                <details>
                                    <summary style={{
                                        cursor: 'pointer',
                                        fontSize: '16px',
                                        marginBottom: '10px',
                                        color: '#495057',
                                        fontWeight: '600'
                                    }}>
                                        📋 Headers (點擊展開)
                                    </summary>
                                    <div style={{ marginTop: '10px' }}>
                                        {notification.headers && Object.keys(notification.headers).length > 0 ? (
                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '10px' }}>
                                                {Object.entries(notification.headers).map(([key, value]) => (
                                                    <div key={key} style={{ fontSize: '14px' }}>
                                                        <strong>{key}:</strong>{' '}
                                                        <span style={{ color: '#6c757d', wordBreak: 'break-all' }}>
                                                            {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <p style={{ color: '#6c757d', fontSize: '14px', margin: 0 }}>無 Headers 資料</p>
                                        )}
                                    </div>
                                </details>

                                {/* 完整 JSON */}
                                <details style={{ marginTop: '15px' }}>
                                    <summary style={{
                                        cursor: 'pointer',
                                        fontSize: '16px',
                                        color: '#495057',
                                        fontWeight: '600'
                                    }}>
                                        🔍 完整 JSON (點擊展開)
                                    </summary>
                                    <pre style={{
                                        backgroundColor: '#f8f9fa',
                                        padding: '15px',
                                        borderRadius: '4px',
                                        overflow: 'auto',
                                        fontSize: '13px',
                                        marginTop: '10px'
                                    }}>
                                        {JSON.stringify(notification, null, 2)}
                                    </pre>
                                </details>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <div style={{
                marginTop: '30px',
                padding: '15px',
                backgroundColor: '#fff3cd',
                borderRadius: '8px',
                border: '1px solid #ffc107'
            }}>
                <p style={{ margin: '0 0 10px 0', fontWeight: '600' }}>⚠️ 注意事項</p>
                <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '14px' }}>
                    <li>通知記錄儲存在記憶體中，伺服器重啟後會清空</li>
                    <li>最多保留最近 50 筆通知記錄</li>
                    <li>此頁面僅供開發測試使用，生產環境建議使用資料庫儲存</li>
                </ul>
            </div>
        </div>
    );
};

export default NotificationsPage;
