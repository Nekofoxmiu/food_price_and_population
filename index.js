'use strict';
import * as path from 'path'
import { promises as fs } from 'fs';
import { fileURLToPath } from 'url';
import {parseCSV, parseXLSX} from "./data_convert.js"

const rootFloder = `${path.dirname(fileURLToPath(import.meta.url))}`;
const XLSX_path = path.join(rootFloder, 'dataset', 'WPP2022_GEN_F01_DEMOGRAPHIC_INDICATORS_COMPACT_REV1.xlsx');

async function app () {

    try{
        console.log(XLSX_path)
        let XLSX_data = await parseXLSX(XLSX_path,17);
        await fs.writeFile(path.join(rootFloder, 'dataset', 'WPP2022_GEN_F01_DEMOGRAPHIC_INDICATORS_COMPACT_REV1.json'), JSON.stringify(XLSX_data, null, "    "));
        process.stdout.write(`\x1b[33mfinish\x1b[0m\x1b[K\n`);
    } catch(err) {
        console.log(err);
    }
    

}

await app();