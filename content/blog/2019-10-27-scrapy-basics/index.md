---
title: 'Scrapy基本使用'
tags: ['python']
published: true
date: '2019-10-27'
---

# Scrapy是什麼?

Scrapy是一個作網路爬蟲的framework，可以將一個網站的資料抓下來。

Scrapy的核心是spider，當你寫好一支spider程式，就可以透過`scrapy runspider somefile.py`來執行這個spider。

因為所有request都是透過asynchounous架構執行，所以不會浪費時間在等待上，同時可以有多個spider一起工作，spider也可以排程進行。

為了避免太頻繁的爬蟲行為造成對網站的攻擊，可以設定request之間的延遲、同時最多連線數、甚至透過自動平衡流量的機制來自動設定。

最後，scrapy支援多種後端格式，例如可以輸出成json、xml、csv、FTP、Amason S3、MongoDB等等。

Scrapy可以分為以下幾個主題:

1. 如何選擇要下載的文字: CSS selector及XPath expressions
2. 如何開發及除錯: IPython shell console, telnet console
3. 如何輸出到指定的格式: JSON, CSV, XML, FTP, S3...
4. 如何偵測網站用的encoding
5. 延伸支援: cookies/session管理, HTTP compression/authentication/caching, robots.txt, 深度管理, user-agent spoofing


# 開始一個Scrapy專案

輸入`scrapy startproject PROJECT_NAME`後，會產生一個目錄，其結構為

```shell-script
PROJECT_NAME/
    scrapy.cfg            # spider執行的設定檔
    PROJECT_NAME/         # 所有的程式碼都放這裡
        __init__.py
        items.py          # 下載後儲存在記憶體中的格式
        pipelines.py
        settings.py
        spiders/          # 你要把你的程式碼放這裡
            __init__.py
```

## 建立第一個Spider

首先新增`PROJECT_NAME/spiders/dmoz_spider.py`。

在這個檔案中，建立一個class繼承`scrapy.Spider`並定義以下屬性:

* `name`: 如果你同時有多個spider在跑，這個名稱必須是唯一的
* `start_urls`: spider需要下載的homepage清單，spider會首先拜訪這裡列出的homepage，下載網頁後再從網頁中找後續要下載的URL
* `parse()`: 下載好的homepage會以`response`參數傳給`parse()`，`parse()`處理後將資料的內容以`Item`的格式傳回

```python
import scrapy

class DmozSpider(scrapy.Spider):
    name = "dmoz"
    allowed_domains = ["dmoz.org"]
    start_urls = [
        "http://www.dmoz.org/Computers/Programming/Languages/Python/Books/",
        "http://www.dmoz.org/Computers/Programming/Languages/Python/Resources/"
    ]

    def parse(self, response):
        """不作任何文字處理，單純把下載的首頁儲存成html檔"""
		# filename 來自 start_urls 的路徑，等於 Books.html 及 Resources.html
        filename = response.url.split("/")[-2] + '.html'
        with open(filename, 'wb') as f:
            f.write(response.body)
```

# 開始爬資料

到這個project的最上層目錄，輸入`scrapy crawl dmoz`開始爬資料。

結束後目錄下會多出`Books.html`及`Resources.html`兩個檔案。

執行時，每個`start_urls`的內容，都會產生一個`scrapy.Request`，然後分別執行。每一個request結束後，會產生一個`scrapy.http.Response`作為參數丟給`parse()`。

# 萃取出想要的資料

從複雜的HTML中，要選出想要的資料，可以透過XPath或CSS兩種方式。下面是XPath的範例及它們的用途:

* `/html/head/title`: 在最上層找`<html>`，然後在裡面找`<head>`，然後選擇`<title>`
* `/html/head/title/text()`: 找到`<title>`元素後，選擇其中包含的文字部分，也就是`<title>...</title>`之間的所有字元
* `//td`: 選擇整個網頁所有的`<td>`元素
* `//a/@href`: 選擇整個網頁所有的`<a>`元素，然後選擇這些元素的`href`屬性
* `//div[@class="mine"]`: 選擇整個網頁所有`class`屬性等於`mine`的`<div>`元素，這裡的`[...]`有時稱為predicate

這裡會建議學習XPath selector，因為CSS只能選擇結構，但XPath可以選擇內容，例如「找出文字中有Next page的連結」。

selector有四種基本的method:

* `xpath()`: 傳回list of selectors，每一個都代表被選擇的元素
* `css()`: 傳回list of selectors，每一個都代表被選擇的元素
* `extract()`: 傳回unicode string，代表選取的資料
* `re()`: 傳回list of unicode strings，代表透過regular expression選取的資料

