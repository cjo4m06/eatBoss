var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var linebot = require('linebot');
var schedule = require('node-schedule');

var index = require('./routes/index');
var users = require('./routes/users');
var mysql = require("mysql");

//請填入你申請的 Line Messages Api 資訊
//如果需要主動提醒的話，需要有 Message push API 的權限
//可以申請 Developer Trial 的話免費的也有 Message push API 權限，但有限制好友數量
var bot = linebot({
    channelId: 'Line Channel ID',
    channelSecret: 'Line Channel Secret',
    channelAccessToken: 'Line Channel Acccess Token'
});

//請填入 MySql Database 資訊
var con = mysql.createConnection({
    host: "MySql Database Host",
    user: "MySql Database Account",
    password: "MySql Database Passwrod",
    database: "MySql Database Name"
});

con.connect(function(err) {
    if (err) {
        console.log('connecting error');
        return;
    }
    console.log('connecting success');
});

var app = express();
var linebotParser = bot.parser();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.post('/hooks', linebotParser);

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', index);
app.use('/users', users);

bot.on('message', function(event) {
    if (event.message.type !== 'text') {
        return ;
    }

    var msg = event.message.text;
    text = msg.toLowerCase();

    var sourceId = event.source.userId;
    if (event.source.type == 'group') {
        var sourceId = event.source.groupId;
    }
    if (event.source.type == 'room') {
        var sourceId = event.source.roomId;
    }


    if (text.includes('token:')) {
        var token = text.replace('token:', '');
        con.query('SELECT * FROM clan WHERE token = ?', token, function (err, rows) {
            if (err) {
                console.log(err);
            }

            if (! rows.length) {
                event.reply({'type': 'text', 'text': '無效認證碼，請與作者確認！'});
                return ;
            }

            rows.forEach(function (row) {
                con.query('UPDATE clan SET ? WHERE id = ?', [
                    {line_id: sourceId},
                    row.id
                ], function (err, rows) {
                    if (err) {
                        console.log(err);
                    }

                    event.reply({'type': 'text', 'text': row.name + ' 血盟認證完成！'});
                })
            });
        });
    }

    if (text == 'eatboss' || text == '吃王小幫手') {
        authorize(sourceId, event, helpBoss);
        return;
    }

    if (text == 'list' || text == '清單') {
        authorize(sourceId, event, getList);
        return ;
    }


    if (text == 'boss' || text == '時間表') {
        authorize(sourceId, event, getBoss);
        return ;
    }

    var arr = text.split(' ');

    if ((arr[0] == 'distribution' || arr[0] == '分配') && arr.length == 2) {
        event.postData = arr;
        authorize(sourceId, event, distributionGift);

        return;
    }

    if ((arr[0] == 'distribution' || arr[0] == '分配') && arr.length > 2) {
        event.postData = arr;
        authorize(sourceId, event, distributionGift2);

        return;
    }


    if ((arr[0] == 'list' || arr[0] == '清單')
        && (arr[1] == 'add' || arr[1] == '增加')
        && arr.length == 3) {
        event.postData = arr;
        authorize(sourceId, event, addList);

        return ;
    }

    if ((arr[0] == 'list' || arr[0] == '清單')
        && (arr[1] == 'remove' || arr[1] == '刪除')
        && arr.length == 3) {
        event.postData = arr;
        authorize(sourceId, event, removeList);

        return ;
    }

    if ((arr[0] == 'lineup' || arr[0] == '排隊') && arr.length == 2) {
        event.postData = arr;
        authorize(sourceId, event, addQueue);

        return;
    }


    if (arr[0] == 'checkin' || arr[0] == '報到') {
        if (arr.length == 2) {
            event.postData = arr;
            authorize(sourceId, event, checkInMember);

            return ;
        }
    }

    if (arr[0] == 'whois') {
        if (arr.length > 1) {
            event.postData = arr;
            authorize(sourceId, event, whois);

            return ;
        }
    }


    if (arr[0] == 'alert' || arr[0] == '提醒') {
        if(arr.length == 2 && Number.isInteger(Number.parseInt(arr[1]))) {
            event.postData = arr;
            authorize(sourceId, event, setAlertTime)
        }

        if (arr.length == 1) {
            authorize(sourceId, event, alertBoss);
        }

        return ;
    }

    if ((arr[0] == 'clear' || arr[0] == '清除') && arr.length == 2) {
        event.postData = arr;
        authorize(sourceId, event, clearBoss);
        return ;
    }

    if (arr[0] == 'note' || arr[0] == '備註') {
        event.postData = arr;
        authorize(sourceId, event, noteBoss);
        return ;
    }

    if ((arr[0] == 'add' || arr[0] == '加入')
            && arr.length >= 4
            && Number.isInteger(Number.parseInt(arr[3]))) {
        event.postData = arr;
        authorize(sourceId, event, addBoss);
        return ;
    }

    if ((arr[0] == 'remove' || arr[0] == '刪除') && arr.length == 2) {
        event.postData = arr;
        authorize(sourceId, event, removeBoss);
        return ;
    }

    if ((arr[0] == 'set' || arr[0] == '設定')
        && arr.length == 4
        && Number.isInteger(Number.parseInt(arr[3]))) {
        event.postData = arr;
        authorize(sourceId, event, setBoss);
        return ;
    }


    if (arr.length >= 2) {
        var tArr = arr[1].split('');
        var t1 = Number.parseInt(tArr[0]+tArr[1]);
        var t2 = Number.parseInt(tArr[2]+tArr[3]);
        if (Number.isInteger(Number.parseInt(arr[1]))
            && t1 <= 24 && t2 < 60 && tArr.length == 4) {
            event.postData = arr;
            authorize(sourceId, event, deathBoss);
        }

        if (Number.isInteger(Number.parseInt(arr[1]))
            && (t1 > 24 || t2 >59 || tArr.length != 4)) {
            event.reply({'type': 'text', 'text': '更新失敗，'+ arr[1] +' 時間格式錯誤囉！'});
        }
    }
});

