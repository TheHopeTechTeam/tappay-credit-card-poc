import axios from 'axios';
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    // 設置 CORS 頭部
    res.setHeader('Access-Control-Allow-Origin', '*'); // 允許所有域名進行跨域請求
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS'); // 允許的 HTTP 方法
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-api-key'); // 允許的標頭

    // 處理 Preflight（預檢）請求
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method === 'POST') {
        const { prime, amount, cardholder } = req.body;

        try {
            const response = await axios.post(
                'https://prod.tappaysdk.com/tpc/payment/pay-by-prime',
                {
                    prime,
                    partner_key: process.env.TAPPAY_PARTNER_KEY,
                    merchant_id: process.env.TAPPAY_MERCHANT_ID,
                    amount,
                    currency: 'TWD',
                    details: '支付測試',
                    cardholder,
                    // 啟用 3D 驗證
                    three_domain_secure: true,
                    result_url: {
                        frontend_redirect_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/payment-result`,
                        backend_notify_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/tappay/notify`,
                    },
                },
                {
                    headers: {
                        'x-api-key': process.env.TAPPAY_PARTNER_KEY,
                        'Content-Type': 'application/json',
                    },
                    timeout: 30000, // 設定 timeout 為 30 秒
                }
            );

            res.status(200).json(response.data);
        } catch (error: any) {
            res.status(500).json({ error: error || '未知錯誤' });
        }
    } else {
        res.status(405).json({ error: 'Method Not Allowed' });
    }
}


