# TapPay 信用卡付款流程

本文件說明此專案的 TapPay 信用卡付款完整流程。

## 架構概覽

```
使用者 → 付款頁面 → TapPay SDK → 後端 API → TapPay Server → 3D 驗證 → 付款結果頁面
```

## 詳細流程

### 1. 付款頁面初始化 (`/payment`)

**檔案**: [pages/payment.tsx](pages/payment.tsx)

1. 載入 TapPay SDK (`https://js.tappaysdk.com/sdk/tpdirect/v5.18.0`)
2. 使用 `TPDirect.setupSDK()` 初始化 SDK
   - App ID: `process.env.TAPPAY_APP_ID`
   - App Key: `process.env.TAPPAY_APP_KEY`
   - 環境: `production` 或 `sandbox`
3. 使用 `TPDirect.card.setup()` 設定信用卡欄位
   - 卡號 (`#card-number`)
   - 到期日 (`#card-expiration-date`)
   - CCV (`#card-ccv`)

### 2. 使用者輸入付款資訊

使用者需要填寫：
- 金額 (TWD)
- 持卡人姓名
- Email
- 手機號碼
- 信用卡資訊（由 TapPay SDK 處理，不經過我們的伺服器）

### 3. 取得 Prime

**檔案**: [pages/payment.tsx](pages/payment.tsx)

當使用者提交表單時：

1. 呼叫 `TPDirect.card.getPrime()` 取得 Prime Token
2. Prime 是加密後的信用卡資訊，由 TapPay SDK 產生
3. 如果取得失敗 (`result.status !== 0`)，顯示錯誤訊息

### 4. 呼叫後端付款 API

**檔案**: [pages/payment.tsx](pages/payment.tsx) → [pages/api/payment.ts](pages/api/payment.ts)

前端發送 POST 請求到 `/api/payment`，包含：

```json
{
  "prime": "取得的 Prime Token",
  "amount": 金額,
  "cardholder": {
    "name": "持卡人姓名",
    "email": "Email",
    "phone_number": "手機號碼"
  }
}
```

### 5. 後端處理付款請求

**檔案**: [pages/api/payment.ts](pages/api/payment.ts)

1. 接收前端傳來的 Prime 和付款資訊
2. 呼叫 TapPay Pay by Prime API:
   - URL: `https://prod.tappaysdk.com/tpc/payment/pay-by-prime`
   - Headers:
     - `x-api-key`: Partner Key
     - `Content-Type`: application/json
3. 請求內容：
   ```json
   {
     "prime": "Prime Token",
     "partner_key": "Partner Key",
     "merchant_id": "Merchant ID",
     "amount": 金額,
     "currency": "TWD",
     "details": "支付測試",
     "cardholder": { 持卡人資訊 },
     "three_domain_secure": true,
     "result_url": {
       "frontend_redirect_url": "付款結果頁面 URL",
       "backend_notify_url": "後端通知 URL"
     }
   }
   ```

### 6. TapPay 處理付款

TapPay 會：
1. 驗證 Prime Token
2. 與銀行進行交易
3. 如果需要 3D 驗證，回傳 `payment_url`
4. 如果不需要 3D 驗證，直接回傳交易結果

### 7. 3D 驗證流程（如果需要）

**檔案**: [pages/payment.tsx](pages/payment.tsx)

1. 如果回應包含 `payment_url`，將使用者導向該 URL
2. 使用者在銀行的 3D 驗證頁面完成驗證
3. 驗證完成後，銀行將使用者導回 `frontend_redirect_url`

### 8. 付款結果頁面

**檔案**: [pages/payment-result.tsx](pages/payment-result.tsx)

1. 接收 URL 參數：
   - `rec_trade_id`: TapPay 交易編號
   - `status`: 交易狀態
   - `auth_code`: 授權碼
   - `bank_transaction_id`: 銀行交易編號
   - `order_number`: 訂單編號

2. 自動呼叫 Record API 反查交易詳細資訊