app.use(function (req, res, next) {
    req.con = con;
    next();
});

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});
// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

function helpBoss(event, clans) {
    var clan = clans[0];
    var message = "歡迎使用吃王小幫手！\n\n";

    message += "目前綁定伺服器：" + clan.server + "\n";
    message += "目前綁定血盟：" + clan.name + "\n";
    message += "作者：命運女神-兔盟-孟宗竹" + "\n";
    if (clan.alert_time) {
        message += "目前提醒功能：開啟(提前 "+clan.alert_time+" 分鐘提醒)\n";
    } else {
        message += "目前提醒功能：關閉"
    }

    message += "目前開放的指令有：boss(時間表),note(備註),alert(提醒),add(加入),remove(刪除),set(設定),clear(清除),list(清單)\n\n";
    message += "指令輸入中文或英文皆可。\n\n";

    message += "指令：更新時間表\n";
    message += "說明：\n";
    message += "輸入 [編號] [死亡時間]\n 即可更新時間表。\nex. 70 0930 代表 編號70的頭目在九點三十分死亡。\n\n";

    message += "指令： boss\n";
    message += "說明：\n";
    message += "輸入 boss 或 時間表，將顯示目前紀錄的所有時間表。\n\n";

    message += "指令： note\n";
    message += "說明：\n";
    message += "輸入 \nnote 編號 [文字]\n or \n備註 編號 [文字] \n即可修改該頭目的備註訊息。\n\n";

    message += "指令： alert [分鐘]";
    message += "範例：\n";
    message += "alert 15\n這樣代表每隻王重生前15分鐘會先提醒，設定為 0 代表關閉提醒功能。\n\n";

    message += "指令： alert\n";
    message += "說明：\n";
    message += "輸入 alert 或 提醒，將顯示最近 N 分鐘內會重生的頭目。\n\n";

    message += "指令： add\n";
    message += "說明：\n";
    message += "輸入 \nadd [編號] [修改頭目名稱] [修改重生間隔] [固定重生] \n或 \n 加入 [編號] [修改頭目名稱] [修改重生間隔] [固定重生]\n即可增加頭目到時間表內。\n固定重生時間非必填，填了只會在固定的時間提醒\n\n";

    message += "指令： remove\n";
    message += "說明：\n";
    message += "輸入 remove 編號 \n或 \n刪除 編號 \n即可刪除該頭目。\n\n";

    message += "指令： set\n";
    message += "說明：\n";
    message += "輸入 set 編號 [修改頭目名稱] [修改重生間隔] \n或 \n設定 編號 [修改頭目名稱] [修改重生間隔]\n更新頭目資訊。\n\n";

    message += "指令： clear\n";
    message += "說明：\n";
    message += "輸入 clear [編號]，即可清除該編號的時間。\n\n";

    message += "指令： 清單\n";
    message += "說明：\n";
    message += "輸入 清單 或 list, 顯示目前所有戰利品排隊狀況。\n\n";

    message += "指令： 清單 增加\n";
    message += "說明：\n";
    message += "輸入 清單 增加 [戰利品名稱] 或 list add [戰利品名稱], 即可增加戰利品種類。\n\n";

    message += "指令： 清單 刪除\n";
    message += "說明：\n";
    message += "輸入 清單 刪除 [戰利品名稱] 或 list remove [戰利品名稱], 即可刪除戰利品種類。\n\n";

    message += "指令： 排隊\n";
    message += "說明：\n";
    message += "輸入 排隊 [戰利品名稱] 或 lineup [戰利品名稱], 即可參加戰利品得排隊分配。\n\n";

    message += "指令： 分配\n";
    message += "說明：\n";
    message += "輸入 分配 [戰利品名稱] 或 distribution [戰利品名稱], 即可分配戰利品給最優先的人選\n\n";

    message += "指令： 報到\n";
    message += "說明：\n";
    message += "輸入 報到 [遊戲 ID] 或 checkin [遊戲 ID]，即可完成ＩＤ登記\n\n";

    message += "指令： whois\n";
    message += "說明：\n";
    message += "輸入 whois [遊戲 ID] 或 whois [遊戲 ID],[遊戲 ID],....，即可查詢遊戲ＩＤ是誰\n\n";

    event.reply({'type': 'text', 'text': message});
}

