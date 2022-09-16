# MW_EISOO_PDAREST（PDA中台系统服务）

## 环境搭建
* Download and install [Node(LTS)](https://nodejs.org/en/) (ndoe v10.15.2, npm v6.4.1)
* Download and install [Mysql](https://dev.mysql.com/downloads/)(web-community-8.0.13.0)
* Clone project
* Root folder, open a terminal & execute command `$npm i` to install all dependencies
* Terminal, execute command `$npm i nodemon -g`
* Terminal, execute command `$npm i pm2 -g`

## 开发环境运行
* Root folder, open a terminal & execute `$npm start`
* `ctrl + c` to stop

## 部署
* Change the configurations in `/config` folder
* Change the NODE_ENV to prod in `.env` file in root folder
* Root folder, open a terminal & execute `$npm run prod`
* `$npm run stop` to stop prod server

## 初始化数据库

### 创建所有表文件

* npm run init-sql-dev

* or

* npm run init-sql-prd

### 初始化所有表文件数据

* npm run init-table-data-dev

* or

* npm run init-table-data-prd

### 删除所有表文件

* npm run clear-table-dev

* or

* npm run clear-table-prd

## 解决 Mysql 8.0+ 版本NodeJS无法连接的问题

### 创建连接用户
* CREATE USER 'richard'@'%' IDENTIFIED WITH mysql_native_password BY '123456';
* grant all privileges on pda_db.* to 'richard'@'%';
* flush privileges;

### 设置数据库编码
* set character_set_connection=utf8;
* show variables like 'char%'

