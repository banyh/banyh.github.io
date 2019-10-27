---
title: 'Scrapy+Django: 資料存到model，並用admin控制'
tags: ['python']
published: false
date: '2019-10-28'
---

# DjangoItem

`DjangoItem`的用途是包裝Django中的model，讓scrapy儲存時可以存到Django model中。

首先需要定義一個Django model:

```python
from django.db import models

class Person(models.Model):
    name = models.CharField(max_length=255)
    age = models.IntegerField()
```

再用`DjangoItem`包裝這個model:

```python
from scrapy_djangoitem import DjangoItem

class PersonItem(DjangoItem):
    django_model = Person
```

包裝後的model的表現會像Scrapy中的`Item`:

```python
p = PersonItem()
p['name'] = 'John'
p['age'] = '22'
```

在Django中，會呼叫`save()`將Form data轉換成model物件，轉換時就會順便存到資料庫中。有時候要添加額外資料，則會呼叫`save(commit=False)`轉換成model物件，修改model物件，再呼叫一次`save()`寫入資料庫。在`DjangoItem`中，同樣可以使用`save()`來傳回model物件並寫入資料庫；也可以用`save(commit=False)`來傳回model物件但不要寫入資料庫。

因為`DjangoItem`同時具有`scrapy.Item`的性質，所以可以增加field:

```python
import scrapy
from scrapy_djangoitem import DjangoItem

class PersonItem(DjangoItem):
    django_model = Person
    sex = scrapy.Field()
```

`DjangoItem`也可以覆蓋原本model的設定:

```python
class PersonItem(DjangoItem):
    django_model = Person
    name = scrapy.Field(default='No Name')
```

# Django Dynamic Scraper

DDS(Django Dynamic Scraper) 是用Django admin來控制scrapy的套件。安裝方式為：

```shell-script
pip install django scrapy scrapy-djangoitem django-celery django-dynamic-scraper
```

# 建立新的Django project

當你開始一個新的Django project，通常會下這樣的指令:

```shell-script
django-admin startproject myproject
cd myproject
python3 manage.py startapp myapp
```

這樣得到的目錄架構為:

```shell-script
myproject/
    myproject/
        __init__.py
        settings.py
        urls.py
        wsgl.py
    myapp/
        __init__.py
        admin.py
        apps.py
        models.py
        tests.py
        views.py
    manage.py
```

現在我們希望將Scrapy與Django整合在一起，並且用Django來管理Scrapy，所以Scrapy應該作為一個app嵌入在Django project中:

```shell-script
myproject/
    myproject/
        __init__.py
        settings.py
        urls.py
        wsgl.py
    myapp/
        scraper/             # from scrapy
            spiders/         # from scrapy
                __init__.py  # from scrapy
            settings.py      # from scrapy
            pipelines.py     # from scrapy
            items.py         # from scrapy
        __init__.py
        admin.py
        apps.py
        models.py
        tests.py
        views.py
    manage.py
    scrapy.cfg               # from scrapy
```

完整的指令清單為：

```shell-script
django-admin startproject myproject
cd myproject/
python3 manage.py startapp myapp
scrapy startproject scraper
mv scraper/scrapy.cfg .
mv scraper/scraper myapp
rmdir scraper
```

## 修改`scrapy.cfg`

預設的內容為

```
[settings]
default = scraper.settings

[deploy]
#url = http://localhost:6800/
project = scraper
```

因為我們將`scraper`目錄放進`myapp`中，造成module的深度增加，所以要修改module的路徑。另外deploy中的`url`及`project`也要作修改。

```
[settings]
default = myapp.scraper.settings

[deploy:scrapyd1]
url = http://localhost:6800/
project = myapp
```

## 修改`myapp/scraper/settings.py`

加入以下設定:

```python
PROJECT_ROOT = os.path.abspath(os.path.dirname(__file__))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "myproject.settings")

BOT_NAME = 'myapp'

SPIDER_MODULES = ['dynamic_scraper.spiders', 'myapp.scraper',]
USER_AGENT = '%s/%s' % (BOT_NAME, '1.0')

ITEM_PIPELINES = {
    'dynamic_scraper.pipelines.ValidationPipeline': 400,
    'myapp.scraper.pipelines.DjangoWriterPipeline': 800,
}
```

* `SPIDER_MODULES`: Scrapy要從那裡找spider module
* `ITEM_PIPELINES`: pipeline至少要有兩個，第一個是DDS必須的，會自動檢查資料庫的內容，以避免抓重覆的資料

## 修改`myproject/settings.py`

在`INSTALLED_APPS`裡面要新增兩個app: `dynamic_scraper`及`myapp`:

```python
INSTALLED_APPS = [
    ...
    'dynamic_scraper',
    'myapp',
]
```

