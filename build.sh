#!/bin/bash
source ~/.nvm/nvm.sh
nvm use 22
export DATABASE_URL="postgresql://postgres:postgres12345%23@localhost:5432/receipt_app?schema=public"
cd /var/www/struk
npx next build 2>&1
