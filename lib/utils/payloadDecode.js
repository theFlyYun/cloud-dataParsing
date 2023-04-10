/*
 * @Author: Long Yunfei
 * @Date: 2023-03-21 09:14:55
 * @LastEditTime: 2023-04-10 23:59:24
 * Copyright: 2023 BJTU. All Rights Reserved.
 * @Descripttion: 
 */
const productkey2object = config.productkey2object;
const config = require('../../config/dataparsing/config');
// var logger=require('../logs/logger')

module.exports ={
    rawdata2JS
}

//按位解析，返回值
function getBit(data,byteLength,startBit,bitLength){
    try{
        //data：字节流，高位不足补0
        var length=byteLength*8//总长
        return Math.floor((data%(1<<(length-startBit)))/(1<<(length-startBit-bitLength)));

    }
    catch{
        // logger.error(`gitbit use error`)
    }
}

function getInfo(data,obj){

    var sliceStart=obj.startByte
    var sliceEnd=Math.ceil(sliceStart+obj.bitLength/8)
    var byteLength=sliceEnd-sliceStart
    var dataSlice=data.slice(sliceStart*2,sliceEnd*2)
    var datavalue=parseInt(dataSlice,16)
    var res

    if(obj.startBit==0&&obj.bitLength%8==0){
        if(obj.hasOwnProperty('divisor')){
            if(obj.hasOwnProperty('signsExist')&&obj.signsExist==true){
                res=datavalue
                res=res<32768?res/obj.divisor:(res-65536)/obj.divisor
            }
            else{
                res=datavalue/obj.divisor
            }
            return res
        }
        else{
            if(obj.hasOwnProperty('signsExist')&&obj.signsExist==true){
                res=datavalue
                res=res<32768?res:(res-65536)
            }
            else{
                res=datavalue
            }
            return res
        }
    }
    else{
        if(obj.hasOwnProperty('divisor')){
            res=getBit(datavalue,byteLength,obj.startBit,obj.bitLength)/obj.divisor
            if(obj.hasOwnProperty('signsExist')&&obj.signsExist==true&&res>32767){
                res-=65536/obj.divisor
            }
            return res
        }
        else{
            res=getBit(datavalue,byteLength,obj.startBit,obj.bitLength)
            if(obj.hasOwnProperty('signsExist')&&obj.signsExist==true&&res>32767){
                res-=65536
            }
            return res
        }
    }
    // console.log(dataSlice,datavalue,byteLength,obj.startBit,obj.bitLength)
}

function rawdata2JS(data,productkey){
    folder_path='../../config/streamconfig/'+config.productkey2object[productkey]
    // console.log(folder_path)

    var jsonconfig=require(folder_path)

    var payloadObj={}//返回对象，用于组JS

    //payload信息解码
    for(key in jsonconfig){
        var obj=jsonconfig[key]
        payloadObj[key]=getInfo(data,obj)
    }

    // console.log(payloadObj)
    return payloadObj
}
