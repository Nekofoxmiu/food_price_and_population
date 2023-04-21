'use strict';
import * as path from 'path'
import { promises as fs } from 'fs';
import { fileURLToPath } from 'url';
import { parseCSV, parseCSV_withURL, parseXLSX } from "./data_convert.js"
import axios from "axios"

const rootFloder = `${path.dirname(fileURLToPath(import.meta.url))}`;
const XLSX_path = path.join(rootFloder, 'dataset', 'WPP2022_GEN_F01_DEMOGRAPHIC_INDICATORS_COMPACT_REV1.xlsx');
const CSV_path = path.join(rootFloder, 'dataset', 'wfp_countries_global.csv');

async function app_xlsx() {

    try {
        console.log(XLSX_path)
        let XLSX_data = await parseXLSX(XLSX_path, 17);
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

async function app_csv() {

    try {
        console.log(CSV_path)
        let CSV_data = await parseCSV_withURL(CSV_path);
        await fs.writeFile(path.join(rootFloder, 'dataset', 'wfp_countries_global.json'), JSON.stringify(CSV_data, null, "    "));
        await first_csv_prase_url();
        process.stdout.write(`\x1b[33mfinish\x1b[0m\x1b[K\n`);
    } catch (err) {
        console.log(err);
    }


}

async function first_csv_prase_url() {

    let body = await fs.readFile('C:\\Users\\Nekofox\\Desktop\\food_price_and_population\\dataset\\wfp_countries_global.json', 'utf8');
    body = body.toString();
    let data = JSON.parse(body);
    for (let i = 0; data.length > i; i++) {
        let contentUrl = data[i].json["@graph"].find(obj => obj["schema:contentUrl"])["schema:contentUrl"];
        delete data[i].json;
        data[i].csv_url = contentUrl;
    }
    await fs.writeFile(path.join(rootFloder, 'dataset', 'wfp_countries_global.json'), JSON.stringify(data, null, "    "));
}



async function specific_csv(country) {

    try {
        console.log(CSV_path)
        let CSV_data = await parseCSV(CSV_path, country);
        await fs.writeFile(path.join(rootFloder, 'dataset', `wfp_countries_${country}.json`), JSON.stringify(CSV_data, null, "    "));
        await first_csv_prase_url();
        process.stdout.write(`\x1b[33mfinish\x1b[0m\x1b[K\n`);
    } catch (err) {
        console.log(err);
    }


}

await app_xlsx();