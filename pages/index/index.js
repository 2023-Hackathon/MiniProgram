// index.js
const app = getApp()
import {
  BtConnection
} from '../../utils/btConnection'
import {
  formatTime
} from '../../utils/util'
import PatientData from '../../utils/patientdata.js'
import fetch from '../../utils/fetch.js'

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
    hr: 0,
    step: 0,
    al: 0,
    poster: '',
    name: '',
    author: '',
    src: '',
    heartrateData: [0, 0],
    espDataArr: [],
    espData: [],
    stepData: [],
    canIUse: wx.canIUse('button.open-type.getUserInfo'),
    canIUseGetUserProfile: false,
    canIUseOpenData: wx.canIUse('open-data.type.userAvatarUrl') && wx.canIUse('open-data.type.userNickName'), 
  },
  bindPrintHeartrateData() {
    console.log(btConnection.getHeartrateData())
  },
  bindPrintEspData() {
    console.log(espConnection.getEspData())
  },
  
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
  bindDiscoverEsp() {
    espConnection.openAdaptor()
    espConnection.startBluetoothDevicesDiscovery()
    console.log("esp discovered")
  },
  runAnalysis() {
    const data = this.getPatientInfo()
    const anxieties = 1 //this.getAnxiety(data)
    const domain = "172.187.225.89"
    const url = "http://" + domain + ":8443/user/stats/detailed"
    console.log(this.data.heartrateData)
    let heartates = this.data.heartrateData.map(h => [Date.parse(h[0]) / 1000, h[1]])
    console.log(heartates)
    const options = {
      url: url,
      headers: {'Content-Type': 'application/json'},
      data: {
        id: 1,
        steps: [[1, 1]],
        heartrates: heartates,
        anxieties: [[11111, 111111]]
      },
      method: 'PATCH'
    }
    fetch(options)
      .then(_ => console.log('success'))
      .catch(_ => {})
  },

  getPatientInfo: function () {
    const patient = new PatientData()
    const resistance = patient.getResistance()

    const totolStep = patient.getTotolStepNum()
    const step = patient.getStepNum()
    const heartRate = patient.getHeartRate()
    const data = {
      totolStep: totolStep,
      step: step,
      heartRate: heartRate,
      resistance: resistance
    }
    return data
  },

  runModel(data) {
    const classical = [
      ["Cello Suite No.1 in G major", "Johann Sebastian Bach"],
      ["Mozart Sonatas K.448", "Mozart"],
      ["A comme amour", "Richard Clayderman"]
    ]
    const relaxing = [
      ["Love story", "Taylor Swift"],
      ["Shape of You", "Ed Sheeran"],
      ["Senorita", "Shawn Mendes & Camila Cacollo"]
    ]
    const pop = [
      ["Believer", "Imagine Dragon"],
      ["Viva la vida", "Cold Play"],
      ["Rolling in the deep", "Adele"]
    ]
    console.log(data.step, data.heratRate, data.resistance)
    const step = data.step
    const heartRate = data.heartRate
    const resistance = data.resistance


    if (heartRate > 80 && step > 600) {
      return pop[Math.floor(Math.random() * 3)]
    } else if (heartRate > 80 && step <= 600) {
      return relaxing[Math.floor(Math.random() * 3)]
    } else if (heartRate > 80 && resistance >= 0.5) {
      return relaxing[Math.floor(Math.random() * 3)]
    } else {
      return classical[Math.floor(Math.random() * 3)]
    }
  },

  getAnxiety(data) {
    var anxiety = 0
    if (data.resistance >= 0 && data.resistance < 0.2) {
      anxiety = 0
    } else if (data.resistance >= 0.2 && data.resistance < 0.4) {
      anxiety = 1
    } else if (data.resistance >= 0.4 && data.resistance < 0.6) {
      anxiety = 2
    } else if (data.resistance >= 0.6 && data.resistance < 0.8) {
      anxiety = 3
    } else {
      anxiety = 4
    }
  },
  onLoad() {
    var data = this.getPatientInfo()
    var anxiety = this.getAnxiety(data)
    var songName = this.runModel(data)
    this.setData({
      hr: data.heartRate,
      step: data.step,
      al: anxiety,
      name: songName[0],
      author: songName[1],
      poster: "../../" + songName[0] + ".png",
      src: "../../" + songName[0] + ".mp3",
      espData: 0,
      heartrateData: [0, 0]
    })
    setInterval(() => {
      console.log("esp", espConnection.status, "hr", btConnection.status)
      if (espConnection.status) {
        let data = espConnection.getEspData()
        data = data.split('@')
        let newArr = this.data.espDataArr
        data.forEach(d => newArr.push(d))
        this.setData({
          espData: data,
          espDataArr: newArr
        })
        console.log(this.data.espDataArr)
        espConnection.writeData(0x31)
      }
      console.log("esp", espConnection.status, "hr", btConnection.status)
      if (btConnection.status) {
        let hData = btConnection.getHeartrateData()
        // hData[0] = formatTime(hData[0])
        this.setData({
          heartrateData: hData,
          hr: hData[hData.length - 1][1]
        })
      }
      console.log("esp", espConnection.status, "hr", btConnection.status)
      console.log("loop!")
    }, 1000)
  },
  getUserProfile(e) {
    wx.getUserProfile({
      desc: '展示用户信息', 
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
    console.log(e)
    this.setData({
      userInfo: e.detail.userInfo,
      hasUserInfo: true
    })
  }
})