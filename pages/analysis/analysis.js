// pages/analysis/analysis.js
import PatientData from '../../utils/patientdata.js'
import fetch from '../../utils/fetch.js'

Page({
  /**
   * Page initial data
   */
  data: {
    hr: 0,
    step: 0,
    al: 0,
    poster: '',
    name: '',
    author: '',
    src: ''
  },

  /**
   * Lifecycle function--Called when page load
   */
  onLoad(options) {
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
      src: "../../" + songName[0] + ".mp3"
    })
  },
  /**
   * Lifecycle function--Called when page is initially rendered
   */
  onReady() {

  },

  /**
   * Lifecycle function--Called when page show
   */
  onShow() {

  },

  /**
   * Lifecycle function--Called when page hide
   */
  onHide() {

  },

  /**
   * Lifecycle function--Called when page unload
   */
  onUnload() {

  },

  /**
   * Page event handler function--Called when user drop down
   */
  onPullDownRefresh() {

  },

  /**
   * Called when page reach bottom
   */
  onReachBottom() {

  },

  /**
   * Called when user click on the top right corner to share
   */
  onShareAppMessage() {

  },

  runAnalysis() {
    const data = this.getPatientInfo()
    const anxieties = this.getAnxiety(data)
    const song = this.runModel(data)
    const domain = ""
    const url = "https://" + domain + "/user/stats/detailed"
    const options = {url: url, data: {id: 1,
                                      steps: data.step,
                                      heartrates: data.heartRate,
                                      anxieties: anxieties},method: 'PATCH'}
    fetch(options)
  },

  getPatientInfo: function() {
    const patient = new PatientData()
    const resistance = patient.getResistance()

    const totolStep = patient.getTotolStepNum()
    const step = patient.getStepNum()
    const heartRate = patient.getHeartRate()
    const data = {totolStep: totolStep, step: step, heartRate: heartRate, resistance: resistance}
    return data
  },

  runModel(data) {
    const classical = [["Cello Suite No.1 in G major", "Johann Sebastian Bach"], ["Mozart Sonatas K.448", "Mozart"], ["A comme amour", "Richard Clayderman"]]
    const relaxing = [["Love story", "Taylor Swift"], ["Shape of You", "Ed Sheeran"], ["Senorita", "Shawn Mendes & Camila Cacollo"]]
    const pop = [["Believer", "Imagine Dragon"], ["Viva la vida", "Cold Play"], ["Rolling in the deep", "Adele"]]
    console.log(data.step, data.heratRate, data.resistance)
    const step = data.step
    const heartRate = data.heartRate
    const resistance = data.resistance
    

    if (heartRate > 80 && step > 600) {
      return pop[Math.floor(Math.random() * 3)]
    }
    else if (heartRate > 80 && step <= 600) {
      return relaxing[Math.floor(Math.random() * 3)]
    }
    else if (heartRate > 80 && resistance >= 0.5) {
      return relaxing[Math.floor(Math.random() * 3)]
    }
    else {
      return classical[Math.floor(Math.random() * 3)]
    }
  },

  getAnxiety(data) {
    var anxiety = 0
    if (data.resistance >= 0 && data.resistance < 0.2) {
      anxiety = 0
    }
    else if (data.resistance >= 0.2 && data.resistance < 0.4) {
      anxiety = 1
    }
    else if (data.resistance >= 0.4 && data.resistance < 0.6) {
      anxiety = 2
    }
    else if (data.resistance >= 0.6 && data.resistance < 0.8) {
      anxiety = 3
    }
    else {
      anxiety = 4
    }
  }
})