function distributionGift2(event, clans) {
    var clan = clans[0];
    var giftName = event.postData[1];
    var userName = event.postData.slice(2, event.postData.length).join(' ');

    con.query('SELECT * FROM list WHERE clan_id = ? AND name = ?', [
        clan.id,
        giftName
    ], function (err, lists) {
        if (err) {
            event.reply({'type': 'text', 'text': '分配失敗，請重新嘗試(1)！'});
            return ;
        }

        if (! lists.length) {
            event.reply({'type': 'text', 'text': '清單：' + giftName + '找不到！'});
            return ;
        }

        var gift = lists[0];
        con.query('SELECT * FROM queue WHERE list_id = ?', [
            gift.id
        ], function (err, queues) {
            if (err) {
                event.reply({'type': 'text', 'text': '分配失敗，請重新嘗試(2)！'});
                return ;
            }

            if (! queues.length) {
                event.reply({'type': 'text', 'text': '清單：' + giftName + ' 目前沒有人排隊！'});
                return ;
            }

            findQueueByUserName(clan, queues, event, userName, giftName);
        });
    });
}

async function findQueueByUserName(clan, queues, event, userName, giftName) {
    var index = 0;
    var isFind = false;
    var queue = null;
    do {
        queue = queues[index];
        var name = await bot.getGroupMemberProfile(event.source.groupId, queue.line_id).then(function (profile) {
            return profile.displayName;
        });
        if (name.toLowerCase() == userName) {
            isFind = true;
        } else {
            queue = null;
        }
        index++;
    } while (! isFind && index < queues.length);

    if (! queue) {
        event.reply({'type': 'text', 'text': '清單：' + giftName + ' 排隊裡面找不到 ' + event.postData[2]});
        return ;
    }

    con.query('DELETE FROM queue WHERE id = ?', queue.id, function (err, row) {
        if (err) {
            event.reply({'type': 'text', 'text': '分配失敗，請重新嘗試(3)！'});
            return ;
        }

        pushDistribution(clan, event, queue.line_id);
    });

    return queue;
}

