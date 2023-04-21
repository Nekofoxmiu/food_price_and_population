import xlstream from 'xlstream';
import { parse as csvParse } from 'csv-parse';
import fs from 'fs';
import axios from 'axios';
import cheerio from 'cheerio';

/**
 * 取得網頁內容中的 LD+JSON 物件
 * @param {string} url 要解析的網址
 * @returns {Promise} Promise 物件，解析出的 JSON 物件會在 resolve 中回傳
 */
async function fetchJSON(url) {
  const html = await axios(url).then((res) => {return res.data.toString()});
  const $ = cheerio.load(html);
  const script = $('script[type="application/ld+json"]').html();
  return JSON.parse(script);
}

/**
 * 解析 CSV 檔案
 * generate by chatgpt
 * @param {string} filePath 檔案路徑
 * @returns {array} 解析後的資料陣列
 */
export async function parseCSV_withURL(filePath) {
  const csvData = fs.readFileSync(filePath, 'utf8').toString();
  return new Promise(async (resolve, reject) => {
    csvParse(csvData, { columns: true, comment: '#' }, async (err, data) => {
      if (err) {
        reject(err);
      } else {
        // 解析 LD+JSON 物件
        let json = [];
        for (const item of data) {
          json.push(fetchJSON(item.url));
        }
        let counting = 0;
        for (const item of data) {
          process.stdout.write(`\x1b[33mprocess row: ${counting}\x1b[0m\x1b[K\r`);
          item.json = await json[counting];
          counting++;
        }
        // 轉換時間為 Unix timestamp
        for (const item of data) {
          item.unix_start_date = Math.floor(Date.parse(item.start_date) / 1000);
          item.unix_end_date = Math.floor(Date.parse(item.end_date) / 1000);
        }
        for (let i = 0; data.length > i; i++) {
          let contentUrl = data[i].json["@graph"].find(obj => obj["schema:contentUrl"])["schema:contentUrl"];
          delete data[i].json;
          data[i].csv_url = contentUrl;
      }
      const result = data.reduce((obj, item) => {
          obj[item.countryiso3] = item;
          return obj;
        }, {});
        process.stdout.write("\n");
        resolve(result);
      }
    });
  });
}

/**
 * 解析 CSV 檔案
 * generate by chatgpt
 * @param {string} filePath 檔案路徑
 * @returns {array} 解析後的資料陣列
 */
export async function parseCSV(filePath, country) {
  const csvData = fs.readFileSync(filePath, 'utf8').toString();
  return new Promise(async (resolve, reject) => {
    csvParse(csvData, { columns: true, comment: '#' }, async (err, data) => {
      if (err) {
        reject(err);
      } else {
        resolve(data);
      }
    });
  });
}

/**
 * 解析 XLSX 檔案並轉換成與 parseCSV 相同的格式
 * @param {string} filePath 檔案路徑
 * @param {number} titlerow 標題列數
 * @returns {Promise} 解析後的資料陣列
 */
export function parseXLSX(filePath, titlerow) {
  
    return new Promise((resolve, reject) => {
      let result = [];
      let row_count = 0;
  
      xlstream.getXlsxStream({ 
        filePath, 
        sheet: 0, 
        withHeader: false,
        numberFormat: "standard"
    })
        .then((stream) => {
          stream.on("data", (data) => {
            if(row_count > titlerow - 2){
                result.push(data.formatted.obj);
            }
            //console.log(data.formatted)
            process.stdout.write(`\x1b[33mprocess row: ${row_count}\x1b[0m\x1b[K\r`);
            row_count++;
          });
          stream.on("end", () => {
            process.stdout.write("\n");
            resolve(result);
          });
          stream.on("error", (err) => {
            reject(err);
          });
        })
        .catch((err) => {
          reject(err);
        });
    });
  }
  