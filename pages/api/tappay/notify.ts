import { NextApiRequest, NextApiResponse } from 'next';

// 儲存最近的通知記錄（最多保留 50 筆）
const notificationHistory: any[] = [];
const MAX_HISTORY = 50;

// 匯出函數以供其他 API 讀取
export function getNotificationHistory() {
    return notificationHistory;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    // GET 請求：回傳通知記錄
    if (req.method === 'GET') {
        return res.status(200).json({
            total: notificationHistory.length,
            notifications: notificationHistory
        });
    }

    // 只接受 POST 請求
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        // 記錄完整的 request headers
        const headers = req.headers;

        // 記錄完整的 request body
        const body = req.body;

        // 建立詳細的記錄資料
        const logData = {
            timestamp: new Date().toISOString(),
            method: req.method,
            url: req.url,
            headers: headers,
            body: body,
        };

        // 儲存到記憶體（開發用）
        notificationHistory.unshift(logData);
        if (notificationHistory.length > MAX_HISTORY) {
            notificationHistory.pop();
        }

        // 輸出到 console (可在 Vercel Logs 中查看)
        console.log('=== TapPay 通知 ===');
        console.log('時間:', logData.timestamp);
        console.log('Headers:', JSON.stringify(headers, null, 2));
        console.log('Body:', JSON.stringify(body, null, 2));
        console.log('==================');

        // TapPay 會發送的通知資料
        const {
            rec_trade_id,
            bank_transaction_id,
            amount,
            currency,
            status,
            msg,
            order_number,
            transaction_time_millis,
            cardholder,
        } = body;

        // 檢查交易狀態
        if (status === 0) {
            // 交易成功
            console.log('✓ 交易成功:', rec_trade_id);

            // 在這裡執行你的業務邏輯：
            // 1. 更新訂單狀態
            // 2. 記錄到數據庫
            // 3. 發送確認郵件等

        } else {
            // 交易失敗
            console.log('✗ 交易失敗:', msg);

            // 處理失敗邏輯
        }

        // 回應 TapPay (必須回傳 200 status)
        res.status(200).json({
            success: true,
            message: 'Notification received'
        });

    } catch (error: any) {
        console.error('處理 TapPay 通知時發生錯誤:', error);

        // 記錄錯誤
        const errorLog = {
            timestamp: new Date().toISOString(),
            error: error.message,
            stack: error.stack,
            headers: req.headers,
            body: req.body,
        };

        console.log('錯誤記錄:', JSON.stringify(errorLog, null, 2));

        // 即使發生錯誤也要回傳 200，避免 TapPay 重複發送通知
        res.status(200).json({
            success: false,
            message: error.message || '處理通知時發生錯誤'
        });
    }
}

