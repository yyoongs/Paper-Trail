const LAST_500_POINTS = 30000;
const WEEK_SECS = 604800;
const EDT_OFFSET = 14400;

const CHART_WIDTH_PERCENTAGE = 0.9;
const CHART_HEIGHT_PERCENTAGE  = 0.7;

let lastTimestamp;

function getUTCTimestampSeconds() {
    return Math.floor(Date.now() / 1000);
}

function createRange(to, scale) {
    switch(scale) {
        case 'day': {
            // let from = to - DAY_SECS;
            let from = to - LAST_500_POINTS;
            return {
                from: from,
                to: to,
                interval: "1"
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

function getCryptoCandle(symbol, interval, from, to) {
    return fetch('/finnhub/crypto/?symbol=' + symbol + '&interval=' + interval + '&from=' + from + '&to=' + to)
        .then(response => response.json())
}

function finnCandleToLineData(data) {
    let result = [];
    for (let i = 0; i < data.c.length; i++) {
        result.push({
            "time": UTCtoEDT(data.t[i]),
            "value": data.c[i]
        });
    }
    return result;
}

function loadChartData(symbol, scale, chart, series, symbolName, current, updated) {
    // makeScaleButtonActive(scale);
    let now = getUTCTimestampSeconds();
    let range = createRange(now, scale);

    getCryptoCandle(symbol, range.interval, range.from, range.to)
        .then(data => {
            symbolName.innerText = symbol;

            let priceData = finnCandleToLineData(data);
            series.setData(priceData);

            chart.timeScale().fitContent();
            lastTimestamp = range.to;

            updateQuote(current, priceData[priceData.length - 1].value, updated);
        });
}

function updateQuote(current, currentPrice, updated) {
    current.innerText = currentPrice.toFixed(2);
    updated.innerText = new Date().toLocaleString('en-US', {timeZone: 'America/New_York'}) + " EDT";
}

document.addEventListener('DOMContentLoaded', function() {
    const chartBody = document.getElementById('chart');
    const graphContainer = document.getElementById('graphContainer');
    const symbolName = document.getElementById('symbol-name');
    const symbolSelectForm = document.getElementById('symbol-select');

    console.log("chartContainer has width: " + graphContainer.offsetWidth + ", height: " + graphContainer.offsetHeight);

    const current = document.getElementById('price-current');
    const updated = document.getElementById('last-updated');

    const priceChart = LightweightCharts.createChart(chartBody, {
        // width: 480,
        // height: 300,
        width: Math.floor(graphContainer.offsetWidth * CHART_WIDTH_PERCENTAGE),
        height: Math.floor(graphContainer.offsetHeight * CHART_HEIGHT_PERCENTAGE),
        timeScale: {
            timeVisible: true
        },
        grid: {
            vertLines: {
                visible: false
            }
        }
    });
    const areaSeries = priceChart.addAreaSeries({lineWidth: 1});

    let symbol = "BINANCE:BTCUSDT";
    let scale = "day";

    loadChartData(symbol, scale, priceChart, areaSeries, symbolName, current, updated);

    symbolSelectForm.addEventListener('submit', (event) => {
        event.preventDefault();
        symbol = event.target[0].value;
        loadChartData(symbol, 'day', priceChart, areaSeries, symbolName, current, updated);
    });

    function updateChart() {
        getFinnQuote(symbol)
            .then(data => {
                let currentTimestamp = UTCtoEDT(getUTCTimestampSeconds());
                if (currentTimestamp < lastTimestamp + 60) {
                    areaSeries.update({
                        time: lastTimestamp,
                        value: data.c
                    });
                } else {
                    areaSeries.update({
                        time: currentTimestamp,
                        value: data.c
                    });
                    lastTimestamp = currentTimestamp;
    }

                updateQuote(current, data.c, updated);
            })
    }

    const refreshChart = setInterval(updateChart, 1000);
});
