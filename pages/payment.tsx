import React, { useState, useEffect } from 'react';
import Head from 'next/head';

declare global {
    interface Window {
        TPDirect: any;
    }
}

export default function Payment() {
    const [amount, setAmount] = useState('100');
    const [cardholder, setCardholder] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [canPay, setCanPay] = useState(false);

    useEffect(() => {
        // 初始化 TapPay SDK
        if (window.TPDirect) {
            window.TPDirect.setupSDK(
                parseInt(process.env.NEXT_PUBLIC_TAPPAY_APP_ID || ''),
                process.env.NEXT_PUBLIC_TAPPAY_APP_KEY || '',
                process.env.NEXT_PUBLIC_TAPPAY_ENV || 'sandbox'
            );

            // 設定信用卡欄位
            window.TPDirect.card.setup({
                fields: {
                    number: {
                        element: '#card-number',
                        placeholder: '**** **** **** ****'
                    },
                    expirationDate: {
                        element: '#card-expiration-date',
                        placeholder: 'MM / YY'
                    },
                    ccv: {
                        element: '#card-ccv',
                        placeholder: 'CCV'
                    }
                },
                styles: {
                    'input': {
                        'color': 'gray'
                    },
                    '.valid': {
                        'color': 'green'
                    },
                    '.invalid': {
                        'color': 'red'
                    }
                }
            });

            // 監聽卡片狀態變化
            window.TPDirect.card.onUpdate((update: any) => {
                setCanPay(update.canGetPrime);
            });
        }
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            // 取得 Prime
            const result = await window.TPDirect.card.getPrime();

            if (result.status !== 0) {
                alert('取得 Prime 失敗: ' + result.msg);
                setIsLoading(false);
                return;
            }

            // 呼叫後端 API 進行付款
            const response = await fetch('/api/payment', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    prime: result.card.prime,
                    amount: parseInt(amount),
                    cardholder: {
                        name: cardholder,
                        email: 'test@example.com',
                        phone_number: '+886912345678',
                    }
                })
            });

            const data = await response.json();

            if (data.status === 0) {
                // 付款成功
                alert('付款成功！');
                window.location.href = '/payment-result?status=success';
            } else if (data.redirect_url) {
                // 需要 3D 驗證
                window.location.href = data.redirect_url;
            } else {
                // 付款失敗
                alert('付款失敗: ' + data.msg);
            }
        } catch (error) {
            console.error('付款錯誤:', error);
            alert('付款過程發生錯誤');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <Head>
                <title>TapPay 付款測試</title>
                <script src="https://js.tappaysdk.com/sdk/tpdirect/v5.18.0"></script>
            </Head>

            <div style={{ maxWidth: '600px', margin: '50px auto', padding: '20px' }}>
                <h1>TapPay 信用卡付款</h1>

                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '20px' }}>
                        <label>
                            金額 (TWD)
                            <input
                                type="number"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                style={{ display: 'block', width: '100%', padding: '10px', marginTop: '5px' }}
                                required
                            />
                        </label>
                    </div>

                    <div style={{ marginBottom: '20px' }}>
                        <label>
                            持卡人姓名
                            <input
                                type="text"
                                value={cardholder}
                                onChange={(e) => setCardholder(e.target.value)}
                                style={{ display: 'block', width: '100%', padding: '10px', marginTop: '5px' }}
                                required
                            />
                        </label>
                    </div>

                    <div style={{ marginBottom: '20px' }}>
                        <label>卡號</label>
                        <div id="card-number" style={{
                            border: '1px solid #ccc',
                            padding: '10px',
                            marginTop: '5px',
                            borderRadius: '4px'
                        }}></div>
                    </div>

                    <div style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
                        <div style={{ flex: 1 }}>
                            <label>到期日</label>
                            <div id="card-expiration-date" style={{
                                border: '1px solid #ccc',
                                padding: '10px',
                                marginTop: '5px',
                                borderRadius: '4px'
                            }}></div>
                        </div>
                        <div style={{ flex: 1 }}>
                            <label>CCV</label>
                            <div id="card-ccv" style={{
                                border: '1px solid #ccc',
                                padding: '10px',
                                marginTop: '5px',
                                borderRadius: '4px'
                            }}></div>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={!canPay || isLoading}
                        style={{
                            width: '100%',
                            padding: '15px',
                            backgroundColor: canPay && !isLoading ? '#007bff' : '#ccc',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: canPay && !isLoading ? 'pointer' : 'not-allowed',
                            fontSize: '16px'
                        }}
                    >
                        {isLoading ? '處理中...' : '確認付款'}
                    </button>
                </form>

                <div style={{ marginTop: '30px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
                    <h3>測試卡號</h3>
                    <p><strong>卡號:</strong> 4242 4242 4242 4242</p>
                    <p><strong>到期日:</strong> 01/25 (任何未來日期)</p>
                    <p><strong>CCV:</strong> 123 (任何三碼)</p>
                </div>
            </div>
        </>
    );
}
