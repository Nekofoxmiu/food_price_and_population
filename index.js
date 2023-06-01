'use strict';
import * as path from 'path'
import fs from 'fs';
import { fileURLToPath } from 'url';
import { parseCSV, parseCSV_withURL, parseXLSX } from "./data_convert.js"
import yargs from "yargs"
import { hideBin } from "yargs/helpers"
import axios from "axios"
import ProgressBar from "progress"
import { createObjectCsvWriter as csvWriter } from 'csv-writer';

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
        choices: ['xlsx', 'csv', 'fetch_csv', 'normal_csv', 'keep', 'test'], // 可選項目
        demandOption: true // 要求必須輸入
    })
    .option('keep', {
        alias: 'k',
        type: 'array',
        describe: '保留的欄位',
        demandOption: false // 選擇性輸入
    })
    .option('pick', {
        alias: 'p',
        describe: '選擇條件',
        type: 'array'
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
    case 'normal_csv':
        await app_normal_csv(argv.input);
        break;
    case 'keep':
        console.log(argv.keep);
        const conditions = [];
        if (argv.pick) {
            argv.pick.forEach(condition => {
                const [field, valueStr] = condition.split('=');
                const values = valueStr.split(';'); // 分割逗號分隔的值
                conditions.push({ field, values });
            });
        }
        await keep(argv.input, conditions);
        break;
    case 'test':
        await test(argv.input)
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
        const nonEmptyCountryISO3 = [];
        XLSX_data.reduce((obj, item) => {
            if (!item.F) {
                emptyCountryISO3.push(item);
            } else {
                nonEmptyCountryISO3.push(item);
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

async function app_normal_csv(file_path) {

    try {
        console.log(file_path)
        let CSV_data = await parseCSV(file_path);
        fs.writeFileSync(path.join(openplace, `${path.parse(file_path).name}.json`), JSON.stringify(CSV_data, null, "    "));
        process.stdout.write(`\x1b[33mfinish\x1b[0m\x1b[K\n`);
    } catch (err) {
        console.log(err);
    }


}

function calculateAveragePrice(data) {
    const groupedData = {};

    // 分組計算總價格和數量
    for (const item of data) {
        const { date, price } = item;

        if (!groupedData[date]) {
            groupedData[date] = {
                totalPrice: parseFloat(price),
                count: 1
            };
        } else {
            groupedData[date].totalPrice += parseFloat(price);
            groupedData[date].count++;
        }
    }

    const updatedData = [];

    // 計算平均價格並更新原始物件
    for (const item of data) {
        const { date, price } = item;

        if (groupedData[date]) {
            const averagePrice = groupedData[date].totalPrice / groupedData[date].count;
            item.price = averagePrice.toFixed(2);
            updatedData.push(item);
            delete groupedData[date];
        } else if (!price) {
            updatedData.push(item);
        }
    }


    return updatedData;
}

function replaceKeysWithDates(array) {
    const merged = array.reduce((result, obj) => {
        const { F, K, L, M, ...rest } = obj;

        if (typeof F === 'string' && F.length > 0 && /^\d{4}$/.test(K)) {
            if (!result[F]) {
                result[F] = { ios3: F, data: [] };
            }

            const year = K.toString();

            const updatedObj = {
                [year + '-01-01']: L,
                [year + '-06-01']: M,
                ...rest
            };

            result[F].data.push(updatedObj);
        }

        return result;
    }, {});

    return Object.values(merged).map(({ ios3, data }) => {
        const mergedObj = data.reduce((result, obj) => {
            Object.entries(obj).forEach(([key, value]) => {
                if (result.hasOwnProperty(key)) {
                    result[key] += value;
                } else {
                    result[key] = value;
                }
            });

            return result;
        }, {});

        return { ios3, ...mergedObj };
    });
}

async function keep(file_path, conditions) {

    try {
        console.log(file_path)
        let CSV_list_data = JSON.parse(fs.readFileSync(file_path, 'utf8').toString());

        const filteredArray = CSV_list_data.map(obj =>
            Object.keys(obj)
                .filter(key => argv.keep.includes(key))
                .reduce((newObj, key) => {
                    newObj[key] = obj[key];
                    return newObj;
                }, {})
        );
        const filterByConditions = (item, conditions) => {
            for (const condition of conditions) {
                const { field, values } = condition;
                if (!values.includes(item[field])) {
                    return false;
                }
            }
            return true;
        };
        const filteredData = filteredArray.filter(item => filterByConditions(item, conditions));

        let result = filteredData;

        if (filteredData[0].price) {
            result = calculateAveragePrice(filteredData);
        }

        if (filteredData[0].F) {
            result = replaceKeysWithDates(filteredData);
        }

        const header = Object.keys(result[0]).map(key => ({
            id: key,
            title: key  // 可以根據需要進行標題的修改
        }));

        const writer = csvWriter({
            path: path.join(openplace, `${path.parse(file_path).name}_filter.csv`),
            header: header
        });

        writer.writeRecords(result)
            .then(() => console.log('CSV 轉換完成'))
            .catch((error) => console.error('轉換失敗', error));

        fs.writeFileSync(path.join(openplace, `${path.parse(file_path).name}_filter.json`), JSON.stringify(result, null, "    "));
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
                            fs.createWriteStream(`${openplace}\\csv_countryios3\\${CSV_list_data[countryiso3].countryiso3}_${new Date(CSV_list_data[countryiso3].unix_start_date * 1000).getFullYear()}_${new Date(CSV_list_data[countryiso3].unix_end_date * 1000).getFullYear()}.csv`)
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

async function test(file_path) {
    // let CSV_list_data = JSON.parse(fs.readFileSync(file_path, 'utf8').toString());

    // CSV_list_data.forEach(obj => {
    //     const { ios3, ...rest } = obj;
    //     const writer = csvWriter({
    //         path: `${ios3}.csv`,
    //         header: [
    //             { id: 'date', title: 'Date' },
    //             { id: 'population', title: 'Population' }
    //         ]
    //     });

    //     const records = Object.entries(rest).map(([date, population]) => ({ date, population }));

    //     writer.writeRecords(records)
    //         .then(() => console.log(`CSV file ${ios3}.csv created successfully.`))
    //         .catch(error => console.error(`Error creating CSV file ${ios3}.csv: ${error}`));
    // });

    let obj = JSON.parse(fs.readFileSync(file_path, 'utf8').toString());
    const filteredArray = obj.comments.filter(obj => obj.commenter.display_name === "厄倫蒂兒");
    obj.comments = filteredArray;
    fs.writeFileSync(path.join(openplace, `${path.parse(file_path).name}_format.json`), JSON.stringify(obj, null, "    "));
}