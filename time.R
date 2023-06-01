plot_price_trend <- function(data, years, filename) {

  data$date <- as.Date(data$date)

  # 提取指定年份的数据
  subset_data <- subset(data, date >= as.Date(paste0(min(years), "-01-01")) & date <= as.Date(paste0(max(years), "-12-31")))

  # 將數據轉為時間序列，頻率為每月一次
  price <- ts(as.numeric(subset_data$price), start = min(years), freq = 12, end = max(years))

  # 設置繪圖
  png(paste0(filename, "麥價走勢.png"), width = 1600, height = 2400, res = 200)

  # 繪製價格變化率圖
  ts.plot(price, xlab = "Year", ylab = "Price", type = "l", main = filename, lty = c(1:2), gpars = list(xaxt = "n"))
  axis(1, at = years)

  # 關閉繪圖
  dev.off()
}

plot_price_variation <- function(data, years, filename) {
  data$date <- as.Date(data$date)

  # 提取指定年份的数据
  subset_data <- subset(data, date >= as.Date(paste0(min(years), "-01-01")) & date <= as.Date(paste0(max(years), "-12-31")))

  price <- ts(as.numeric(subset_data$price), start = min(years), freq = 12, end = max(years))
  diff_ts <- (diff(price) / lag(price, 1)) * 100

  # 設置繪圖設備
  png(paste0(filename, "麥價走勢變化率.png"), width = 1600, height = 2400, res = 200)

  # 繪製價格變化率圖
  ts.plot(diff_ts, xlab = "Year", ylab = "Price_var (%)", type = "l", main = filename, lty = c(1:2), gpars = list(xaxt = "n"))
  axis(1, at = years)

  # 關閉繪圖設備
  dev.off()
}

plot_population_trend <- function(data, years, filename) {

  data$Date <- as.Date(data$Date)

  # 提取指定年份的数据
  subset_data <- subset(data, Date >= as.Date(paste0(min(years), "-01-01")) & Date <= as.Date(paste0(max(years), "-12-31")))

  population <- ts(as.numeric(subset_data$Population), start = min(years), freq = 1, end = max(years))

  # 設置繪圖設備
  png(paste0(filename, "人口走勢.png"), width = 1600, height = 2400, res = 200)

  # 繪製價格變化率圖
  ts.plot(population, xlab = "Year", ylab = "Population", type = "l", main = filename, lty = 1, gpars = list(xaxt = "n"))
  axis(1, at = years)

  # 關閉繪圖設備
  dev.off()
}

plot_population_variation <- function(data, years, filename) {
  data$Date <- as.Date(data$Date)

  # 提取指定年份的数据
  subset_data <- subset(data, Date >= as.Date(paste0(min(years), "-01-01")) & Date <= as.Date(paste0(max(years), "-12-31")))

  population <- ts(as.numeric(subset_data$Population), start = min(years), freq = 2, end = max(years))
  diff_ts <- (diff(population) / lag(population, 1)) * 100

  # 設置繪圖設備
  png(paste0(filename, "人口走勢變化率.png"), width = 1600, height = 2400, res = 200)

  # 繪製價格變化率圖
  ts.plot(diff_ts, xlab = "Year", ylab = "Population_var (%)", type = "l", main = filename, lty = 1, gpars = list(xaxt = "n"))
  axis(1, at = years)

  # 關閉繪圖設備
  dev.off()
}

plot_union_variation <- function(data, data_2, years, filename) {
  data_2$date <- as.Date(data_2$date)
   # 提取指定年份的数据
  subset_data_2 <- subset(data_2, date >= as.Date(paste0(min(years), "-01-01")) & date <= as.Date(paste0(max(years), "-12-31")))

  price <- ts(as.numeric(subset_data_2$price), start = min(years), freq = 12, end = max(years))
  diff_price_ts <- (diff(price) / lag(price, 1)) * 100

  diff_price_halfyear <- aggregate(diff_price_ts, nfrequency = 2, FUN = mean)

  # 创建一个频率为半年的时间序列对象
  diff_price <- ts(diff_price_halfyear, start = min(years)+0.5, freq = 2, end = max(years)-0.5)

  data$Date <- as.Date(data$Date)

  # 提取指定年份的数据
  subset_data <- subset(data, Date >= as.Date(paste0(min(years), "-01-01")) & Date <= as.Date(paste0(max(years), "-12-31")))

  population <- ts(as.numeric(subset_data$Population), start = min(years), freq = 2, end = max(years))
  diff_population <- (diff(population) / lag(population, 1)) * 100

  union_ts <- ts.union(diff_population, diff_price)

  # 設置繪圖設備
  png(paste0(filename, "變化率圖_比較", ".png"), width = 2000, height = 1200, res = 200)

  # 繪製價格變化率圖
  par(mfcol=c(2, 1), mar=c(0, 4, 0, 2), oma=c(4, 2, 2, 2))
  layout(matrix(c(1, 2), nrow = 2), heights = c(1, 1))

  ts.plot(diff_price, xlab = "", ylab = "Price_var (%)", type = "l", lty = 1, gpars = list(xaxt = "n"))
  ts.plot(diff_population, xlab = "Year", ylab = "Population_var (%)", type = "l", lty = 1, gpars = list(xaxt = "n"))
  axis(1, at = years)
  dev.off()

  png(paste0(filename, "_CCF", ".png"), width = 1600, height = 2400, res = 200)
  ccf(diff_population, diff_price, type = "covariance", plot = TRUE, ylab = "cross-correlation")
  dev.off()

  # install.packages("Hmisc")  # 安装Hmisc包
  library(Hmisc)
  cor_result <- cor(union_ts, use = "everything",
     method = "pearson")

  print("相關係數_pearson")
  print(cor_result)

  rcorr_result <- rcorr(union_ts, type="pearson")

  print("P-value_pearson")
  print(rcorr_result$P)

    cor_result <- cor(union_ts, use = "everything",
     method = "spearman")

  print("相關係數_spearman")
  print(cor_result)

  rcorr_result <- rcorr(union_ts, type="spearman")

  print("P-value_spearman")
  print(rcorr_result$P)

}

generate_plot <- function(population_name, price_name, years, ios3) {
  population_data <- read.csv(population_name, header = TRUE)
  price_data <- read.csv(price_name, header = TRUE)
  plot_union_variation(population_data, price_data, years, ios3)
  plot_population_trend(population_data, years, ios3)
  plot_population_variation(population_data, years, ios3)
  plot_price_trend(price_data, years, ios3)
  plot_price_variation(price_data, years, ios3)
}

years <- 2009:2019

generate_plot("RUS.csv", "RUS_2009_2019_filter.csv", years, "俄羅斯")

# 俄羅斯取伏爾加河流域的數據

years <- 2008:2017

generate_plot("MDA.csv", "MDA_2008_2017_filter.csv", years, "摩爾多瓦")

years <- 2006:2020

generate_plot("KAZ.csv", "KAZ_2006_2020_filter.csv", years, "哈薩克")

# KAZ 2020-12-15 數值為補值，重複11-15之數據

years <- 2012:2022

generate_plot("IRQ.csv", "IRQ_2012_2022_filter.csv", years, "伊拉克")

years <- 2012:2022

generate_plot("ARM.csv", "ARM_2012_2022_filter.csv", years, "亞美尼亞")