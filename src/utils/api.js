const { randomString } = require('./rand');
const requests = require('./requests.js');
const fetch = require('node-fetch');
const md5 = require('md5');

const __API = {
    FETCH_ROLE_ID: 'https://api-takumi.mihoyo.com/game_record/card/wapi/getGameRecordCard',
    FETCH_ROLE_INDEX: 'https://api-takumi.mihoyo.com/game_record/genshin/api/index',
    FETCH_ROLE_CHARACTERS: 'https://api-takumi.mihoyo.com/game_record/genshin/api/character',
    FETCH_GACHA_LIST: 'https://webstatic.mihoyo.com/hk4e/gacha_info/cn_gf01/gacha/list.json',
    FETCH_GACHA_DETAIL: 'https://webstatic.mihoyo.com/hk4e/gacha_info/cn_gf01/$/zh-cn.json',
    FETCH_ABY_DETAIL:'https://api-takumi.mihoyo.com/game_record/genshin/api/spiralAbyss',
    FETCH_INFO: "http://localhost:9934/resources/Version2/info/docs/$.json",
};

const HEADERS = {
    'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 13_2_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) miHoYoBBS/2.7.0',
    'Referer': 'https://webstatic.mihoyo.com/',
    'x-rpc-app_version': '2.7.0',
    'x-rpc-client_type': 5,
    'DS': '',
    'Cookie': ''
}

const getDS = () => {
    let n = '14bmu1mz0yuljprsfgpvjh3ju2ni468r',
        i = Date.now() / 1000 | 0,
        r = randomString(6),
        c = md5(`salt=${n}&t=${i}&r=${r}`);
    return `${i},${r},${c}`
}

exports.getInfo = (name) => {
    return new Promise((resolve, reject) => {
        requests({
            method: 'GET',
            url: __API.FETCH_INFO.replace( "$", encodeURI( name )),
        })
            .then(res => {
                resolve(JSON.parse(res));
            })
            .catch(err => {
                reject(err);
            });
    });
}

exports.getAbyDetail = (role_id,schedule_type, server, cookie) => {
    return new Promise((resolve, reject) => {
        requests({
            method: "GET",
            url: __API.FETCH_ABY_DETAIL,
            qs: {
                server,
                role_id,
                schedule_type
            },
            headers: {
                ...HEADERS,
                'DS': getDS(),
                'Cookie': cookie
            }
        })
            .then(res => {
                resolve(JSON.parse(res));
            })
            .catch(err => {
                reject(err);
            });
    });
}

exports.getBase = (uid, cookie) => {
    return new Promise((resolve, reject) => {
        requests({
            method: "GET",
            url: __API.FETCH_ROLE_ID,
            qs: {uid},
            headers: {
                ...HEADERS,
                'DS': getDS(),
                'Cookie': cookie,
            }
        })
            .then(res => {
                resolve(JSON.parse(res));
            })
            .catch(err => {
                reject(err);
            });
    });
}

exports.getDetail = (role_id, server, cookie) => {
    return new Promise((resolve, reject) => {
        requests({
            method: "GET",
            url: __API.FETCH_ROLE_INDEX,
            qs: {
                server,
                role_id
            },
            headers: {
                ...HEADERS,
                'DS': getDS(),
                'Cookie': cookie
            }
        })
            .then(res => {
                resolve(JSON.parse(res));
            })
            .catch(err => {
                reject(err);
            });
    });
}

exports.getCharacters = (role_id, server, character_ids, cookie) => {
    return new Promise((resolve, reject) => {
        requests({
            method: 'POST',
            url: __API.FETCH_ROLE_CHARACTERS,
            json: true,
            body: {
                character_ids,
                server,
                role_id
            },
            headers: {
                ...HEADERS,
                'DS': getDS(),
                'Cookie': cookie,
                "content-type": "application/json"
            }
        })
            .then(res => {
                resolve(res);
            })
            .catch(err => {
                reject(err);
            });
    });
}

exports.getGachaList = () => {
    return new Promise((resolve, reject) => {
        requests({
            method: 'GET',
            url: __API.FETCH_GACHA_LIST,
        })
            .then(res => {
                resolve(JSON.parse(res));
            })
            .catch(err => {
                reject(err);
            });
    });
}

exports.getGachaDetail = gachaID => {
    return new Promise((resolve, reject) => {
        requests({
            method: 'GET',
            url: (__API.FETCH_GACHA_DETAIL.replace('$', gachaID)),
        })
            .then(res => {
                resolve(JSON.parse(res));
            })
            .catch(err => {
                reject(err);
            });
    });
}