function distributionGift(event, clans) {
    var clan = clans[0];
    var giftName = event.postData[1];

    con.query('SELECT * FROM list WHERE clan_id = ? AND name = ?', [
        clan.id,
        giftName
    ], function (err, lists) {
        if (err) {
            event.reply({'type': 'text', 'text': '分配失敗，請重新嘗試(1)！'});
            return ;
        }

        if (! lists.length) {
            event.reply({'type': 'text', 'text': '清單：' + event.postData[1] + '找不到！'});
            return ;
        }

        var gift = lists[0];
        con.query('SELECT * FROM queue WHERE list_id = ?', [
            gift.id
        ], function (err, queues) {
            if (err) {
                event.reply({'type': 'text', 'text': '分配失敗，請重新嘗試(2)！'});
                return ;
            }

            if (! queues.length) {
                event.reply({'type': 'text', 'text': '清單：' + event.postData[1] + ' 目前沒有人排隊！'});
                return ;
            }

            var queue = queues[0];
            con.query('DELETE FROM queue WHERE id = ?', queue.id, function (err, row) {
                if (err) {
                    event.reply({'type': 'text', 'text': '分配失敗，請重新嘗試(3)！'});
                    return ;
                }

                pushDistribution(clan, event, queue.line_id);
            })
        });
    })
}

function pushDistribution(clan, event, line_id) {
    bot.getGroupMemberProfile(event.source.groupId, line_id).then(function (profile) {
        event.reply({
            'type': 'text',
            'text': '分配 ' + event.postData[1] + ' 給 ' + profile.displayName + ' 成功！'
        });
    });
}

function addQueue(event, clans) {
    var clan = clans[0];

    con.query('SELECT * FROM list WHERE clan_id = ? AND name = ?', [
        clan.id,
        event.postData[1]
    ], function (err, lists) {
        if (err) {
            event.reply({'type': 'text', 'text': '排隊失敗，請重新嘗試(1)！'});
            return ;
        }

        if (! lists.length) {
            event.reply({'type': 'text', 'text': '清單：' + event.postData[1] + '找不到！'});
            return ;
        }

        var gift = lists[0];
        var data = {
            list_id: gift.id,
            line_id: event.source.userId
        };
        con.query('INSERT INTO queue SET ?', data, function (err, rows) {
            if (err) {
                event.reply({'type': 'text', 'text': '排隊失敗，請重新嘗試(2)！'});
                return ;
            }

            event.reply({
                'type': 'text',
                'text': '排隊：' +event.postData[1] + ' 成功'
            });
        });
    });
}

function addList(event, clans) {
    var clan = clans[0];
    var data = {
        clan_id: clan.id,
        name: event.postData[2]
    }

    con.query('SELECT * FROM list WHERE clan_id = ? AND name = ?', [
        clan.id,
        event.postData[2]
    ], function (err, lists) {
        if (err) {
            event.reply({'type': 'text', 'text': '新增失敗，請重新嘗試！'});
            return ;
        }

        if (lists.length) {
            event.reply({'type': 'text', 'text': '清單：' + event.postData[2] + '已經存在！'});
            return ;
        }

        con.query('INSERT INTO list SET ?', data, function (err, rows) {
            if (err) {
                event.reply({'type': 'text', 'text': '新增失敗，請重新嘗試！'});
                return ;
            }

            event.reply({
                'type': 'text',
                'text': '新增清單：' +event.postData[2] + ' 成功'
            });
        });
    });
}

function removeList(event, clans) {
    var clan = clans[0];

    con.query('SELECT * FROM list WHERE clan_id = ? AND name = ?', [
        clan.id,
        event.postData[2]
    ], function (err, lists) {
        if (err) {
            event.reply({'type': 'text', 'text': '新增失敗，請重新嘗試！'});
            return ;
        }

        if (! lists.length) {
            event.reply({'type': 'text', 'text': '清單：' + event.postData[2] + '不存在！'});
            return ;
        }

        var list = lists[0];
        con.query('DELETE FROM list WHERE id = ?', list.id, function (err, rows) {
            if (err) {
                event.reply({'type': 'text', 'text': '刪除失敗，請重新嘗試！'});
                return ;
            }

            event.reply({'type': 'text', 'text': '刪除成功!'});
        });
    });
}

function getList(event, clans) {
    var clan = clans[0];
    con.query('SELECT list.*, queue.line_id FROM list LEFT JOIN queue on queue.list_id = list.id WHERE list.clan_id = ? ORDER BY list.id asc', clan.id, function (err, lists) {
        if (! lists.length) {
            event.reply({'type': 'text', 'text': '目前尚無戰利品清單!'});
            return ;
        }

        pushGift(event, lists);
    });
};