### 9. 反查交易狀態

**檔案**: [pages/payment-result.tsx](pages/payment-result.tsx) → [pages/api/tappay/record.ts](pages/api/tappay/record.ts)

1. 前端發送 POST 請求到 `/api/tappay/record`
2. 後端呼叫 TapPay Record API:
   - URL: `https://prod.tappaysdk.com/tpc/transaction/query`
   - 請求內容：
     ```json
     {
       "partner_key": "Partner Key",
       "filters": {
         "rec_trade_id": "交易編號"
       }
     }
     ```
3. 回傳交易詳細資訊，包含在 `trade_records` 陣列中

### 10. 顯示交易結果

**檔案**: [pages/payment-result.tsx](pages/payment-result.tsx)

顯示交易詳細資訊：
- 交易狀態 (`record_status === 0` 為成功)
- 交易編號
- 銀行交易編號
- 授權碼
- 金額
- 卡號（部分遮罩）
- 持卡人資訊
- 3D 驗證狀態
- 銀行回應訊息

### 11. 後端通知（非同步）

**檔案**: [pages/api/tappay/notify.ts](pages/api/tappay/notify.ts)

TapPay 會非同步地發送 POST 請求到 `backend_notify_url`，包含交易結果。

此 API 應該：
1. 記錄通知內容
2. 更新訂單狀態
3. 執行業務邏輯（發送確認郵件等）
4. 必須回傳 200 status（否則 TapPay 會重試）

## 環境變數設定

需要在 `.env.local` 或 Vercel 環境變數中設定：

```bash
# TapPay API Keys
TAPPAY_PARTNER_KEY=partner_xxx
TAPPAY_MERCHANT_ID=tppf_xxx
TAPPAY_APP_ID=xxx
TAPPAY_APP_KEY=app_xxx
TAPPAY_ENV=production  # 或 sandbox

# 網站 URL
NEXT_PUBLIC_BASE_URL=https://your-domain.com
```

## API 端點總覽

| 端點 | 方法 | 說明 |
|------|------|------|
| `/api/payment` | POST | 處理付款請求，呼叫 TapPay Pay by Prime API |
| `/api/tappay/record` | POST | 反查交易狀態，呼叫 TapPay Record API |
| `/api/tappay/notify` | POST | 接收 TapPay 非同步通知 |

## 頁面路由總覽

| 路由 | 說明 |
|------|------|
| `/payment` | 付款頁面，使用者輸入付款資訊 |
| `/payment-result` | 付款結果頁面，顯示交易狀態和詳細資訊 |

## 測試卡號

在 Sandbox 環境測試時使用：

- **卡號**: 4242 4242 4242 4242
- **到期日**: 01/25 (任何未來日期)
- **CCV**: 123 (任何三碼)

## 交易狀態碼

### Record API Status
- `0`: 交易成功
- 其他: 交易失敗或異常

### Bank Result Code
- `00`: 交易成功
- 其他: 參考 TapPay 文件

## 注意事項

1. **安全性**
   - 信用卡資訊不經過我們的伺服器，由 TapPay SDK 直接處理
   - Partner Key 和 Merchant ID 只在後端使用，不暴露給前端
   - App ID 和 App Key 用於前端 SDK 初始化

2. **3D 驗證**
   - 啟用 `three_domain_secure: true` 可提高交易安全性
   - 需要設定正確的 redirect URL

3. **錯誤處理**
   - 所有 API 都應該有 try-catch 錯誤處理
   - 記錄錯誤到 console 以便除錯

4. **後端通知**
   - 必須回傳 200 status
   - 應該是冪等的（重複通知不會造成問題）
   - 記錄所有通知內容以便追蹤

## 相關文件

- [TapPay 官方文件](https://docs.tappaysdk.com/)
- [Pay by Prime API](https://docs.tappaysdk.com/tutorial/zh/reference.html#pay-by-prime-api)
- [Record API](https://docs.tappaysdk.com/tutorial/zh/reference.html#record-api)
