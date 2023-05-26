# 繪製價格變化率圖函數
plot_price_trend <- function(data, years, filename) {
  price <- ts(as.numeric(data$price), start = min(years), freq = 12, end = max(years))

  # 設置繪圖設備
  png(c(filename, ".png"), width = 1600, height = 2400, res = 200)

  # 繪製價格變化率圖
  ts.plot(price, xlab = "Year", ylab = "Price", type = "l", main = filename, lty = c(1:2), gpars = list(xaxt = "n"))
  axis(1, at = years)

  # 關閉繪圖設備
  dev.off()
}

# 繪製價格變化率圖函數
plot_price_variation <- function(data, years, filename) {
  price <- ts(as.numeric(data$price), start = min(years), freq = 12, end = max(years))
  diff_ts <- (diff(price) / lag(price, 1)) * 100

  # 設置繪圖設備
  png(c(filename, ".png"), width = 1600, height = 2400, res = 200)

  # 繪製價格變化率圖
  ts.plot(diff_ts, xlab = "Year", ylab = "Price_var (%)", type = "l", main = filename, lty = c(1:2), gpars = list(xaxt = "n"))
  axis(1, at = years)

  # 關閉繪圖設備
  dev.off()
}

lao <- read.csv("LAO_2006_2023_filter.csv", header = TRUE)
years <- 2006:2023

plot_price_trend(lao, years, "寮國米價(次等的)走勢.png")
plot_price_variation(lao, years, "寮國米價(次等的)走勢變化率.png")

# 2019_04_15 為缺失值，通過上下月份平均補上

mmr <- read.csv("MMR_2008_2023_filter.csv", header = TRUE)
years <- 2008:2023

plot_price_trend(mmr, years, "緬甸米價(劣質的)走勢.png")
plot_price_variation(mmr, years, "緬甸米價(劣質的)走勢變化率.png")
