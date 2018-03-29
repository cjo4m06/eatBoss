# EatBoss
>這是一個 『 天堂M 』 手遊吃王的 **Line 機器人**，裡面提供了很多功能。

#### 1. 作者介紹 - 孟宗竹
>作者本身也是一個天堂愛好者，目前依然在這深坑裡面掙扎中，期待的哪一天可以畢業。
><br><br>
>會開始寫這工具，是因為一開始吃王的時候總是把時間搞錯，或是時間過了才想起剛剛王記吃王了...
><br><br>
>在各種遺憾的原有下開始寫這工具。
><br><br>
>**作者 by 命運女神-兔盟(怎麼可以吃兔兔)-孟宗竹**

#### 2. 架站需求
>這工具主要是利用 **Node.js** 開發完成，同時須搭配 **Line Messages API** 及 **MySQL**。
><br><br>
>所以如果你有需要使用該工具的話，需要有基礎的架站能力，不過現在網路資源很多相信各位一定都可以成功的。

#### 3. Node.js
>這是我第一次寫 **Node.js**，算是新手作品，所以如果有大神路過請別太苛責，但我也會虛心接受各位的 code review的！
><br><br>
>這個需要一個 **Node.js** 環境，網路有很多教學文章，同時也有不少免費的服務可以架設 **Node.js**，作者本身是架在 [Heroku](www.Heroku.com)

#### 4. Line Messages API
>這是 Line 提供的服務，需要到 [Line Messages API](https://developers.line.me/en/docs/messaging-api/overview/) 申請服務。
><br><br>
>這邊需要注意的是，如果你需要使用到自動提醒的功能話，在申請的時候需要注意你申請的 **Plan**，因為不是所有的 Messages API 都會提供 Push API 權限的。
><br><br>
>這邊作者申請的是 **Developer Trial**，這是開發者模式，所以所有權限都有，但缺點是好友數量有限制，但這不影響你自己血盟的使用。

#### 5. MySQL
>這算是很老牌的資料庫了，網路資源很多這邊我就不多做介紹了。
><br><br>
>資料庫裡面需要建立五張 Table 分別是:
> * clan Table<br>
> 這張表主要紀錄血盟資訊及認證碼<br>
> ![clan Table](/public/clan.png)<br>
> * boss Table<br>
> 這張表主要紀錄 Boss 資訊<br>
> ![boss Table](/public/boss.png)<br>
> * member Table<br>
> 這張表主要紀錄吃王團成員資訊<br>
> ![member Table](/public/member.png)<br>
> * list Table<br>
> 這張表主要紀錄掉寶資訊<br>
> ![list Table](/public/list.png)<br>
> * queue Table<br>
> 這張表主要紀錄排隊取寶資訊<br>
> ![queue Table](/public/queue.png)<br>
