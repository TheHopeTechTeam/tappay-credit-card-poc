import axios from 'axios';
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { rec_trade_id } = req.body;

    if (!rec_trade_id) {
        return res.status(400).json({ error: 'rec_trade_id is required' });
    }

    try {
        // 呼叫 TapPay Record API 反查交易狀態
        const response = await axios.post(
            'https://prod.tappaysdk.com/tpc/transaction/query',
            {
                partner_key: process.env.TAPPAY_PARTNER_KEY,
                filters: {
                    rec_trade_id: rec_trade_id,
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

        // 記錄查詢結果
        console.log('=== TapPay Record API 查詢 ===');
        console.log('rec_trade_id:', rec_trade_id);
        console.log('查詢結果:', JSON.stringify(response.data, null, 2));
        console.log('============================');

        res.status(200).json(response.data);

    } catch (error: any) {
        console.error('查詢交易狀態失敗:', error.response?.data || error.message);

        res.status(500).json({
            error: error.response?.data || error.message || '查詢失敗'
        });
    }
}