async function pushGift(event, lists) {
    var start = 0;
    var message = '';
    for (var i = 0; i < lists.length; i++) {
        var list = lists[i];
        if (start != list.id) {
            start = list.id;
            if (message != '') {
                message += "\n\n";
            }

            message += list.name + "\t優先權: ";
        }
        if (list.line_id) {
            message += await bot.getGroupMemberProfile(event.source.groupId, list.line_id).then(function (profile) {
                return profile.displayName;
            });
            if (i+1 < lists.length && lists[i+1].id == start) {
                message += ', '
            }
        }
    }
    event.reply({
        'type': 'text',
        'text': message
    });

    return message;
}

function setAlertTime(event, clans) {
    var clan = clans[0];
    con.query('UPDATE clan set alert_time = ? WHERE id = ?', [
        event.postData[1],
        clan.id
    ], function (err, rows) {
        if (err) {
            event.reply({'type': 'text', 'text': '更新提醒時間失敗，請重新嘗試'});
            return ;
        }

        event.reply({'type': 'text', 'text': '提醒時間已設置為提前' + event.postData[1] + '分鐘'});
    });
}

function clearBoss(event, clans) {
    clan = clans[0];
    con.query('UPDATE boss set estimated_time = NULL WHERE clan_id = ? AND number = ?',[
        clan.id,
        event.postData[1]
    ], function (err, rows) {
        if (err) {
            event.reply({'type': 'text', 'text': '清除失敗，請重新嘗試！'});
            return ;
        }

        if (! rows.affectedRows) {
            event.reply({'type': 'text', 'text': '找不到編號 ' + event.postData[1]});
            return ;
        }

        event.reply({'type': 'text', 'text': '編號：'+event.postData[1]+' 時間已清除。'});
    });
}

function removeBoss(event, clans) {
    var clan = clans[0];

    con.query('DELETE FROM boss WHERE clan_id = ? AND number = ?', [
        clan.id,
        event.postData[1]
    ], function (err, rows) {
        if (err) {
            event.reply({'type': 'text', 'text': '刪除失敗，請重新嘗試！'});
            return ;
        }

        if (! rows.affectedRows) {
            event.reply({'type': 'text', 'text': '編號：' + event.postData[1]+ ' 不存在！'});
            return ;
        }

        event.reply({'type': 'text', 'text': '編號：' + event.postData[1] +' 刪除成功！'})
    });
}

function setBoss(event, clans) {
    var clan = clans[0];
    var data = {
        name: event.postData[2],
        rebirth_time: Number.parseInt(event.postData[3])
    }

    con.query('UPDATE boss SET ? WHERE clan_id = ? AND number = ?', [
        data,
        clan.id,
        event.postData[1]
    ], function (err, rows) {
        if (err) {
            event.reply({'type': 'text', 'text': '更新失敗，請重新嘗試！'})
            return ;
        }

        if (! rows.affectedRows) {
            event.reply({'type': 'text', 'text': '找不到編號 ' + number});

            return ;
        }

        event.reply({'type': 'text', 'text': '編號：' + event.postData[1] + '更新成功!'});
    });
}

function addBoss(event, clans) {
    var clan = clans[0];
    if (event.postData.length > 4) {
        var data = {
            clan_id: clan.id,
            number: event.postData[1],
            name: event.postData[2],
            rebirth_time: Number.parseInt(event.postData[3]),
            times: event.postData[4]
        };
    } else {
        var data = {
            clan_id: clan.id,
            number: event.postData[1],
            name: event.postData[2],
            rebirth_time: Number.parseInt(event.postData[3]),
            times: null
        };
    }
    con.query('SELECT * FROM boss WHERE clan_id = ? AND number = ?', [
        clan.id,
        event.postData[1]
    ], function (err, bosses) {
        if (err) {
            event.reply({'type': 'text', 'text': '新增失敗，請重新嘗試！'});
            return ;
        }

        if (bosses.length) {
            event.reply({'type': 'text', 'text': '編號：' + event.postData[1] + '已經存在！'});
            return ;
        }

        con.query('INSERT INTO boss SET ?', data, function (err, rows) {
            if (err) {
                event.reply({'type': 'text', 'text': '新增失敗，請重新嘗試！'});
                return ;
            }

            event.reply({
                'type': 'text',
                'text': '新增編號：' +event.postData[1] +' '+ event.postData[2] + ' 頭目成功, 重生時間為：'+event.postData[3]+'小時。'
            });
        });
    });
}

