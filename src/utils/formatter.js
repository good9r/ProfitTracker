// 格式化為「萬」單位，如：+12.01萬、-1.43萬
export function formatWan(num) {
  const wan = num / 10000;
  const sign = wan > 0 ? "+" : "";
  return `${sign}${wan.toFixed(2)}萬`;
}

// 格式化 USD，如：$175,040.88
export function formatUSD(num) {
  const absNum = Math.abs(num);
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    signDisplay: "never",
  }).format(absNum);
}

// 格式化 NTD，如：NT$175,040
export function formatNTD(num) {
  const absNum = Math.abs(num);
  return new Intl.NumberFormat("zh-TW", {
    style: "currency",
    currency: "TWD",
    signDisplay: "never",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(absNum);
}

// 格式化百分比，如：+148.88%、-4.32%
export function formatPercent(num) {
  const sign = num > 0 ? "+" : "";
  return `${sign}${num.toFixed(2)}%`;
}