# 創建 Django models

Django需要兩個model class，第一個儲存抓下來的資料，假設名稱叫`Article`；第二個儲存要抓的網站，假設名稱叫`Website`，裡面會包含多個`Article`。`Website`不一定代表一整個網站，也可以代表某種主題，例如運動新聞、政治Blog等等。

```python
# -*- coding: utf-8 -*-
from django.db import models
from dynamic_scraper.models import Scraper, SchedulerRuntime
from scrapy_djangoitem import DjangoItem


class Website(models.Model):
    name = models.CharField(max_length=200)     # 分類的名稱
    url = models.URLField()                     # 主要的網址
    # ForeignKey是多對一的關係，多個Website可以同時被一個Scraper管理
    scraper = models.ForeignKey(Scraper, blank=True, null=True, on_delete=models.SET_NULL)
    # SchedulerRuntime會管理每一個Website
    scraper_runtime = models.ForeignKey(SchedulerRuntime, blank=True, null=True, on_delete=models.SET_NULL)

    def __unicode__(self):
        return self.name


class Article(models.Model):
    title = models.CharField(max_length=200)   # 文章的標題
    news_website = models.ForeignKey(Website)  # 每篇文章一定會屬於一個Website
    description = models.TextField(blank=True) # 文章的內容
    url = models.URLField()                    # 文章的URL
    # SchedulerRuntime會管理所有的Article
    checker_runtime = models.ForeignKey(SchedulerRuntime, blank=True, null=True, on_delete=models.SET_NULL)

    def __unicode__(self):
        return self.title


class ArticleItem(DjangoItem):
    django_model = Article
```

## 結合`DjangoItem`:

```python
from scrapy_djangoitem import DjangoItem

class ArticleItem(DjangoItem):
    django_model = Article
```

就可以用`dict`的方式存取Django database:

```python
a = ArticleItem()
a['title'] = '桃園機場淹水'
a['description'] = '黃金先生漂流中'
article = a.save(commit=False)
```

## 刪除Object

如果透過Django admin介面刪除model object，runtime object並不會馬上刪除。如果你希望能立即刪除，需要透過Django的信號控制:

```python
@receiver(pre_delete)
def pre_delete_handler(sender, instance, using, **kwargs):
    ....

    if isinstance(instance, Article):
        if instance.checker_runtime:
            instance.checker_runtime.delete()

pre_delete.connect(pre_delete_handler)
```

# 啟動Django web service

當定義完model後，需要作四件事才能使server正常運作。

1. `python manage.py makemigrations myapp`
2. `python manage.py migrate`
3. `python manage.py createsuperuser`
4. 修改`myapp/admin.py`，註冊`Website`及`Article`兩個Model:

```python
from django.contrib import admin
from .models import Website, Article, ArticleItem

admin.site.register(Website)
admin.site.register(Article)
```

然後就可以啟動Django server:

```shell-script
python manage.py runserver 0.0.0.0:7000
```

進入`http://localhost:7000/admin/`，輸入設定的帳號及密碼，就可以進去。

# 用 Django admin 定義要爬的物件

## Scraper執行的步驟

* 下載main page，找出符合條件的base物件，可以超過一個，但需要包含所有想下載的url
* 得到base物件後，找出裡面包含的其他物件，例如子頁面的url、關於文章的description、縮圖等等
* 如果有指定url通往detail page，就下載detail page
* 從detail page抓出要爬的物件

在管理頁面中，先在`Scraped object classes`的右邊點擊Add，新增一個`Scraped object classes`命名為`news`。

定義數個attributes，對應到要爬的物件。

如果你希望檢查URL是否唯一，可以將URL後面的ID Field打勾。

* 在Scraper運作時，會先主頁面的抓base及url，再抓子頁面的標題及內文
* `order`屬性用來決定XPath解析的順序，會由小到大來解析，習慣上會設為10或100的倍數，而且base應該是最小的。
* `id field`定義這個欄位是否為UNIQUE

# 定義你的Scraper

在管理頁面中，先在`Scraper`的右邊點擊Add，新增一個Scraper。Scraper必須指定`ScrapedObjClass`，就選擇前面定義的class。而Status則先選擇MANUAL。

![ScrapedObjClass](/images/2016-06-14-django-dynamic-scraper-3.png)

接下來要定義頁面，我們有兩種頁面，第一層的Main Page，及第二層的Detail Page 1。第一層的Main Page的URL是由`Website`直接指定，所以不用設。第二層的Detail Page 1的URL是由main page抓出的URL決定。

![ScrapedObjClass](/images/2016-06-14-django-dynamic-scraper-4.png)

![ScrapedObjClass](/images/2016-06-14-django-dynamic-scraper-5.png)