function deathBoss(event, clans) {
    var clan = clans[0];
    con.query('SELECT * FROM boss WHERE clan_id = ? AND number = ?',[
        clan.id,
        event.postData[0]
    ], function (err, bosses) {
        if(err) {
            event.reply({'type': 'text', 'text': '更新失敗，請重新嘗試！'});
            return ;
        }

        if (! bosses.length) {
            event.reply({'type': 'text', 'text': '找不到編號 ' + event.postData[0]});
            return ;
        }

        var boss = bosses[0];
        var nowTime = Date.now() + (8 * 60 * 60 * 1000);
        var now = new Date(nowTime);
        var r_a = event.postData[1].split('');
        var time = now.getFullYear() + '/'
            + (now.getMonth() + 1) + '/'
            + now.getDate() + ' '
            + r_a[0] + r_a[1] + ':' + r_a[2] + r_a[3] + ':00';
        var bossTime = Date.parse(time);
        if (bossTime > nowTime) {
            bossTime -= 24 * 60 * 60 * 1000;
        }
        if (boss.rebirth_time) {
            bossTime += boss.rebirth_time * 60 * 60 * 1000;
        }
        bossTime = new Date(bossTime);

        var hours = '' + bossTime.getHours() < 10 ?
        '0' + bossTime.getHours() : bossTime.getHours();
        var minutes = '' + bossTime.getMinutes() < 10 ?
        '0' + bossTime.getMinutes() : bossTime.getMinutes();

        var date = bossTime.getFullYear() + '/'
                    + (bossTime.getMonth() + 1) + '/'
                    + bossTime.getDate() + ' '
                    + hours + ':' + minutes + ':00';

        var data = event.postData;
        data[0] = data[1] = '';
        var note = data.join(' ');
        con.query('UPDATE boss SET ? WHERE id = ?', [
            {estimated_time: date, note: note, is_alert: 0},
            boss.id
        ], function (err, rows) {
            if (err) {
                event.reply({'type': 'text', 'text': '更新失敗，請重新嘗試！'});
                return ;
            }
            event.reply({
                'type': 'text',
                'text': boss.name + ' 預估重生時間為：' + hours + minutes
            });
        });
    });
}

function getBoss(event, clans) {
    var message = "地圖\t頭目\t時間\t備註\n";
    var clan = clans[0];
    con.query('SELECT * FROM boss WHERE clan_id = ? ORDER BY IF(TIMESTAMPDIFF(MINUTE, CONVERT_TZ(now(), "+00:00", "+08:00"), estimated_time) >= 0, TIMESTAMPDIFF(MINUTE, CONVERT_TZ(now(), "+00:00", "+08:00"), estimated_time), 999999999)', clan.id, function (err, bosses) {
        for (var i = 0; i < bosses.length; i ++) {
            var boss = bosses[i];
            var time = new Date(boss.estimated_time);
            var hours = '' + time.getHours() < 10 ?
            '0' + time.getHours() : time.getHours();
            var minutes = '' + time.getMinutes() < 10 ?
            '0' + time.getMinutes() : time.getMinutes();

            message += boss.number + "\t"
                + boss.name + "\t"
                + (boss.estimated_time ? hours + '' + minutes : '') + "\t"
                + (boss.note ? boss.note : '') + "\n"
        }

        event.reply({'type': 'text', 'text': message});
    });
}

function noteBoss(event, clans) {
    var clan = clans[0];
    var data = event.postData;
    var number = data[1];
    data[0] = data[1] = '';
    var note = data.join(' ');
    con.query('UPDATE boss SET ? WHERE number = ? AND clan_id = ?', [
        {note: note},
        number,
        clan.id
    ], function (err, rows) {
        if (err) {
            event.reply({'type': 'text', 'text': '更新失敗，請重新嘗試!'});
        }

        if (! rows.affectedRows) {
            event.reply({'type': 'text', 'text': '找不到編號 ' + number});

            return ;
        }

        event.reply({'type': 'text', 'text': '備註更新成功！'});
    });
}

