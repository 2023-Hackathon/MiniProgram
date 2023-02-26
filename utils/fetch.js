export default function fetch(options) {
  return new Promise((resolve, reject) => {
    wx.request({
      url: options.url,
      data: options.data,
      method: options.method,
      header: { 'content-type': 'application/json' },
      success:(res) => {
        if (res.data.code == 0) {
          resolve(res.data)
        }  else {
          wx.showToast({
            title: res.data.message || 'Network Error',
            icon: 'none',
            duration: 2000
          })
          reject(res.data.message)
        }
      },
      fail: (e) => {
        reject('Network Error')
      }
    })
  });
}
