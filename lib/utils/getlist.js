/*
 * @Author: Long Yunfei
 * @Date: 2023-04-10 23:44:08
 * @LastEditTime: 2023-04-11 00:00:12
 * Copyright: 2023 BJTU. All Rights Reserved.
 * @Descripttion: 
 */

const axios = require('axios').default;
const config = require('../../config/dataparsing/config');

const host="10.8.0.3:3000"

module.exports ={
    getToken,getlist,getproductkey
}

async function getToken(){

  
    var access_token
    await axios({
        url: "http://"+host+"/v1/oauth2/token",
        data: {
            "grant_type":"password",
            "client_id": "1234",
            "client_secret": "333.333.333",
            "username":config.connect.options.username,
            "password":config.connect.options.password,
            "device_type": "user"

        },
        method: 'post',
        headers: {
            "Content-Type": "application/json"
        }
    }).then(res => {
        console.log('got token!')
        // console.log(res.data.access_token)
        access_token = res.data.access_token
    })
    .catch('got token failed', error => { console.log(error) })

    return access_token
}

async function getlist(){

    var access_token=await getToken()
    var did2PK={}

    var sm=await axios({
        url: "http://"+host+"/v1/devices",
        data: {},
        method: 'get',
        headers: {
            "Content-Type": "application/json",
            'Authorization': access_token
        }
    })
    .then(res => {
        console.log('get list!')
        // console.log(res.data)
        for(key in res.data){
            // console.log(res.data[key].did)
            did2PK[res.data[key].did]=res.data[key].product_key
        }
        // console.log(did2PK)
    })
    .catch('get list failed', error => { console.log(error) })

    return did2PK
}

async function getproductkey(did) {
    var access_token=await getToken()
    var PK

    // console.log("http://"+host+`/v1/devices/${did}`,access_token)

    var sm=await axios({
        url: "http://"+host+`/v1/devices/${did}`,
        data: {},
        method: 'get',
        headers: {
            'Authorization': access_token
        },
        params: {
            q:"product_key"
        }
    })
        .then(res => {
            PK = res.data.product_key
            // console.log("********************")
            // console.log(res.data.product_key)
            // console.log("********************")
        // console.log(did2PK)
    })
    .catch('get list failed', error => { console.log(error) })

    return PK
    
}