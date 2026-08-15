import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

globalThis.React = React;

const {
  CurrencyValue,
  formatCurrency,
  formatExactCurrency
} = await import("../src/components/ui/CurrencyValue.js");
const {
  formatPercentage,
  PercentageValue
} = await import("../src/components/ui/PercentageValue.js");
const {
  formatExactTokenPrice,
  formatTokenPrice,
  TokenPriceValue
} = await import("../src/components/ui/TokenPriceValue.js");

assert.equal(formatCurrency(Number.NaN), "$0.00");
assert.equal(formatCurrency(1_250), "$1,250");
assert.equal(formatExactCurrency(1_250), "$1,250.00");
assert.equal(formatTokenPrice(Number.NaN), "$0.00");
assert.equal(formatTokenPrice(-1), "$0.00");
assert.equal(formatTokenPrice(2_500), "$2,500.00");
assert.equal(formatTokenPrice(1.23456), "$1.2346");
assert.equal(formatTokenPrice(0.123456), "$0.123456");
assert.equal(formatTokenPrice(0.0000123456), "$0.0000123456");
assert.equal(formatTokenPrice(0.00000000001), "<$0.0000000001");
assert.equal(formatExactTokenPrice(0.019978510478617935), "$0.019978510478617935");
assert.equal(
  formatPercentage(0.04, { maximumFractionDigits: 1, minimumDisplayValue: 0.1 }),
  "<0.1%"
);

const currencyMarkup = renderToStaticMarkup(
  React.createElement(CurrencyValue, { "aria-label": "总资产", value: 248.06 })
);
assert.match(currencyMarkup, /aria-hidden="true" data-slot="currency-display"/);
assert.match(currencyMarkup, /data-slot="currency-exact">总资产：\$248\.06<\/span>/);

const tokenPriceMarkup = renderToStaticMarkup(
  React.createElement(TokenPriceValue, { "aria-label": "QIC 单价", value: 0.0000123456 })
);
assert.match(tokenPriceMarkup, /aria-hidden="true" data-slot="token-price-display"/);
assert.match(
  tokenPriceMarkup,
  /data-slot="token-price-exact">QIC 单价：\$0\.0000123456<\/span>/
);

const tinyTokenPriceMarkup = renderToStaticMarkup(
  React.createElement(TokenPriceValue, { "aria-label": "微价币单价", value: 0.00000000001 })
);
assert.match(tinyTokenPriceMarkup, /data-threshold="true"/);
assert.match(tinyTokenPriceMarkup, /data-part="threshold">&lt;<\/span>/);
assert.match(
  tinyTokenPriceMarkup,
  /data-slot="token-price-exact">微价币单价：\$0\.00000000001<\/span>/
);

const percentageMarkup = renderToStaticMarkup(
  React.createElement(PercentageValue, { "aria-label": "计入比例", value: 80 })
);
assert.match(percentageMarkup, /aria-hidden="true" data-slot="percentage-display"/);
assert.match(percentageMarkup, /data-slot="percentage-spoken">计入比例：80%<\/span>/);

const thresholdMarkup = renderToStaticMarkup(
  React.createElement(PercentageValue, {
    maximumFractionDigits: 1,
    minimumDisplayValue: 0.1,
    value: 0.04
  })
);
assert.match(thresholdMarkup, /data-threshold="true"/);
assert.match(thresholdMarkup, /data-slot="percentage-spoken">&lt;0\.1%<\/span>/);

console.log("numeric value checks passed");
