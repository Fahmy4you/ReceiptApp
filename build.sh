#!/bin/bash
source ~/.nvm/nvm.sh 2>/dev/null && nvm use 22 2>/dev/null || true
export DATABASE_URL="postgresql://postgres:postgres12345%23@localhost:5432/receipt_app?schema=public"
cd /root/receiptapp
npx next build 2>&1
pkill -f "next-server" 2>/dev/null
sleep 1
nohup npm start >> /root/receiptapp/prod.log 2>&1 &
