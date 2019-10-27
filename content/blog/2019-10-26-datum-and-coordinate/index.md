---
title: '地圖使用的座標系'
tags: ['others']
published: true
date: '2019-10-27'
---

# 橫麥卡托投影 Transverse Mercator Projection

* 地球是一個球體，在球面上計算距離、角度都很麻煩，為了方便計算，需要將球面畫到紙上，這個過程稱為投影。
* 把地球想成一顆皮球，延著經線方向剪開，例如下圖剪成18片，每片角度20度，可稱為**20度分帶**的投影
	![橫麥卡托投影](https://upload.wikimedia.org/wikipedia/commons/thumb/9/9b/Transverse_Mercator_meridian_stripes_20deg.jpg/1024px-Transverse_Mercator_meridian_stripes_20deg.jpg)
* 靠近南北極的地方，因為用內插法，所以緯度越高，面積誤差越大
* UTM投影是橫麥卡托投影的一種，將地球剪成60片，每片角度6度(也稱為**6度分帶**)
	![UTM投影](http://gis.depaul.edu/shwang/teaching/geog258/Grid_files/image008.jpg)
* UTM投影是美國軍方繪製地圖用的，所以用經度180度為起點，將地球分為1到60帶，澎湖位於50帶，台灣位於51帶


# 二度分帶

* UTM投影是為了畫世界地圖而設計，但用到都市地形時，6度分帶的誤差大到無法接受
* 1974年，政府為了畫1/5000基本地形圖，就以東經121度為中心，用2度分帶的橫麥卡托投影
	![台灣2度分帶](http://www.sunriver.com.tw/images/grid/grid_02db.jpg)
* 設定完分帶後，需要設定座標原點。為了使台灣本島的座標為正值，所以X方向的原點設為東經121度向西250.000公里，Y方向的原點則設為赤道
	* 例如玉山主峰座標 T67 244806mE, 2596536mN，表示距離東經121度線(250.000-244.806)=5.194公里，距離赤道2596.536公里
* 台灣本島範圍在東經120到122度間，所以用的地圖是121分帶，澎湖用119分帶


# 大地基準點(Datum)及座標系

* 將球面投影到平面時，參考球體上必須和平面重合的點，稱為大地基準點
* 1967年，IUGG公布GRS67標準，裡面包含地球的長半徑、短半徑、扁率等參數
	* 用這些參數測量南投埔里虎子山的座標為東經120° 58' 25.975"，北緯23° 58' 32.340"
	* 以虎子山的座標基準點，測量台灣各地的二度分帶座標，這個系統稱為TWD67
* 1997年，使用國際地球參考框架(ITRF)推算的地心座標及IUGG公布的GRS80標準
	* 不需要再以虎子山為參考座標，而是用GPS來計算，稱為TWD97系統
	* TWD67 橫座標 = TWD97 橫座標 - 828 公尺
	* TWD67 縱座標 = TWD97 縱座標 + 207 公尺
	* 所以同樣一組數字，TWD67的位置在TWD97西北西大約850公尺
* WGS84(World Geodetic System 1984)是應用GPS建立的經緯度座標系統
	* WGS84和TWD97的誤差只有幾公分，但座標含意不同
	* 1994年有改版一次，稱為WGS84(G730)
	* 地圖資料如果要用在國際的軟體上，都必須使用WGS84

# 參考資料

1. [大地座標系統與二度分帶座標](http://www.sunriver.com.tw/grid_tm2.htm)
2. [TWD67與TWD97](http://blog.minstrel.idv.tw/2004/05/twd67-twd97.html)
3. [Taiwan datums](http://wiki.osgeo.org/wiki/Taiwan_datums)
4. [國家坐標系統之訂定](http://gps.moi.gov.tw/SSCenter/Introduce/IntroducePage.aspx?Page=GPS9)
5. [二度分帶座標轉換爲經緯度 ](http://vinn.logdown.com/posts/2014/02/20/note-twd97-converts-to-wgs84)
