var serviceUUID = [] //主 service 的 uuid 列表
var writeUUID = ""; //写读 UUID
var notifyUUID = ""; //notify UUID
var filterServiceUUID = ""; //过滤获取到的服务uuid(有些会返回多条数据)
var filterDeviceName = ""; //设备名称

var macAddress = ""; //保存得到mac地址
var flagFromTypes = ''; //来源类型
var _discoveryStarted = false;
var deviceId = ''; //用于区分设备的 id

var _deviceId = '';
var _serviceId = '';
var _characteristicId = '';
var status = false; //当前状态
var action_type = ''; //操作类型
var code = -1;
var isnotExist = true

function flagServiceIDFun(serviceType) {
  if (serviceType == 4) { // 
  serviceUUID[0] = "0000*E0-00*0-*0*0-*0*0-00**5F9**4*B"; //主 service 的 uuid 列表
  writeUUID = "00*0**E2-00*0-*0*0-*0*0-00**5F9**4*B"; //写读 UUID
  notifyUUID = "00*0**E1-00*0-*0*0-*0*0-00**5F9**4*B"; //notify UUID
  
  filterServiceUUID = "*E0";
  filterDeviceName = getNameMac(macAddress, 6, 'abc_'); //设备名称
  }
}

function initBle(fromMac, flagTypes, currentSerial) {
  //断开连接【每次初始化先断开连接】
  closeBLEConnection();

  // macAddress = clearSymbol(fromMac);
  macAddress = fromMac; //保存mac
  flagFromTypes = flagTypes //类型来源
currentSerialVal = currentSerial //当前操作序号
  
   // 根据类型，赋值主服务id相关信息【根据个人需求，如果只有一种设备，初始化赋值即可】
  flagServiceIDFun(flagTypes);
  
  wx.openBluetoothAdapter({
      success: (res) => {
          console.log('openBluetoothAdapter 初始化蓝牙模块是否成功:', res)

          // 监听寻找新设备事件
          onBluetoothDeviceFound();

          //开始搜寻附近的蓝牙外围设备
          startBluetoothDevicesDiscovery();
      },
      fail: (res) => {
          console.log('初始化蓝牙失败', res);
          //自行处理【可弹窗提示用户开启蓝牙】，这通过回调处理
          asddErrorCallback(res.errCode, "");

          //监听蓝牙适配器状态变化事件【根据需求是否执行】
          // wx.onBluetoothAdapterStateChange(function (res) {
          //     console.log('蓝牙适配器状态更改结果:  ', res)
          //     if (res.available) {
          //         console.log('蓝牙可用，搜索设备:--》 ')
          //         onBluetoothDeviceFound();
          //         startBluetoothDevicesDiscovery();
          //     }
          // })
      }
  })
}

/**
 * 监听寻找新设备事件
 * 搜索匹配设备后，自动连接设备
 */
function onBluetoothDeviceFound() {
  wx.onBluetoothDeviceFound((res) => {
      console.log('广播数据结果:', res);

      res.devices.forEach(device => {
          if (!device.name && !device.localName) {
              return
          }

          // 转换后, 得出相关数据
          var hexStr = ab2hex(device.advertisData);
          console.log("广播数据中转换后：advertisData---->" + hexStr);

          //通过获取mac匹配
          if ((macAddress != "") && (macAddress == device.deviceId) && isnotExist) {
              isnotExist = false;
              deviceId = device.deviceId;
              console.log('android-->tempDeviceId:' + deviceId);
      
              //停止搜寻附近的蓝牙外围设备
              stopBluetoothDevicesDiscovery();
              
              //连接设备
              createBLEConnection();
          }
          
          
          //通过name匹配设备
          let deviceName = device.name.toUpperCase();
          if ((deviceName.indexOf(filterDeviceName) != -1) && isnotExist) {
              isnotExist = false;
              deviceId = device.deviceId;
              console.log('ios or android-->tempDeviceId:' + deviceId);
              
      //停止搜寻附近的蓝牙外围设备。
              stopBluetoothDevicesDiscovery();
              
              //连接设备
              createBLEConnection();
          }
      })
  })
}

function startBluetoothDevicesDiscovery() {
  console.log("执行连接蓝牙设备 回调空===" + _discoveryStarted);
  if (_discoveryStarted) {
      return;
  }
  _discoveryStarted = true
  
  wx.startBluetoothDevicesDiscovery({
      services: serviceUUID, //如果设置此参数，则只搜索广播包有对应 uuid 的主服务的蓝牙设备。
      allowDuplicatesKey: false,
      success: (res) => {
          console.log('启动搜索蓝牙设备, 结果  :', res)
          //onBluetoothDeviceFound()   //先调用此方法再使startBluetoothDevicesDiscovery
      },
      fail(res) {
          asddErrorCallback(res.errCode, "");
          console.log('startBluetoothDevicesDiscovery fail', res);
      }
  })
}

