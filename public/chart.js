const DAY_SECS = 86400;
const WEEK_SECS = 604800;
const MONTH_SECS = 2592000;
const YEAR_SECS = 31536000;
const EDT_OFFSET = 14400;

function getUTCTimestampSeconds() {
    return Math.floor(Date.now() / 1000);
}

function createRange(to, scale) {
    switch(scale) {
        case 'day': {
            // let from = to - (to % DAY_SECS);
            let from = to - DAY_SECS;
            return {
                from: from,
                to: to,
                interval: "5"
            };
        }
        case 'week': {
            let from = to - WEEK_SECS;
            return {
                from: from,
                to: to,
                interval: "30"
            };
        }
        case 'month': {
            let from = to - MONTH_SECS;
            return {
                from: from,
                to: to,
                interval: "60"
            };
        }
        case 'year': {
            let from = to - YEAR_SECS;
            return {
                from: from,
                to: to,
                interval: "D"
            };
        }
        default:
            console.log("Error parsing range")
    }
}

/**
 * @return {number}
 */
function UTCtoEDT(utc) {
    return utc - EDT_OFFSET;
}

function getFinnQuote(symbol) {
    return fetch('/finnhub/quote/?symbol=' + symbol)
        .then(response => response.json())
}

function getStockCandle(symbol, interval, from, to) {
    return fetch('/finnhub/candlestick/?symbol=' + symbol + '&interval=' + interval + '&from=' + from + '&to=' + to)
        .then(response => response.json())
}

function getCryptoCandle(symbol, interval, from, to) {
    return fetch('/finnhub/crypto/?symbol=' + symbol + '&interval=' + interval + '&from=' + from + '&to=' + to)
        .then(response => response.json())
}

function finnCandleToOHLCData(data) {
    let result = [];
    for (let i = 0; i < data.c.length; i++) {
        result.push({
                "time": UTCtoEDT(data.t[i]),
                "open": data.o[i],
                "high": data.h[i],
                "low": data.l[i],
                "close": data.c[i]
            });
    }
    return result;
}

function loadChartData(symbol, scale, chart, series, title) {
    let now = getUTCTimestampSeconds();
    let range = createRange(now, scale);

    // getStockCandle(symbol, range.interval, range.from, range.to)
    getCryptoCandle(symbol, range.interval, range.from, range.to)
        .then(data => {
            title.innerText = "Price chart for " + symbol;

            let priceData = finnCandleToChartData(data);
            series.setData(priceData);
            // series.setData(data);

            chart.timeScale().setVisibleRange({
                from: range.from,
                to: range.to
            });
            chart.timeScale().fitContent();
        });
}

document.addEventListener('DOMContentLoaded', function() {
    const chartBody = document.getElementById('chart');
    const chartTitle = document.getElementById('chart-title');
    const symbolSelectForm = document.getElementById('symbol-select');

    const current = document.getElementById('price-current');
    const open = document.getElementById('price-open');
    const high = document.getElementById('price-high');
    const low = document.getElementById('price-low');
    const lastUpdated = document.getElementById('last-updated');

    const priceChart = LightweightCharts.createChart(chartBody, {
        width: 480,
        height: 300,
        timeScale: {
            timeVisible: true
        }});
    const barSeries = priceChart.addBarSeries();

    // let symbol = "AAPL";
    let symbol = "BINANCE:BTCUSDT";
    let scale = "day";

    // console.log(getFinnQuote(symbol));

    document.querySelectorAll('input[name="date-scale"]').forEach((button) => {
        button.addEventListener("click", function(event) {
            // console.log(event.target.id);
            scale = event.target.id;
            loadChartData(symbol, scale, priceChart, barSeries, chartTitle);
        })
    });

    loadChartData(symbol, scale, priceChart, barSeries, chartTitle);

    symbolSelectForm.addEventListener('submit', (event) => {
        event.preventDefault();
        symbol = event.target[0].value;
        updateQuote();
        loadChartData(symbol, scale, priceChart, barSeries, chartTitle);
    });

    function updateQuote() {
        getFinnQuote(symbol)
            .then(data => {
                // console.log(data);
                current.innerText = data.c;
                open.innerText = data.o;
                high.innerText = data.h;
                low.innerText = data.l;
                let now = new Date();
                lastUpdated.innerText = now.toLocaleString('en-US', {timeZone: 'America/New_York'}) + " EDT";
            })
    }

    updateQuote();
    const refreshQuotes = setInterval(updateQuote, 60000);

});
