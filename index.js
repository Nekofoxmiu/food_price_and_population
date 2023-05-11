'use strict';
import * as path from 'path'
import fs from 'fs';
import { fileURLToPath } from 'url';
import { parseCSV, parseCSV_withURL, parseXLSX } from "./data_convert.js"
import yargs from "yargs"
import { hideBin } from "yargs/helpers"
import axios from "axios"
import ProgressBar from "progress"

const rootFloder = `${path.dirname(fileURLToPath(import.meta.url))}`;
console.log("資料存在：", rootFloder, " 要清除乾淨請至此資料夾刪除");
const openplace = process.cwd();


function wait(ms) {
    return new Promise(resolve => setTimeout(() => resolve(), ms));
};

// 定義 yargs 參數
const argv = yargs(hideBin(process.argv))
    .option('input', {
        alias: 'i',
        describe: '輸入檔案路徑',
        demandOption: true // 要求必須輸入
    })
    .option('function', {
        alias: 'f',
        describe: '功能選擇',
        choices: ['xlsx', 'csv', 'fetch_csv'], // 可選項目
        demandOption: true // 要求必須輸入
    })
    .argv;

// 執行對應的功能
switch (argv.function) {
    case 'xlsx':
        await app_xlsx(argv.input);
        break;
    case 'csv':
        await app_csv(argv.input);
        break;
    case 'fetch_csv':
        await fetch_csv(argv.input);
        break;
    default:
        console.error(`未知的功能選擇：${argv.function}`);
        break;
}


async function app_xlsx(file_path) {

    try {
        console.log(file_path)
        let XLSX_data = await parseXLSX(file_path, 17);
        const emptyCountryISO3 = [];
        emptyCountryISO3.push(XLSX_data[0]);
        const nonEmptyCountryISO3 = XLSX_data.reduce((obj, item) => {
            if (!item.F) {
                emptyCountryISO3.push(item);
            } else {
                if (item.F === "ISO3 Alpha-code") {
                    obj["template"] = item;
                } else {
                    obj[item.F] = item;
                }
            }
            return obj;
        }, {});
        fs.writeFileSync(path.join(openplace, 'population_countryiso3.json'), JSON.stringify(nonEmptyCountryISO3, null, "    "));
        fs.writeFileSync(path.join(openplace, 'population_No_countryiso3.json'), JSON.stringify(emptyCountryISO3, null, "    "));
        process.stdout.write(`\x1b[33mfinish\x1b[0m\x1b[K\n`);
    } catch (err) {
        console.log(err);
    }


}

async function app_csv(file_path) {

    try {
        console.log(file_path)
        let CSV_data = await parseCSV_withURL(file_path);
        fs.writeFileSync(path.join(openplace, 'wfp_countries_global.json'), JSON.stringify(CSV_data, null, "    "));
        process.stdout.write(`\x1b[33mfinish\x1b[0m\x1b[K\n`);
    } catch (err) {
        console.log(err);
    }


}

async function fetch_csv(file_path) {


    try { fs.accessSync(`${openplace}\\csv_countryios3`); }
    catch {
        console.log(`read ${openplace}\\csv_countryios3 folder fail.\nCreate one.`);
        fs.mkdirSync(`${openplace}\\csv_countryios3`);
    }
    try {

        console.log(file_path)
        let CSV_list_data = JSON.parse(fs.readFileSync(file_path, 'utf8').toString());
        let countryiso3_arr = Object.keys(CSV_list_data);


        const bar = new ProgressBar('Downloading [:bar] :percent :etas', {
            complete: '=',
            incomplete: ' ',
            width: 20,
            total: countryiso3_arr.length
        });

        const downloadPromises = countryiso3_arr.map((countryiso3) => {
            return new Promise((resolve, reject) => {
                axios.get(CSV_list_data[countryiso3].csv_url, { responseType: 'stream' })
                    .then((response) => {
                        response.data.pipe(
                            fs.createWriteStream(`${openplace}\\csv_countryios3\\${CSV_list_data[countryiso3].countryiso3}_${CSV_list_data[countryiso3].unix_start_date}_${CSV_list_data[countryiso3].unix_end_date}.csv`)
                        ).on('finish', () => {
                            bar.tick(); // 每當下載完成一個檔案時更新進度條
                            resolve();
                        }).on('error', (err) => {
                            reject(err);
                        });
                    })
                    .catch((err) => {
                        reject(err);
                    });
            });
        });

        Promise.all(downloadPromises).then(() => {
            process.stdout.write(`\x1b[33mfinish\x1b[0m\x1b[K\n`);;
        }).catch((err) => {
            console.error('Error occurred:', err);
        });

    } catch (err) {
        console.log(err);
    }


}