//停止搜寻附近的蓝牙外围设备。
function stopBluetoothDevicesDiscovery() {
  wx.stopBluetoothDevicesDiscovery()
}

/**
 * 连接蓝牙设备
 */
function createBLEConnection() {
  var that = this;
  wx.createBLEConnection({
      deviceId: deviceId,
      success: (res) => {
          wx.showToast({
              title: '设备连接成功',
              duration: 2000
          })
          getBLEDeviceServices(deviceId)
      },
      fail: (res) => {
          console.log('createBLEConnection fail', res);
          asddErrorCallback(res.errCode, "");
      }
  })
  //停止搜索
  stopBluetoothDevicesDiscovery();
}

function getBLEDeviceServices(deviceId) {
  //监听低功耗蓝牙连接状态的改变事件
  wx.onBLEConnectionStateChange(function(res) {
      console.log("onBLEConnectionStateChange:", res);
      // 该方法回调中可以用于处理连接意外断开等异常情况
      console.log(`device ${res.deviceId} state has changed, connected: ${res.connected}`)
      if (res.connected == false) {
          console.log("连接意外断开等****", _deviceId);
          _deviceId = '';
          if (flagFromTypes == 1 && flagFromTypes == 2) {
              asddErrorCallback(1010, ""); 
          }
      }
  });

  //获取蓝牙所有service
  wx.getBLEDeviceServices({
      deviceId: deviceId,
      success: (res) => {
          // console.log("获取蓝牙设备所有服务(service)", res);
          for (let i = 0; i < res.services.length; i++) {
              let tmpUuid = res.services[i].uuid;
              if ((res.services[i].isPrimary) && (tmpUuid.indexOf(filterServiceUUID) != -1)) {
                  //获取蓝牙特征值
                  getBLEDeviceCharacteristics(deviceId, res.services[i].uuid)
                  return
              }
          }
      },
      fail: (res) => {
          console.log('getBLEDeviceServices fail', res);
          asddErrorCallback(res.errCode, "");
      }
  })
}

/**
 * 获取蓝牙特征值
 */
function getBLEDeviceCharacteristics(deviceId, serviceId) {
  console.log("设备：" + deviceId + '******************服务：' + serviceId);
  wx.getBLEDeviceCharacteristics({
      deviceId: deviceId,
      serviceId: serviceId,
      success: (res) => {
          // console.log('蓝牙设备特征值信息:', res);
          console.log('getBLEDeviceCharacteristics success', res.characteristics)
          for (let i = 0; i < res.characteristics.length; i++) {
              let item = res.characteristics[i]
              var itemUUID = item.uuid.toUpperCase(); //转大写

              //read操作
              if (item.properties.read && itemUUID == writeUUID) {
                  wx.readBLECharacteristicValue({
                      deviceId: deviceId,
                      serviceId: serviceId,
                      characteristicId: item.uuid,
                  })
              }
              
              //write操作
              if (item.properties.write && itemUUID == writeUUID) {
                  console.log("写 特征值 -----------------------" + item.uuid);
                  _deviceId = deviceId
                  _serviceId = serviceId
                  _characteristicId = item.uuid

                  //发送 信息查询指令 【根据需求】
                  if (flagFromTypes == 1 || flagFromTypes == 2) { //血压、秤
                      handleTimeToHex();
                  } 
              }

                  
      //notify操作，注意调用监听特征值变化
              if (notifyUUID == itemUUID) {
                  if (item.properties.notify || item.properties.indicate) {
                      console.log('调用notifyBLECharacteristicValueChange前', item.uuid);
                      wx.notifyBLECharacteristicValueChange({
                          deviceId: deviceId,
                          serviceId: serviceId,
                          characteristicId: item.uuid,
                          state: true,
                          success(res) {
                              console.log('notification通知数据', res);
                              status = true;
                              // wx.hideLoading();
                          },
                          fail(res) {
                              console.log('notifyBLECharacteristicValueChange fali', res);
                          }
                      })
                  }
              }
          }
      },
      fail: (res) => {
          console.log('getBLEDeviceCharacteristics fail', res)
          asddErrorCallback(res.errCode, "");
      }
  })


  // 操作之前先监听，保证第一时间获取数据
  wx.onBLECharacteristicValueChange(function(res) {
      console.log(`characteristic ${res.characteristicId} has changed, now is ${res.value}`)

      console.log("操作类型:" + action_type);

      var resData = ab2hex(res.value); //转16进制
      console.log("设备返回数据--->", resData); //5d0000000001be304d

      // 判断不同类型处理数据
      if (flagFromTypes == 1) {
          console.log('开始调用 血压计=====》处理返回的数据');
          bloodPressureObj.filterStr(resData);
      }
      
  })
}

