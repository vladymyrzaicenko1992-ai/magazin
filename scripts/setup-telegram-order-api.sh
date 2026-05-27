#!/usr/bin/env bash
# Перевірка API замовлень (після деплою config.json з orderApiUrl)
set -euo pipefail
API="${1:-https://161-35-146-240.nip.io/order.php}"
curl -sS -X POST "$API" \
  -H "Content-Type: application/json" \
  -H "Origin: https://vse-v-morozilke.shop" \
  -d '{"name":"Test","phone":"+380955301343","items":[{"name":"Test item","qty":1}],"total":1}'
echo
