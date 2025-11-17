import { useEffect, useState } from 'react';
type TPDirectType = {
    setupSDK: (appId: string, appKey: string, env: 'sandbox' | 'production') => void;
    card: {
        setup: (options: any) => void;
        getTappayFieldsStatus: () => { canGetPrime: boolean; hasError: boolean };
        getPrime: (callback: (result: any) => void) => void;
    };
};

declare let TPDirect: TPDirectType;
declare global {
    interface Window {
        TPDirect: TPDirectType;
    }
}

const PaymentPage = () => {
    const [name, setName] = useState('John Doe');
    const [email, setEmail] = useState('john.doe@example.com');
    const [phoneNumber, setPhoneNumber] = useState('0912345678');
    const [amount, setAmount] = useState(2);

    useEffect(() => {
        if (typeof window !== 'undefined' && window.TPDirect) {
            TPDirect.setupSDK(
                // App ID
                process.env.TAPPAY_APP_ID || '',
                // App KEY
                process.env.TAPPAY_APP_KEY || '',
                'production' // 或 'sandbox'
            );

            TPDirect.card.setup({
                fields: {
                    number: { element: '#card-number', placeholder: '卡號' },
                    expirationDate: { element: '#card-expiration-date', placeholder: '有效期限 MM / YY' },
                    ccv: { element: '#card-ccv', placeholder: 'CVV' },
                },
                styles: {
                    input: { color: 'black' },
                    'input.ccv': { 'font-size': '16px' },
                    ':focus': { color: 'blue' },
                    '.valid': { color: 'green' },
                    '.invalid': { color: 'red' },
                },
            });
        }
    }, []);

    const handleSubmit = (event: React.FormEvent) => {
        event.preventDefault(); // 防止表單的默認提交行為
        const tappayStatus = TPDirect.card.getTappayFieldsStatus();
        console.log(tappayStatus);

        TPDirect.card.getPrime((result) => {
            if (result.status !== 0) {
                alert('取得 Prime 失敗：' + result.msg);
                return;
            };

            alert('Prime 取得成功：' + result.card.prime);
            // 傳送至後端 API
            fetch('/api/payment', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    prime: result.card.prime,
                    amount: amount,
                    cardholder: {
                        name: name,
                        email: email,
                        phone_number: phoneNumber,
                    },
                }),
            })
                .then((res) => res.json())
                .then((data) => {
                    // 檢查是否需要進行 3D 驗證
                    if (data.payment_url) {
                        // 導向到 3D 驗證頁面
                        window.location.href = data.payment_url;
                    } else if (data.status === 0) {
                        // 交易成功（不需要 3D 驗證）
                        alert('交易成功！');
                    } else {
                        // 交易失敗
                        alert('交易失敗：' + (data.msg || '未知錯誤'));
                    }
                })
                .catch((err) => alert('交易失敗：' + err.message));
        });
    };


    return (
        <div className="container" style={{ marginTop: '20px' }}>
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label>金額 (TWD)</label>
                    <input
                        type="number"
                        className="form-control"
                        value={amount}
                        onChange={(e) => setAmount(Number(e.target.value))}
                        required
                        min="1"
                        placeholder="請輸入金額"
                        readOnly
                        style={{ backgroundColor: '#e9ecef' }}
                    />
                    <small className="form-text text-muted">測試金額固定為 2 元</small>
                </div>

                <div className="form-group">
                    <label>持卡人姓名</label>
                    <input
                        type="text"
                        className="form-control"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        placeholder="請輸入持卡人姓名"
                    />
                </div>
                <div className="form-group">
                    <label>Email</label>
                    <input
                        type="email"
                        className="form-control"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        placeholder="請輸入 Email"
                    />
                </div>
                <div className="form-group">
                    <label>手機號碼</label>
                    <input
                        type="tel"
                        className="form-control"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        required
                        placeholder="請輸入手機號碼 (例: 0912345678)"
                        pattern="[0-9]{10}"
                    />
                </div>

                <hr style={{ margin: '20px 0' }} />

                <div className="form-group">
                    <label>卡號</label>
                    <div className="form-control" id="card-number"></div>
                </div>
                <div className="form-group">
                    <label>卡片到期日</label>
                    <div className="form-control" id="card-expiration-date"></div>
                </div>
                <div className="form-group">
                    <label>卡片後三碼</label>
                    <div className="form-control" id="card-ccv"></div>
                </div>

                <button type="submit" className="btn btn-default">
                    Pay
                </button>
            </form>
        </div>
    );
};

export default PaymentPage;


