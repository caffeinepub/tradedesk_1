# TradeDesk

## Current State
- Payments page has 4 deposit methods (Card, Bank Wire, Crypto, E-Wallet) and 4 withdrawal methods
- Transaction history shows static sample data
- There is a "KYC Required" badge on the withdrawal tab header but no actual KYC flow
- Backend has authorization, user profiles, balance, portfolio, trade history, and watchlist

## Requested Changes (Diff)

### Add
- UPI payment method as a new deposit and withdrawal option (5th method in each panel)
  - UPI-specific form: UPI ID input field (e.g. name@upi), QR code display placeholder, virtual payment address
  - Processing time: Instant, fee: Free, limits: min ₹100 / max ₹100,000
- Full KYC verification flow accessible from Payments page and a new KYC page/section
  - KYC steps: Personal Info (name, DOB, nationality, address), ID Verification (upload govt ID front/back), Selfie Verification (selfie with ID), Review & Submit
  - KYC status levels: Unverified, Pending, Level 1 (basic), Level 2 (full)
  - KYC banner/prompt in payments page when status is unverified or pending
  - KYC unlocks higher deposit/withdrawal limits
  - Backend: submitKYC, getKYCStatus functions to store KYC data per user
- KYC page added to sidebar navigation

### Modify
- Payments page: Add UPI as 5th payment method card in both deposit and withdrawal grids
- UPI deposit panel: show UPI ID input, virtual payment address instructions
- Backend: add KYC status types and submitKYC / getKYCStatus functions

### Remove
- Nothing removed

## Implementation Plan
1. Update backend main.mo to add KYCStatus type, KYCSubmission type, per-user KYC storage, submitKYC and getKYCStatus functions
2. Add UPI payment method to DEPOSIT_METHODS and WITHDRAW_METHODS arrays with UPI-specific form UI
3. Create KYC.tsx page with step-by-step KYC wizard (Personal Info -> ID Upload -> Selfie -> Review)
4. Add KYC status banner to Payments page that links to KYC flow
5. Add KYC navigation item to sidebar
6. Wire KYC status from backend to payment limits and badge display
