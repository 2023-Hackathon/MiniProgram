export class BtConnection {
  constructor() {
    this.serviceUUID = [] //主 service 的 uuid 列表
    this.writeUUID = ("").toUpperCase(); //写读 UUID
    this.notifyUUID = ("00002A37-0000-1000-8000-00805F9B34FB").toUpperCase(); //notify UUID
    this.filterServiceUUID = ("0000180D-0000-1000-8000-00805F9B34FB").toUpperCase(); //过滤获取到的服务uuid(有些会返回多条数据)
    this.filterDeviceName = "Ethera band-0010026"; //设备名称

    this.macAddress = ""; //保存得到mac地址
    this.flagFromTypes = ''; //来源类型
    this._discoveryStarted = false;
    this.deviceId = ''; //用于区分设备的 id

    this._deviceId = '';
    this._serviceId = '';
    this._characteristicId = '';
    this.status = false; //当前状态
    this.action_type = 'NOTIFY'; //操作类型
    this.code = -1;
    this.isnotExist = true



    console.log('initing bluetooth')
    wx.openBluetoothAdapter()
  }

  openAdaptor() {
    console.log('opening bluetooth')
    wx.openBluetoothAdapter({
      success: (res) => {
        console.log('openBluetoothAdapter 初始化蓝牙模块是否成功:', res)
        this.onBluetoothDeviceFound()
        this.startBluetoothDevicesDiscovery()
      },
      fail: (res) => {
        console.log('初始化蓝牙失败', res);
        //自行处理【可弹窗提示用户开启蓝牙】，这通过回调处理
      }
    })
  }

  closeAdaptor() {
    this.isnotExist = true
    console.log('closing bluetooth')
    wx.closeBLEConnection()
    wx.closeBluetoothAdapter()
  }

  /**
   * 监听寻找新设备事件
   * 搜索匹配设备后，自动连接设备
   */
  onBluetoothDeviceFound() {
    wx.onBluetoothDeviceFound((res) => {
      // console.log('广播数据结果:', res);

      res.devices.forEach(device => {
        if (!device.name && !device.localName) {
          return
        }
        console.log(device.name)
        if (device.name === this.filterDeviceName) console.log("FOUND !!!!!!!!!")
        // 转换后, 得出相关数据
        var hexStr = this.ab2hex(device.advertisData);
        // console.log("广播数据中转换后：advertisData---->" + hexStr);

        //通过获取mac匹配
        if ((this.macAddress != "") && (this.macAddress == device.deviceId) && this.isnotExist) {
          this.isnotExist = false;
          this.deviceId = device.deviceId;
          console.log('android-->tempDeviceId:' + this.deviceId);

          //停止搜寻附近的蓝牙外围设备
          this.stopBluetoothDevicesDiscovery();

          // //连接设备
          this.createBLEConnection();
        }


        //通过name匹配设备
        let deviceName = device.name;
        if ((deviceName.indexOf(this.filterDeviceName) != -1) && this.isnotExist) {
          this.isnotExist = false;
          this.deviceId = device.deviceId;
          console.log('ios or android-->tempDeviceId:' + this.deviceId);

          //停止搜寻附近的蓝牙外围设备。
          this.stopBluetoothDevicesDiscovery();

          //连接设备
          this.createBLEConnection();
        }
      })
    })
  }

  startBluetoothDevicesDiscovery() {
    console.log("执行连接蓝牙设备 回调空===" + this._discoveryStarted);
    if (this._discoveryStarted) {
      return;
    }
    this._discoveryStarted = true

    wx.startBluetoothDevicesDiscovery({
      services: this.serviceUUID, //如果设置此参数，则只搜索广播包有对应 uuid 的主服务的蓝牙设备。
      allowDuplicatesKey: false,
      success: (res) => {
        console.log('启动搜索蓝牙设备, 结果  :', res)
        this.onBluetoothDeviceFound() //先调用此方法再使startBluetoothDevicesDiscovery
      },
      fail(res) {
        console.log('startBluetoothDevicesDiscovery fail', res);
      }
    })
  }

  //停止搜寻附近的蓝牙外围设备。
  stopBluetoothDevicesDiscovery() {
    console.log('end discovery')
    this._discoveryStarted = false
    wx.stopBluetoothDevicesDiscovery()
  }

  /**
   * 连接蓝牙设备
   */
  createBLEConnection() {
    console.log("creating BLE connection")
    var that = this;
    wx.createBLEConnection({
      deviceId: this.deviceId,
      success: (res) => {
        wx.showToast({
          title: '设备连接成功',
          duration: 2000
        })
        console.log('connect successfully with ' + this.deviceId)
        this.getBLEDeviceServices(this.deviceId)
      },
      fail: (res) => {
        console.log('createBLEConnection fail', res);
        // asddErrorCallback(res.errCode, "");
      }
    })
    //停止搜索
    this.stopBluetoothDevicesDiscovery();
  }

  getBLEDeviceServices(deviceId) {
    //监听低功耗蓝牙连接状态的改变事件
    wx.onBLEConnectionStateChange(function (res) {
      console.log("onBLEConnectionStateChange:", res);
      // 该方法回调中可以用于处理连接意外断开等异常情况
      console.log(`device ${res.deviceId} state has changed, connected: ${res.connected}`)
      if (res.connected == false) {
        console.log("连接意外断开等****", this._deviceId);
        this._deviceId = '';
        if (this.flagFromTypes == 1 && this.flagFromTypes == 2) {
          // asddErrorCallback(1010, "");
          console.log("??getBLEDeviceServices??")
        }
      }
    });

    //获取蓝牙所有service
    wx.getBLEDeviceServices({
      deviceId: deviceId,
      success: (res) => {
        console.log("获取蓝牙设备所有服务(service)", res);
        for (let i = 0; i < res.services.length; i++) {
          let tmpUuid = res.services[i].uuid.toUpperCase();
          console.log(`finding desired service: ${this.filterServiceUUID.toUpperCase()}   checking: ${tmpUuid}`)
          if ((res.services[i].isPrimary) && (tmpUuid.indexOf(this.filterServiceUUID.toUpperCase()) != -1)) {
            //获取蓝牙特征值
            console.log('service found')
            this.getBLEDeviceCharacteristics(deviceId, res.services[i].uuid)
            return
          }
        }
      },
      fail: (res) => {
        console.log('getBLEDeviceServices fail', res);
        // asddErrorCallback(res.errCode, "");
      }
    })
  }

  /**
   * 获取蓝牙特征值
   */
  getBLEDeviceCharacteristics(deviceId, serviceId) {
    let that = this
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
          console.log(`checking item: ${itemUUID}`)
          //read操作
          if (item.properties.read && itemUUID == this.writeUUID) {
            wx.readBLECharacteristicValue({
              deviceId: deviceId,
              serviceId: serviceId,
              characteristicId: item.uuid,
            })
          }

          //write操作
          if (item.properties.write && itemUUID == this.writeUUID) {
            console.log("写 特征值 -----------------------" + item.uuid);
            this._deviceId = deviceId
            this._serviceId = serviceId
            this._characteristicId = item.uuid

            //发送 信息查询指令 【根据需求】
            if (this.flagFromTypes == 1 || this.flagFromTypes == 2) { //血压、秤
              console.log("发送 信息查询指令 【根据需求】")
              // handleTimeToHex();
            }
          }


          //notify操作，注意调用监听特征值变化
          if (this.notifyUUID == itemUUID) {
            console.log('notify service start processing')
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
    wx.onBLECharacteristicValueChange(function (res) {
      console.log(`characteristic ${res.characteristicId} has changed, now is ${res.value}`)

      console.log("操作类型:" + that.action_type);

      var resData = that.ab2hex(res.value); //转16进制

      // // Convert the buffer to a hex string
      // let resData = Array.from(new Uint8Array(res.value))
      //   .map(byte => byte.toString(16).padStart(2, '0'))
      //   .join('');
      


      console.log("设备返回数据--->", resData); //5d0000000001be304d

      // 判断不同类型处理数据
      if (that.flagFromTypes == 1) {
        console.log('开始调用 血压计=====》处理返回的数据');
        // bloodPressureObj.filterStr(resData);
      }

    })
  }


  /**
   *  匹配规则: 取名称后面的mac地址
   *  mac地址: 假设C7:E2:90:17:1A:40
   * 	len: 截取长度为
   */
  getNameMac(macAddress, len, name) {
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
  clearSymbol(str) {
    str = str.replace(/:/g, ""); //取消字符串中出现的所有冒号
    return str;
  }

  /**
   * rrayBuffer转16进度字符串
   */
  ab2hex(buffer) {
    var hexArr = Array.prototype.map.call(
      new Uint8Array(buffer),
      function (bit) {
        return ('00' + bit.toString(16)).slice(-2)
      }
    )
    return hexArr.join('');
  }

}