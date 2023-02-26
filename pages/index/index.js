// index.js
// 获取应用实例
const app = getApp()
import {BtConnection} from '../../utils/btConnection'

const btConnection = new BtConnection(
    "",
    "00002A37-0000-1000-8000-00805F9B34FB",
    "0000180D-0000-1000-8000-00805F9B34FB",
    "Ethera band-0010026"
  )
btConnection.setFlagFromType('h')

const espConnection = new BtConnection(
  "3604da64-2145-422a-89c6-c540392c3a6a",
  "3604da64-2145-422a-89c6-c540392c3a6a",
  "02afd1d9-f889-4f49-acc7-33b34a620adb",
  "ESP32-Edge"
)
espConnection.setFlagFromType('e')

Page({
  data: {
    motto: 'Hello World',
    userInfo: {},
    hasUserInfo: false,
    canIUse: wx.canIUse('button.open-type.getUserInfo'),
    canIUseGetUserProfile: false,
    canIUseOpenData: wx.canIUse('open-data.type.userAvatarUrl') && wx.canIUse('open-data.type.userNickName'), // 如需尝试获取用户信息可改为false
  },
  bindPrintHeartrateData(){
    console.log(btConnection.getHeartrateData())
  },
  bindPrintEspData(){
    console.log(btConnection.getEspData())
  },
  // 事件处理函数
  bindViewTap() {
    wx.navigateTo({
      url: '../logs/logs'
    })
  },
  bindOpenBtTap() {
    btConnection.openAdaptor()
  },
  bindCloseBtTap() {
    btConnection.closeAdaptor()
  },
  bindStartDiscovery() {
    btConnection.openAdaptor()
    btConnection.startBluetoothDevicesDiscovery()
    
  },
  bindEndDiscovery() {
    btConnection.stopBluetoothDevicesDiscovery()
  },
  bindDiscoverEsp(){
    espConnection.openAdaptor()
    espConnection.startBluetoothDevicesDiscovery()
    console.log("esp discovered")
    
  },
  onLoad() {
    
  },
  getUserProfile(e) {
    // 推荐使用wx.getUserProfile获取用户信息，开发者每次通过该接口获取用户个人信息均需用户确认，开发者妥善保管用户快速填写的头像昵称，避免重复弹窗
    wx.getUserProfile({
      desc: '展示用户信息', // 声明获取用户个人信息后的用途，后续会展示在弹窗中，请谨慎填写
      success: (res) => {
        console.log(res)
        this.setData({
          userInfo: res.userInfo,
          hasUserInfo: true
        })
      }
    })
  },
  getUserInfo(e) {
    // 不推荐使用getUserInfo获取用户信息，预计自2021年4月13日起，getUserInfo将不再弹出弹窗，并直接返回匿名的用户个人信息
    console.log(e)
    this.setData({
      userInfo: e.detail.userInfo,
      hasUserInfo: true
    })
  }
})
