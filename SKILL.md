# Skill: American English Trainer（离线英语口语与听力训练器）

## 项目目标

开发一个纯前端、可离线运行、支持PWA安装的美式英语训练工具。

目标用户：

* 中国成年人
* 希望提升英语口语与听力
* 能够应对：

  * 日常生活
  * 酒店住宿
  * 餐厅点餐
  * 旅游出行
  * 交通问路
  * 外企办公
  * 商务会议
  * 体育娱乐
  * 海外出差

项目定位：

不是背单词软件。

而是：

场景化英语口语与听力训练器。

---

# 技术要求

## 必须满足

纯前端实现：

* HTML
* CSS
* Vanilla JavaScript

禁止：

* React
* Vue
* Angular
* Node.js
* Python
* 后端服务
* 数据库
* API依赖

所有功能必须本地运行。

---

# PWA支持

实现：

* manifest.json
* service-worker.js

支持：

* iPhone Safari 添加到主屏幕
* Android Chrome 添加到主屏幕
* 离线启动

---

# 数据存储

使用：

localStorage

存储：

* 收藏夹
* 错题本
* 学习统计
* 连续学习天数
* 最近学习记录

禁止服务器同步。

---

# UI设计原则

移动端优先。

设计参考：

现代iOS应用风格。

要求：

* 单手操作
* 大按钮
* 卡片式布局
* 圆角
* 清爽浅色界面
* 白色背景
* 蓝色主色调

禁止：

* 深色炫酷大屏风格
* 企业后台风格

---

# 首页

顶部显示：

American English Trainer

副标题：

Speak American English Naturally

---

学习统计卡片：

累计学习
今日完成
连续学习
收藏数量
错题数量

---

模式选择：

Sentence Mode
Conversation Mode
Listening Mode
Favorites Mode
Mistakes Mode

---

场景选择：

Daily Life
Hotel
Travel
Transportation
Restaurant
Office
Meeting
Business
Sports
Entertainment

---

# Sentence Mode

随机抽取一句。

显示：

中文

例如：

我想办理入住。

---

默认隐藏答案。

按钮：

Show Answer

点击后显示：

I'd like to check in.

如果存在多个表达：

全部显示。

例如：

1. I'd like to check in.
2. I'd like to check into my room.
3. Can I check in?

---

功能按钮：

Play Audio
Favorite
Correct
Wrong
Next

---

# Conversation Mode

采用连续对话形式。

数据结构：

一个Conversation包含多个Turn。

示例：

Guest:
我想办理入住。

用户先说英语。

点击答案：

I'd like to check in.

下一步：

Staff:
May I see your passport?

点击显示中文：

我可以看一下您的护照吗？

继续推进。

---

支持：

上一句
下一句

---

# Listening Mode

显示：

Play

点击后：

播放美式英语。

初始不显示英文。

用户先听。

然后：

Show Transcript

显示英文。

再点击：

Show Chinese

显示中文。

---

# TTS要求

使用：

SpeechSynthesis

语言：

en-US

必须使用美式英语。

---

支持语速：

0.8x
1.0x
1.2x
1.5x
2.0x

默认：

1.0x

---

# Favorites Mode

收藏夹模式。

显示：

已收藏内容。

支持：

取消收藏
重新练习

---

# Mistakes Mode

错题模式。

来源：

用户点击Wrong。

---

错题记录结构：

id
wrongCount
correctCount

---

逻辑：

Wrong：

wrongCount +1

Correct：

correctCount +1

---

毕业机制：

correctCount >= 3

自动移出错题本。

---

# 学习统计

记录：

totalLearned

todayCompleted

listeningCount

conversationCount

favoriteCount

mistakeCount

streakDays

lastStudyDate

---

连续学习逻辑：

如果今天与上次学习日期连续：

streakDays +1

否则重新计算。

---

# 数据组织规范

建立 data 文件夹。

结构：

data/

daily-life.js
hotel.js
travel.js
transportation.js
restaurant.js
office.js
meeting.js
business.js
sports.js
entertainment.js

conversations.js

---

Sentence数据格式

{
id: 1,
scene: "hotel",
cn: "我想办理入住。",
answers: [
"I'd like to check in.",
"I'd like to check into my room.",
"Can I check in?"
]
}

---

Conversation数据格式

{
id: 1001,
scene: "hotel",
turns: [
{
role: "guest",
cn: "我想办理入住。",
answers: [
"I'd like to check in."
]
},
{
role: "staff",
en: "May I see your passport?",
cn: "我可以看一下您的护照吗？"
}
]
}

---

# 初始语料要求

不要使用AI生成占位符。

直接提供高质量真实口语。

要求：

全部采用现代美式英语。

避免：

教材式英语
过时表达
英式英语

---

V1语料规模

Sentence：

每个场景100句

10个场景

共1000句

---

Conversation：

每个场景10组

10个场景

共100组对话

---

所有句子必须符合真实美国人日常表达习惯。

---

# 代码质量要求

模块化。

避免一个超大JS文件。

代码需：

* 可维护
* 可扩展
* 可追加语料

未来新增：

daily-life-v2.js

即可扩容。

无需修改核心逻辑。

---

# 最终交付

生成完整项目目录。

输出：

* index.html
* style.css
* app.js
* manifest.json
* service-worker.js
* data目录
* 示例语料

保证打开 index.html 即可运行。

所有核心功能必须实现。
