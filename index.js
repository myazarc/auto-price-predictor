const puppeteer = require("puppeteer-extra");
const cheerio = require("cheerio");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
const { analyzeDataV2, getHTMLContent, getDatas } = require("./utils");

puppeteer.use(StealthPlugin());

const KM = 170000;

const url =
  "https://www.sahibinden.com/hyundai-i30-1.4-cvvt-team?pagingSize=50";

const data = [];
let $;

(async () => {
  //#region data fetching
  const browser = await puppeteer.launch({
    headless: true,
  });

  const page = await browser.newPage();

  await page.goto(url, {
    waitUntil: "domcontentloaded",
  });

  do {
    const htmlContent = await getHTMLContent(page);
    $ = cheerio.load(htmlContent);

    const rows = $("tbody tr");
    const datas = await getDatas($, rows);
    data.push(...datas);
    await page.$eval("a.prevNextBut", (a) => a.click());
  } while (
    $(".prevNextBut").length > 0 &&
    $(".prevNextBut").attr("title") === "Sonraki"
  );
  await browser.close();
  //#endregion

  console.log("V2 Analysis");

  let analysisV2 = analyzeDataV2(data, KM);

  console.log(`Mean Price: ${analysisV2.mean}`);
  console.log(`Median Price: ${analysisV2.median}`);
  console.log(`Q1 Price: ${analysisV2.q1}`);
  console.log(`Q3 Price: ${analysisV2.q3}`);
  console.log(`IQR: ${analysisV2.iqr}`);
  console.log(`Predicted Price for ${KM} km: ${analysisV2.predictedPrice}`);
  console.log(
    `Correlation between Price and Mileage: ${analysisV2.correlation}`
  );

  // strategy: median between median and Q1
  let finalPrice = (analysisV2.median + analysisV2.q1) / 2;

  console.log(`Recommended Sale Price: ${finalPrice}`);
})();
