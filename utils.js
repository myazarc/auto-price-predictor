const regression = require("regression");
const math = require("mathjs");
const sleep = (ms) => new Promise((res) => setTimeout(res, ms));

const getDatas = async ($, rows) => {
  const data = rows
    .map((i, row) => {
      const columns = $("td", row);

      const km =
        parseFloat(
          $(columns.get(4)).text().trim().replace(".", "").replace(",", ".")
        ) || 0;
      const year = parseFloat($(columns.get(3)).text().trim()) || 0;
      const price =
        parseFloat(
          $("span", columns.get(6))
            .text()
            .trim()
            .replace("TL", "")
            .trim()
            .replace(".", "")
            .replace(",", ".")
        ) || 0;
      return {
        price,
        km,
        year,
      };
    })
    .get()
    .filter((item) => item.price > 0 && item.km > 0 && item.year > 0);

  return data;
};

const getHTMLContent = async (page) => {
  await sleep(2000);
  /*await page.screenshot({
      path: +new Date().getTime() + "testresult.png",
      fullPage: true,
    });
    */

  await page.waitForSelector(".searchResultsRowClass");

  const htmlContent = await page.content();
  return htmlContent;
};

const calculateIQR = (prices) => {
  prices.sort((a, b) => a - b);

  let q1 = prices[Math.floor(prices.length / 4)];
  let q3 = prices[Math.floor((prices.length * 3) / 4)];
  let iqr = q3 - q1;

  return { q1, q3, iqr };
};

const calculateCorrelation = (prices, kms) => {
  let meanPrice = math.mean(prices);
  let meanKM = math.mean(kms);

  let numerator = 0;
  let denominatorPrice = 0;
  let denominatorKM = 0;

  for (let i = 0; i < prices.length; i++) {
    let priceDiff = prices[i] - meanPrice;
    let kmDiff = kms[i] - meanKM;

    numerator += priceDiff * kmDiff;
    denominatorPrice += priceDiff ** 2;
    denominatorKM += kmDiff ** 2;
  }

  let denominator = Math.sqrt(denominatorPrice * denominatorKM);

  return numerator / denominator;
};

const analyzeDataV2 = (carData, KM) => {
  let prices = carData.map((car) => car.price);
  let kms = carData.map((car) => car.km);

  let mean = prices.reduce((a, b) => a + b, 0) / prices.length;
  prices.sort((a, b) => a - b);
  let median = prices[Math.floor(prices.length / 2)];

  let { q1, q3, iqr } = calculateIQR(prices);

  let regressionResult = regression.linear(
    carData.map((car) => [car.km, car.price])
  );
  let predictedPrice =
    regressionResult.equation[0] * KM + regressionResult.equation[1];

  const correlation = calculateCorrelation(prices, kms);

  return { mean, median, q1, q3, iqr, predictedPrice, correlation };
};

module.exports = {
  getDatas,
  getHTMLContent,
  analyzeDataV2,
};
