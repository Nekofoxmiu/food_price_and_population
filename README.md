# food_price_and_population
 School statistics project  
  
|  Options|別名|說明|是否必填|輸入甚麼|
| :------:  | :------: | :------: | :------: | :------: |
|--help||Show help|[boolean]|none|
|--version||Show version number|[boolean]|none|
|--input|-i|輸入檔案路徑|[required]|檔案路徑|
|--function|-f|功能選擇|[required]|[choices: "xlsx", "csv", "fetch_csv", "normal_csv", "keep"]|
|--keep|-k|保留的欄位|[option]|以空白分隔的保留欄位名|
|--pick|-p|選擇條件|[option]|以;分隔的keyvalue組合|
  
example：
首先要將csv轉為json
parser -i "path/to/csv" -f  normal_csv

然後處理好的json再丟入下列命令處理為可放入R的csv
parser -i "path/to/already/parse/json" -f keep -k date commodity price -p "commodity=Rice (low quality)"

最後看著R的範例，依照對應的欄位填入路徑、檔案名等
