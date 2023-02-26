export class BtConnection {
  constructor(writeUUID="", notifyUUID="", serviceUUID="", deviceName="") {
    this.serviceUUID = [] 
    this.writeUUID = writeUUID.toUpperCase(); 
    this.notifyUUID = notifyUUID.toUpperCase(); //notify UUID
    this.filterServiceUUID = serviceUUID.toUpperCase(); 
    this.filterDeviceName = deviceName; 

    this.macAddress = ""; 
    this.flagFromTypes = ''; 
    this._discoveryStarted = false;
    this.deviceId = ''; 

    this._deviceId = '';
    this._serviceId = '';
    this._characteristicId = '';
    this.status = false; 
    this.action_type = 'NOTIFY'; 
    this.code = -1;
    this.isnotExist = true

    this.heartrateStorageMaxLen = 30
    this.heartrateData = []

    this.espData = ""

    console.log('initing bluetooth')
    
    wx.openBluetoothAdapter()
  }

  setFlagFromType(flag){
    this.flagFromTypes = flag
  }

  writeHeartrateData(heartrateData){
    let data = parseInt(heartrateData, 16)
    
    if(this.heartrateData.length > this.heartrateStorageMaxLen){
      this.heartrateData.pop()
    }
    this.heartrateData.push([new Date(), data])
  }

  getHeartrateData(){
    return this.heartrateData
  }

  writeEspData(espData){
    this.espData = this.hex2a(espData)
    console.log("esp data wrote\n" + this.espData)
  }

  getEspData(){
    return this.espData
  }

  openAdaptor() {
    console.log('opening bluetooth')
    this.closeBLEConnection()
    wx.openBluetoothAdapter({
      success: (res) => {
        console.log('openBluetoothAdapter 初始化蓝牙模块是否成功:', res)
        this.onBluetoothDeviceFound()
        this.startBluetoothDevicesDiscovery()
      },
      fail: (res) => {
        console.log('初始化蓝牙失败', res);
      }
    })
  }

  closeAdaptor() {
    this.isnotExist = true
    wx.closeBLEConnection()
    wx.closeBluetoothAdapter()
  }

  
closeBLEConnection() {
    this.stopBluetoothDevicesDiscovery();

    if (this.deviceId) {
        wx.closeBLEConnection({
            deviceId: this.deviceId,
            success: function(res) {
                console.log("closeBLEConnection。success", res);

            },
            fail: function(res) {
                console.log("closeBLEConnection。fail", res);
            },
            complete: function() {
                this.status = false;
            }
        })

        wx.closeBluetoothAdapter({
            success: function(res) {
                console.log("closeBluetoothAdapter ==>res:", res);
            },
            fail: function(error) {
                console.log("closeBluetoothAdapter ==>error:", error);
            }
        })
    }

    this._discoveryStarted = false;
    this.isnotExist = true;
    this._deviceId = '';
    this.deviceId = '';
}


  
  onBluetoothDeviceFound() {
    wx.onBluetoothDeviceFound((res) => {

      res.devices.forEach(device => {
        if (!device.name && !device.localName) {
          return
        }
        console.log(device.name)
        if (device.name === this.filterDeviceName) console.log("FOUND !!!!!!!!!")
        var hexStr = this.ab2hex(device.advertisData);
        if ((this.macAddress != "") && (this.macAddress == device.deviceId) && this.isnotExist) {
          this.isnotExist = false;
          this.deviceId = device.deviceId;
          console.log('android-->tempDeviceId:' + this.deviceId);

          this.stopBluetoothDevicesDiscovery();

          this.createBLEConnection();
        }

        let deviceName = device.name;
        if ((deviceName.indexOf(this.filterDeviceName) != -1) && this.isnotExist) {
          this.isnotExist = false;
          this.deviceId = device.deviceId;
          console.log('ios or android-->tempDeviceId:' + this.deviceId);

          this.stopBluetoothDevicesDiscovery();

          this.createBLEConnection();
        }
      })
    })
  }

  startBluetoothDevicesDiscovery() {
    if (this._discoveryStarted) {
      return;
    }
    this._discoveryStarted = true

    wx.startBluetoothDevicesDiscovery({
      services: this.serviceUUID, 
      allowDuplicatesKey: false,
      success: (res) => {
        console.log('启动搜索蓝牙设备, 结果  :', res)
        this.onBluetoothDeviceFound() 
      },
      fail(res) {
        console.log('startBluetoothDevicesDiscovery fail', res);
      }
    })
  }

  stopBluetoothDevicesDiscovery() {
    console.log('end discovery')
    this._discoveryStarted = false
    wx.stopBluetoothDevicesDiscovery()
  }


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
    this.stopBluetoothDevicesDiscovery();
  }

  getBLEDeviceServices(deviceId) {
    wx.onBLEConnectionStateChange(function (res) {
      console.log("onBLEConnectionStateChange:", res);
      console.log(`device ${res.deviceId} state has changed, connected: ${res.connected}`)
      if (res.connected == false) {
        console.log("连接意外断开等****", this._deviceId);
        this.isnotExist = true
        this._deviceId = '';
        if (this.flagFromTypes == 1 && this.flagFromTypes == 2) {
          console.log("??getBLEDeviceServices??")
        }
      }
    });

    wx.getBLEDeviceServices({
      deviceId: deviceId,
      success: (res) => {
        console.log("获取蓝牙设备所有服务(service)", res);
        for (let i = 0; i < res.services.length; i++) {
          let tmpUuid = res.services[i].uuid.toUpperCase();
          console.log(`finding desired service: ${this.filterServiceUUID.toUpperCase()}   checking: ${tmpUuid}`)
          if ((res.services[i].isPrimary) && (tmpUuid.indexOf(this.filterServiceUUID.toUpperCase()) != -1)) {
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

  getBLEDeviceCharacteristics(deviceId, serviceId) {
    let that = this
    wx.getBLEDeviceCharacteristics({
      deviceId: deviceId,
      serviceId: serviceId,
      success: (res) => {
        console.log('getBLEDeviceCharacteristics success', res.characteristics)
        for (let i = 0; i < res.characteristics.length; i++) {
          let item = res.characteristics[i]
          var itemUUID = item.uuid.toUpperCase(); 
          console.log(`checking item: ${itemUUID}`)
          console.log(that.notifyUUID)
          if (item.properties.read && itemUUID == that.writeUUID) {
            wx.readBLECharacteristicValue({
              deviceId: deviceId,
              serviceId: serviceId,
              characteristicId: item.uuid,
            })
          }

          if (item.properties.write && itemUUID == that.writeUUID) {
            that._deviceId = deviceId
            that._serviceId = serviceId
            that._characteristicId = item.uuid

            if (that.flagFromTypes === 'e') { 
              that.status = true
              that.writeData(0x31)
            }   
          }

          if (that.notifyUUID == itemUUID) {
            console.log('notify service start processing')
            if (item.properties.notify || item.properties.indicate) {
              wx.notifyBLECharacteristicValueChange({
                deviceId: deviceId,
                serviceId: serviceId,
                characteristicId: item.uuid,
                state: true,
                success(res) {
                  that.status = true;
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

    wx.onBLECharacteristicValueChange(function (res) {
      console.log(`characteristic ${res.characteristicId} has changed, now is ${res.value}`)

      var resData = that.ab2hex(res.value); 

      console.log("设备返回数据--->", resData); 
      that.data = resData
      
      switch(that.flagFromTypes){
        case "h":
          console.log('writing heartrate data')
          that.writeHeartrateData(resData)
          break
        case "e":
          console.log('writing esp data')
          that.writeEspData(resData)
          break
      }

    })
  }

  writeData(hex, action = '') {
    
    if (!this.status) {
      console.error("status err")
      return;
    }

    if (!this._deviceId) {
      // asddWriteErrors('w');
      console.error("_deviceId err")
      return;
    }

    
    setTimeout(() => {
      console.log(99999980908908070789878696758645)
      console.log(hex)

      var enDataBuf = new Uint8Array([hex]);
      console.log(enDataBuf)
      var buffer1 = enDataBuf.buffer
      console.log(buffer1)

      wx.writeBLECharacteristicValue({
        deviceId: this._deviceId,
        serviceId: this._serviceId,
        characteristicId: this._characteristicId,
        value: buffer1,
        success: (res) => {
          wx.hideLoading();

          if (action == 'lastZero') {
            console.log('========');
          }
        },
        fail(res) {
          console.log(res);
          // asddErrorCallback(res.errCode, "");
        }
      })
    }, 1000)
  }

  getNameMac(macAddress, len, name) {
    let clearColonMac = clearSymbol(macAddress);
    let lastFourMac = clearColonMac.substring(clearColonMac.length - len);
    let strName = name.toUpperCase();
    strName = strName + lastFourMac.toUpperCase(); 
    console.log('拼接后的' + strName); //abc_171A40
    return strName
  }

  clearSymbol(str) {
    str = str.replace(/:/g, ""); 
    return str;
  }

  ab2hex(buffer) {
    var hexArr = Array.prototype.map.call(
      new Uint8Array(buffer),
      function (bit) {
        return ('00' + bit.toString(16)).slice(-2)
      }
    )
    return hexArr.join('');
  }

  hex2a(hexx) {
    var hex = hexx.toString();//force conversion
    var str = '';
    for (var i = 0; i < hex.length; i += 2)
        str += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
    return str;
}

}