/**
 * 写入数据
 */
function writeData(hex, action = '') {
  if (!status) {
      return;
  }

  if (!_deviceId) {
      asddWriteErrors('w');
      return;
  }

  setTimeout(() => {
      //类型转换
      var enDataBuf = new Uint8Array(hex);
      var buffer1 = enDataBuf.buffer
      console.log("发送内容长度：", buffer1.byteLength)
      console.log('写入的数据：' + _deviceId + '服务serviceId---》' + _serviceId + '特征characteristicId---》' + _characteristicId);

      wx.writeBLECharacteristicValue({
          deviceId: _deviceId,
          serviceId: _serviceId,
          characteristicId: _characteristicId,
          value: buffer1,
          success: (res) => {
              wx.hideLoading();
              console.log("写数据返回结果", res.errMsg);
              
              //项目需求： 发送某个指令后的需要处理回调
               if (action == 'lastZero') {
                  console.log('最后一次写入00需执行回调========》');
                  //回调 目的: 执行调用提交接口
                  eyeCareObj.eyeCareCallback();
               }
          },
          fail(res) {
              console.log("写数据失败..", res);
              asddErrorCallback(res.errCode, "");
          }
      })
  }, 1000)
}

/**
 * 断开蓝牙连接
 */
function closeBLEConnection() {
	//停止搜索
    stopBluetoothDevicesDiscovery();
    console.log("断开与低功耗蓝牙设备的连接。", deviceId);

    if (deviceId) {
        wx.closeBLEConnection({
            deviceId: deviceId,
            success: function(res) {
                console.log("closeBLEConnection。success", res);

            },
            fail: function(res) {
                console.log("closeBLEConnection。fail", res);
            },
            complete: function() {
                status = false;
            }
        })

        //关闭蓝牙模块
        wx.closeBluetoothAdapter({
            success: function(res) {
                console.log("closeBluetoothAdapter ==>res:", res);
            },
            fail: function(error) {
                console.log("closeBluetoothAdapter ==>error:", error);
            }
        })
    }

    _discoveryStarted = false;
    isnotExist = true;
    _deviceId = '';
    deviceId = '';
}

function bluetoothStatus(errorType) {
  switch (errorType) {
      case 10001:
          wx.showModal({
              title: '提示',
              content: '请检查手机蓝牙是否打开',
              showCancel: false
          })
          break;
      case 10002:
          wx.showToast({
              title: '没有找到指定设备',
              icon: 'none'
          })
          break;
      case 10003:
          wx.showToast({
              title: '连接失败',
              icon: 'none'
          })
          closeBLEConnection();
          break;
      case 10004:
          wx.showToast({
              title: '没有找到指定服务',
              icon: 'none'
          })
          closeBLEConnection();
          break;
      case 10005:
          wx.showToast({
              title: '没有找到指定特征值',
              icon: 'none'
          })
          closeBLEConnection();
          break;
      case 10007:
      case 10008:
      case 10013:
          wx.showToast({
              title: '设备启动失败，请重试',
              icon: 'none'
          })
          break;
      case 10009:
          wx.showModal({
              title: '提示',
              content: '当前系统版本过低，请更新版本体验',
              showCancel: false
          })
          break;
      case 10012:
          wx.showToast({
              title: '连接超时',
              icon: 'none'
          })
          break;
  }
}

/**
 *  匹配规则: 取名称后面的mac地址
 *  mac地址: 假设C7:E2:90:17:1A:40
 * 	len: 截取长度为
 */
function getNameMac(macAddress, len, name) {
  let clearColonMac = clearSymbol(macAddress);
  let lastFourMac = clearColonMac.substring(clearColonMac.length - len);
  let strName = name.toUpperCase();
  strName = strName + lastFourMac.toUpperCase(); //转大写
  console.log('拼接后的' + strName); //abc_171A40
  return strName
}

/**
* 去掉 冒号
*/
function clearSymbol(str) {
  str = str.replace(/:/g, ""); //取消字符串中出现的所有冒号
  return str;
}

/**
* rrayBuffer转16进度字符串
*/
function ab2hex(buffer) {
  var hexArr = Array.prototype.map.call(
      new Uint8Array(buffer),
      function(bit) {
          return ('00' + bit.toString(16)).slice(-2)
      }
  )
  return hexArr.join('');
}




module.exports = {
  flagServiceIDFun,
  initBle,
  onBluetoothDeviceFound,
  startBluetoothDevicesDiscovery,
  stopBluetoothDevicesDiscovery,
  createBLEConnection,
  getBLEDeviceCharacteristics,
  getBLEDeviceServices,
  writeData,
  closeBLEConnection,
  bluetoothStatus,
  getNameMac,
  clearSymbol,
  ab2hex
}