在下面的Scraper elems，可以選擇`ScrapedObjClass`內定義的屬性。

* `X Path`是決定如何由頁面取出想要的元素。
* `Request Page Type`是告訴Scraper，資料應該由那一種頁面取出。
* `Processors`及`Proc ctxt`定義輸出資料的處理器，如同[Item Loader section](http://readthedocs.org/docs/scrapy/en/latest/topics/loaders.html)一般。
    - 在URL中，因為抓下來的網址是相對的，所以需要加：`Processors`設為`preurl`、`Proc ctxt`設為`'pre_url': 'http://wn.wikinews.org'`
* `Mandatory`指示資料是否為必要欄位，如果Scraper抓到的item缺少其中一項必要欄位，整個item都會放棄。

![ScrapedObjClass](/images/2016-06-14-django-dynamic-scraper-7.png)

回到管理頁面，新增一個空的`Scheduler runtimes`物件:

![ScrapedObjClass](/images/2016-06-14-django-dynamic-scraper-9.png)

回到管理頁面，新增`Websites`物件:

![ScrapedObjClass](/images/2016-06-14-django-dynamic-scraper-8.png)


# 建立Spider Class

### 修改`myapp/scraper/spider/__init__.py`:

```python
from dynamic_scraper.spiders.django_spider import DjangoSpider
from myapp.models import Website, Article, ArticleItem


class ArticleSpider(DjangoSpider):

    name = 'article_spider'

    def __init__(self, *args, **kwargs):
        self._set_ref_object(Website, **kwargs)
        self.scraper = self.ref_object.scraper
        self.scrape_url = self.ref_object.url
        self.scheduler_runtime = self.ref_object.scraper_runtime
        self.scraped_obj_class = Article
        self.scraped_obj_item_class = ArticleItem
        super(ArticleSpider, self).__init__(self, *args, **kwargs)
```


### 修改`myapp/scraper/pipelines.py`:

```python
# -*- coding: utf-8 -*-
import logging
from django.db.utils import IntegrityError
from scrapy.exceptions import DropItem
from dynamic_scraper.models import SchedulerRuntime

class DjangoWriterPipeline(object):

    def process_item(self, item, spider):
      if spider.conf['DO_ACTION']: #Necessary since DDS v.0.9+
            try:
                item['news_website'] = spider.ref_object

                checker_rt = SchedulerRuntime(runtime_type='C')
                checker_rt.save()
                item['checker_runtime'] = checker_rt

                item.save()
                spider.action_successful = True
                spider.log("Item saved.", logging.INFO)

            except IntegrityError as e:
                spider.log(str(e), logging.ERROR)
                spider.log(str(item._errors), logging.ERROR)
                raise DropItem("Missing attribute.")
      else:
          if not item.is_valid():
              spider.log(str(item._errors), logging.ERROR)
              raise DropItem("Missing attribute.")

      return item
```


# 開始執行Spider

在管理頁面中，先在`Scraper`裡面，將STATUS改成`ACTIVE`。

執行方法與原本的Scrapy相同，從命令列執行:

```shell-script
scrapy crawl [--output=FILE --output-format=FORMAT]
            SPIDERNAME -a id=REF_OBJECT_ID
            [-a do_action=(yes|no) -a run_type=(TASK|SHELL)
            -a max_items_read={Int} -a max_items_save={Int}
            -a max_pages_read={Int}
            -a output_num_mp_response_bodies={Int}
            -a output_num_dp_response_bodies={Int} ]
```

* `-a id=REF_OBJECT_ID`: 指定要抓的reference item id，在沒有新增其他物件時，必須設為1
* 預設情況下，從command line抓的內容不會存到DB，如果要存要指定`-a do_action=yes`
* `-a run_type=(TASK|SHELL)`可以模擬爬蟲的過程，用來測試
* `-a max_items_read={Int}`、`-a max_items_save={Int}`會覆寫Scraper內部設定
* `-a output_num_mp_response_bodies={Int}`、`-a output_num_dp_response_bodies={Int}`設定後，可以前將幾篇main/detail page的回應內容輸出，以便除錯
* 如果你輸出不要存在DB，而要存在檔案，可以用`--output=FILE --output-format=FORMAT`來設定

因此我們輸入，就會開始執行:

```shell-script
scrapy crawl article_spider -a id=1 -a do_action=yes
```

通常在這步會遇到一個問題，就是`DJANGO_SETTINGS_MODULE`沒有設定。這個環境變數本來是放在`myproject/settings.py`中設定，但透過命令列執行時，沒有初始化。所以應該要手動初始化:

```shell-script
set -x DJANGO_SETTINGS_MODULE myproject.settings  # FISH
export DJANGO_SETTINGS_MODULE=myproject.settings  # BASH
```
