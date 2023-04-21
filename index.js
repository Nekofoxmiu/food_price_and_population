'use strict';
import * as path from 'path'
import { promises as fs } from 'fs';
import { fileURLToPath } from 'url';
import { parseCSV, parseCSV_withURL, parseXLSX} from "./data_convert.js"
import yargs from "yargs"
import {hideBin} from "yargs/helpers"

const rootFloder = `${path.dirname(fileURLToPath(import.meta.url))}`;
const XLSX_path = path.join(rootFloder, 'dataset', 'WPP2022_GEN_F01_DEMOGRAPHIC_INDICATORS_COMPACT_REV1.xlsx');
const CSV_path = path.join(rootFloder, 'dataset', 'wfp_countries_global.csv');

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
        choices: ['app_xlsx', 'app_csv', 'specific_csv'], // 可選項目
        demandOption: true // 要求必須輸入
    })
    .argv;

// 執行對應的功能
switch (argv.function) {
    case 'app_xlsx':
        await app_xlsx(argv.input);
        break;
    case 'app_csv':
        await app_csv(argv.input);
        break;
    case 'specific_csv':
        await specific_csv(argv.input);
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
                if(item.F === "ISO3 Alpha-code") {
                    obj["template"] = item;
                } else {
                    obj[item.F] = item;
                }
            }
            return obj;
        }, {});
        await fs.writeFile(path.join(rootFloder, 'dataset', 'population_countryiso3.json'), JSON.stringify(nonEmptyCountryISO3, null, "    "));
        await fs.writeFile(path.join(rootFloder, 'dataset', 'population_No_countryiso3.json'), JSON.stringify(emptyCountryISO3, null, "    "));
        process.stdout.write(`\x1b[33mfinish\x1b[0m\x1b[K\n`);
    } catch (err) {
        console.log(err);
    }


}

async function app_csv(file_path) {

    try {
        console.log(file_path)
        let CSV_data = await parseCSV_withURL(file_path);
        await fs.writeFile(path.join(rootFloder, 'dataset', 'wfp_countries_global.json'), JSON.stringify(CSV_data, null, "    "));
        process.stdout.write(`\x1b[33mfinish\x1b[0m\x1b[K\n`);
    } catch (err) {
        console.log(err);
    }


}

async function specific_csv(file_path, country) {

    try {
        console.log(file_path)
        let CSV_data = await parseCSV(file_path, country);
        await fs.writeFile(path.join(rootFloder, 'dataset', `wfp_countries_${country}.json`), JSON.stringify(CSV_data, null, "    "));
        await first_csv_prase_url();
        process.stdout.write(`\x1b[33mfinish\x1b[0m\x1b[K\n`);
    } catch (err) {
        console.log(err);
    }


}
