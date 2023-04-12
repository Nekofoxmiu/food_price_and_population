import xlstream from 'xlstream';
import { parse as csvParse } from 'csv-parse';
import fs, { copyFileSync } from 'fs';
import { setDefaultResultOrder } from 'dns/promises';

/**
 * 解析 CSV 檔案
 * @param {string} filePath 檔案路徑
 * @returns {array} 解析後的資料陣列
 */
export async function parseCSV(filePath) {
  const csvData = fs.readFileSync(filePath, 'utf8');
  return new Promise((resolve, reject) => {
    csvParse(csvData, { columns: true }, (err, data) => {
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
  