要實驗selector，可以透過scrapy shell:

```shell-script
scrapy shell "http://www.dmoz.org/Computers/Programming/Languages/Python/Books/"
```

在scrapy shell中，會準備好以下的objects:
* `crawler`: `scrapy.crawler.Crawler` instance
* `request`: `scrapy.Request` instance
* `response`: `scrapy.http.Response` instance
* `settings`: `scrapy.settings.Settings` instance
* `spider`: `DmozSpider` instance，也就是自定義的class

另外可以用`shelp()`來列出幫助訊息，`view(response)`在瀏覽器中看抓到的網頁。

在scrapy shell中，你可以使用`response.body`或`response.headers`來讀取HTTP response的原始資料。在`response.selector`中，包含所需的selector function，你可以透過捷徑`response.css`及`response.xpath`來呼叫`response.selector.css`及`response.selector.xpath`。

當你已經選擇好一群selector時，可以用`extract()`將文字取出，例如`response.xpath('//a/text()').extract()`，結果會是list of strings。

根據實驗，我們就可以修改程式碼，印出每一本書的書名、連結、描述:

```python
def parse(self, response):
    title = response.xpath('//div[@class="title-and-desc"]/a/div/text()').extract()
    link = response.xpath('//div[@class="title-and-desc"]/a/@href').extract()
    desc = response.xpath('//div[@class="title-and-desc"]/div/text()').extract()
    desc = [' '.join(t.split()) for t in desc]
    print(list(zip(title, link, desc)))
```

然後執行`scrapy crawl dmoz`來看結果。

# `PROJECT_NAME/items.py`

`Item`是用來裝下載資料的容器，介面與與`dict`完全相同，但加上了保護機制，避免使用未定義的field或錯字。

假設我們感興趣的資料只有三項：標題(title)、連結(link)、描述(desc)。可以定義：

```python
import scrapy
class MyItem(scrapy.Item):
    title = scrapy.Field()
    link = scrapy.Field()
    desc = scrapy.Field()
```

## 將資料存成`Item`

在`parse()`中，建立`DmozItem` instance，然後將要儲存的資料放進去，最後用`yield`傳回item。

```python
from PROJECT_NAME.items import DmozItem

def parse(self, response):
    item = DmozItem()
    item['title'] = response.xpath('//div[@class="title-and-desc"]/a/div/text()').extract()
    item['link'] = response.xpath('//div[@class="title-and-desc"]/a/@href').extract()
    desc = response.xpath('//div[@class="title-and-desc"]/div/text()').extract()
    item['desc'] = [' '.join(t.split()) for t in desc]
    yield item
```


# 二層的爬蟲

有時候網站架構由多層網頁組成，第一層可能是新聞列表，第二層才是包含內文的網頁。

因此爬蟲架構會變成：
* scrapy抓好第一層網頁後，根據預設值呼叫`parse()`
	* 在第一層網頁，抓所有第二層的url，並`yield scrapy.Request`，指定`parse_dir_contents()`來處理第二層網頁
* scrapy抓好第二層網頁後，會自動呼叫`parse_dir_contents()`
	* 這裡要儲存資訊到item中，並且`yield item`

```python
import scrapy

from PROJECT_NAME.items import DmozItem

class DmozSpider(scrapy.Spider):
    name = "dmoz"
    allowed_domains = ["dmoz.org"]
    start_urls = [
        "http://www.dmoz.org/Computers/Programming/Languages/Python/",
    ]

    def parse(self, response):
        for href in response.css("ul.directory.dir-col > li > a::attr('href')"):
            url = response.urljoin(href.extract())
            # 在第一層抓到的url，再產生一群新的Request，但這一次需要新的callback
            yield scrapy.Request(url, callback=self.parse_dir_contents)

    # 第二層的parse function，處理第二層的response
    def parse_dir_contents(self, response):
        for sel in response.xpath('//ul/li'):
            item = DmozItem()
            item['title'] = sel.xpath('a/text()').extract()
            item['link'] = sel.xpath('a/@href').extract()
            item['desc'] = sel.xpath('text()').extract()
            yield item
```

在上面的範例中，因為第一二層的結構不同，所以用了兩個callback function。如果兩層的結構是一樣的，通常只需要一個callback function。

# 將輸出儲存到檔案

目前我們看到`parse()`的傳回值有兩種：`scrapy.Item`或`scrapy.Request`。傳回`scrapy.Request`會交給scrapy處理，抓下網頁後自動呼叫對應的parse function。但傳回`scrapy.Item`呢?

最簡單的方式就是用命令列來指定檔名，例如將收集到的item存到`items.json`:

```shell-script
scrapy crawl dmoz -o items.json
```
