const { get, push, isInside, update } = require('../../utils/database');
const { hasAuth, sendPrompt } = require('../../utils/auth');
const render = require('../../utils/render');
const getGachaResult = require('./gacha');

const userInitialize = async userID => {
    if (!(await isInside('gacha', 'user', 'userID', userID))) {
        await push('gacha', 'user', {
            userID,
            choice: 301,
            indefinite: { five: 1, four: 1, isUp: undefined },
            character:  { five: 1, four: 1, isUp: 0 },
            weapon:     { five: 1, four: 1, isUp: null },
            path: { course: null, fate: 0}
        });
    }
};

module.exports = async Message => {
    let msg     = Message.raw_message;
    let userID  = Message.user_id;
    let groupID = Message.group_id;
    let type    = Message.type;
    let sendID  = type === 'group' ? groupID : userID;
    let name    = Message.sender.nickname;
    let [cmd]   = msg.split(/(?<=^\S+)\s/).slice(1);

    await userInitialize(userID);

    if (!(await hasAuth(userID, 'gacha')) || !(await hasAuth(sendID, 'gacha'))) {
        await sendPrompt(sendID, name, '祈愿十连', type);
        return;
    }

    if (msg.includes('卡池')) {
        let choice;
        switch (cmd) {
            case '常驻': choice = 200; break;
            case '角色': choice = 301; break;
            case '武器': choice = 302; break;
        }
        await update('gacha', 'user', { userID }, { choice });
        await bot.sendMessage(sendID, `[CQ:at,qq=${userID}] 您的卡池已切换至: ` + cmd, type);
    } else if (msg.includes('十连')) {
        let data = await getGachaResult(userID, name);
        await render(data, 'genshin-gacha', sendID, type);
    } else if (msg.includes('查看定轨')) {
        const { choice } = await get('gacha', 'user', { userID });
        if (choice!==302){
          await bot.sendMessage(sendID, '当前卡池非武器池', type);
          return;
        }
        const table = await get('gacha', 'data', { gacha_type: 302 });
        const {path} = await get('gacha', 'user', { userID });
        if (path['course'] === null)
          await bot.sendMessage(sendID, '当前未指定定轨武器', type);
        else
          await bot.sendMessage(sendID, '当前定轨 '+table['upFiveStar'][path['course']]['item_name']+'\n命定值 '+path['fate'], type);
    } else if (msg.includes('定轨')) {
        const { choice } = await get('gacha', 'user', { userID });
        if (choice!==302){
          await bot.sendMessage(sendID, '当前卡池非武器池', type);
          return;
        }
        if (cmd === "无") {
          let path = { course:null, fate: 0};
          await update('gacha', 'user', { userID }, { path });
          await bot.sendMessage(sendID, '已取消定轨', type);
          return;
        }
        let id = -1;
        const table = await get('gacha', 'data', { gacha_type: 302 });
        for(let i=0;i<table['upFiveStar'].length;i++){
            if (table['upFiveStar'][i]['item_name'] === cmd){
              id = i;
              break;
            }
        }
        if (id === -1){
          await bot.sendMessage(sendID, '非 up 武器', type);
          return;
        } else {
          await bot.sendMessage(sendID, '定轨 ' + cmd + ' 成功，命定值已清零', type);
          let path = { course: id, fate: 0 };
          await update('gacha', 'user', { userID }, { path });
        }
    }
}