function alertBoss(event, clans) {
    var clan = clans[0];
    var delayMinutes = clan.alert_time;

    var nowTime = Date.now() + (8 * 60 * 60 * 1000);
    var now = new Date(nowTime);
    var hours = '' + now.getHours() < 10 ?
    '0' + now.getHours() : now.getHours();
    var minutes = '' + now.getMinutes() < 10 ?
    '0' + now.getMinutes() : now.getMinutes();
    var date = now.getFullYear() + '/'
        + (now.getMonth() + 1) + '/'
        + now.getDate() + ' '
        + hours + ':' + minutes + ':00';

    var endTime = Date.now() + (8 * 60 * 60 * 1000) + (delayMinutes * 60 * 1000);
    var end = new Date(endTime);
    hours = '' + end.getHours() < 10 ?
    '0' + end.getHours() : end.getHours();
    minutes = '' + end.getMinutes() < 10 ?
    '0' + end.getMinutes() : end.getMinutes();

    var endDate = end.getFullYear() + '/'
        + (end.getMonth() + 1) + '/'
        + end.getDate() + ' '
        + hours + ':' + minutes + ':00';

    con.query('SELECT *, TIMESTAMPDIFF(MINUTE, ?, estimated_time) as time FROM boss WHERE clan_id = ? AND estimated_time >= ? AND estimated_time <= ? ORDER BY estimated_time', [
        date,
        clan.id,
        date,
        endDate
    ], function (err, rows) {
        if (err) {
            event.reply({'type': 'text', 'text': '取得失敗，請重新嘗試！'});
            return ;
        }

        if (! rows.length) {
            event.reply({'type': 'text', 'text': delayMinutes + '分鐘內沒有王會重生...'});
            return ;
        }

        var message = '以下王將在 ' + delayMinutes + " 分鐘內重生:\n";
        for (var i = 0; i < rows.length; i++) {
            var boss = rows[i];
            message += "【提醒】" + boss.number
                + "地圖的 " + boss.name
                + " 將在" +boss.time+ "分鐘後重生\n";
        }

        event.reply({'type': 'text', 'text': message});
    });
}

function authorize(sourceId, event, callback) {
    con.query('SELECT * FROM clan WHERE line_id = ?', sourceId, function (err, rows) {
        if (err) {
            console.log(err);
        }
        if(! rows.length) {
            event.reply({'type': 'text', 'text': '尚未認證無法使用，請洽作者開通認證！'});
            return ;
        }

        callback(event, rows);
    });
}

