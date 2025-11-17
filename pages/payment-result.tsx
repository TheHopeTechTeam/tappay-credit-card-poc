import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

const PaymentResultPage = () => {
    const router = useRouter();
    const [logData, setLogData] = useState<any>(null);
    const [transactionStatus, setTransactionStatus] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        // 記錄所有 query parameters (TapPay 會透過 URL 參數傳遞資訊)
        const queryParams = router.query;

        // 建立記錄資料
        const data = {
            timestamp: new Date().toISOString(),
            url: window.location.href,
            queryParams: queryParams,
            referrer: document.referrer,
            userAgent: navigator.userAgent,
        };

        // 輸出到 console
        console.log('=== TapPay Redirect 記錄 ===');
        console.log('時間:', data.timestamp);
        console.log('完整 URL:', data.url);
        console.log('Query Parameters:', JSON.stringify(queryParams, null, 2));
        console.log('Referrer:', data.referrer);
        console.log('User Agent:', data.userAgent);
        console.log('===========================');

        setLogData(data);

        // 如果有 rec_trade_id，立即呼叫 Record API 反查交易狀態
        if (Object.keys(queryParams).length > 0) {
            const rec_trade_id = queryParams.rec_trade_id as string;
            if (rec_trade_id) {
                verifyTransaction(rec_trade_id);
            }
        }
    }, [router.query]);

    const verifyTransaction = async (rec_trade_id: string) => {
        setLoading(true);
        try {
            const response = await fetch('/api/tappay/record', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ rec_trade_id }),
            });

            const data = await response.json();
            setTransactionStatus(data);

            console.log('=== 交易狀態反查結果 ===');
            console.log(JSON.stringify(data, null, 2));
            console.log('=====================');

        } catch (error) {
            console.error('反查交易狀態失敗:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container" style={{ marginTop: '20px', padding: '20px' }}>
            <h1>付款結果</h1>

            {loading && (
                <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#fff3cd', borderRadius: '5px' }}>
                    <p>🔄 正在驗證交易狀態...</p>
                </div>
            )}

            {transactionStatus && (
                <div style={{ marginTop: '20px' }}>
                    <h2>交易狀態 (Record API 反查結果)</h2>
                    {transactionStatus.trade_records && transactionStatus.trade_records.length > 0 ? (
                        // 有交易記錄
                        (() => {
                            const record = transactionStatus.trade_records[0];
                            const isSuccess = record.record_status === 0;
                            return (
                                <div style={{
                                    backgroundColor: isSuccess ? '#d4edda' : '#f8d7da',
                                    padding: '15px',
                                    borderRadius: '5px',
                                    marginBottom: '20px'
                                }}>
                                    <p><strong>狀態:</strong> {isSuccess ? '✅ 交易成功' : '❌ 交易失敗'}</p>
                                    <p><strong>交易編號:</strong> {record.rec_trade_id}</p>
                                    <p><strong>銀行交易編號:</strong> {record.bank_transaction_id}</p>
                                    <p><strong>授權碼:</strong> {record.auth_code}</p>
                                    <p><strong>金額:</strong> TWD ${record.amount}</p>
                                    <p><strong>卡號:</strong> {record.partial_card_number}</p>
                                    <p><strong>持卡人:</strong> {record.cardholder.name}</p>
                                    <p><strong>3D 驗證:</strong> {record.three_domain_secure ? '✅ 已完成' : '❌ 未完成'}</p>
                                    <p><strong>銀行回應:</strong> {record.bank_result_msg} ({record.bank_result_code})</p>
                                </div>
                            );
                        })()
                    ) : (
                        // 查詢失敗或無記錄
                        <div style={{
                            backgroundColor: '#f8d7da',
                            padding: '15px',
                            borderRadius: '5px',
                            marginBottom: '20px'
                        }}>
                            <p><strong>狀態:</strong> ❌ 查詢失敗</p>
                            {transactionStatus.msg && <p><strong>訊息:</strong> {transactionStatus.msg}</p>}
                        </div>
                    )}

                    <details style={{ marginTop: '10px' }}>
                        <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>完整交易資訊</summary>
                        <pre style={{
                            backgroundColor: '#f5f5f5',
                            padding: '10px',
                            borderRadius: '3px',
                            overflow: 'auto',
                            marginTop: '10px'
                        }}>
                            {JSON.stringify(transactionStatus, null, 2)}
                        </pre>
                    </details>
                </div>
            )}

            {logData && (
                <div style={{ marginTop: '20px' }}>
                    <h2>Redirect 資訊</h2>
                    <div style={{
                        backgroundColor: '#f5f5f5',
                        padding: '15px',
                        borderRadius: '5px',
                        fontFamily: 'monospace'
                    }}>
                        <p><strong>時間:</strong> {logData.timestamp}</p>
                        <p><strong>完整 URL:</strong> {logData.url}</p>
                        <p><strong>Referrer:</strong> {logData.referrer || '無'}</p>

                        <h3 style={{ marginTop: '15px' }}>Query Parameters:</h3>
                        <pre style={{
                            backgroundColor: '#ffffff',
                            padding: '10px',
                            borderRadius: '3px',
                            overflow: 'auto'
                        }}>
                            {JSON.stringify(logData.queryParams, null, 2)}
                        </pre>
                    </div>

                    <div style={{ marginTop: '20px' }}>
                        <button
                            onClick={() => router.push('/payment')}
                            className="btn btn-primary"
                            style={{
                                padding: '10px 20px',
                                backgroundColor: '#007bff',
                                color: 'white',
                                border: 'none',
                                borderRadius: '5px',
                                cursor: 'pointer'
                            }}
                        >
                            返回付款頁面
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PaymentResultPage;


