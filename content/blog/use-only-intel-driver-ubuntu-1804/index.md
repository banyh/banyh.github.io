---
title: '在Ubuntu 18.04中，只使用Intel顯卡來顯示，以空出GPU memory'
tags: ["ubuntu", "hardware",]
published: true
date: '2019-10-14'
---

1. 先確定`prime-select query`的結果是 nvidia。

因為當`prime-select intel`時，會強制關掉nvidia GPU，這樣空出GPU memory就沒有意義，因為我們也無法使用GPU。

2. 新增`/etc/X11/xorg.conf`內容如下：

```
Section "Device"
    Identifier     "intel"
    Driver         "modesetting"
    BusID          "PCI:0:2:0"
EndSection
```

3. 修改`/etc/default/grub`，在`GRUB_CMDLINE_LINUX_DEFAULT`內新增`nogpumanager`。之後執行`update-grub`更新。

4. 重開機