function pushBoss(clan) {
    var delayMinutes = clan.alert_time;

    var nowTime = Date.now() + (8 * 60 * 60 * 1000);
    var now = new Date(nowTime);
    var hours = '' + now.getHours() < 10 ?
    '0' + now.getHours() : now.getHours();
    var minutes = '' + now.getMinutes() < 10 ?
    '0' + now.getMinutes() : now.getMinutes();
    var date = now.getFullYear() + '/'
        + (now.getMonth() + 1) + '/'
        + now.getDate() + ' '
        + hours + ':' + minutes + ':00';

    var endTime = Date.now() + (8 * 60 * 60 * 1000) + (delayMinutes * 60 * 1000);
    var end = new Date(endTime);
    hours = '' + end.getHours() < 10 ?
    '0' + end.getHours() : end.getHours();
    minutes = '' + end.getMinutes() < 10 ?
    '0' + end.getMinutes() : end.getMinutes();
    var endDate = end.getFullYear() + '/'
        + (end.getMonth() + 1) + '/'
        + end.getDate() + ' '
        + hours + ':' + minutes + ':00';

    con.query('SELECT * FROM boss WHERE clan_id = ? AND times IS NOT NULL',
        clan.id,
        function (err, rows) {
            if (err) {
                return ;
            }

            var endAlert1 = Date.now() + (8 * 60 * 60 * 1000) + (delayMinutes * 60 * 1000);
            var endAlert2 = Date.now() + (8 * 60 * 60 * 1000) + ((delayMinutes - 1) * 60 * 1000);
            var end1 = new Date(endAlert1);
            hours1 = '' + end1.getHours() < 10 ?
            '0' + end1.getHours() : end1.getHours();
            minutes1 = '' + end1.getMinutes() < 10 ?
            '0' + end1.getMinutes() : end1.getMinutes();

            var end2 = new Date(endAlert2);
            hours2 = '' + end2.getHours() < 10 ?
            '0' + end2.getHours() : end2.getHours();
            minutes2 = '' + end2.getMinutes() < 10 ?
            '0' + end2.getMinutes() : end2.getMinutes();

            for (var i = 0; i < rows.length; i++) {
                var row = rows[i];
                var times = row.times.split(',');
                var isAlert = false;

                for (var j = 0; j < times.length; j++) {
                    if (times[j] == (hours1+minutes1)) {
                        isAlert = true;
                    }

                    if (times[j] == (hours2+minutes2)) {
                        isAlert = true;
                    }

                }

                if (isAlert) {
                    var message = "【提醒】" + row.number
                        + "地圖的 " + row.name
                        + " 將在10分鐘後重生\n";
                    bot.push(clan.line_id, message);
                }

            }
        });

    con.query('SELECT *, TIMESTAMPDIFF(MINUTE, ?, estimated_time) as time FROM boss WHERE clan_id = ? AND estimated_time >= ? AND estimated_time <= ? AND is_alert = 0 AND times IS NULL', [
        date,
        clan.id,
        date,
        endDate
    ], function (err, rows) {
        if (err) {
            console.log(clan.name + '取得 boss 資料出錯！');
            return ;
        }

        if (! rows.length) {
            return ;
        }

        var ids = [];
        for (var i = 0; i < rows.length; i++) {
            var boss = rows[i];
            var message = "【提醒】" + boss.number
                + "地圖的 " + boss.name
                + " 將在" +boss.time+ "分鐘後重生\n";
            bot.push(clan.line_id, message);
            ids.push(boss.id);
        }

        if (ids.length) {
            con.query('UPDATE boss set is_alert = 1 where id in (?)', [ids], function (err, rows) {
                if (err) {
                   console.log(err);
                }
            })
        }
    });
}

function checkInMember(event, clans) {
    var clan = clans[0];
    var userId = event.source.userId;
    var data = event.postData;
    if(! userId || userId == null) {
        console.log(event);
    }

    con.query('UPDATE member SET ? WHERE line_id = ? AND clan_id = ?',[
        {name: data[1]},
        userId,
        clan.id
    ], function (err, rows) {
        if (err) {
            event.reply({'type': 'text', 'text': '報到失敗！'});
        }

        if (! rows.affectedRows) {
            con.query('INSERT INTO member SET ?', {
                line_id: userId,
                clan_id: clan.id,
                name: data[1]
            }, function (err, rows) {
                if (err) {
                    event.reply({'type': 'text', 'text': '報到失敗！'});
                }
            });
        }

        event.reply({'type': 'text', 'text': data[1]+" 報到成功！"});
    });
}

function whois(event, clans) {
    var clan = clans[0];
    var data = event.postData;
    data[0] = '';
    data = data.join(' ');
    data = data.split(' ');
    con.query('SELECT * FROM member WHERE name IN (?) AND clan_id = ?', [
        data,
        clan.id
    ], function (err, rows) {
        if (err) {
            event.reply({'type': 'text', 'text': '查詢失敗!'});
        }

        if (rows.length) {
            pushName(clan, rows, event);
        }
    });
}

async function pushName(clan, members, event) {
    var names = '';
    for (var i = 0; i < members.length; i++) {
        var name = await bot.getGroupMemberProfile(event.source.groupId, members[i].line_id).then(function (profile) {
            return members[i].name + ' 是 ' + profile.displayName + "\n";
        });
        names += name;
    }

    event.reply({
        'type': 'text',
        'text': names
    });

    return names;
}

var j = schedule.scheduleJob('*/2 * * * *', function(){
    con.query('SELECT * FROM clan WHERE line_id is not NULL AND alert_time > 0', [], function (err, clans) {
        if (err) {
            console.log('定時推送錯誤：');
            console.log(err);
            return ;
        }

        for(var i = 0; i < clans.length; i++) {
            pushBoss(clans[i]);
        };
    });
});

module.exports = app;
