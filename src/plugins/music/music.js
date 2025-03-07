const querystring = require('querystring');
const fetch = require('node-fetch')
const { get, push, update } = require('../../utils/database');

const MUSICSRC = {
    SRC_QQ:   'QQ',
    SRC_163:  '163'
}
Object.freeze(MUSICSRC);

const ERRCODE = {
    ERR_SRC: '1',
    ERR_404: '2',
    ERR_API: '3'
}
Object.freeze(ERRCODE);

exports.errMsg = {
    [ERRCODE.ERR_SRC]: '错误的音乐源',
    [ERRCODE.ERR_404]: '没有查询到对应歌曲',
    [ERRCODE.ERR_API]: '歌曲查询出错'
}

const hasKey = (obj, level, ...rest) => {
    if (obj === undefined) {
        return false
    }
    if (rest.length == 0 && obj.hasOwnProperty(level)) {
        return true
    }

    return hasKey(obj[level], ...rest)
}

// 看看，这集 LinuxHub 群友智慧的代码！！！ {
const doPost = async (url, headers, body) => {
    let ret = false;

    const response = await fetch(url, {
        method: 'POST',
        headers: headers,
        body: body
    });

    if (response.status == 200) {
      ret = response.json();
    }

    return ret;
}
// }

const musicQQ = async (keyword) => {
    let url = 'https://api.qq.jsososo.com/search/quick';
    let form = {
        'key':    keyword,
    }
    let body = querystring.stringify(form);
    let headers = {
        'Content-Length': body.length,
        'Content-Type':   'application/x-www-form-urlencoded',
        "User-Agent":     'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0',
    }
    let jbody = await doPost(url, headers, body);

    if (!jbody) {
        return ERRCODE.ERR_API;
    }

    if (hasKey(jbody, 'data', 'song', 'itemlist', 0, 'id')) {
        return [
        {
            'type': 'music',
            'data': {
                'type': 'qq',
                'id': jbody['data']['song']['itemlist'][0]['id']
            }
        }]
    }

    return ERRCODE.ERR_404;
}

const music163 = async (keyword) => {
    let url = 'https://music.163.com/api/search/get/';
    let form = {
        's':      keyword,
        'type':   1,  // 1:单曲, 10:专辑, 100:歌手, 1000:歌单, 1002:用户, 1004:MV, 1006:歌词, 1009:电台, 1014:视频
        'limit':  1,
        'offset': 0
    }
    let body = querystring.stringify(form);
    let headers = {
        'Content-Length': body.length,
        'Content-Type':   'application/x-www-form-urlencoded',
        'Referer':        'https://music.163.com',
        'Cookie':         'appver=2.0.2'
    }
    let jbody = await doPost(url, headers, body);

    if (!jbody) {
        return ERRCODE.ERR_API;
    }

    if (hasKey(jbody, 'result', 'songs', 0, 'id')) {
        return [
        {
            'type': 'music',
            'data': {
                'type': '163',
                'id': jbody['result']['songs'][0]['id']
            }
        }]
    }

    return ERRCODE.ERR_404;
}

exports.musicID = async ( msg, source ) => {
    let [keyword] = msg.split(/(?<=^\S+)\s/).slice(1);
    const worker  = {
        [MUSICSRC.SRC_QQ]:   musicQQ,
        [MUSICSRC.SRC_163]:  music163
    }

    if (!(source in worker)) {
        return ERRCODE.ERR_SRC;
    }

    return await worker[source](keyword);
}

exports.musicSrc = async ( msg, id ) => {
    let [source] = msg.split(/(?<=^\S+)\s/).slice(1);
    let data = await get('music', 'source', { ID:id });

    if (!(Object.values(MUSICSRC).includes(source))) {
        return false;
    }

    if (data === undefined) {
        await push('music', 'source', { ID:id, Source:source });
    } else {
        await update('music', 'source', { ID:id }, { ...data, Source:source });
    }

    return source;
}

