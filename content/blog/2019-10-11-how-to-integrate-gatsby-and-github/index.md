---
title: '如何使用Gatsby寫Blog，並且deploy到GitHub'
tags: ["git"]
published: true
date: '2019-10-11'
---

## 1. 在global環境安裝`gatsby-cli`

```bash
npm install -g gatsby-cli
```

## 2. 利用現成的starter建立新的網站

```bash
gatsby new banyh.github.io https://github.com/willjw3/gatsby-starter-developer-diary
cd banyh.github.io
npm audit fix

# 為了使用Katex，需要更新以下套件至指定版本
npm install --save gatsby@2.15.35 gatsby-plugin-manifest@2.0.7
npm install --save gatsby-transformer-remark@2.6.28 gatsby-remark-katex@3.1.13 katex
# gh-pages可以deploy GitHub
npm install gh-pages --save-dev
```

## 3. deploy to github

```bash
gatsby build
gh-pages -d public -b master -r git@github.com:banyh/banyh.github.io.git
```

更簡便的方式是在`package.json`中，`"scripts"`內新增
```json
  "deploy": "gatsby build && gh-pages -d public -b master -r git@github.com:banyh/banyh.github.io.git"
```
之後就可以用`npm run deploy`來自動build and deploy。

## 4. 備份到github

在`banyh.github.io`中有兩個branch，其中`master`被用來放置build後的static files，而`gatsby-source`則用來放置gatsby的原始碼。

```bash
git remote add origin git@github.com:banyh/banyh.github.io.git
git checkout -b gatsby-source
git add .
git push origin gatsby-source
```
