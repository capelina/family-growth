# 家庭成长管理系统（family-growth）

面向家庭场景的成长协作平台，家长与孩子双角色协作，覆盖成长记录、任务激励、积分商城与家庭广场等模块。后端基于 Spring Boot 三层架构，前端为零构建的原生 HTML/CSS/JavaScript 单页应用。

## 技术栈

- 后端：Java 21、Spring Boot 3.5、Spring MVC、Spring Data JPA、Hibernate
- 数据库：MySQL 8（默认 profile），H2 文件库（本地快速启动）
- 前端：HTML5 / CSS3 / 原生 JavaScript（零第三方依赖，手写 SVG 图表）
- 构建：Maven

## 功能模块

| 模块 | 说明 |
| --- | --- |
| 认证登录 | 账号密码登录，HandlerInterceptor + UUID 会话令牌鉴权与过期校验 |
| 家庭成员 | 邀请码加入家庭，家长 / 孩子角色区分权限 |
| 成长记录 | 多图上传、时间线展示、待审 / 通过 / 驳回三态审核流 |
| 任务中心 | 任务发布、提交、审核，限时任务超时拦截 |
| 积分商城 | 积分余额校验、兑换单生成，事务保障扣减一致性 |
| 家庭广场 | 记录公开分享、点赞与评论 |
| 成长档案 | 按孩子维度汇总成长数据 |
| 统计看板 | 趋势与分布统计，前端手写 SVG 折线图 / 柱状图 |

## 快速启动

1. 准备数据库：MySQL 8 创建库 `family_growth`（或由连接串 `createDatabaseIfNotExist=true` 自动创建）。
2. 配置连接参数（环境变量，均有默认值）：

```bash
DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=family_growth
DB_USERNAME=family
DB_PASSWORD=你的数据库密码
```

3. 启动：

```bash
mvn spring-boot:run
```

4. 浏览器访问 `http://localhost:8080`。

也可切换 H2 内存/文件库快速体验：`--spring.profiles.active=h2`。

## 目录结构

```
src/main/java/...      Controller / Service / Repository / Entity / DTO
src/main/resources/
  application.yml      通用配置（默认激活 mysql profile）
  application-mysql.yml MySQL 数据源
  static/              前端页面（index.html + js/views）
```

## 说明

- 数据库密码等敏感信息通过环境变量注入，仓库中不含任何生产凭据。
- 上传文件目录 `./data/uploads` 与编译产物 `target/` 已在 `.gitignore` 中排除。
